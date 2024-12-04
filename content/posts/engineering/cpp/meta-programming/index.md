---
title: Compile-Time Programming in C++
seo_title: Compile-Time Programming in C++
summary: 
description: 
slug: Compile-Time Programming in C++
author: Christopher Weaver

draft: false
date: 2024-04-12T09:38:32-06:00
lastmod: 2024-04-12T09:38:32-06:00
publishDate: 2024-04-12T09:38:32-06:00

feature_image: iag.png
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

When writing a C++ program, we eventually have to compile the program into machine code if we wish to run it. Many things happen under the hood during this compilation process, some of which can be controlled by the developers themselves. One of the cool things an engineer can do is write code that the compiler will then use to generate other code. This is called compile-time programming or metaprogramming.

### Creating Templates

One of the main benefits to metaprogramming is the ability to write generic/flexible routines only once and have the compiler ensure the routine can handle lots of different data types. Consider this function to take a value and raise it to the power of 2
```C++
int pow_n(int n) {
  return n * 2;
}
```
Simple and gets the job done, except you later on realize you need a function to do the same thing with floats. You could technically use the same function, but not without data loss. So you instead need to write another function
```C++
float power_n(float n) {
  return n * 2f;
}
```
This works, but violates the DRY principle, requires more work from our developer, and becomes a maintanance problem. Templates can help us solve this:
```C++
template<typename T>
T power_n(T n) {
  return n * 2;
}
```
Now when we call the power_n function with different types, we tell the compiler about the type the operation needs to handle:
```C++
float x = pow_n<int>(1);
float y = pow_n<float>(2.0f);
```
Starting in C++ 17, we often do not need to be explicit on the type as the compiler can use template argument deduction to generate the function for us with the type we need. 
```C++
auto x = pow_n(2.0f) // will generate float example above
auto y = pow_n(1) // will generate int example above
```
This type of deduction cannot always be done, and often should not be done for the sake of removing ambiguity. A classic example is defining a vector which can store most built-in and user defined types
```C++
vector<int>myVec{};
vector<float>myVec2{};
```
Again, this is not always necessary, depending on your compiler and which version of C++ you are using. But even when it is not necessary, I often like to add it for the sake of communicating intent. 

Templates can do more than direct the compilers to build for different types. For example check out this function that uses an integer template argument 
```C++
template<int N, typename T>
auto const_pow_n(const T& V) {
  auto product = T{1};
  for (int i = 0; i < N, i++) {
    product *= V;
  }
  return product;
}
auto x2 = const_power_n<3>(4.0f);
```
This will generate a different function per integer template argument passed into it. 

C++ supports template specialization for cases where you want to make your routine generic but handle specific use cases differently. For the example above, let's specialize when 2 is passed as the integer template argument, since we only need to perform a single calculation and can optimize for that.
```C++
template<>
auto const_pow_n<2, int>(const int& V) {
  return V * V;
}
```
Templates are not restricted to functions, it also can be applied ot classes. This rectangle class can be defined with a class template to store different types of data
```C++
template<typename T>
class Rectangle {
  public:
    Rectangle(T x, T y, T w, T h): x_{x}, y_{y}, w_{w}, h_{h} {}
    auto area() const { return w_ * h_ ;}
    auto width() const { return w_; }
    auto height() const { return h_; }
  private:
    T x_{}, y_{}, w_{}, h_{};
}
```
Our Rectangle class has now become much more flexible!
```C++
Rectangle r1 = Rectangle<float>(2.0f, 2.0f, 4.0f, 4.0f); // All member variantes with type T will be float
Rectangle r2 = Rectangle{-2,-2,4,4}; // Rectangle<int> from template argument deduction
```
### Constant Expressions

A lot of the magic with metaprogramming involves having the compiler handle certain tasks during compilation so that we do not need to address them at run-time. There are two awesome advantages to this approach:

1. We can catch certain bugs at compile time instead of run-time. Sometimes, these run-time issues will not be immediately noticeable until the software has been shipped. Not good. This is one of the reasons Rust has become such a powerful language, since the Rust compiler is so effective at catching errors during compile time.
2. Our run-time should be faster. By preprocessing some tasks at compile time, our run-time will not need to process these tasks, which improves performance. This approach will increase our compile time, but it should be remembered that software is a means to an end, not the end itself. Engineers should focus more on their end product and less on the 'developer experience.'
By prefixing your expression with constexpr, you are telling the compiler that the expression should be evaluated at compile time.
```C++
constexpr auto v = 43 + 12;
```
During run-time, your program will not need to add 43 and 12, but instead will see this:
```C++
int v = 55;
```
One less addition the cpu needs to compute means we can get to our next expression quicker! The constexpr keyword can also be used with functions, telling the compiler to evaluate the function at compile time if all the conditions allowing for evaluation are fulfilled. 
```C++
constexpr auto sum(int x, int y, int z) {
  return x + y + z;
}
int main() {
  constexpr auto value = sum(3,4,5);
}
```
Since the result of sum() is used in a constant expression and its parameters can be determined at compile time, the compiler will generate the following regular C++ code:
```C++
const auto value = 12;
```
In cases where the compiler cannot evaluate the function at compile time, it will safely fall back to handling the function during runtime like normal.
```C++
int x, y, z;
std::cin >> x >> y >> z; // Get user input
auto value = sum(x,y,z);
```
In this example, we do not know the parameters for the sum function at compile time, since a user will provide these during runtime. Depsite calling a constexpr marked function, the compiler will safely compile this operation to execute during runtime like normal. 

If we ever want to restrict the compiler from falling back to a runtime expression, we can instead use the keyword *consteval*
```C++
consteval auto sum(int x, int y, int z) {
  return x + y + z;
}
```
The compile will not complain if we try to use the sum() function like so
```C++
int x, y, z;
std::cin >> x >> y >> z; // Get user input
auto value = sum(x,y,z);
```
The compiler will also complain if we pass in a parameter that is not itself const
```C++
int x = 10;
auto s = sum(x,2,3); // compilation error: x is not marked const
```

### If Constexpre Statement
Really cool things start to happen when we leverage the power of *if constexpr*. The if constexpr statement allows template functions to evaluate different scopes at compile time. This is called compile-time polymorphism and possesses many advantages over dynamic polymorphism as we will discuss. Consider the following example of dynamic polymorphism
```C++
class Animal {
  virtual ~Animal() {};
  void auto speak() const;
}
class Bear: public Animal {
  void roar() const { std::cout << "Roar\n"; }
  void speak() override { roar(); }
}
class Duck: public Animal {
  void quack() const { std::cout << "Quack\n"; }
  void speak() override { quack(); }
}
void makeSpeak(Animal* a) {
  a->speak();
}
int main() {
  Bear b = new Bear();
  Duck d = new Duck();
  makeSpeak(b);
  makeSpeak(d);
}
```
This all works as expected. Both the bear and duck objects will speak the way they should, and the makeSpeak() function can generically handle many different, similar types without needing to know the exact type. The power of dynamic polymorphism is quite clear and has been a major contributor to its prolific use in real-world software. However, dynamic polymorphism is slow, which I posit is largely unacceptable when writing C++ because if runtime performance is not important, there are easier languages to write your software in than C++.

compile-time polymorphism can be leveraged instead for major performance improvements. Lets rebuild the example above using this technique
```C++
class Bear {
  void roar() const {
    std::cout << "roar\n";
  }
}
class Duck {
  void quick() const {
    std::cout << "quack\n";
  }
}
template<typename Animal>
void speak(const Animal& a) {
  if constexpr (std::is_same_v<Animal, Bear>) {
    a.roar();
  } else if constexpr (std::is_same_v<Animal, Duck>) {
    a.quack();
  }
}
int main() {
  Bear bear = Bear{};
  Duck duck = Duck{};
  speak(bear);
  speak(duck);
}
```
Here we have matched the functionality of the previous approach without inheritance, resolving virtual functions, or forcing our objects into the heap. When speak() is invoked with Animal == Bear
```C++
Bear bear = Bear{};
speak(bear);
```
The compiler generates the following function
```C++
void speak(const Bear& a) {
  animal.roar();
}
```
and similarly with Duck
```C++
Duck duck = Duck{};
speak(duck);
```
The compiler generates the following function
```C++
void speak(const Duck& a) {
  animal.quack();
}
```
We should expect significant performance improvements from this change as well as allowing us to use value-based object oriented programming. 

Our functions can see similar improvements by the removal of branching at compile time. Consider this example which executes the modulus function
```C++
template<typename T>
T generic_mod(const T& v, const T& n) {
  if (std::is_floating_point_v<T>) {
    return std::fmod(v,n);
  } else {
    return v % n;
  }
}
```
Here we need to treat floats differntly when computing the modulus, which means we create an if-else branch which slows down runtime performance. We can remove this using constexpr
```C++
template<typename T>
T generic_mod(const T& v, const T& n) {
  if constexpr(std::is_floating_point_v<T>) {
    return std::fmod(v,n);
  } else {
    return v % n;
  }
}
```
Thats it! Now when the compiler comes across an expression calling generic_mod with floats, it will generate this
```C++
float generic_mod(const float& v, const float& n) {
  return std::fmod(v,n);
}
```
and calling the function with an int will produce
```C++
int generic_mod(const int& v, const int& n) {
  return v % n;
}
```
the if-else check has been removed and our code is more performant. 

### Checking for Errors

Metaprogramming also helps us catch errors at compile time, which is much preferred to catching them at runtime where nasty issues can more easily sneak into production. This is done via the *static_asset()* keyword. For the generic_mod function we built above, there is a potential bug where a user could pass in zero for the second parameter and crash our program. We could add an assert to catch this issue during runtime testing
```C++
T generic_mod(const T& v, const T& n) {
  assert(n >= 0);
  if (std::is_floating_point_v<T>) {
    return std::fmod(v,n);
  } else {
    return v % n;
  }
}
```
The advantage of using a static_assert is our program will refuse to compile if the assert condition is not met. The error is caught sooner. 
```C++
T generic_mod(const T& v, const T& n) {
  static_assert(n >= 0, "N must be positive");
  if (std::is_floating_point_v<T>) {
    return std::fmod(v,n);
  } else {
    return v % n;
  }
}
int x = generic_mod(2,5); // compiles
int y = generic_mod(2, 0) // does not compile, N is zero
```

### Compile-time programming Example

This example comes from 

***C++ High Performance***

**Authors:** *Bjorn Andrist & Viktor Sehr*

Building a hash function at compile time. 

Let us say we have an unordered map of strings that identifies bitmaps. If the bitmap is already loaded, the system returns the loaded bitmap; otherwise it will load the bitmap and return it. 
```C++
Bitmap load_bitmap_resource(const std::string& path) {
  static auto loaded = std::unordered_map<std::string, Bitmap>{};
  if (loaded.count(path) > 0) {
    return loaded.at(path);
  }
  auto bitmap = load_bitmap_from_filesystem(path.c_str());
  loaded.emplace(path, std::move(bitmap));
  return loaded.at(path);
}
```
Now, whenever we need to load a bitmap we will use this cache function in our program. But because we are using an unordered_map, we need to hash the path string every time we call this function. Compile time programming can optimize this by computing the hash during compilation. Lets add a new function to write our hash functions during compilation
```C++
constexpr size_t hash_function(const char* str) {
  auto sum = size_t{0};
  for (auto ptr = str; *ptr != '\0'; ++ptr) {
    sum += *ptr;
  }
  return sum;
}
```
All this really bad hash function does is add up the the ascii code values which is ripe for collisions, but achieves our purpose in this demo. Now we can invoke our function 
```C++
size_t hash = hash_function("abc");
```
The compile will synthesize that line into this:
```C++
size_t hash = size_t{294};
```
Next we will construct a class to pre-hash our strings
```C++
class PrehashedString {
  public:
    template<size_t N>
    constexpr PrehashedString(const char(&str)[N]):
                hash_{hash_function(&str[0])},
                size_{N-1},
                strptr_(&str[0]) {}
    auto operator == (const PrehashedString& s) const {
      return size_ == s.size_ && std::equal(c_str(), c_str() + size_, s.c_str());
    }
    auto operator != (const PrehashedString& s) const {
      return !(*this == s);
    }
    constexpr auto size() const { return size_; }
    constexpr auto get_hash() const { return hash_; }
    constexpr const char* c_str() const { return strptr_; }
  private:
    size_t hash_{};
    size_t size_{};
    const char* strptr_{nullptr};
};
```
Note the templated constructor which forces PrehasedString to only accept compile-time string literals. We can now use our class
```C++
PrehashedString prehashed_string = PrehashedString{"my_string"};
```
One other thing we will do is add a hash class to the standard library
```C++
namespace std {
  template<>
  class hash<PrehashedString> {
    public:
      constexpr auto operator()(const PrehashedString& s) const {
        return s.get_hash();
      }
  };
}
```
Now we can test our solution
```C++
const Bitmap& load_bitmap_resource(const PrehashedString& path) {
  static auto loaded = std::unordered_map<PrehashedString, Bitmap>{};
  if (loaded.count(path) > 0) {
    return loaded.at(path);
  }
  auto bitmap = load_bitmap_from_filesystem(path.c_str());
  loaded.emplace(path, std::move(bitmap));
  return loaded.at(path);
}
auto test = get_bitmap_resource("abc");
```
That is it. The load_bitmap_resource function will precompute a hash from a string literal passed into it. The unordered_map will find the specialized template function for hash and called the operator() on it to retrieve the has value computed at compile time. 

For most systems, this is over optimization and will likely not produce any real value to our runtime. But on some embedded systems, hash functions are a luxury they cannot afford and being able to pre-compute these hash values before deploying to these limited systems opens up a whole world of possibilities. 

Compile-time programming in C++ offers a robust framework for optimizing and error-checking software before it even runs. By leveraging features such as templates and constexpr, developers can reduce runtime overhead, catch potential errors early, and ensure code is both efficient and robust. This programming paradigm not only enhances performance but also significantly improves the maintainability and reliability of applications. As C++ continues to evolve, the capabilities of compile-time programming expand, giving developers powerful tools to write cleaner, faster, and more error-free code. Embracing these techniques can lead to substantial benefits in both development time and application performance, making them indispensable for modern C++ development.