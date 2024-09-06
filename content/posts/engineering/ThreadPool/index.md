---
title: Building a Thread Pool in C++
seo_title: Building a Thread Pool
summary: 
description: 
slug: Building a Thread Pool
author: Christopher Weaver

draft: false
date: 2024-09-05T07:32:00-06:00
lastmod: 
expiryDate: 
publishDate: 

feature_image: threadPool.png
feature_image_alt: 

categories:
- Engineering
tags:
- C++
series:
- C++

toc: true
related: true
social_share: true
newsletter: false
disable_comments: false
---
One of my pet projects over the past few years has been my deep learning framework, built entirely in C++ [link](https://www.christopher-weaver.com/projects/portfolio-project-1/). Once I had an initial iteration that worked sequentially and could successfully train a neural network to accomplish specific tasks, I turned toward leveraging concurrency to speed up training. My first thought was to farm out computationally expensive tasks to different CPU cores, primarily focusing on functions that perform computations on matrices.

In my project, I have a set of polymorphic classes that represent different types of neural network layers (like a dense layer, input layer, flatten layer, etc.). Each initialized class owns its matrix of weights and, upon receiving an input matrix, performs some computations between the two and sends out an output matrix. These matrices are often tens of thousands of values in size, which provided a good opportunity for multi-threading computations. For example, with my matrix multiplication function, I did the following:

Lookup how many cores I have on the machine.
Break up the matrix into separate equal parts matching the number of available cores. I don’t actually break apart the matrix; I generate index ranges to represent dividing the matrix.
Create a new task that uses my matrix multiplication function with parameters representing the bounding index.
Once all tasks are complete, each task is deleted via RAII.
This approach worked, and I saw significant improvement in my training times. However, the inefficiency of creating and destroying tasks every time a neural layer performed forward propagation (which usually happens thousands of times during a training session) was obviously not efficient and bothered me. The solution was not to constantly create and destroy threads, but instead to generate the number of threads to match the number of cores on a machine at the beginning of the program, and continuously use those same threads throughout the program's lifetime in a thread pool. Here's how I did that in C++:

I decided that each neural layer should own its own ThreadPool class. The ThreadPool class would be responsible for managing its threads throughout the program's lifetime, including the management of all tasks sent its way. The public interface of this class looks like this:

```C++
    class Thread_Pool {
        
        Thread_Pool();
        ~Thread_Pool();
        void setupPool(size_t threads);
        void clearPool();
        void wait();
        
        template<typename F, typename... Args>
        void enqueue(F&&f, Args&&... args);
    };
```
I decided I only wanted to utilize this thread pool during training when the mini-batch size is equal to or larger than the number of cores on the machine. From my testing, the overhead of using threads outweighs the performance gains of concurrency when the matrix sizes are too small. To accommodate this, the default constructor does not do much. Instead, when my program needs to use the thread pool, each layer calls the setupPool() function to initialize the thread pool with the appropriate number of threads. The clearPool() method does cleanup when training is complete, and the thread pool is no longer needed (the destructor will also call this method). This approach leaves room for mistakes since some of the initial state management is outside the constructor, but I felt it was a worthy tradeoff in this case. The enqueue function takes a task the neural layer needs to complete and assigns it to a thread. The wait() function is called anytime we want our neural layer class to hold until the Thread_Pool has no further work.

The private members and functions look like this:
```C++
    std::vector<std::thread> workers;
    std::vector<std::function<void()>> tasks;

    void worker();

    std::mutex queueMutex;
    std::condition_variable condition;
    std::condition_variable finishedCondition;
    std::atomic<bool> stop{false};
    std::atomic<int> activeTasks{0};
```
I will go over these more in detail as we further evaluate our implementation details. Starting with our setupPool function
```C++
void Thread_Pool::setupPool(size_t threads) {
    stop = false;
    for (size_t i = 0; i < threads; i++) {
        workers.emplace_back(&Thread_Pool::worker::this);
    }
}
```
This function is called by the neural layer class when it determines that the thread pool is appropriate. The threads variable always matches the number of cores on a machine by passing this variable:
```C++
    const auto processor_count = std::thread::hardware_concurrency();
```
We construct the appropriate number of threads and place them into our thread vector called workers, where they will live throughout their lifetime. Each thread will run the worker(), which looks like this:
```C++
    void Thread_Pool::worker() {
        while (true) {

            std::function<void()> task;

            {
                std::unique_lock<std::mutex> lock(queueMutex);
                condition.wait(lock, [this]() {
                    return stop || !task.empty();
                });

                if (stop) {
                    return;
                }

                task = std::move(tasks.front());
                tasks.pop();
            }

            task();

      
            activeTasks--;
            finishedCondition.notify_one();
            
        }
    }
```
We want to ensure each thread is kept alive and ready for work when the time comes, so the worker() function runs a while(true) loop. However, the thread will often have no work to do, which is why we call the wait() function on our private condition variable. The condition variable locks our queueMutex mutex until the lambda we pass it returns true. The best part is that the thread itself goes to sleep and doesn’t continuously check the lambda, alleviating CPU overhead. Instead, it waits for us to call condition.notify_one(), which we do elsewhere in the class. The condition checks two things: first, whether we’ve asked the Thread_Pool class to stop. If so, it continues, and we check if stop == true. If it is, we exit the while loop. The other check is whether our tasks queue has something in it. If it’s not empty, we assign the front item to the task variable and pop it off the queue. At this point, we can release our mutex, allowing other threads to safely pull from the tasks queue without a race condition. The thread then executes the task, decrements the activeTasks, and notifies the finishedCondition that one task is done.

Often, I break down my matrix into its indexed ranges and then call enqueue() on the Thread_Pool class in a loop to concurrently process subsets of the matrix on different cores. Here, it’s important for the neural layer to wait for all cores to finish processing their part of the matrix. The neural layer calls wait(), which causes the thread pool class to block until all tasks are completed. The wait() function looks like this:
```C++
    void Thread_Pool::wait() {

        std::unique_lock<std::mutex> lock(queueMutex);

        finishedCondition.wait(lock, [this]() {
            return stop || (tasks.empty() && activeTasks == 0);
        })
    }
```
The finished condition checks to see if the tasks queue is empty and activeTasks == 0 (meaning all tasks are not only off the queue but completed). If these conditions aren’t met, the main thread the neural layer runs on is put to sleep. Anytime we complete a task in worker() and call finishedCondition.notify_one(), we check again to see if we can end the wait() and hand control back to the neural layer.

Adding tasks to the thread pool is one of the harder challenges and requires meta-programming and a template parameter pack since we need it to handle any task given by the neural layer (as long as no return value is expected). This is the job of the enqueue() function, which generally gets called like this:
```C++
    const auto processor_count = std::thread::hardware_concurrency();
    for (int i = 0; i < processor_count - 1; i++) {
        _threadPool.enqueue(&Tensor::MatmulInner<a_f>,
                                this,
                                std::ref(m1),
                                std::ref(m2),
                                bias,
                                i * dimensions_per_thread,
                                dimensions_per_thread,
                                af);
    }
    _threadPool.wait();
```
A lot of the parameters passed won’t make sense without further context about the program, but that’s part of the point. The enqueue() function doesn’t need to understand the parameters passed to it; it just needs to ensure they can be executed by a thread. The enqueue() function works like this:
```C++
    template<typename... F, Args... args>
    void enqueue(F&& f, Args&&... args) {
        {
            std::unique_lock<std::mutex> lock(queueMutex);
            tasks.emplace([f = std::forward<F>(f), ...args = std::forward<Args>(args)]() mutable {
                if constexpr (std::is_member_function_pointer<F>::value) {
                    std::invoke(f, std::foward<Args>(args)...);
                } else {
                    f(std::foward<Args>(args)...);
                }
            });
            activeTasks++;
        }
        condition.notify_one();
    }
```
Because I want to accept any function with an arbitrary number of arguments, we use templates with a template paramter pack to capture the arguments. I capture these parameters as rvalues (&&) in order to ensure we can bind to both rvalues and lvalues, but this will require us to use perfect forwarding later on. I next lock the queueMutex to ensure no thread attempts to modify the tasks queue prior to me getting a new task on it. I then attempt to add a new std::function<void> task to the tasks queue that will represent the function I want my task to execute. I do this by emplacing a lambda that captures the f and args. I call std::foward on both these because I want to ensure if these values are initially passed as lvalues that I make copies and if they are passed by rvalues that I properly move them. This task will modify matrices and I therefore mark the lambda as mutable. I next utilize SFINAE by checking to see if f is a member function pointer (f is a pointer to a member function of a class, which it will be in all my uses). If it is, we need to use std::invoke to ensure correct calling semantics where the first arguments is typically an instance of the class. Otherwise, we can directly have the lambda call the f function. These are compile time checks so they should have little to no impact on our runtime. Once we have added the task lambda to our tasks queue, we can increment our activeTasks tracker, release the queueMutex and notify our condition variable that as task is ready. We saw earlier in our worker() that a notified condition variable will check to see if there is something in the task queue, grab it, and execute it. 

Finally we need to implement the cleanup of the class which lives within the clearPool()
```C++
    void Thread_Pool::clearPool() {
        {
            std::unique_lock<std::mutex> lock(queueMutex);
            stop = true;
            condition.notify_all();
        }
        for (std::thread &worker : workers) {
            if (worker.joinable()) {
                worker.join();
            }
        }

        workers.clear();

        std::queue<std::function<void()>> empty;
        std::swap(tasks,empty);

        activeTasks = 0;

        finishedCondition.notify_all();
    }
```
We set all our invariants to values that signal no further work is needed for the threads in our thread pool. We join our threads, clear our workers vector in which our threads live, we ensure our threads queue is empty, and notify our finishedCondition just in case a thread is being blocked by our wait() function. This function is utilized by my neural net when switching from training to inference and no longer needs the concurrency a thread pool provides. I also call this function from the destructor for RAII. 

Thread pools are great. They provide utilization of multiple cpu cores with little overhead while often hidding implementation details we prefer to keep out of other parts of our program. Part of what makes this work so well is there is little to no communication needed between threads. Each thread works completely independent of the rest, which often is not the case. When threads need to pass information between them, better (more complex options) such as programming thread affinities might be required. 