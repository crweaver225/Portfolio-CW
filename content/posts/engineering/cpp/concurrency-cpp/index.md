---
title: Concurrency in C++
seo_title: Concurrency in C++
summary: 
description: 
slug: Concurrency in C++
author: Christopher Weaver

draft: false
date: 2024-05-13T09:38:32-06:00
lastmod: 2024-05-13T09:38:32-06:00
publishDate: 2024-05-13T09:38:32-06:00

feature_image:
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
### Introduction

tot manus noctis opus

In today's world, harnessing the power of concurrency is essential for maximizing the performance of software applications. C++, with its robust suite of features for managing multiple tasks simultaneously, stands as a formidable tool in a developer's arsenal. Here I attempt to demystify the complexities of concurrent programming in C++, offering a guide to understanding and implementing threads, locks, and asynchronous operations effectively. Whether you're looking to improve the responsiveness of your applications or to fully leverage multi-core processors, mastering concurrency opens up a world of possibilities. Let’s dive into the nuances of C++ concurrency, starting with the basics and moving towards more advanced concepts.

### Threads

A running program will always have at least one thread. When the main function is called at the start of your program, it is executed on the main thread. We are not limited to one thread and can quickly spin up multiple threads like so:

```C++
void print() {
  std::this_thread::sleep_for(std::chrono::seconds{1});
  std::cout << "Thread ID: " << std::this_thread::get_id() << "\n";
}
int main() {
  auto ti = std::thread{print};
  ti.join();
  std::cout << "Thread ID: " << std::this_thread::get_id() << "\n";
}
```

Here we spin up a thread distinct from the main thread to handle the `print()` function. The `join()` function halts our main function until the thread has finished. We could instead call `ti.detach()` if we wish for the main function to continue regardless of the state of the `ti` thread, which in this case will likely result in the program terminating before the completion of the `print` function. If you are among the lucky few who can use C++20, we now have `std::jthread`, which is the same as a normal thread but with the added benefit of RAII. When the `jthread` reaches the end of scope, it will send a stop request and join the threads on destruction.

```C++
void print() {
  std::this_thread::sleep_for(std::chrono::seconds{1});
  std::cout << "Thread ID: " << std::this_thread::get_id() << "\n";
}
int main() {
  auto joinable_thread = std::jthread{print};
  std::cout << "Thread ID: " << std::this_thread::get_id() << "\n";
} // This is ok, the jthread will join automatically
```

You can also more easily stop a thread designed to run until asked to stop as follows:

```C++
void print(std::stop_token stoken) {
  while (!stoken.stop_requested()) {
    std::cout << "Thread ID: " << std::this_thread::get_id() << "\n";
    std::this_thread::sleep_for(std::chrono::seconds{1});
  }
}
int main() {
  auto joinable_thread = std::jthread{print};
  std::cout << "Thread ID: " << std::this_thread::get_id() << "\n";
  std::this_thread::sleep_for(std::chrono::seconds{5});
  joinable_thread.request_stop();
} 
```

Calling `request_stop` ends the `print()` function, at which point our threads join, and everyone is happy as our program exits. 

What we have shown so far is a simple passing of a function with zero arguments to a thread to be executed. But that is quite limiting. We need to be able to pass data into our thread. There are a lot of different ways to accomplish this; let's start with some simple approaches. Any class that supports the `()` operator can be passed into a thread, and the thread will automatically call this operator when being started. Any state within that class is now accessible to the thread:

```C++
class Vehicle {
  int _doors = 4;
  Vehicle(int doors) { _doors = doors; }
  void operator()() {
    std::cout << "This car has: " << _doors << " doors";
  }
};
int main() {
  std::thread t1{ Vehicle(4) }; // Use uniform initialization when passing an object to a thread
  t1.join();
}
```

Our thread will print out the correct number. We can also pass data into our thread by using a lambda that uses its capture semantics to bring data with it into the thread:

```C++
int main() {
  int test = 12;
  auto l1 = [test]() {
    std::cout << test << std::endl;
  };
  std::thread t1(l1); // captures test by value
  t1.join();

  int test2 = 13;
  auto l2 = [&test2]() {
    test2++;
    std::cout << test2 << std::endl;
  };
  std::thread t2(l2); // Captures test2 by reference
  t2.join();
}
```

We now have the opportunity to take in data by value or reference. This, though, is still very limiting. Luckily, `std::thread` has a constructor that supports variadic templates, which opens up a lot more opportunities for us.

```C++
void printID(int id) {
    std::this_thread::sleep_for(std::chrono::milliseconds(50));
    std::cout << "ID = " << id << std::endl;
    
}
void printIDAndName(int id, std::string name) {
    std::this_thread::sleep_for(std::chrono::milliseconds(100));
    std::cout << "ID = " << id << ", name = " << name << std::endl;
}
int main() {
    int id = 0; // Define an integer variable

    // starting threads using variadic templates
    std::thread t1(printID, id);
    std::thread t2(printIDAndName, ++id, "MyString");
    std::thread t3(printIDAndName, ++id); // this procudes a compiler error

    // wait for threads before returning
    t1.join();
    t2.join();
    //t3.join();


    return 0;
}
```

Here we can easily pass in our function and an arbitrary number of arguments that match how many our function takes. This is a powerful feature, but we must be aware that by default, data passed in via variadic templates is either moved or copied depending on if it is an lvalue or rvalue. If we are passing an lvalue and we don’t want to pay for a copy, we need to explicitly move it using `std::move()`. But what if we really want to pass in the variable as a reference that the thread can modify?

```C++
void printName(std::string &name, int waitTime) {
    std::this_thread::sleep_for(std::chrono::milliseconds(waitTime));
    name += " (from Thread)";
    std::cout << name << std::endl;
}

int main() {
    std::string name("MyThread");

    // starting thread
    std::thread t(printName, std::ref(name), 50);

    // wait for thread before returning
    t.join();

    // print name from main
    name += " (from Main)";
    std::cout << name << std::endl;

    return 0;
}
```

We need to pass it using `std::ref()`. 

So this is great, but C++ often deals with objects, which means we often want to work with the member functions within an object in our thread. We can do that:

```C++
class Vehicle {
public:
    Vehicle() : _id(0) {}
    void addID(int id) { _id = id; }
    void printID() {
        std::cout << "Vehicle ID=" << _id << std::endl;
    }

private:
    int _id;
};

int main() {
    // create thread
    Vehicle v1, v2;
    std::thread t1 = std::thread(&Vehicle::addID, v1, 1); // call member function on object v1
    std::thread t2 = std::thread(&Vehicle::addID, &v2, 2); // call member function on object v2

    // wait for thread to finish
    t1.join();
    t2.join();

    // print Vehicle id
    v1.printID();
    v2.printID();

    return 0;
}
```

This is similar to what we saw above, except we need to use the scope resolution syntax to let the thread know which function to call. Finally, since we are good modern C++ engineers, we will need to know how to pass objects within smart pointers to our threads:

```C++
int main() {
    // create thread
    std::shared_ptr<Vehicle> v(new Vehicle);
    std::thread t = std::thread(&Vehicle::addID, v, 1); // call member function on object v
    
    // wait for thread to finish
    t.join();
    
    // print Vehicle id
    v->printID();
    
    return 0;
}
```

Finally, we need to go over how multiple threads can be handled:

```C++
int main() {
    // create threads
    std::vector<std::thread> threads;
    for (size_t i = 0; i < 10; ++i) {
        // create new thread from a Lambda
        threads.emplace_back([i]() {

            // wait for a certain amount of time
            std::this_thread::sleep_for(std::chrono::milliseconds(10 * i));

            // perform work
            std::cout << "Hello from Worker thread #" <<

 i << std::endl;
        });
    }

    // do something in main()
    std::cout << "Hello from Main thread" << std::endl;

    // call join on all thread objects using a range-based loop
    for (auto &t : threads)
        t.join();

    return 0;
}
```

We can store our threads in a vector and then loop through that vector to call `join()` on each thread. It should be noted we need to call `emplace_back` instead of `push_back` because a thread object does not have a copy constructor and instead needs to be moved, which `emplace_back` does behind the scenes.

### Protecting Data

Concurrent programming is an amazing way to speed up our software; it also is an amazing way to shoot ourselves in the foot. Consider this code example:

```C++
int counter = 0;
void increment_counter(int n) {
  for (int i = 0; i < n; i++) {
    counter++;
  }
}
int main() {
  constexpr auto n = int{100000000};
  {
    auto t1 = std::jthread{increment_counter, n};
    auto t2 = std::jthread{increment_counter, n};
  }
  std::cout << counter << "\n";
  assert(counter == (n * 2));
}
```

This program will likely fail. This is because both threads share the same data and likely will be performing the increment operator at the same time, incrementing by 1 instead of two between the two threads. We can protect ourselves by using `std::mutex`.

```C++
int counter = 0;
std::mutex counter_mutex = std::mutex{};
void increment_counter(int n) {
  for (int i = 0; i < n; i++) {
    auto lock = std::unique_lock<std::mutex>{counter_mutex};
    counter++;
  }
}
int main() {
  constexpr auto n = int{100000000};
  {
    auto t1 = std::jthread{increment_counter, n};
    auto t2 = std::jthread{increment_counter, n};
  }
  std::cout << counter << "\n";
  assert(counter == (n * 2));
}
```

Ok, so what is going on here? Whenever we reach a critical part of our code that could be the source of a data race, we can lock a mutex that, when another thread reaches the mutex, will check to see if it is already locked. If it is, it will wait until the mutex is unlocked before proceeding. This means only one thread will ever be within the section of your code the mutex defines at a time. In my example above, I actually place the mutex within a `unique_lock` which just acts as our RAII object to ensure we do not forget to unlock our mutex. 

But our example above has an issue: deadlocks. Sometimes our program will need to modify more than one mutex at any given time. But this leaves us open to the possibility that two threads are both waiting on each other to release one lock before they release theirs:

```C++
std::mutex mutex1;
std::mutex mutex2;

void thread1() {
    std::cout << "Thread 1: Locking mutex1" << std::endl;
    std::lock_guard<std::mutex> lock1(mutex1);
    std::this_thread::sleep_for(std::chrono::milliseconds(100));

    std::cout << "Thread 1: Trying to lock mutex2" << std::endl;
    std::lock_guard<std::mutex> lock2(mutex2);

    std::cout << "Thread 1: Locked both mutexes" << std::endl;
}

void thread2() {
    std::cout << "Thread 2: Locking mutex2" << std::endl;
    std::lock_guard<std::mutex> lock1(mutex2);
    std::this_thread::sleep_for(std::chrono::milliseconds(100));

    std::cout << "Thread 2: Trying to lock mutex1" << std::endl;
    std::lock_guard<std::mutex> lock2(mutex1);

    std::cout << "Thread 2: Locked both mutexes" << std::endl;
}

int main() {
    std::thread t1(thread1);
    std::thread t2(thread2);

    t1.join();
    t2.join();

    return 0;
}
```

Here `thread1` might be waiting on `thread2` to unlock `mutex2` and `thread2` might be waiting on `thread1` to release `mutex1`. The solution here is to use `std::lock()` when handling multiple mutexes:

```C++
void thread1() {
    std::cout << "Thread 1: Trying to lock both mutexes" << std::endl;
    std::unique_lock<std::mutex> lock1(mutex1, std::defer_lock);
    std::unique_lock<std::mutex> lock2(mutex2, std::defer_lock);
    std::lock(lock1, lock2);
   
    std::cout << "Thread 1: Locked both mutexes" << std::endl;
}

void thread2() {
    std::cout << "Thread 2: Trying to lock both mutexes" << std::endl;
    std::unique_lock<std::mutex> lock1(mutex1, std::defer_lock);
    std::unique_lock<std::mutex> lock2(mutex2, std::defer_lock);
    std::lock(lock1, lock2);

    std::cout << "Thread 2: Locked both mutexes" << std::endl;
}
```

Here `std::lock()` will wait until it can lock both mutexes and then will ensure they are both locked at the same time. One of the great things about `unique_lock` is you can tell it to not immediately lock until you call `.lock()` on it by passing the argument `std::defer_lock`.

### Passing Data Between Threads

So far, we have kind of relied on global/shared variables between threads, which is not a great approach. A better way is to have our threads directly communicate information back into the scope that owns the thread. This can be done with promises and futures. Let’s first see how to do this with threads.

```C++
// Function to perform some computation and set the result in a promise
void compute(std::promise<int> result_promise) {
    int result = 0;
    for (int i = 1; i <= 10; ++i) {
        result += i * i; // Example computation: sum of squares from 1 to 10
    }
    result_promise.set_value(result); // Set the result in the promise
}

int main() {
    // Create a promise and a future
    std::promise<int> promise;
    std::future<int> future = promise.get_future();

    // Launch a thread to perform the computation
    std::thread t(compute, std::move(promise));

    // Retrieve the result from the future
    int result = future.get(); // get() waits for the result and retrieves it

    // Join the thread
    t.join();

    // Output the result
    std::cout << "The sum of squares from 1 to 10 is: " << result << std::endl;

    return 0;
}
```

We need to utilize the `std::promise` and `std::future`. We will end up passing the promise into our function (which requires a parameter to accept it), and we hold onto the future provided by `promise.get_future()` to retrieve data when ready. When our thread is ready to pass data back, it calls `set_value()` on the promise. Meanwhile, our main function is halted, waiting for `future.get()` to receive data back. 
We can now modify this to handle multiple threads:

```C++
// Function to perform some computation and set the result in a promise
void compute(int start, int end, std::promise<int> result_promise) {
    int result = 0;
    for (int i = start; i < end; ++i) {
        result += i * i; // Example computation: sum of squares
    }
    result_promise.set_value(result); // Set the result in the promise
}

int main() {
    // Number of threads
    const int num_threads = 4;

    // Range of values to compute
    const int range_size = 100;
    const int step = range_size / num_threads;

    // Vectors to hold the threads and their promises/futures
    std::vector<std::thread> threads;
    std::vector<std::promise<int>> promises(num_threads);
    std::vector<std::future<int>> futures;

    // Launch threads
    for (int i = 0; i < num_threads; ++i) {
        int start = i * step;
        int end = (i + 1) * step;
        futures.push_back(promises[i].get_future());
        threads.emplace_back(compute, start, end, std::move(promises[i]));
    }

    // Handle the results from each thread
    int total_sum = 0;
    for (auto& future : futures) {
        total_sum += future.get(); // get() waits for the result and retrieves it
    }

    // Join the threads
    for (auto& thread : threads) {
        thread.join();
    }

    std::cout << "Total sum of computations: " << total_sum << std::endl;

    return 0;
}
```

Managing promises and futures with threads can quickly become challenging and requires a decent amount of boilerplate to do. We could instead use `std::async()` which works really well

 out of the box with promises and futures.

```C++
double divideByNumber(double num, double denom) {
    if (denom == 0)
        throw std::runtime_error("Exception from thread#: Division by zero!");

    return num / denom;
}

int main() {
    // use async to start a task
    double num = 42.0, denom = 2.0;
    std::future<double> ftr = std::async(divideByNumber, num, denom);

    // retrieve result within try-catch-block
    try {
        double result = ftr.get();
        std::cout << "Result = " << result << std::endl;
    } catch (std::runtime_error e) {
        std::cout << e.what() << std::endl;
    }

    return 0;
}
```

`std::async` takes arguments similar to `std::thread` (except for an extra optional argument at the beginning) and returns a future which will be the return value of the function. But unlike using threads, we no longer need to construct or manage a `std::promise`. This simplifies our function used in the thread significantly. 

Also, unlike a thread which will always run concurrently, `std::async` will determine at runtime if its function should run synchronously or asynchronously depending on the current machine resources. Developers can override this by passing `std::launch::deferred` for synchronous execution or `std::launch::async` for asynchronous execution. Similar to threads, we can also spin up a bunch of async objects as needed:

```C++
double divideByNumber(double num, double denom) {
    if (denom == 0)
        throw std::runtime_error("Exception from thread#: Division by zero!");

    return num / denom;
}
int main() {

    std::vector<std::future<void>> futures;
    int nLoops = 1000, nThreads = 5;
    for (int i = 0; i < nThreads; ++i) {
        futures.emplace_back(std::async(divideByNumber, 5000, i));
    }

    // wait for tasks to complete
    double final_sum = 0.0;
    for (const std::future<void> &ftr : futures)
        final_sum += ftr.get();
    return 0;
}
```

`std::async` abstracts a lot of the difficulties of using `std::thread` away but at the cost of a loss of strict control. As a general rule of thumb, if you need performance-critical threading or fine-grained control, threads may be a better solution. Otherwise, use async for simpler things like I/O-bound tasks. 

One further example I would like to go over is using a manager object to queue asynchronous operations:

```C++
class Vehicle {
public:
    Vehicle(int id) : _id(id) {}
    int getID() { return _id; }

private:
    int _id;
};

class WaitingVehicles {
public:
    WaitingVehicles() {}

    bool dataIsAvailable() {
        std::lock_guard<std::mutex> myLock(_mutex);
        return !_vehicles.empty();
    }

    Vehicle popBack() {
        // perform vector modification under the lock
        std::lock_guard<std::mutex> uLock(_mutex);

        // remove last vector element from queue
        Vehicle v = std::move(_vehicles.back());
        _vehicles.pop_back();

        return v; // will not be copied due to return value optimization (RVO) in C++
    }

    void pushBack(Vehicle &&v) {
        // simulate some work
        std::this_thread::sleep_for(std::chrono::milliseconds(100));

        // perform vector modification under the lock
        std::lock_guard<std::mutex> uLock(_mutex);

        // add vector to queue
        std::cout << "   Vehicle #" << v.getID() << " will be added to the queue" << std::endl;
        _vehicles.emplace_back(std::move(v));
    }

private:
    std::vector<Vehicle> _vehicles; // list of all vehicles waiting to enter this intersection
    std::mutex _mutex;
};

int main() {
    // create monitor object as a shared pointer to enable access by multiple threads
    std::shared_ptr<WaitingVehicles> queue(new WaitingVehicles);

    std::cout << "Spawning threads..." << std::endl;
    std::vector<std::future<void>> futures;
    for (int i = 0; i < 10; ++i) {
        // create a new Vehicle instance and move it into the queue
        Vehicle v(i);
        futures.emplace_back(std::async(std::launch::async, &WaitingVehicles::pushBack, queue, std::move(v)));
    }

    std::cout << "Collecting results..." << std::endl;
    while (true) {
        if (queue->dataIsAvailable()) {
            Vehicle v = queue->popBack();
            std::cout << "   Vehicle #" << v.getID() << " has been removed from the queue" << std::endl;
        }
    }

    std::for_each(futures.begin(), futures.end(), [](std::future<void> &ftr) {
        ftr.wait();
    });

    std::cout << "Finished processing queue" << std::endl;

    return 0;
}
```

Our data is safer since it is all going through the same `WaitingVehicles` class which correctly implements a mutex to prevent against data races. It also queues our data to ensure it is handled on our main thread in the correct order.

### C++20 Additional Synchronization Primitives

There are three new additions to concurrency in C++20 worth mentioning. The first is Latches. A latch allows for synchronizing multiple threads by providing a point they all must arrive at. It is a glorified decrementing counter where all threads decrement the latch and then wait for the latch to reach zero before moving on.

```C++
int do_work{ /* ... */}
int do_more_work{ /* ... */}
int main() {
  constexpr auto n_threads = 2;
  std::latch initialized = std::latch{n_threads};
  std::vector<std::thread> threads = std::vector<std::thread>{};
  for (int i = 0; i < n_threads; i++) {
    threads.emplace_back( [&]() {
      do_work();
      initialized.arrive_and_wait(); // decrement and wait
      do_more_work();
    });
  }
  initialized.wait(); // block until this latch is zero
  for (auto&& t : threads) {
    t.join();
  }
}
```

Latches also support:

```C++
std::latch l = std::latch{8};
l.count_down(); // decrement but don't wait until zero
l.wait(); // don't decrement but wait until zero
if (l.try_wait()) { // test to see if latch is zero without blocking
  // latch is zero
}
```

The next one is barriers. They are similar to latches but with two additions: a barrier can be reused, and it can run a completion function when it reaches zero. To use it, pass the initial value and our completion function/lambda:

```C++
auto bar = std::barrier{8, []() {
  std::cout << "All threads arrived at barrier\n";
}};
```

Barrier supports all the same functions as a latch, which means when we call `bar.arrive_and_wait()` 8 times, the message "All threads arrived at barrier" will display. Here is an example of a program that simulates rolling 6 dice and seeing how many times it takes to roll all 6s:

```C++
int roll_die() {
    static thread_local std::mt19937 generator(std::random_device{}());
    std::uniform_int_distribution<int> distribution(1, 6);
    return distribution(generator);
}
int main() {
  bool done = false;
  auto dice = std::array<int, 5>{};
  auto threads = std::vector<std::thread>{};
  auto n_turns = 0;

  // our completion function when barrier reaches zero
  auto check_result = [&]() {
    ++n_turns;
    bool is_six = [](int i) { return i == 6; };
    done = std::all_of(dice.begin(), dice.end(), is_six);
  };
  auto bar = std::barrier{6, check_result};

  for (int i = 0; i < 5; i++) {
    threads.emplace_back([&,i]() {
      while (!done) {
        dice[i] = roll_die();
        bar.arrive_and_wait();
      }
    });
  }
  for (auto&& t : threads) {
    t.join();
  }
  std::cout << n_turns << std::endl;
}
```

Each time all six dice have been randomly rolled, the barrier completion function is called and we check to see if all six dice are equal to 6. If they are, we set our `done` variable to true and finish up. Otherwise, it should be noted that the barrier will automatically reset to its initial number after running the completion function. This means we can iterate again over all the dice threads and try again.

Finally, let's review semaphores. Semaphores in C++ can be used to signal different states between different threads while controlling access to critical data. In the example below, a counting semaphore allows for 5 different threads to access a function at the same time, blocking all other threads until a spot opens up:

```C++
class Server {
public: 
  void handle(const Request& req) {
    sem_.acquire(); // blocks until 1 of 5 threads is available. 
    do_handle(req);
    sem_.release

(); // decrements so another thread can call do_handle
  }
private:
  void do_handle(const Request& req) { /* ... */ }
  std::counting_semaphore<5> sem_{5};
};
```

Below is an example of a bounded buffer that has multiple threads reading (pop()) and writing (push()) to the buffer. To prevent data races, we will use two semaphores to synchronize our threads properly.

```C++
template <typename T, int N>
class BoundedBuffer {
  std::array<T, N> buf_;
  std::size_t read_pos_{};
  std::size_t write_pos_{};
  std::mutex m_;
  std::counting_semaphore<N> n_empty_slots{N};
  std::counting_semaphore<N> n_full_slots{0};

  void do_push(auto&& item) {
    n_empty_slots_.acquire(); // There is one less slot. Any other thread will need to wait if all empty slots are taken (== 0)
    try {
      auto lock = std::unique_lock{m_}; // use a mutex to lock our data
      buf_[write_pos_] = std::forward<decltype(item)>(item);
      write_pos_ = (write_pos_ + 1) % N;
    } catch (...) {
      n_empty_slots_.release(); // we failed to add to the buffer, so empty slots should be reset
      throw;
    }
    n_full_slots_.release(); // everything was successful, we now have one more full slot
  }
public:
  void push(const T& item) { do_push(item); }
  void push(T&& item) { do_push(std::move(item)); }
  auto pop() {
    n_full_slots_.acquire(); // Check if there is any data, if so remove one and all other threads must wait for data to be added if at zero
    auto item = std::optional<T>{};
    try {
      auto lock = std::unique_lock{m_};
      item = std::move(buf_[read_pos_]);
      read_pos_ = (read_pos_ + 1) % N;
    } catch (...) {
      n_full_slots_.release();
      throw;
    }
    n_empty_slots_.release();
    return std::move(*item);
  }
};
```

Using two semaphores, we are able to synchronize all of our threads so that we are never trying to `pop()` an empty buffer or add to a full buffer. This is challenging since our threads will run non-deterministically.

There is one more major aspect to C++ concurrency that I want to handle, which is atomics. But I suspect there is enough content regarding atomics that it can be its own post. Also, this post is getting rather long, so I think we can end here.

### Conclusion

Our processors will, and already have started to, hit a wall as far as how fast they can sequentially process information. But our need for faster programs certainly will not acquiesce to this limiting factor. Instead, it is up to engineers to figure out how to utilize multiple threads and concurrent processes to speed up our programs. This is not an easy task by any means, but it is an important one. Writing robust concurrent software is doable, and you no longer need ice in your veins to make the attempt. But you must make sure you are using the right tools and that you understand them.

tot manus noctis opus