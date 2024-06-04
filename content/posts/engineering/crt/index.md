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
};

// Derived class
class SportsCar : public Car<SportsCar> {
public:
    void startEngine() {
        std::cout << "SportsCar engine started with a roar!" << std::endl;
    }
};

// Another derived class
class FamilyCar : public Car<FamilyCar> {
public:
    void startEngine() {
        std::cout << "FamilyCar engine started quietly." << std::endl;
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

### Downside
There are some major shortcomings to the CRTP that need to be known before anyone goes about making changes everywhere in their code. The biggest is we lose a major benefit of dynamic polymorphism when we instead use the CRTP, which is the ability to use a common base class as an abstraction. In our car example above, you will often find using dynamic polymorphism that a collection of different types of cars will be stored in a container as instances of their base class pointer. This allows different places in the code to interact with instances of Car and interact with the Car interface without needing to worry about which exact derived type of the Car base class it is. This is a super powerful way to program generically and introduce abstractions into your system, and it is lost with CRTP. We cannot add our SportsCar and FamilyCar instantiations into a vector<Car> and then pass that around to other functions. This is because both of these classes technically have different base classes (Car<SportsCar> & Car<FamilyCar>). C++ templates will build separate classes for both templates with no way to store them as a common Car class. 

Secondly, everything that touches these CRTP classes must also be implemented using templates. If we want to build a function to compute the fair market price, we must use templates:
```C++
template<typename Derived>
float fairMarketPrice(Car<Derived> car) {
    /// implementation
}
```
This might not be a big deal, but it is rather intrusive in some contexts. 

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
As long as our derived class implements the Car concept requirements, we can define our Vehicle class with the start() interface similar to what we did with the CRTP above. The difference is that C++ concepts provide a cleaner, less perplexing syntax along with comprehensible compile-time errors when something is wrong. Along with these benefits, we also get the same runtime performance as CRTP. I recommend using C++ concepts over the CRTP whenever possible. 

### Conclusion
For the C++ engineer working on high-performance applications such as high-frequency trading or game engines, static polymorphism in the form of the CRTP or C++20 Concepts is an excellent way to get some of the benefits of runtime polymorphism without the performance hit. It is not a silver bullet, particularly because we lose the ability to abstract away via a common base class. But when a common base class is not necessary, static polymorphism should be the default approach.