---
title: ScopeGuards
seo_title: ScopeGuards
summary: 
description: 
slug: ScopeGuards
author: Christopher Weaver

draft: true
date: 2024-07-11T09:38:32-06:00
lastmod: 2024-07-11T09:38:32-06:00
publishDate: 2024-07-11T09:38:32-06:00

feature_image:
feature_image_alt: 

categories:
- Engineering
tags:
- C++
- Design Patterns
series:
- Design Patterns

toc: true
related: true
social_share: true
newsletter: false
disable_comments: false
---

Systems programming languages like C++ do not have a garbage collector and do not utilize automatic reference counting (other than for specific library features) for memory management and therefore require the programmer to ensure memory gets cleaned up throughout the lifecycle of the program. The high price of putting the burden on the engineer to manage their own memory comes with the beneficial tradeoff that you can write much more efficient and predictable programs. C++, in order to help developers manage memory, uses an idiom called RAII (resource acquisition is initialization), which involves moving memory ownership to objects that will automatically clean up that memory in its destructor once that object falls out of scope. Falling out of scope means the program reaches the ending } in which that object was defined. Modern C++ leans very heavily upon RAII to ensure both performant software and memory-safe programs.

RAII is a powerful tool that engineers can use for more than just ensuring memory safety. It also has an interesting side effect that can be leveraged, outside of resource management, to help produce more robust, error-free software. A design pattern that leverages RAII to hedge against runtime errors called the scopeguard. I will be borrowing an example from:

***Design Patterns With C++***
**Author:** *Fedor G. Pikus*

Our example involves some code representing storing records in a database:
```C++
class Record { ... };
class Database {
  class Storage { ... };
  Storage S;
  class Index { ... };
  Index I;
  public:
    void insert (const Record& r);
};

void Database::insert(const Record& r) {
  S.insert(r);
  I.insert(r);
}
```
We have a database class, as well as an Index and Storage class. When a record is inserted into the database, we need to insert it both into our index and storage class. The problem is that the insert for either of these functions can fail and will throw. If the failure happens on the storage insert, our function cleanly fails, throws, and we can successfully handle that throw elsewhere. But what if the failure happens on the index insert? In this case, we throw out of the function but now we have a problem since the insert on the storage class has already happened and we now do not have synchronization between these two classes.

The obvious answer to this problem is to wrap the entire thing in a try-catch and build a mechanism to revert an insert:
```C++
void Database::insert(const Record& r) {
  S.insert(r);
  try {
    I.insert(r);
  } catch (...) {
    S.undo();
    throw;
  }
}
```
This works in this use case, but does not scale as more error-prone functionality gets built into the control flow. Even adding one more function to this insert call now requires adding additional complexity that begins to make reasoning about the code difficult. Even something like adding a required finalize function makes things messier:
```C++
void Database::insert(const Record& r) {
  S.insert(r);
  try {
    I.insert(r);
  } catch (...) {
    S.undo();
    I.finalize();
    throw;
  }
  I.finalize();
}
```
Modern C++ RAII to the rescue. Let's build a scopeguard to clean up this function and ensure we are robust to failure:
```C++
class ScopeGuardBase {
  public:
    ScopeGuardBase() : commit_(false) {}
    void commit() const noexcept { commit_ = true; }
  protected:
    ScopeGuardBase(ScopeGuardBase&& other) : commit_(other.commit_) {
      other.commit();
    }
    ~ScopeGuardBase() {}
    mutable bool commit_;
  private:
    ScopeGuardBase& operator=(const ScopeGuardBase&) = delete;
};
template <typename Func>
class ScopeGuard : public ScopeGuardBase {
  public:
    ScopeGuard(Func&& func) : func_(func) {}
    ScopeGuard(const Func& func) : func_(func) {}
    ~ScopeGuard() { if (!commit_) func_(); }
    ScopeGuard(ScopeGuard&& other) : ScopeGuardBase(std::move(other)), func_(other.func_) {}
  private:
    Func func_;
};
template <typename Func>
ScopeGuard<Func> MakeGuard(Func&& func) {
  return ScopeGuard<Func>(std::forward<Func>(func));
}
```
We now have a scopeguard that is by default "armed," which means unless we call the commit() to disarm the scopeguard, it will call the provided function when it goes out of scope. This is perfect for our needs above:
```C++
void Database::insert(const Record& r) {
  S.insert(r);
  ScopeGuard sg = MakeGuard([&]() { S.undo(); });
  I.insert(r);
  sg.commit();
}
```
Walking through what happens here, we first attempt to insert into Storage. If that fails, no worries, we throw and move on. But if it succeeds, we need to create our scopeguard, passing in our lambda that will call the undo() function on our Storage class. The storage class is by default armed (the class default constructor sets commit to false) so that when the scopeguard goes out of scope, the destructor will be called and the lambda (S.undo()) will be called. This works well since if I.insert() fails and the function throws, the scopeguard is immediately out of scope, the destructor is called and S gets rolled back. But if I.insert() succeeds, we now need to be sure we disarm our scopeguard since we no longer want to roll back the insert on our Storage class when we get out of scope. By calling sg.commit(), we disarm our scopeguard and ensure no rollback occurs.

The syntax is clean and allows for easy additions and modifications, like adding the finalize() back into our function:
```C++
void Database::insert(const Record& r) {
  S.insert(r);
  ScopeGuard fg = MakeGuard([&]() { S.finalize(); });
  ScopeGuard sg = MakeGuard([&]() { S.undo(); });
  I.insert(r);
  sg.commit();
}
```
Here we want fg to always be called after a determination is made on sg since the stack always unwinds from bottom to top once we reach the end of scope. No matter what happens after we create the fg scopeguard, we can rest assured that S.finalize() will be called.

Because we relegate the logic of a scopeguard to the destructor, we need to take a few more precautions than normal. In C++, two exceptions cannot be propagated at the same time, otherwise the program will exit. Because an exception will trigger the destructor of the scope guard, any action we attempt that itself throws an error will possibly bring about a scenario where two exceptions propagate at the same time. To protect against this, we can build a shielded scopeguard:
```C++
template <typename Func>
class ScopeGuard : public ScopeGuardBase {
  public:
    ScopeGuard(Func&& func) : func_(func) {}
    ScopeGuard(const Func& func) : func_(func) {}
    ~ScopeGuard() { 
      if (!commit_) {
        try { func_(); } catch (...) {}
      }
    }
    ScopeGuard(ScopeGuard&& other) : ScopeGuardBase(std::move(other)), func_(other.func_) {}
  private:
    Func func_;
};
```
If our ScopeGuard destructor throws, we catch it and ensure our program does not prematurely exit.

We can also implement specific logic in the scopeguard destructor based on if its destructor is being triggered due to an exception or not. If we prefer that our scopeguard only implement its function if there are no exceptions propagating the scope, we can do that like this:
```C++
class UncaughtExceptionDetector {
  public:
    UncaughtExceptionDetector() : count_(std::uncaught_exceptions()) {}
    operator bool() const noexcept { return std::uncaught_exceptions() > count_; }
  private:
    const int count_;
};
template <typename Func, bool on_success, bool on_failure>
class ScopeGuard : public ScopeGuardBase {
  public:
    ScopeGuard(Func&& func) : func_(func) {}
    ScopeGuard(const Func& func) : func_(func) {}
    ~ScopeGuard() { 
      if ((on_success && !detector) || (on_failure && detector)) {
        func_();
      }
    }
    ScopeGuard(ScopeGuard&& other) : ScopeGuardBase(std::move(other)), func_(other.func_) {}
  private:
    UncaughtExceptionDetector detector_;
    Func func_;
};
```
std::uncaught_exceptions() returns a number for how many exceptions are currently propagating in the stack. We can conditionally check within the destructor of the scopeguard and modify our behavior accordingly.

