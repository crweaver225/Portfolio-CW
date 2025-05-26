---
title: Functional Programming in C++
seo_title: Functional Programming in C++
summary: 
description: 
slug: Functional Programming in C++
author: Christopher Weaver

draft: false
date: 2025-05-24T09:38:32-06:00
lastmod: 2025-05-24T09:38:32-06:00
publishDate: 2025-05-24T09:38:32-06:00

feature_image: functional-cpp.png
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
disable_comments: true
---
### Functional Programming
I have as of recently been on a side quest of sorts, learning Haskell and the fundamentals of functional programming. In opposition to imperative programming languages like C and Java, languages like Haskell are declarative and built by composing a series of functions that take input and produce an output without ever modifying the state of the program. Advocates of functional programming argue their code is easier to reason about, has fewer bugs, and becomes trivial to parallelize. What I found was that most of these claims are not without merit. Functional programs have an eloquence to their structure that makes programming more enjoyable at times. When it came to making code changes, I knew that as long as the function I was modifying continued to pass their unit tests, my program would continue to operate as expected, no matter how large the changes were. This felt like a superpower. There also was something incredibly refreshing about jumping into a code base and not needing to learn all the complex types defined throughout the program. The sea of objects regularly found in an object oriented focused programming language is more like a puddle of objects in functional langauges.

Haskell was a joy to learn. Among its most defining features, I found these to be the most important.

1) It tries very hard to keep everything stateless. This means if I call a function, that function will not modify any part of the program or the larger system the program is running on. The function can only take in values, run compute operations, and return entirely new values. The last part emphasizes what makes functional programming unique. Even when a variable is passed into a function, Haskell's vanilla functions cannot modify or return that value since doing so would mean the function can modify something at a specific memory address within the program. Even things like a simple for loop are not easily achievable since they generally require modifying an iterator of some sort as you execute your loop, which would mean modifying the state of a variable. 

2) Lazy evaluation. Haskell likes to execute operations that the developer asked it to compute only when those operations are going to be used. This gives the language a really unique ability to run operations on lists of infinite size. There are some really great performance benefits to this since lazy evaluation prevents storing and executing compute on large data structures where much of the data might not require being computed. Finally, lazy evaluation allows for more modular and compositional code via the chaining of functions. I write more about lazy evaluation [here.](/engineering/lazy-evaluation-in-haskell/)

3) Higher-order functions. Haskell allows for functions that take other functions in as arguments just as it would any other sort of variable. This allows for some great composable code with powerful abstractions and reusable code blocks. 

I recently wrote about some of my biggest pain points with C++ and just how incredibly well Rust resolves [them](/engineering/programming-in-rust/). My conclusion was not that C++ should be abandoned like a temple in an Indiana Jones film, but that there are a lot of great lessons we can leverage to write better C++ code. Learning Haskell further solidified some of those insights I had encountered and continues to nudge my opinion about proper programming styles in a language that bridges multiple paradigms. C++ is often said to be an object-oriented programming language. I think this is a fair claim. OOP concepts are first-class citizens within the mechanics of the language. Furthermore, OOP has been the go-to approach for most C++ developers since the inception of the language. But C++ does offer some really great tools for writing code that inherits (pun intended) the benefits of functional programming. A lot of these tools are part of recent additions to the language driven by the increasing popularity of functional programming paradigms.

### Functional Programming in C++
So how would we go about leveraging the benefits of functional programming into our C++ source code? The lowest-hanging fruit for us is to limit the use of mutable data. When initializing variables and objects, we should default to marking them const to ensure they cannot be modified elsewhere in the program. 
```C++
int modify_var(const int _my_var) {
    int new_my_var = my_var + 10;
    return new_my_var;
}
int main() {
    const int my_var = 10;
    const int new_my_var = modify_var(my_var);
}
```
When something is marked as const, it cannot be modified throughout the lifetime of the program. Beyond the compiler optimizations we can expect to benefit from with this minor change, we have now made our program easier to reason about and safer to execute since we do not have to worry about data changing in ways we did not anticipate. An example where having a state that can be modified throughout the program and can backfire looks like this
```C++
double average(std::vector<int>& data) {
    if (!data.empty()) {
        data[0] = 999;  // 😱 Side effect!
    }

    int sum = 0;
    for (int x : data) {
        sum += x;
    }
    return static_cast<double>(sum) / data.size();
}

int main() {
    std::vector<int> values = {10, 20, 30, 40};
    double avg = average(values);

    std::cout << "Average: " << avg << std::endl;
    std::cout << "First element after average: " << values[0] << std::endl; // Output: 999
}
```
The output of this program should be 10, but instead we see 999. Our vector that we pass into the average function was modified in a way we may not have been expecting and may result in a bug down the line. Instead, we should always default to marking our vector as const within main and within the argument parameter in our average function. If we find that we need these to be modifiable in the future, we first ought to review if we have an opportunity to change our architecture and then, finally, to remove our const keyword if it remains the best option. 

In order to ensure statelessness, Haskell leans heavily on making copies of data as it gets processed through different functions. C++, being a systems programming language with a heavy emphasis upon performance optimization, often recoils a little at the thought of making multiple copies of the same piece of data as it traverses the control flow of the program. Allocating memory and then filling that memory with values is relatively expensive and can negatively impact performance in ways passing a reference to the same memory address doesn't. The contention between these two approaches is generally referred to as value semantics vs. reference semantics. There is no perfect solution to the debate, and the answer for any particular situation will depend on that situation. But within the context of discussing the benefits of functional programming, it is often extremely beneficial in C++ to simply default to value semantics and allow for multiple copies of a variable or object to propagate throughout the program. As mentioned, this removes state in an important way that reduces bugs and makes reasoning about the program much simpler. 
```C++
#include <iostream>
#include <string>

struct Config {
    std::string name;
    int maxThreads;
    bool debug;

    void print() const {
        std::cout << "Config: " << name
                  << ", maxThreads: " << maxThreads
                  << ", debug: " << std::boolalpha << debug << std::endl;
    }
};

// Good: return by value
Config makeDefaultConfig() {
    Config cfg;
    cfg.name = "Default";
    cfg.maxThreads = 4;
    cfg.debug = false;
    return cfg;
}

void makeBackupConfigForDisk(Config original) {
    original.name = "Backup";
    saveToDisk(original); // calls a function elsewhere in the system to save to disk
}

int main() {
    Config appConfig = makeDefaultConfig(); // full ownership
    appConfig.debug = true;                 // independently modifiable

    makeBackupConfigForDisk(appConfig);

    appConfig.print();     // Modifications do not affect backupConfig
}
```
Here we end up making a copy of Config when we pass it to makeBackupConfigForDisk that we then modify and further send out to another function to save to disk. The copy *might be more expensive, but the added benefit is our original appConfig object was not modified and still operates as we expect when we call print() on it. In functional programming terms, we have eliminated some side effects in our program for a more deterministic runtime. 

### Views and Ranges
In this really great [talk](https://www.youtube.com/watch?v=vN0U4P4qmRY) by Klaus Iglberger, he puts an emphasis on keeping handcrafted loops out of your C++ programs. Instead, developers should be leveraging functions from the algorithms library to process data. This is similar to Haskell's lack of loops in its language mechanics. Instead, Haskell largely relies either on recursion or on functions like fold and filter to traverse data structures. C++ has historically utilized the handcrafted for-loop as a primary part of the language, but recent additions in C++20 bring new abilities to sidestep the handcrafted loop and instead traverse data structures in a more functional manner. 

The ranges library introduced in C++20 provides a significant amount of new features developers can utilize to comply with Iglberger's suggestion and help us encompass many of the benefits functional programming offers us. Let's take a look at a small example that traverses a vector and squares each value.
```C++
auto numbers = std::vector{1,2,3,4};
auto square = [](auto v) { return v * v; };
auto squared_view = std::views::transform(numbers, square);
for (auto s : squared_view) {
    std::cout << s << " ";
}
// Outputs: 1 4 9 16
```
What is noteworthy here is that nothing gets computed until you print the variable s using cout. Prior to that moment, the transform function does not execute the square operation on any values. This is (as an ironic turn of phrase) lazy evaluation at work, similar to what we see in Haskell. Furthermore, what we are seeing is a composition of functions to achieve some end result without ever explicitly modifying the state of our program. Our numbers vector is never modified. If we were to print it out again, the values would still be 4. Instead, we have created new values each time we access another value within squared_view. Furthermore, our range-based for-loop has no iterator that gets explicitly modified throughout the loop in a way prone to human error during development. This entire code snippet is brought to you by the functional programming paradigm. It is pure in that it offers us the ability to execute operations on only the data we intend to use without fear of the execution having any side effects on the rest of our program. 

Functional programming offers this really cool ability to chain a bunch of functions together to transform data efficiently in a very intuitive way. Composable functions are one of the hallmarks of the paradigm and are something that was sorely missing from C++ until recently. C++ could, of course, compose functions together prior to C++20 but required either expensive copies of data or dangerous reference semantics. Let's take a look at an example where we want to iterate over a vector of students to find the individual in their second year with the highest score.
```C++
struct Student {
    int year_{};
    int score_{};
    std::string name_{};
};

auto get_max_score(const std::vector<Student>& students, int year) {
    auto by_year = [=](const auto& s) { return s.year_ == year; };
    auto v = std::vector<Student>{};
    std::ranges::copy_if(students, std::back_inserter(v), by_year);
    auto it = std::ranges::max_element(v, std::less{}, &Student::score_);
    return it != v.end() ? it->score_ : 0;
}
```
Our get_max_score function takes a vector of Student objects and the year we want to find the max score for. Our by_year lambda will handle the filtering by year, and the max_element function will give us an iterator to the student with the highest value. The issue is that the C++ algorithms library does not allow for allocating memory or composing functions together as we could in Haskell. Instead, we are forced to create a new vector and push all students that match the required year into this vector prior to looking for the maximum score. Unfortunately, the lack of composability means we need to make significantly more memory allocations in order to execute multiple operations from the algorithms library. 

The ranges library in C++20 allows for composability. Here is how we can leverage it to solve the same problem as above.
```C++
auto get_max_score(const std::vector<Student>& s, int year) {
    auto by_year = [=](const auto& s) { return s.year_ == year; };

    auto v1 = std::ranges::ref_view{s}; // Wrap container in a view
    auto v2 = std::ranges::filter_view{v1, by_year};
    auto v3 = std:;ranges::transform_view{v2, &Student::score_};

    auto it = std::ranges::max_element(v3);
    return it != v3.end() ? *it : 0;
}
```
Our function above accomplishes our initial task without the extra memory allocation in the middle to filter by year. The ref_view wraps our container and allows us to compose both our filter and max_element functionality together without any further memory allocation. Furthermore, this entire process will only iterate over the data once despite the multiple things we are asking the function to do, which offers us some really cool performance benefits. And just as before, all of this happens without any modification to the initial student vector, which means no subtle bugs potentially introduced into our program because of a change to the state of the program. 

The ranges library offers some great functional programming improvements, but what we see above can become quite verbose in comparison to the eloquence we see in a similar Haskell approach.
```Haskell
getMaxScore :: [Student] -> Int -> Int
getMaxScore students targetYear =
  case [score s | s <- students, year s == targetYear] of
    [] -> 0
    scores -> maximum scores
```
Fortunately, C++ also offers range adaptors to further clean up some of this syntax. Range adaptors use the pipe operator to compose our functions in a really cool way. Here is the same function as above, but with the range adaptors.
```C++
int get_max_score(const std::vector<Student>& students, int year) {
    auto by_year = [=](const Student& s) { return s.year_ == year; };

    auto scores = students 
                | std::views::filter(by_year)
                | std::views::transform(&Student::score_);

    auto it = std::ranges::max_element(scores);
    return it != scores.end() ? *it : 0;
}
```
The pipe operator allows us to compose our functions and read them from left to right in an intuitive manner. Above we take the students vector, filter by year, and transform it into a non-owning view that our max_element function can quickly iterate over to give us our final result. Again, no memory allocation occurs, no handcrafted loops need to be introduced, and the state of our program does not get modified whenever this function is called. The two massive benefits here are

1) Using functions like filter, transform, and others, we can communicate to other developers what precisely is happening in a uniform way that is easy to understand. Handcrafted solutions to this can be built but require significantly more cognitive load on other developers who may later need to jump in and understand what this function is doing.

2) I can modify this function as much as I want in the future, and so long as it continues to pass the unit tests that I would write for it, I can be confident my program will not break. That is because this function is relatively pure and will not impact any other part of the overarching system. This means we can refactor quickly with confidence. 

### Conclusion
While C++ is traditionally known for its imperative and object-oriented roots, it's more than capable of supporting functional programming techniques — and embracing them can lead to clearer, safer, and more maintainable code. By using tools like std::ranges, pure functions, immutability, and value semantics, C++ developers can reap many of the same benefits enjoyed by users of purely functional languages like Haskell or Elm without leaving the comfort of the C++ ecosystem.

Incorporating functional ideas doesn't mean abandoning what makes C++ powerful — it means using those features with intention: isolating side effects, reducing shared mutable state, and writing transformations instead of instructions. As C++ continues to evolve, modern features like views, lambdas, and structured bindings make functional approaches not only possible but elegant.

By practicing functional programming in C++, you gain the expressive clarity of a higher-level paradigm while maintaining access to the performance and control that C++ is known for. It’s not about dogma — it’s about writing better software.