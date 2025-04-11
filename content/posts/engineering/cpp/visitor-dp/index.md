---
title: The Visitor Design Pattern
seo_title: The Visitor Design Pattern
summary: 
description: 
slug: The Visitor Design Pattern
author: Christopher Weaver

draft: true
date: 2024-04-09T09:38:32-06:00
lastmod: 2024-04-09T09:38:32-06:00
publishDate: 2024-04-09T09:38:32-06:00

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

// LEVERAGE THIS POST FOR FUNCTIONAL PROGRAMMING

// MY RANGES POST STARTS
In my previous [post](/engineering/algorithms-in-the-c-standard-library/) we discussed many of the benefits of using the C++ Algorithms library as well as some of the downsides. The biggest issue being that we cannot efficientyl compose multiple algorithms together with expensive copies of the underlying containers. The introduction of the *Ranges* library in C++ solves this issue while providing a more modern syntax that will make your code easier to comprehend and reason about. 

### Views

Views in the Ranges library are leazy evaluated iterators over a range. Consider this example which squares all values in a vector
```C++
  vector<int> numbers = std::vector{1,2,3,4};
  auto square = [](int v) { return v * v; };
  auto squared_view = std::views::transform(numbers, square);
  for (int s : squared_view) {
    std::cout << s << " ";
  }
  // Output: 1 2 9 16
```
In contrast to the Algorithms library, squared_view is not a copy of the numbers vector with the values squared. Instead it is a proxy object for numbers that is lazily evaluated. That means only when we access an element in squared_view does the std::transform() function get invoked. Only when our iterator comes across the value at index 2 does the square lambda get invoked to produce 9. This allows us to treat squared_view as a container with we can run function like find() and count() on, but internally no new container with a copy of data was created. If you need to store the squared_view as its own container using std::ranges::copy(). 

### Composability

The nature of views and its ability to not copy containers means we now have the power to efficiently combine multiple operations. There problem we faced [post](/engineering/algorithms-in-the-c-standard-library/) involving finding the max score for students in their second year can be solved with the Ranges library like so
```C++
  int get_max_score(const std::vector<Student>& s, int year) {
    auto by_year = [=](const auto&s) { return s.year_ == year; };

    auto v1 = std::ranges::ref_view{s}; // Wrap our vector container in a view
    auto v2 = std::ranges::filter_view{v1, by_year};
    auto v3 = std::ranges::transform_view{v2, &Student::score_};

    auto it = std::ranges::max_element(v3);
    return it != v3.end() ? *it : 0;
  }
```
Here we chain all the different algorithms we need without once creating a copy of data. V1, v2, and v3 are all wrappers around our original Student vector that get lazily evaluated when needed. 

### Range Adaptors

The composability above is great, but the Ranges library also comes with the option to use a less verbose syntax that I could argue is more "readable". Ranges allows us to compose our views using *range adaptors* and *pipe operators* to achieve this syntax change. If we wished, we would instead write the exampe given above as
```C++
  int get_max_score(const std::vector<Student>& s, int year) {
    auto by_year = [=](const auto&s) { return s.year_ == year; };

    using namespace std::views; // range adaptors live in std::views
    auto scores = s | filter(by_year) | transform(&Student::score_);

    auto it = std::ranges::max_element(scores);
    return it != v3.end() ? *it : 0;
  }
```
The scores view replaces the v1, v2, and v3 above making our code much less verbose. It also is processed left to right meaning we first transform to a view, filter by year, and transform based on the score_. Reading left to write makes our code more human readable which is often a good thing. 

### View Ownership Model
A few things to note about these views. They are technically non-owning ranges with comlexity guarantees. A range is any type that provides a begin() to return a starting iterator and an end() to return a sentinel. All standard containers are ranges, most of which own their own elements. While views are ranges that provide begin() and end(), they do not own the elements. This allows views to be composable, assigned, copied, moved, and destructed in O(1) constant time. But it also means the views do not mutate the underlying container they are wrapping. But what if you need to materialize your view into a new owning container? As mentioned above, you would use std::ranges::copy()
```C++
  auto ints = std::list{2,3,4,2,1};
  using namespace std::views;
  auto r = ints | transform([](auto i) { return std::to_string(i);});

  auto vec = std::vector<std::string>{};
  copy(r, std::back_inserter(vec));
```

### Examples

Being able to generate a view with unique properties in constant time O(1)
```C++
for (auto i : std::views::iota(-2,2)) {
  std::cout<< i << " ";
}
// Output: -2 -1 0 1
```

Extracting all digits from a string
```C++
auto csv = std::string{"10,11,12"};
auto digits = csv | std::views::split(',') | std::views::join;
for (auto i : digits) {
  std::cout<< i << " ";
}
// Output: 101112
```

Sampling three values from a container that match certain qualifications
```C++
auto vec = std::vector{1,2,3,4,5,4,3,2,1};
auto v = vec | std::views::drop_while([](auto i) { i < 5;}) | std::views::take(3);
for (auto i : v) {
  std::cout<< i << " ";
}
// Output: 5 4 3
```
// MY RANGES POST ENDS

As I have previously [mentioned](https://www.christopher-weaver.com/engineering/solid/), writing software encompasses more than builing a working solution. It also often requires an architecture that is flexible to future required changes. Making changes to our source code is often difficult because of depencencies that interconnect different parts of our code in ways that is hard to keep track of. So often we discover small changes to one part of our code will break functionality elsewhere in the system. The visitor pattern helps us build new functionality without modifying existing code, satisfying the Open-Closed principle. 

Let us consider a classic example of rendering some shapes using dynamic polymorphism: 

```C++
struct Point {
  double x;
  double y;
};
enum Shape {
  circle, 
  square
};
class Shape {
  public:
    Shape() = default;
    virtual ~Shape() = default;
    virtual void draw() const = 0;
};

class Circle: public Shape {
  public:
    explicit Circle(double radius) : radius_(radius) { };
    double radius() const { return radius_; }
    Point center() const {return center_; }
    void draw() const override;
  private:
    double radius_;
    Point center_{};
};

void Circle::draw() const {
  // implement drawing
}

class Square: public Shape {
  public:
    explicit Square(double side) : Shape(square), side_(side) {}
    double side() const { return side_; }
    Point center const { return center_; }
    void draw() const override;
  private:
    double side_;
    Point center_{};
};

void Square::draw() const {
  // implement drawing
}

void drawAllShapes(std::vector<std::unique_ptr<Shape>> const& shapes) {
  for (auto const& shape : shapes) {
    shape->draw();
  }
}
```
Compile, run, and marvel at your code because it works! You are now drawing shapes. The great part of this solution is just how easy it is to add other shapes. If you find out later that your software now needs to support Triangles, simply add a new Triangle class that inherits from Shape and ensure it overrides the virtual draw function. Everything seems great. But we do have a problem. We can no longer easily add new operations to this architecture. Say we find out at a later date that our shapes now needs to implement functionality to serialize themselves into Bytes. We would be forced to modify our base class with a new virtual function called Serialize(). This violates the Open-Closed principle since adding a new virtual function to our base class means the class is not closed. Furthermore, what if not all the derived classes need to support being serialized? Maybe we will never need to serialize the Triangle class? Unfortunately the Triangle class is forced to implement this operation despite its lack of a need which violates the Interface Segregation principle. 

The problem was face is a classic problem with this type of object oriented programming. Adding new types is easy, but adding new operations is difficult. 

This is where the Visitor design pattern comes in. It allows us to ease our troubles when it comes to adding new operations. As per usual, I find the best way to demonstrate something like the visitor design pattern is with an example. Lets try and tackle our Shape issue above by adding two new classes, an abstract ShapeVisitor class and a derived class meant to represent one operation, the draw operation we had above:

```C++
class ShapeVisitor {
  public:
    virtual ~ShapeVisitor() = default;
    virtual void visit(Circle const&) const = 0; 
    virtual void visit(Square const&) const = 0; 
}
class Draw: public ShapeVisitor {
  public:
    void visit(Circle const& c) const override;
    void visit(Square const& s) const override;
}
```
With these in place, we can now re-implement our Shape classes:
```C++
class Shape {
  public:
    Shape() = default;
    virtual ~Shape() = default;
    virtual void accept(ShapeVisitor const& v) = 0;
};
class Circle: public Shape {
  public:
    explicit Circle(double radius) : radius_(radius) { };
    double radius() const { return radius_; }
    Point center() const {return center_; }
    void accept(ShapeVisitor const& v) const override;
  private:
    double radius_;
    Point center_{};
};
void Circle::accept(ShapeVisitor const& v) const {
  v.visit(*this);
}
class Square: public Shape {
  public:
    explicit Square(double side) : Shape(square), side_(side) {}
    double side() const { return side_; }
    Point center const { return center_; }
    void accept(ShapeVisitor const& v) const override;
  private:
    double side_;
    Point center_{};
};
void Square::accept(ShapeVisitor const& v) cons {
  v.visit(*this);
}
```
We have now removed the draw operation from the derived classes and instead added a virtual accept operation that takes a ShapeVisitor class. The ShapeVisitor class is itself a pure abstract class which means what exactly the visit operation will do within the accept operation is unknown to the Square and Circle class. This is good as it helps keep our dependencies seperated. We can now finish our draw operation:
```C++
void drawAllShapes(std::vector<std::unique_ptr<Shape>> const& shape) {
  for (auto const& shape : shapes) {
    shape->accept( Draw{} );
  }
}
```
The logic you added to your Draw class for any of the supported shape classes will be run. This is great because our Shape base class is now completely closed and operations are now added by extension. Remember the serialization operation we needed to add earlier? We can now support it without modifying the Shape class or any of its derived classes. 
```C++
class Serialize: public ShapeVisitor {
  public:
    void visit(Circle const& c) const override;
    void visit(Square const& s) const override;
};
void serializeAllShapes(std::vector<std::unique_ptr<Shape>> const& shape) {
  for (auto const& shape : shapes) {
    shape->accept( Serialize{} );
  }
}
```
As great as this seems, it comes with some significant downsides. The first is that the visitor design pattern is susceptible to violating the DRY principle. Serializing Squares and Circles might be very similar, yet we are forced to implement a seperate function for each derived class we want to support. Secondly, adding new types has once again become more challenging. The very benefit of our original object oriented approach was the easy it provides for adding new derived classes of Shape. But now, when we go to add a new shape such as Triangle, we are required to update the entire ShapeVisitor heirarchy. We need to add a new virtual class to ShapeVisitor and modify all of its derived classes. Thirdly, and in my opinion most importantly, the visitor design pattern invokes a massive performance penalty on our software. It is slow. This is because we have a double dispatch operation where C++ needs to resolve two virtual operations (accept() and visit()). Dynamic polymorphism tends to produce a performance penalty upon our code, but the visitor pattern doubles down on this creating multiple layers of virtual functions that need to be resolved. 

But fear not, for those willing to abandon their old ways of dynamic polymorphism and join us on the side of light and goodness, C++ supports a better way to build out the visitor pattern. It involves the use of std::variant. 

The std::variant is a container that will store one object at a time, but is not limited to supporting only one kind of object. When defining a std::variant, you inform its template parameters of all the different objects it could potentially possess:
```C++
  std::variant<Circle, Square, Triangle> shape;
```
Then you can assign any instance of these objects into the variant
```C++
 Square s{10};
 shape = s;
 Square const s2 = std::get<Square>(shape);

 Circle c{5};
 shape = c;
 Circle* const c2 = std::get_if<Circle>(shape);
```
As different objects get assigned to the variant, any previous object the variant may have had will be released, meaning only one object will ever be in the variant. The two ways shown above to retrieve the value from the variant are get and get_if. When calling get(), the variant will attempt to return the object being asked for as a reference, but if the variant is empty or has a different type of object, it will throw an std::bad_variant_exception. If instead you call get_if, it will always return a pointer, but if the variant is empty or has a different object type, it will return a nullptr. The last thing worth noting on variants is that they should be used with caution. Only use these with objects of similar memory footprint. That is because the variant will allocate for itself enough memory to store the largest object it built a template parameter for. If the variant needs to support int and Circle, each instance of the variant will have way more memory than is required to store the int which can have a negative impact on the performance of your code. 

With all that out of the way, let me show you how to re-implement the visitor design patter in C++ using std::variant. 
```C++
class Circle {
  public:
    explicit Circle(double radius) : radius_(radius) { };
    double radius() const { return radius_; }
    Point center() const {return center_; }
  private:
    double radius_;
    Point center_{};
};

class Square {
  public:
    explicit Square(double side) : Shape(square), side_(side) {}
    double side() const { return side_; }
    Point center const { return center_; }
  private:
    double side_;
    Point center_{};
};

struct Draw {
  void operator()(Circle const& c) const {
    // handle draw logic for circle
  }
  void operator()(Square const& s) const {
    // handle draw logic for square
  }
}
```
So that is largely it. First thing you will notice is that we have removed inheritance and all virtual functions. Our classes are now simpler and ready for better compiler optimization when the time comes. Secondly, We have defined our draw operation as well, and similar to before, we will be able to add other types of operations without modifying the Square or Circle class.
```C++
using Shape = std::variant<Circle, Square>;
using Shapes = std::vector<Shape>;

void drawAllShapes(Shapes const& shapes) {
  for (auto const& shape : shapes) {
    std::visit( Draw{}, shape);
  }
}

int main() {
  Shapes shapes;
  shapes.emplace_back( Circle{2.3});
  shapes.emplace_back( Square{1.2});
  shapes.emplace_back( Circle{4.1});

  drawAllShapes(shapes);
}
```
So a couple of things here. First you will notice we have defined Shape and Shapes to simplify our code and resemble some of the nice parts of the dynamic polymorphism we left behind. When we operate on the Shape, we are operating on a std::variant that will contain either a Circle or Square. Secondly, we are using std::visit which I have not yet gone over. Along with get() and get_if() operator supported by std::variant, we can also use this std::visit operator. This operator allows us to perform an operation on the stored value of the variant. Std::visit will check the draw object we pass in and see if it has an operator() that takes the type the variant currently has and execute that one. This approach requires no inheritance, virtual functions, and many of the other things that hinder performance, create dependencies, and increase complexity. We also no longer need to store all our derived classes as pointers but instead can default to value-based programming. Many of our pitfalls are gone. Adding a new operator to serialize is as simple as:
```C++
struct Serialize {
  void operator()(Circle const& c) const {
    // handle draw logic for circle
  }
  void operator()(Square const& s) const {
    // handle draw logic for square
  }
}
void serializeAllShapes(Shapes const& shapes) {
  for (auto const& shape : shapes) {
    std::visit( Serialize{}, shape);
  }
}
```
Better than getting rid of the all the complexity inheritance and dynamic polymorphism brings with it is the nice improvement in performance. Consider this benchmark[^1] that ran 25,000 operations (updating the center point) on 10,000 randomly created shapes.

GCC 11.1

1) Classic visitor design pattern: 1.6161s
2) Object-oriented solution: 1.5205s
3) std::variant solution: 1.1992s

The variant solution performed significantly better. But there is a further optimization we could accomplish at the sake of clean code. Instead of using std::visit, we could manually implement each operation using std::get_if():
```C++
void drawAllShapes(Shapes const& shapes) {
  for (auto const& shape : shapes) {
    if (Circle* circle = std::get_if<Circle>(&shape)) {
      // Draw Circle
    } else if (Square* square = std::get_if<Square>(&shape)) {
      // Draw Square
    }
  }
}
```
Using the same benchmark as above, this approach scored:

4) std::variant (with std::get_if()): 1.0252s

A nice additional improvement which highlights what is often the tradeoff between clean code and performant code. There is no perfect answer on which way to proceed. But it is always worth reiterating that software is a means to an end, not an end itself. Especially in C++, a difficult language usually choosen because we need superior performance, choosing run time performance over clean code is often the right choice. 

So this is great right? Using the std::variant visitor design pattern, we have now made adding new operations to our object types much easier and SOLID. But we have a problem. This improvement was made at the expense of being able to add new types. We have come full circle. Again, if we need to support a new type like a Triangle, we must attempt to delve into every visitor operation() and add support for that type, which means these classes are no longer closed. 

This is a tradeoff we will always have to make with the visitor pattern. If we do not anticipate more types will be added in the future, the visitor pattern is a great choice for helping us easily extend the functionality of the types we have. 

[^1]: p.131 Iglberger, Klaus. 2022. “C++ Software Design”. OREILLY. 