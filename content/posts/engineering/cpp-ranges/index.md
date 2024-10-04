---
title: Ranges in C++ 
seo_title: Ranges in Cpp
summary: 
description: 
slug: Ranges in Cpp
author: Christopher Weaver

draft: false
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