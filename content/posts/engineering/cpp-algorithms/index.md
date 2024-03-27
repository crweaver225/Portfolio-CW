---
title: Algorithms in the C++ Standard Library
seo_title: Algorithms in the C Standard Library
summary: 
description: 
slug: Algorithms in the C Standard Library
author: Christopher Weaver

draft: false
date: 2024-03-15T09:38:32-06:00
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

### Why Use the Algorithms Library

In this post we will go over some of the efficient algorithms that the C++ Algorithm library has to offer. As a rule of thumb, engineers should almost always opt for using these library components over raw for-loops and other hand crafted solutions. Using these library compnents not only improves the readability of your code, but often comes with performance improvements and future proofs your code. 

Using the Algorithms library in your C++ code is as simple as including the algorithms header into the file you want to use it in
```
#include <algorithm>
```
As I just mentioned above, using this library allows us to solve problems in a more robust manner than custom solutions built by an engineer. There are a lot of reasons for this, but amongst the most important reasons is that the algorithm library is standardized. Any engineer who knows C++ should quickly be able to glance at the code and see what it is doing. Consider this example of a hand crafted solution to a problem:
```C++
bool conflicting = false;
for (const auto& info : infos) {
  if (info.params() == output.params()) {
    if (varies(info.flags())) {
      conflicting = true;
      break;
    }
  } else {
    conflicting = true;
    break;
  }
}
```
Understanding this code will take another engineer some time to tackle. It is challenging to comprehend why conflicting is set to true and the amount of conditional checks requires keeping lots of context in mind when reviewing the code. Now consider instead if we were to rewrite this same functionality using the Algorithms library:
```C++
const bool in_conflict = [&](const auto& info) {
  return info.params() != output.params() || varies(info.flags());
}
const bool conflicting = std::ranges::any_of(infos, in_conflict);
```
We quickly can see the logic of our lambda within a single line and that it gets applied using a standardized any_of algorithm that any developer should be able to understand. 

But the Algorithms library not only provides improved readability, it also gives our software optimizations for free. Consider this function to find a value in an unsorted array:
```C++
template <typename It, typename Value>
auto find_slow(It first, It last, cont Value& value) {
  for (auto it = first; it != last; it++) {
    if (*it == value) {
      return it;
    }
  }
  return last;
}
```
At first glance, you would not think there is much that can be done to optimizae this function since the vactor is unsorted. But this is not the case. If instead of using the raw for-loop above, we used the std::find() we would likely find the function runs faster. That is because in the GNU libstdc++ implementation, the main loop is unrolled into chucks of four loops at a time. This means the comparison operation is executed one-fourth as many times. When running this function both ways on an input of 10,000,000 elements, I tend to see a speed up of about 1.04x on my machine. Obviously nothing crazy, but this is essentially a free optimization just waiting to be taken advantage of. 

### Features

1) Algorithms do not change the size of the container they work on. 
  - Any function from <algorithm> can only modify the elements within the specified range they are given. No element is ever added or removed from the underlying container. This is important because it means the algorithms can have complexity guarantees. In fact, no algorithm in this library will ever have a time complexity greater than O(n log n). But this means algorithms require containers with allocated memory in order to work since they themselves will not allocate memory. There are exceptions to this such as using the std::back_inserter() and std::inserter() functions. An example:
  ```C++
  const auto square_func = [](int x){ return x * x; };
  const auto v = std::vector{1,2,3,4};

  auto squared_vec = std::vector<int>{};
  auto dst_vec = std::back_inserter(squared_vec);
  std::ranges::transform(v, dst_vec, square_func);
  ```

2) Algorithms perform just as well as C library functions. It is often thought that low level C algorithms like memcpy(), memmove(), memcmp() are superior to C++ <algorithms> in speed and therefore an acceptable trade-off for the type safety <algorithms> provide. But the C++ <algorithms> such as std::copy(), std::equal(), std::fill() will resort to these low-level c functions where possible. It is only in cases where C++ finds it is not safe that it will not resort to these low-level functions. This saftey fallback is one which I suggest we should prefer when deploying software in the real world. But even when C++ does not utilize the C library functions, it sometimes will perform better with its own implimentations. A great example is std::sort which tends to perform better than qsort() due to its ability to inline ordinary comparison operators. 

3) Algorithms can easily work with your custom objects by adding the operator<()> and operator==(). By default, the <algorithm> relies on the == < operators. By supporting these operators in your custom objects, you can easily utilize these objects in the <algorithms>.
```C++
struct Flower {
  auto operator<=>(const Flower& f) const = default;
  bool operator==(const Flower& f) const = default;
  int height_ {};
}

auto garden = std::vector<Flower>{{67}, {28}, {14}};
auto tallest = std::max_element(garden.begin(), garden.end());
auto perfect = std::find(garden.begin(), garden.end(), Flower{28});
```
It is important to note that <algorithms> require our objects move constructor and move assignment operator be marked *noexcept*. If not marked with *noexcept*, <algorithms> will avoid using move operators and instead default to more expensive copy operators for safety purposes. 

### Understanding Iterators

The Algorithms library operates on iterators and ranges instead of different container types. This is to help ensure it is as generic and flexible as possible. I want to devote an entire other post to ranges, therefore I will limit myself to iterators here. 

An iterator provides a generic way to navigate through the elements in a sequence. At its core, an iterator is an object that represents the position in a sequence. It has two main responsibilities:
  1) Navigate a sequence
  2) Read and write values to its current position. 

In C++, the iterator syntax mimicks the syntax of a raw pointer. It can be stepped up or down in the sequence and it can be dereferenced. Some of the things we can do with an iterator:
```
it ++   // step forward
it --   // step backwards
it += n   // jump arbitrary number of positions
value = *it   // read value
*it = value   // assign value
```
In order to help ensure big O complexity guarantees, C++ has six different types of iterators used by different algorithms:

1) input_iterator: supports read and step forward only. This is good for one pass algorithms such as std::count. 
2) output_iterator: write and step forward only. Good for something like an output stream. 
3) forward_iterator: supports read, write, and step forward. The value at the current position read or written to. This is often used for singly linked lists. 
4) bidirectional_iterator: supports read, write, step forward, and step backwards operations. Used for things like a double linked list. 
5) random_access_iterator: supports read, write, step forward, step backwards, and jump operations. 
6) contiguous_iterator: This is the same as a random_access_iterator but can only be used with we are certain the data is in contiguous memory. 

The other iterator concept worth noting is the sentinel value. A sentinel value is a special value that indicates the end of a sequence. This allows us to iterate over a sequence when we do not know its size. The obvious example of this is a c-style string which allocates one more block of memory than is needed to store all the values of the string. This last block stores a '\0' which tells us the string has ended. Most C++ containers support a sentinel using the syntax .end(). If we were to code it ourselves, it could look something like this:
```C++
char arr[] = {'a','b','c','d'};
char* end = arr + sizeof(arr);
for (char *it = arr; it != end; it++) {
  std::cout << *t << ' ';
}
```
We define the sentinel as the memory block just past the end of the sequence. Dereferencing the value cannot be done, but wont be so long as our iterator logic is properly programmed. 

### Examples

#### Sorting elements
```C++
vector<int> v{4,3,2,3,6};
std::sort(v.begin(), v.end());
```
#### Finding elements
```C++
auto col = std::list{2,4,3,2,3,1};
auto it = std::find(col.begin(), col.end(), [](int x) { return x == 2; });
if (it != col.end()) {
  std::cout << *it;
}
```
#### Generating elements
```C++
auto v = std::vector<int>(4);
std::fill(v.begin(), v.end(), 5);
```
#### Binary search
```C++
auto v = std::vector<int>{2,2,3,3,3,4,5};
bool found = std::binary_search(v.begin(), v.end(), 3);
```
Or if we want the index
```C++
auto v = std::vector<int>{2,2,3,3,3,4,5};
auto it = std::lower_bound(v.begin(), v.end(), 3);
if (it != v.end()) {
  auto index = std::distance(v.begin(), it);
}
```
#### Check if condition is met somewhere in the sequence
```C++
auto v = std::vector<int>{2,2,3,3,3,4,5};
if (std::all_of(v.begin(), v.end(), [](int i) { return i < 0; })) {

}
```
#### Counting elements
```C++
const auto numbers = std::list{3,3,2,1,3,1,3};
int n = std::count(numbers.begin(), numbers.end(), 3);
```
This is just a tiny subset of all the possible options available to use in the <algorithms> library. 

### Problems and considerations
As great as the Algorithms library is, there is one major downfall to its usage. The problem arises when an engineer attempts to combine multiple algorithms together for more complex problems. The issue is that it becomes very hard to avoid unneccessary copies of the underlying containers being used. Consider this example of a Student object:
```C++
struct Student {
  int year_{};
  int score_{};
  std::string name_{};
}
```
Now lets say we want to find the second year student with the highest score within a large vector of students. The obvious answer to find the student with the highest score is to use the max_element function on the score_. But we only want to consider second year students using something like the copy_if() function. In order to make this work, we want to combine these two functions, but the Algorithms library does not support composing multiple algorithms. Instead we would have to make a copy of all the second year students into a new container and then look for the max score_. 
```C++
auto get_max_score(const std::vector<Student>* students, int year) {
  auto by_year = [=](const auto& s) { return s.year == year; };
  auto v = std::vector<Student> {};
  std::copy_if(students.begin(), students.end(), std::back_inserter(v), by_year);
  auto it = std::max_element(v, std::less{}, &Student::score_);
  return it != v.end() > it->score_ : 0;
}
```
As you can see, we need to allocate a new array to hold all the second year students so that we can search for the highest score. I often say that if you are choosing C++ for your project it is because you want optimal runtimes and efficient use of hardware resources. Allocating large temporary containers does not mesh with those goals. But there is a solution to this in the C++ ranges library that I will go over in the near future. 

### Conclusion
The C++ Algorithms library is a powerful tool that should find regularly use by most C++ engineers. Usage will produce more readable and performant code, which is something we all should strive for. 