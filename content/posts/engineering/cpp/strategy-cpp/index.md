title: The Strategy Design Pattern
seo_title: The Strategy Design Pattern
summary: 
description: 
slug: The Strategy Design Pattern
author: Christopher Weaver

draft: false
date: 2024-05-24T09:38:32-06:00
lastmod: 2024-05-24T09:38:32-06:00
publishDate: 2024-05-24T09:38:32-06:00

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

I recently wrote about the [visitor design pattern](/engineering/the-visitor-design-pattern/), which is designed to add functionality to your objects without modifying the objects themselves, thus staying in compliance with the Open-Closed Principle. Unfortunately, this means adding new objects is no longer simple, as our visitor abstractions will need to be modified to handle these new classes. This time, I will be writing about the strategy design pattern, which solves the opposite problem: making it easier to create new types of objects without large changes to any existing implementation details, at the expense of not being able to easily add new operations.

Let's consider two classes that need to be rendered as part of a 2D graphics project:

```C++
class Shape {
    public:
        virtual ~Shape() = default;
        virtual void draw() const = 0;
};
class Square : public Shape {
    public:
        explicit Square(double side) : side_(side) {};
        void draw() const override;
    private:
        double side_;
};
class Circle : public Shape {
    public:
        explicit Circle(double radius) : radius_(radius) {};
        void draw() const override;
    private:
        double radius_;
};
```

In both cases, engineers wanting to use OpenGL might include it in the `circle.cpp` and `square.cpp` files and use it in their respective `draw()` functions. Unfortunately, this is a bad design for a few reasons. First of all, both shape classes now depend on OpenGL and are no longer simple geometric data types; they now lug a large graphics library along with them. Secondly, we can no longer easily change how shapes are drawn without modifying our class. If we change our graphics library, we need to modify the class, violating the OCP. Also, having these shapes be in charge of drawing is a violation of the SRP and should be avoided.

If we wish to redesign this without using the visitor design pattern (perhaps because we expect many other shapes to be added in the future), we can use the strategy design pattern to accomplish this. The strategy design pattern involves abstracting out implementation details that will be injected into our classes to handle implementation details on the class's behalf. Let's take a look at a better solution for drawing our shapes:

```C++
class DrawCircleStrategy {
    public:
        virtual ~DrawCircleStrategy() = default;
        virtual void draw(Circle const& circle) const = 0;
};
class OpenGLCircleStrategy : public DrawCircleStrategy {
    public:
        void draw(Circle const& circle) const override;
};

class Circle : public Shape {
    public:
        explicit Circle(double radius, std::unique_ptr<DrawCircleStrategy> drawer) : radius_(radius), drawer_(std::move(drawer)) {};
        void draw() const override {
            drawer_->draw(*this);
        }
    private:
        double radius_;
        std::unique_ptr<DrawCircleStrategy> drawer_;
};

class DrawSquareStrategy {
    public:
        virtual ~DrawSquareStrategy() = default;
        virtual void draw(Square const& square) const = 0;
};
class OpenGLSquareStrategy : public DrawSquareStrategy {
    public:
        void draw(Square const& square) const override;
};

class Square : public Shape {
    public:
        explicit Square(double side, std::unique_ptr<DrawSquareStrategy> drawer) : side_(side), drawer_(std::move(drawer)) {};
        void draw() const override {
            drawer_->draw(*this);
        }
    private:
        double side_;
        std::unique_ptr<DrawSquareStrategy> drawer_;
};
```

We can now implement the drawing of circles and squares using OpenGL by injecting the respective strategy class into our `Circle` and `Square` classes during construction:

```C++
int main() {
    std::vector<std::unique_ptr<Shape>> shapes;
    shapes.push_back(std::make_unique<Circle>(12, std::make_unique<OpenGLCircleStrategy>()));
    shapes.push_back(std::make_unique<Square>(14, std::make_unique<OpenGLSquareStrategy>()));
    for (auto const& shape : shapes) {
        shape->draw();
    }
}
```

If we need to switch to a different graphics library for squares in the future, we can build out a new class that inherits from the `DrawSquareStrategy` and implements usage of this different library. Our `Square` class will never know of this change, nor will any of the other classes.

Other than the previously mentioned issue that the strategy pattern makes adding new functionality to our classes more difficult (since we need to add new virtual interface methods back into our base class), the implemented strategy pattern above will slow us down with all the indirections coming from virtual functions. But that is okay because this issue can be handled with static polymorphism using templates:

```C++
template<typename DrawCircleStrategy>
class Circle : public Shape {
    public:
        explicit Circle(double radius, DrawCircleStrategy drawer) : radius_(radius), drawer_(std::move(drawer)) {};
        void draw() const override {
            drawer_.draw(*this);
        };
    private:
        double radius_;
        DrawCircleStrategy drawer_;
};

template<typename DrawSquareStrategy>
class Square : public Shape {
    public:
        explicit Square(double side, DrawSquareStrategy drawer) : side_(side), drawer_(std::move(drawer)) {};
        void draw() const override {
            drawer_.draw(*this);
        };
    private:
        double side_;
        DrawSquareStrategy drawer_;
};

int main() {
    std::vector<std::unique_ptr<Shape>> shapes;
    shapes.push_back(std::make_unique<Circle<OpenGLCircleStrategy>>(12, OpenGLCircleStrategy()));
    shapes.push_back(std::make_unique<Square<OpenGLSquareStrategy>>(14, OpenGLSquareStrategy()));
    for (auto const& shape : shapes) {
        shape->draw();
    }
}
```

Instead of injecting a `unique_ptr` with our draw strategy, we pass it as a template argument. As always, we lose some runtime flexibility with this approach but achieve significant performance improvements.

One of the biggest issues with the strategy design pattern is the potential explosion of classes and large constructors for injection. If our shapes need to support classes to serialize them and export to JSON, we now need to add new strategies for each derived shape class, and each of these needs to be injected into our class, which can quickly clutter our constructors.

The strategy design pattern is another tool in our toolbelt for designing software that is subject to change. In this case, we now have the ability to abstract out implementation details without concern that changes to those details in the future will impact our classes. 