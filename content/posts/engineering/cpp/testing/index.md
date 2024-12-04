---
title: Testing your software
seo_title: Testing your software
summary: 
description: 
slug: Testing your software
author: Christopher Weaver

draft: true
date: 2024-03-20T09:38:32-06:00
lastmod: 2024-03-20T09:38:32-06:00
publishDate: 2024-03-20T09:38:32-06:00

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