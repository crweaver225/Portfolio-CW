---
title: Automatic Type Deduction
seo_title: Automatic Type Deduction
summary: 
description: 
slug: Automatic Type Deduction
author: Christopher Weaver

draft: false
date: 2024-02-03T07:32:00-06:00
lastmod: 
expiryDate: 
publishDate: 

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

Programming languages like JavaScript and Python are known for their loose use of types. Loved by some, despised by others, these languages consider types to not be required when declaring variables and returning from a function. C++ has historically not been like these scripting languages, instead strictly requiring types be declared for most allocations of memory such as creating variables and defining the return type of a function. This began to change with the introduction of the *auto* keyword in C++11. When declaring local variables, the use of auto looks like this
```C++
auto i = 0;
auto x = Foo{};
auto y = create_object{};
``` 
In all these cases, the compiler will deduce the type. 

This is a controversial feature amongst the C++ developer community. Many think the use of *auto* reduces the readability of the code or even makes C++ too similar to dynamically types languages like JavaScript. Others think it improves readability. Take for example this snippet
```C++
map<int,list<string>>::iterator i = m.begin();
auto i = m.begin();
```
Clearly auto i is simpler to read and quicker to type out. 

I tend to have sympathy for those who state the overuse of auto can introduce more challenges than benefits when reasoning through source code. Verbosity can be cumbersome when reading source code, but the alternative can often be worse. Having types explicitly declared provides valuable information for developers trying to understand what is happening. Irregardless of the criticism, *auto* is here to stay and is a requirement for understanding as a C++ developer. It also does come with some nice benefits. One benefit of using *auto* is that you will never accidentally leave a variable unintialized since an uninitialized auto variable will not compile. Furthermore, in cases where an expression's type changes, such as a function return type changing, you do not need to worry about changing every place where that function is used. 

Some examples of *auto* being used in function signatures

```C++
struct Foo {
  auto val() const {
    return m_;
  }
  auto& cref() const {
    return m_;
  }
  auto& mref() {
    return m_;
  }
  int m_{}
}
```
As you can see, auto can be bound with references and const references. It also can be used as an r-value with the syntax &&auto. 

*auto* can also be used with free functions
```C++
auto val() const // deduced type
auto val() const -> const int // trailing type
int val() const // explicit type

auto mref() const // deduced type
auto mre() const -> const int& // trailing type
int& mre() const // explicit type
```
A trailing type is required in some circumstances by the C++ standards. One circumstance is when the function is marked as virtual. But the primary need is for metaprogramming where the return type depends on templated parameters
```C++
template <typename T, typename U>
auto add(T t, U u) -> decltype(t + u);
```
Here *decltype* tells the compiler to determine the type at compile time without evaluating the expression. This can be very valuable when attempting to forward the exact type from a function. If we were to write a wrapper function for val() and mref() 
```C++
int val_wrapper() { return val(); } // returns int
int& mref_wrapper() { return mref(); } // retursn int&
```
works well when the return type is explicit. But this breaks when using *auto*
```C++
auto val_wrapper() { return val(); } //returns int
auto mref_wrapper() { return mref(); } // also returns int
```
in both cases, the compiler deduces an int. Using &auto as the return value would resolve the issue in this case, but that is not always ideal. Instead we can do this
```C++
decltype(auto) val_wrapper() { return val(); } // returns int
decltype(auto) mref_wrapper() { return mref(); } // returns int&
```
This helps keep the code more generic and is safer to use. 