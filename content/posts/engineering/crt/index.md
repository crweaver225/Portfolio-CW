---
title: Static Polymorphism
seo_title: Static Polymorphism
summary: 
description: 
slug: Static Polymorphism
author: Christopher Weaver

draft: false
date: 2024-06-04T09:38:32-06:00
lastmod: 
expiryDate: 
publishDate: 

feature_image: CRTP.png
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
### Introduction
Performance is very important in C++ programming, so important that the use of virtual functions often produces too much overhead to utilize. But without the use of virtual functions, we lose a lot of the flexibility and generic implementations that polymorphic programming gives us. The curiously recurring template pattern (*CRTP*) provides a solution that allows for polymorphic implementation in our design patterns without the runtime costs that the indirection of virtual functions incurs. 

### CRTP
The CRTP uses the idea of using a base class as an abstraction, but instead of establishing a runtime relationship between the base class and its derived class, this relationship is established at compile time using templates. 
```C++
#include <iostream>

// Base class template
template<typename Derived>
class Car {
public:
    void start() {
        // Call the startEngine method of the Derived class
        static_cast<Derived*>(this)->startEngine();
    }
    int size() const {
        static_cast<Derived*>(this)->size();
    }
};

// Derived class
class SportsCar : public Car<SportsCar> {
public:
    void startEngine() {
        std::cout << "SportsCar engine started with a roar!" << std::endl;
    }
    int size() const {
        return 100;
    }
};

// Another derived class
class FamilyCar : public Car<FamilyCar> {
public:
    void startEngine() {
        std::cout << "FamilyCar engine started quietly." << std::endl;
    }
    int size() const {
        return 50;
    }
};

int main() {
    SportsCar mySportsCar;
    FamilyCar myFamilyCar;

    std::cout << "Starting SportsCar:" << std::endl;
    mySportsCar.start();

    std::cout << "Starting FamilyCar:" << std::endl;
    myFamilyCar.start();

    return 0;
}
```
It took some time for me to wrap my head around this. Our derived class inherits from the base class while passing itself as a template argument. Then, within the base class interface, we need to ensure we static_cast itself as an instance of its template argument and call the correct function for that derived class. In the example above, even though SportsCar does not have a start() member function, it does support the call as part of its interface since it inherits from the Car base class. And because the Car base class can call the correct derived class function based on its template arguments, the startEngine function within the SportsCar class will get called. 

The CRTP allows us to build a common interface via the base class as well as a default implementation for the reduction of duplicate code.
```C++
template <class Derived>
class Base {
public:
    void interface() {
        // Static polymorphism used here
        static_cast<Derived*>(this)->implementation();
    }

    void implementation() {
        // Default implementation (if any)
    }
};

class Derived : public Base<Derived> {
public:
    void implementation() {
        // Custom implementation for Derived
        std::cout << "Derived implementation" << std::endl;
    }
};

class Derived2: public Base<Derived2> {
};

int main() {
    Derived d;
    d.interface();  // Calls Derived::implementation()

    Derived2 d2;
    d2.interface(); // Calls Base::implementation()
}
```
Here, both d and d2 have a common interface, which is nice. Additionally, if we have a bunch of derived classes that all have the same implementation details for the implementation() function, we can default to the base class's version without needing to duplicate code. Then, only when we need a unique implementation for a derived class can we write it up. 

You should expect an implementation of CRTP to be significantly faster than a similar implementation using dynamic polymorphism. This is because:

1. **Function Call Overhead**: Dynamic polymorphism requires a virtual table (vtable) lookup every time a virtual function is called. This not only adds a small runtime overhead but also can hinder certain compiler optimizations. With CRTP, function calls are resolved at compile-time, eliminating the vtable lookup and potentially enabling function inlining, which can significantly improve performance.

2. **Memory Layout and Access**: Objects using dynamic polymorphism typically have an extra pointer per object (to the vtable), which increases the size of each object. This extra memory can affect cache performance, particularly if many objects are instantiated. CRTP does not require this additional pointer, which can lead to better data locality and cache usage.

3. **Compiler Optimizations**: Since CRTP enables more behavior to be resolved at compile time, it opens up more opportunities for compiler optimizations like inlining, loop unrolling, and constant folding. These optimizations are often not possible with virtual functions because the exact function to be called cannot be determined until runtime.

4. **Predictability and Branch Prediction**: The absence of vtable lookups means there are fewer conditional branches in your code, which can improve branch prediction on modern CPUs. Better branch prediction can lead to smoother and faster execution paths through your code.

The major benefit of any type of polymorphism is that we can work with objects even though we do not know their specific type. This is possible with static polymorphism via templates
```C++
template<typename Derived>
float fairMarketPrice(Car<Derived> car) {
    int car_size = car->size();
    /// the rest of the implementation
}
```
Here our function does not know which specific car is being passed to it until compile time. This gives us our polymorphism that we want. 

### CRTP and Abstract Classes
When a derived class does not implement a function that it should, the base class will attempt to do it on the derived class's behalf. But if the base class does not implement the function either (because we are attempting to make the function something the derived class must implement), our program will be malformed. In order to match the pure virtual functions of dynamic polymorphism, we must change the implementation name that the derived class should complete to be different from the base class function to cause a compilation error when it is not implemented.
```C++
template <typename D>
class B {
    public:
        void f(int i) {
            static_cast<D*>(this)->f_impl(i);
        }
};
class D : public B<D> {
    public:
        void f_impl(int i) {
            // implementation
        }
};
```

### CRTP and Access Control
How do we allow our base class to access private functions and members of the derived class that we do not want accessible to the client? The simplest way is to use a friend declaration against the template argument.
```C++
template <typename D>
class B {
    friend D;
    public:
        void f(int i) {
            static_cast<D*>(this)->f_impl(i);
        }
};
class D : public B<D> {
    private:
        void f_impl(int i) {
            // implementation
        }
};
```
As a general rule of thumb, using a friend declaration invokes a code smell. But sometimes, such as this, it makes sense in its use.

### Downside
There are some major shortcomings to the CRTP that need to be known before anyone goes about making changes everywhere in their code. The biggest is we lose a major benefit of dynamic polymorphism when we instead use the CRTP, which is the ability to use a common base class as an abstraction. In our car example above, you will often find using dynamic polymorphism that a collection of different types of cars will be stored in a container as instances of their base class pointer. This allows different places in the code to interact with instances of Car and interact with the Car interface without needing to worry about which exact derived type of the Car base class it is. This is a super powerful way to program generically and introduce abstractions into your system, and it is lost with CRTP. We cannot add our SportsCar and FamilyCar instantiations into a vector<Car> and then pass that around to other functions. This is because both of these classes technically have different base classes (Car<SportsCar> & Car<FamilyCar>). C++ templates will build separate classes for both templates with no way to store them as a common Car class. 

### Using Concepts Instead 
C++20 comes with the addition of concepts, which is a modern approach to restrict our templates in interesting ways. In many cases, we can use concepts instead of the CRTP.
```C++
// Concept that defines requirements for a Car
template<typename T>
concept Car = requires(T a) {
    { a.startEngine() } -> std::same_as<void>;  // Requires a startEngine() function that returns void
};

// Class that uses the concept
template<Car T>
class Vehicle {
public:
    void start() {
        T car;
        car.startEngine();  // Guaranteed to exist and be valid due to the Car concept
    }
};

// A class that satisfies the Car concept
class SportsCar {
public:
    void startEngine() {
        std::cout << "SportsCar engine started with a roar!" << std::endl;
    }
};

int main() {
    Vehicle<SportsCar> mySportsCar;
    mySportsCar.start();

    return 0;
}
```
As long as our derived class implements the Car concept requirements, we can define our Vehicle class with the start() interface similar to what we did with the CRTP above. The difference is that C++ concepts provide a cleaner, less perplexing syntax along with comprehensible compile-time errors when something is wrong. Along with these benefits, we also get the same runtime performance as CRTP. Let's look at one more example where we want a function that can take two examples of a generic base class and compute the Euclidean distance between them. With dynamic polymorphism, we would create our abstract base class Point with virtual functions to get x() and y() values that our derived class would use to return values. We can do something similar to that with concepts by first defining our limiting concept:
```C++
template <typename T>
concept Point = requires(T p) {
    requires std::is_same_v<decltype(p.x()), decltype(p.y())>; // Requires T has x() & y() and they return the same types
    requires std::is_arithmetic_v<decltype(p.x())>; // ensures the return value can be operated on by C++ math operators 
};
```
Instead of defining a base class Point, we have now defined a Point concept that other classes can mimic as long as they meet all the criteria defined in the concept.
```C++
template <typename T>
class Point2D {
    public:
        Point2D(T x, T y) : x_{x}, y_{y} {}
        auto x() { return x_; }
        auto y() { return y_; }
    private:
        T x_{};
        T y_{};
};

auto dist(Point auto p1, Point auto p2) {
    auto a = p1.x() - p2.x();
    auto b = p1.y() - p2.y();
    return std::sqrt(a*a + b*b);
}

int main() {
    Point2D p1{12.0, 14.0};
    Point2D p2{5.0, 11.0};
    auto e_distance = dist(p1, p2);
}
```
Point2D does not inherit from Point, yet it can be passed to a function that accepts Point because it successfully honors the requirements of the concept Point. We get the convenience of generically using the Point abstraction and the performance of no virtual function indirection!

Concepts are huge, and something I plan to explore more in the future. I recommend using C++ concepts over the CRTP whenever possible.

### Conclusion
For the C++ engineer working on high-performance applications such as high-frequency trading or game engines, static polymorphism in the form of the CRTP or C++20 Concepts is an excellent way to get some of the benefits of runtime polymorphism without the performance hit. It is not a silver bullet, particularly because we lose the ability to abstract away via a common base class. But when a common base class is not necessary, static polymorphism should be the default approach.