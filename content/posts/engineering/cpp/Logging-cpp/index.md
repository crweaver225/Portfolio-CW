---
title: Building a Log Utility Class in C++
seo_title: Building a Log Utility Class in Cpp
summary: 
description: 
slug: Building a Log Utility Class in Cpp
author: Christopher Weaver

draft: false
date: 2024-10-04T09:38:32-06:00
lastmod: 2024-10-04T09:38:32-06:00
publishDate: 2024-10-04T09:38:32-06:00

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

I was recently working through 

***Building Low Latency Applications With C++***

**Author:** *Sourav Ghosh*

and found a really cool example of a Logger class that is pretty plug and play for a bunch of software projects where one might need to log their C++. Of course, there are a bunch of great libraries that can do this, but the one I will be going through below is lightweight and customizable to the developers needs. What follows largely comes from the book referenced above, but with some of my own modifications to modernize the abstractions where I thought relevant. 

Imagine you want to log anytime your utility class has its execute() invoked along with the current state of the utility class. We want a logger class that is both so simple you can easily call log() to write to a specific log file, but flexible enough to take any arbitrary number of arguments to help construct the log entry

```C++
class UtilityClass {
  int flag_ = 1;
  int timesInvoked_ = 0;
  Logger logger_;

  UtilityClass() : logger_("utility_class.log");
};
```
Our utility class will hold onto a Logger member variable that is initailized within the constructor. Our logger class will need an initial string argument that informs the logger where it needs to store the logs written to it. Once this is good to go though, writting logs is pretty simple
```C++
UtilityClass::execute() {
  logger_->log("%:% %() invoked. flag=%, timesInvoked=% \n", __FILE__, __LINE__, __FUNCTION__, flag_, ++timesInvoked_);
}
```
Thats it. We lay out the text we want to be logged and then pass an arbitrary amount of other arguments to the log function that will replace each instace of %. Our final example will look something like this within our log

utilityclass.cpp, 12, execute() invoked. flag=true, timesInvoked=1

This text will live within the .log file we setup when constructing our Logger class. Let us now see how we implement the Logger class. 

We will start with defining our Logger constructor and private members
```C++
class Logger {

  explicit Logger(const std::string &file_name) : file_name_(file_name) {
    file_.open(file_name);
    ASSERT(file_.is_open(), "Could not open log file:" + file_name);
    logger_thread = std::thread(&Logger::flush, this);
  }

  // Deleted default, copy & move constructors and assignment-operators.
  Logger() = delete;

  Logger(const Logger &) = delete;

  Logger(const Logger &&) = delete;

  Logger &operator=(const Logger &) = delete;

  Logger &operator=(const Logger &&) = delete;

  private:
    const std::string file_name_;
    std::ofstream file_;

    std::queue<LogElement> queue_;
    std::atomic<bool> running_;
    std::thread *logger_thread_;
};
```
Our constructor takes in the file name and attempts to open an ofstream file that it has ownership over. Assuming this works, we next start up a thread that runs a function called flush which we will get to shortly. We do not want our Logger class being copied or moved and therefore delete those constructors. Our private member variables include a queue to asynchronously take in new items to write to our log file, an atomic boolean to track if the log should still be running, and our thread to handle writing logs on a backend thread that doesnt bog down any critical processes. 

Before we proceed any further, there are a couple of data structures we will need to define that our logger class will use to handle the different data types it might be passed to log. 

```C++
enum class LogType : int8_t {
  CHAR = 0,
  INTEGER = 1,
  LONG_INTEGER = 2,
  LONG_LONG_INTEGER = 3,
  UNSIGNED_INTEGER = 4,
  UNSIGNED_LONG_INTEGER = 5,
  UNSIGNED_LONG_LONG_INTEGER = 6,
  FLOAT = 7,
  DOUBLE = 8
};

struct LogElement {
  LogType type_ = LogType::CHAR;
  union {
    char c;
    int i;
    long l;
    long long ll;
    unsigned u;
    unsigned long ul;
    unsigned long long ull;
    float f;
    double d;
  } u_;
};
```
We first construct an enum to represent the different primitive types supported by our logger class. We also construct a LogElement struct that holds two values. The first is the enum of the primitive type stored by the LogElement and the second is a union that stores the actual primitive value. It should be noted an std::variant is a more modern solution to getting similar behavior, but with a performance hit I do not find acceptable in C++. 

We can now look at the implementation details of our flush function. 
```C++
auto flushQueue() noexcept {
  while (running_) {

    while (!queue_.empty()) {
      auto next = queue_.front();
      queue_.pop();
      switch (next->type_) {
        case LogType::CHAR:
          file_ << next->u_.c;
          break;
        case LogType::INTEGER:
          file_ << next->u_.i;
          break;
        case LogType::LONG_INTEGER:
          file_ << next->u_.l;
          break;
        case LogType::LONG_LONG_INTEGER:
          file_ << next->u_.ll;
          break;
        case LogType::UNSIGNED_INTEGER:
          file_ << next->u_.u;
          break;
        case LogType::UNSIGNED_LONG_INTEGER:
          file_ << next->u_.ul;
          break;
        case LogType::UNSIGNED_LONG_LONG_INTEGER:
          file_ << next->u_.ull;
          break;
        case LogType::FLOAT:
          file_ << next->u_.f;
          break;
        case LogType::DOUBLE:
          file_ << next->u_.d;
          break;
      }
    }
    file_.flush();

    using namespace std::literals::chrono_literals;
    std::this_thread::sleep_for(10ms);
  }
}
```
This function will run on a while true loop, confirming with the atomic boolean that it should continue to loop after each iteration. This is fine since, as stated earlier, this function runs on a background thread spun up within the constructor. Each iteration involves pulling all the items from the queue one at a time, checking the type, and writing the correct union value to our ofstream file. Once the queue is cleared, we flush the file and put the thread to sleep for 10ms. 

Next is the most challenging part of our logger class which is the actual log function. Because we want to be able to take an arbitrary number of arguments that can be inserted in place of the % symbol in the string, we will need to utilize a template variadic pack. 
```C++
template<typename T, typename... A>
auto log(const char *s, const T &value, A... args) noexcept {
  while (*s) {
    if (*s == '%') {
      if (*(s + 1) == '%') { // to allow %% -> % escape character.
        ++s;
      } else {
        pushValue(value); // substitute % with the value specified in the arguments.
        log(s + 1, args...); // pop an argument and call self recursively.
        return;
      }
    }
    pushValue(*s++);
  }
}
```
Our log function takes a pointer to the beginning of the string we want our log to write to and an arbitrary number of templated arguments. A while loop allows us to iterate the string one memory address at a time until we reach our null terminated string value. We check each character to see if it is a % that requires work to grab the next templated argument to place within our string. We have an edge case where we are actually escaping a % by having two of them in a row. Each iteration of our while loop will end in us calling the pushValue() method. If our character is not a %, then we stay within the scope of the current function and continue to the next loop. If our character matches %, then we will call pushValue() with the next templated argument, which will insert that templated value in our log, and then we call log() again with args... to ensure our log function gets the next templated argument. Our pushValue function is overloaded to handle all the primitive types supported by our LogType enum
```C++
auto pushValue(const char value) noexcept {
  pushValue(LogElement{LogType::CHAR, {.c = value}});
}

auto pushValue(const int value) noexcept {
  pushValue(LogElement{LogType::INTEGER, {.i = value}});
}

auto pushValue(const long value) noexcept {
  pushValue(LogElement{LogType::LONG_INTEGER, {.l = value}});
}

auto pushValue(const long long value) noexcept {
  pushValue(LogElement{LogType::LONG_LONG_INTEGER, {.ll = value}});
}

auto pushValue(const unsigned value) noexcept {
  pushValue(LogElement{LogType::UNSIGNED_INTEGER, {.u = value}});
}

auto pushValue(const unsigned long value) noexcept {
  pushValue(LogElement{LogType::UNSIGNED_LONG_INTEGER, {.ul = value}});
}

auto pushValue(const unsigned long long value) noexcept {
  pushValue(LogElement{LogType::UNSIGNED_LONG_LONG_INTEGER, {.ull = value}});
}

auto pushValue(const float value) noexcept {
  pushValue(LogElement{LogType::FLOAT, {.f = value}});
}

auto pushValue(const double value) noexcept {
  pushValue(LogElement{LogType::DOUBLE, {.d = value}});
}

auto pushValue(const char *value) noexcept {
  while (*value) {
    pushValue(*value);
    ++value;
  }
}

auto pushValue(const std::string &value) noexcept {
  pushValue(value.c_str());
}

auto pushValue(const LogElement &log_element) noexcept {
  queue_.push(log_element);
}
```
The last overloaded function takes the actual LogElement we converted all the other primitive types to and adds it to the queue_. From here, our flushQueue() method running on its own thread will periodically take all LogElement values in the queue_ and add to them our log file. 

Finally, we utilize a destructor on our Logger to clean up
```C++
~Logger() {
  while (queue_.size()) {
    using namespace std::literals::chrono_literals;
    std::this_thread::sleep_for(1s);
  }
  running_ = false;
  logger_thread_->join();

  file_.close();
}
```
We wait for the flushQueue method to clean up any items left in our queue_, then we join our threads and close our file. 

The end result is a light logging class that we can use anywhere in our project. A big note of warning, our implementation is not entirely thread safe as it currently sits. Two different places in our code writing to the same log file at the same time could lead to characters being inter-mixed. Additional locks or synchronizations techniques can be included to prevent such issues from occuring. 

Happy logging