---
title: The Art of Software Design in C++ 
seo_title: The Art of Software Design in Cpp
summary: 
description: 
slug: The Art of Software Design in Cpp
author: Christopher Weaver

draft: false
date: 2024-03-20T09:38:32-06:00
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

I recently began reading 

***C++ Software Design***

**Author:** *Klaus Iglberger*

![Book Image](cppSoftwareDesign.png "Book Image")

I highly recommend the book, you can find it for purchase [here](https://www.amazon.com/Software-Design-Principles-Patterns-High-Quality/dp/1098113160/ref=sr_1_3?crid=3EIAKRJ6I9RYZ&dib=eyJ2IjoiMSJ9.leTWyGrelAfYNVsZmlqjNIIWuByFnaRuHn0QbI4jC74JFVAJM4QMV1IHHuxfxSJolTytjLL7EIgzeoxgr6DwgXcD7bDvgz7VWzkXdk2iHAzjXEMDPDzABa59mDvIZocmPwIH2uHwFCGB-sza3M1Kf5F1AwCK6t5g_p34kZsdQ7DDNocCgBKqsGQP4Sp2COFMATzuHyLjjznLijhGbNDfUipO2okLHYt_QO84nDIFnf0.ZEvP6-KyR-IGuLWK11zPIbzh_y0d6uYiCDaOwE4Gais&dib_tag=se&keywords=c%2B%2B+software+design&qid=1711117286&sprefix=c%2B%2B+softwar%2Caps%2C100&sr=8-3)

My intention is to summarize the book with one post per chapter based on what I find most important. This summary will be far from exhaustive but hopefully helpful to anyone dipping their toe into learning how to better design their software. 

### Design for Change

Building software that does its design task is often onlyl half the battle. Often it is the case that we need our software to change and be adaptable over time as requirements and needs change. One of the essential needs of good software is the ability to change it easily. Good software design is crucial to making adaptable software possible. Often with bad design patterns ever the most simple change can turn into a complicated endevour as seemingy unrelated functionality breaks from your "minor change". 

Our major culprit to flexible and robust software is dependencies. The coupling of different segments of code in order to form features and functionality. The interaction between code segments that we describe as dependency is a required part of writing software. But we have flexibility in how this is done, and choosing the right approach to managing dependencies goes a long way towards building better software systems.

#### Separation of Concerns

One of the best strategies for reducing the types of artificial dependencies and allowing for a simplification of code change is breaking down systems into small, understandable pieces. We will often refer to the *SOLID* principles when talking about software design, and the first part of the *SOLID* principle directly ties in to the separation of concerns: *Single-Responsibility Principle* (SRP). 

The *SRP* in its colloquial form says "Everything should just do one thing". What this exactly means is certianly up for interpretation. But I found the example used on pg. 12 to be extremely helpful concrete example. Consider this Document class
```C++
class Document {
  public:
    virtual ~Document() = default;
    virtual void exportToJSON(/*...*/) const = 0;
    virtual void serialize(ByteStream&, /*...*/) = 0;
}
```
This purely abstract class looks eerily similar to classes I have personally written many times. On its surface there are a lot of things to like about it. This is a form of runtime polymorphism that allows our code to generically handle lots of different types without needing to know the nitty gritty details of how they implement their functionalities. Our document class appears to be well built to encapsulate and abstract away implementation details that other parts of code do not need to know. 

But this class is a bad design because of contains multiple artificial dependencies. First, exportTOJSON() needs to be implemented by all derived classes (even if the derived class does not support exporting to JSON!). Often in C++, things like implementing JSON exports is left to a third party library. If that is the case, all derived classes will be seperately using this library. If the time comes where a change is made to which library is used, we now need to go into each derived class and make the change (each derived class is coupled to each other in that all of them need the same change based on a change to a library). 

Another dependency is introduced in the serialize() function which will likely need to know which kind of document it needs to serialize its contents into. A common approach is to build an document type enum that each derived class uses to help understand its own state and how it should proceed with serialization. 
```C++
enum class DocumentType {
  pdf,
  word,
  // .... potentially many more types
}
```
But now anytime a new type is added, all other derived types will be directly affected since each derived type would "know" about all other types. How do we fix this? Well by ensuring the document class only does one thing, which is to represent the most basic operations of a document. 
```C++
class Document {
  public:
    virtual ~Document() = default;
}
```
Obviously we have now lost two important features we need. We will later discuss how to better support exporting to JSON and serialization for this document class. 

#### Don't Repeat Yourself

The *DRY* principle is actually pretty intuitively nestled in with the concept of making software easier to change. Repitition of code means if you need to change your code in one place, it is likely you will need to make similar changes to the other places that have repetitive code. This is an artificial dependency, and can be a rather nasty one as the compiler will almost never spot this. 

### Separation of Interfaces

The I in *SOLID* stands for *Interface Segregation Principle* (ISP). Simply put, it means clients should not be forced to depend on methods that they do not use. In our document example used above, I mentioned that some derived classes may be force to implement methods they do not need or support. The ISP recommends decoupling interfaces by instead seperating the interfaces like so
```C++
class JSONExportable {
  public:
    virtual ~JSONExportable = default;
    virtual void exportToJSON(/*...*/) const = 0;
};
class Serializable {
  public:
    virtual ~Serializable() = default;
    virtual void serialize(ByteStream& bs, /*...*/) const = 0;
};
class Document: public JSONExportable, public Serializable {
  public:
    virtual ~Document() = default;
}
```
When structured this way, we can now minimize dependencies to only the set of functions that is actually required
```C++
void exportDocument(JSONExportable const& exportable) {
  exportable.exportToJSON(/*pass arguments*/);
}
```
Now the JSONExportable functionality no longer depends on the the serialization functionality or the ByteStream class. 

### Design for Testability

Building tests for your software is an awesome way to deal with the chellenges of changing things. The purpose of these tests is to be able to assert that all of your software functionally still works, even after making a change. Iglberger then makes what to some will be a controvertial statement: software shoudl be designed for testability. 

Lets consider the following Widget class and how we its private member function making writing tests challenging. Consider the class
```C++
class Widget {
  //..
  private: void updateCollection(/*..*/);
  std::vector<Blob> blobs_;
}
```
The problem is immediatley before us. Because the udpateCollection function is private, our tests will not be able to access this function. We could of course build another public function that can test the function for us. This is called a *white box test* - a test that knows the internal implementation details of some other function. This though introduces a dependency, which as we have spent so much time discussing above, we want to avoid. Instead it is important we directly test our updateCollection() function. 

Another approach would be to make our test code a friend of the Widget class. This would allow access to all the private members for testing. This architecture though smells and also introduces more dependencies. As a gerneral rule of thumb, in C++ a friend is not your friend. Part of our goals when writing tests is that our production code should never be aware of the test code. When this is violated, we have now introduced a new coupling between our class in the test code. 

So how do we solve this? Iglberger suggests extracting the private member function and make it a seperate entity in our codebase. 
```C++
namespace widgetDetails {
  
  class BlobCollection {
    public:
      void updateCollection(/* ... */);
    private:
      std::vector<Blob> blobs_;
  };
}

class Widget {
  private:
    widgetDetails::BlobCollection blobs_;
};
```
We now have the ability to test the updateCollection() and how it changes the Blob vector. The functionality is also available and private within the Widget class. You can also argue that this approach increases the encapsulation of our objects. In Scott Meyers book *Effective C++*, extractive functions from a a class is a step toward increasing encapsulation...You should generally prefer nonmember nonfried functions to member functions because every member functino has full access to every other member function of the class, even the private ones. But the appraoch above prevents this since the member function and data cannot itself access any other private parts of the Widget class. 

### Design for Extension

Another part of *SOLID* is the *Open-Closed Principle* (OCP). This principle states that classes should be open to extension, but closed to modification. Whenever a base class needs to be changed, there can be numerous implications for the derived classes. There we instead require that classes be extended when change is required. But this extension should be easy and should not modify existing code.

I found the rest of this section of the chapter to be a little underdeveloped. I have a high level of confidence though that this topic will come up again in later chapters and we can better consider the OCP. 