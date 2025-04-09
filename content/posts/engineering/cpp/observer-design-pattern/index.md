---
title: Observer Design Pattern
seo_title: Observer Design Pattern
summary: 
description: 
slug: Observer Design Pattern
author: Christopher Weaver

draft: false
date: 2024-09-12T09:38:32-06:00
lastmod: 2024-09-12T09:38:32-06:00
publishDate: 2024-09-12T09:38:32-06:00

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

I have spent a good portion of my professional career working on native mobile applications, which largely rely on reactive programming to automatically update UI elements when there is a state change to relevant data objects. Frameworks like RxSwift and Combine make this pretty painless and provide modern, clean, and performant native code. This pattern also has significant value in the C++ development enviornment. 

At a high level, the observer design pattern allows us to define a one-to-many dependency between objects so that when the state of one object changes, all its dependents are notified. This pattern targets a variation point and extracts it into an abstraction that helps decouple software entities. 

Lets look at an implementation example:
```C++
template<typename Subject, typename StateTag>
class Observer {
    public: 
        virtual ~Observer() = default;
        virtual void update(Subject const& subject, StateTag property) = 0;
};

class Person {
    public: 
        enum StateChange {
            forenameChanged,
            surnameChanged,
            addressChanged
        };
        using PersonObserver = Observer<Person, StateChange>;

        explicit Person(std::string forename, std::string surname) : forename_{std::move(forename)}, surname_{std::move(surname)} {}

        bool attach(PersonObserver* observer);
        bool detach(PersonObserver* observer);

        void notify(StateChange property);

        void forename(std::string newForename);
        void surname(std::string newSurname);
        void address(std::string newAddress);

        std::string const& forename() const { return forename_;}
        std::string const& surname() const { return surname_; }
        std::string const& address() const {return address_;}
    private:
        std::string forename_;
        std::string surname_;
        std::string address_;

        std::set<PersonObserver*> observers_;
};
```
We have built an abstract templated Observer class that other classes can implement as part of this design pattern. In our example, we use a simplistic Person class made up of three data members representing the first name, last name, and address. The two things worth noting so far is:
1) Using a templated Observer class allows us to easily customize the class to pass data specific to the use case of the class that utilizes it. In our case the Person class will be passing a StateChange enum to help observers monitor what exactly changed. 
2) We will be storing all observers of the Person class in a set of PersonObserver pointers. This might feel like an abandonment of modern C++, but it remains a valid and well accepted part of the language. In fact, it is recommended we take arguments as pointers when the class does not have ownership over the resource. We could of course utilize a weak pointer, but the second advantage to using a pointer is each value in the set is a unique memory address. Ok lets continue
```C++
bool Person::attach(PersonObserver* observer) {
    auto [pos,success] = observers_.insert(observer);
    return success;
}
bool Person::detach(PersonObserver* observer) {
    return (observers_.erase(observer) > 0U );
}
void Person::notify(StateChange property) {
    for (auto iter = begin(observers_); iter != end(observers_);) {
        auto const pos = iter++;
        (*pos)->update(*this,property);
    }
}
```
The attach and detach functions are pretty self explanatory, we simply are adding and removing new observers to our set. For the notify function, all we technically need to do is call update() on all pointers in our observers_ set, passing a reference of self along with the state change. The implementation above is a little more complicated in order to handle a use case where a detach is called during the loop within notify(). But this does not handle use cases where attach() is called which can get quite a bit more complex. 
```C++
void Person::forename(std::string newForename) {
    forename_ = std::move(newForename);
    notify(forenameChanged);
}
void Person::surname(std::string newSurname) {
    surname_ = std::move(newForename);
    notify(surnameChanged);
}
void Person::address(std::string newAddress) {
    address_ = std::move(newAddress);
    notify(addressChanged);
}
```
We are now notifying any interested party when the first name, last name, or address changes with any instance of a Person class. 
```C++
class NameObserver : public Observer<Person, Person::StateChange> {
    public:
        void update(Person const& person, Person::StateChange property) override;
};

void NameObserver::update(Person const& person, Person::StateChange property) {
    if (property == Person::forenameChanged || property == Person::surnameChanged) {
        // Respond to name change
    }
}

class AddressObserver : public Observer<Person, Person::StateChange> {
    public:
        void update(Person const& person, Person::StateChange property) override;
};

void AddressObserver::update(Person const& person, Person::StateChange property) {
    if (property == Person::addressChanged) {
        // Respond to address change
    }
}
```
Equipped with these observers, we can now put our design pattern into action
```C++
int main() {
    NameObserver nameObserver;
    AddressObserver addressObserver;

    Person homer("Homer", "Simpson");
    Person marge("Marge", "Simpson");
    Person monty("Montgomery", "Burns");

    homer.attach(&nameObserver);
    marge.attach(&addressObserver);
    monty.attach(&addressObserver);

    home.forename("Homer Jay");
    marge.address("123 Main St.");
    monty.address("Springfield Nuclear Power Plant");

    homer.detatch(&nameObserver);
}
```
We create three persons and attach specific observers to them. Then, anytime the name changes for homer or the address changes for marge and monty we will see the update function called for the appropriate observer instance. If these observer classes are tied to the UI of our application, we can wire this up to quickly change our UI elements when the name and address likewise changes on our Person instances. 

While the approach above works, a good modern C++ engineer should often look for ways to limit inheritance and reference semantics. To that end, here is a way to improve our Observer design pattern using std::function
```C++
template<typename Subject, typename StateTag>
class Observer {
    public:
        using OnUpdate = std::function<void(Subject const&, StateTag)>;

        explicit Observer(OnUpdate onUpdate) : onUpdate_{ std::move(onUpdate)} {}

        void update(subject, property);
    
    private:
        onUpdate onUpdate_;
};
```
What we will see if we investiage the implementation in a new main() function is that we have simplified and expanded the flexibility of the Observer class
```C++
void propertyChanged(Person const& person, Person::StateChange property) {
    if (property == Person::forenameChanged || property == Person::surnameChanged) {
        // Respond to name change
    }
}

void main() {
    using PersonObserver = Observer<Person, Person::StateChang>;

    PersonObserver nameObserver(propertyChanged);

    PersonObserver addressObserver([](Person const& person, Person::StateChange property) {
        if (property == Person::addressChanged) {
            // Respond to address change
        }
    });

    Person homer("Homer", "Simpson");
    Person marge("Marge", "Simpson");
    Person monty("Montgomery", "Burns");

    homer.attach(&nameObserver);
    marge.attach(&addressObserver);
    monty.attach(&addressObserver);

    home.forename("Homer Jay");
    marge.address("123 Main St.");
    monty.address("Springfield Nuclear Power Plant");

    homer.detatch(&nameObserver);
}
```
We no longer need to define and construct classes that inherit from the Observer. Instead we can pass functions and llambdas into an instance of the templated observer class itself and have those handle changes as they occur. 

There are three major types of observer patterns. The one given above as well as a push and a pull observer. With the push observer, our update function would need to send the updated state via a bunch of overloaded update functions:
```C++
class Observer {
    public:
        virtual void update1(/* arguments for a specific state change */);
        virtual void update2(/* arguments for a specific state change */);
};
```
The other type is a pull observer which essentially sends the entire changed object with the update function and has the observer attempt to understand what specifically changed. The push observer has the advantage of potentially being more efficent since the observer does not need to query the observed class for a change, but increases code complexity with multiple update functions. The pull observer on the other hand simplifies the update function at the expense of more complexity in understanding what exactly changed in the observed class. The impelmentation provided above is the compromise between the two, providing only one update function but with an additional heuristic tag to help decipher what changed. 

One final note. 

Observer classes become complex very quickly. Especially in multithreaded enviornments. Properly handling attaching and detaching is a massive subject on its own. Security risks can also be problematic with this design pattern as a bad observer could lock up your program if it inproperly handles its callback. Using the observer design pattern is non-trivial and should be implemented with caution and further education. 