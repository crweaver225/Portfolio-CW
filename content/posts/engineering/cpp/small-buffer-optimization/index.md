---
title: Small Buffer Optimization
seo_title: Small Buffer Optimization
summary: 
description: 
slug: Small Buffer Optimization
author: Christopher Weaver

draft: false
date: 2024-06-03T09:38:32-06:00
lastmod: 2024-06-03T09:38:32-06:00
publishDate: 2024-06-03T09:38:32-06:00

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
### Introduction
Engineers like optimization techniques; it is in our blood. An interesting, although slightly counterintuitive technique is small buffer optimization. One of our goals should be to program on the stack using value semantics anytime it makes sense. But the reality is we often are required to allocate our data onto the heap for numerous reasons. It is often necessary, but unfortunate since heap allocated data comes with a performance penalty. For containers that need to store data, small buffer optimization works to try and mitigate this performance hit by allocating a small amount of stack memory that will be used instead of heap memory when possible. When only a small amount of data is stored within the container, its stack allocated memory is used, otherwise it will store the data in the heap.

I say this is slightly unintuitive because much of what engineers do to optimize their code base involves reducing the memory footprint of their containers. A container with a smaller memory footprint will introduce far less cache misses during runtime and can often lead to very significant performance improvements. But with small buffer optimization, we instead increase the memory size of our container with the knowledge that this extra memory might not even be used!

### Implementation
Let's dive into how this gets implemented. We are going to implement a small string class with buffer optimization. If the string it owns is less than or equal to 15 characters, we will store it locally in a stack-allocated array, otherwise, it will be stored in the heap using pointer semantics. For small strings, we should expect a major optimization at runtime since we do not need to allocate memory on the heap (expensive) or fetch the memory from heap when needed (also expensive). Instead, for these small strings, the memory is already allocated at the start of the program and is retrieved much faster.

We could increase the size of the local buffer to try and capture more use cases, but what we will find is that there will start to be a degradation in performance as the size of the class increases due to the larger buffer. The larger size means more cache misses which might perform worse than grabbing data from the heap. Since heap data only adds the size of the pointer (usually 64 bits) into the class memory size, the entirety of the class might be more cache friendly and perform better (even with the need to use heap memory).

```C++
class SmallString {
private:
    static constexpr size_t MAX_SIZE = 15; // Maximum size for the small buffer
    size_t size;
    char* data;
    char buffer[MAX_SIZE + 1]; // Static buffer +1 for null terminator

public:
    // Constructor
    SmallString(const char* str) : size(strlen(str)) {
        if (size <= MAX_SIZE) {
            // Use the internal buffer
            data = buffer;
        } else {
            // Allocate memory dynamically if size exceeds MAX_SIZE
            data = new char[size + 1];
        }
        strcpy(data, str);
    }
    // Copy constructor
    SmallString(const SmallString& other) : size(other.size) {
        if (size <= MAX_SIZE) {
            data = buffer;
        } else {
            data = new char[size + 1];
        }
        strcpy(data, other.data);
    }

    // Destructor
    ~SmallString() {
        if (size > MAX_SIZE) {
            delete[] data;
        }
    }

    // Helper function to display string
    void print() const {
        std::cout << "String: " << data << " (size: " << size << ")" << std::endl;
    }
};

int main() {
    SmallString s1("Hello");
    SmallString s2("This is a very long string that does not fit in the buffer");

    s1.print();
    s2.print();

    return 0;
}
```
Even with the benefits of SBO, it is unfortunate to have so many use cases where memory is allocated for the object that might never be used. Very wasteful. There is a way to work around this through the use of a union. A union in C/C++ is a user-defined datatype that can define different types of data within it, similar to a struct. But, only one member variable within the union can store data at any given time. Using a union allows us to use the same memory for both our local buffer and our pointer to the heap which is great, since without the SBO we need to store the pointer anyway. This essentially means we get our local buffer for free!
```C++
class SmallString {
private:
    static constexpr size_t MAX_SIZE = 15; // Maximum size for the small buffer
    union {
        char* data;  // Pointer to the dynamically allocated buffer for large strings
        char buffer[MAX_SIZE + 1];  // Inline buffer for small strings
    };
    size_t size;

    bool isSmall() const { return size <= MAX_SIZE; }

public:
    // Constructor
    SmallString(const char* str

) : size(strlen(str)) {
        if (isSmall()) {
            // Use the small buffer
            memcpy(buffer, str, size + 1);
        } else {
            // Allocate memory for large strings
            data = new char[size + 1];
            memcpy(data, str, size + 1);
        }
    }

    // Destructor
    ~SmallString() {
        if (!isSmall()) {
            delete[] data;
        }
    }

    // Copy constructor
    SmallString(const SmallString& other) : size(other.size) {
        if (isSmall()) {
            memcpy(buffer, other.buffer, size + 1);
        } else {
            data = new char[size + 1];
            memcpy(data, other.data, size + 1);
        }
    }

    // Assignment operator
    SmallString& operator=(const SmallString& other) {
        if (this == &other) return *this;

        if (!isSmall()) {
            delete[] data;
        }

        size = other.size;
        if (isSmall()) {
            memcpy(buffer, other.buffer, size + 1);
        } else {
            data = new char[size + 1];
            memcpy(data, other.data, size + 1);
        }
        return *this;
    }

    // Print function for demonstration
    void print() const {
        std::cout << (isSmall() ? buffer : data) << std::endl;
    }
};

int main() {
    SmallString s1("Hello");
    SmallString s2("This is a very long string, definitely not small!");
    s1.print();
    s2.print();
    return 0;
}
```
If the SmallString instantiation is larger than 15 characters, the data variable will be used within the union, otherwise the buffer variable will be used. In both cases, the union will take up the same memory footprint at the largest item in the union, which in this case is likely buffer at 16 bytes. So in this case, we get either the pointer for free.

### Conclusion
This optimization is great, when used correctly. In both my examples above, the SmallString class is still larger than it otherwise would have been had I not done SBO. This is fine if we have enough instantiations that utilize the small buffer. But if every instantiation is so large that it must go on the heap, we are bloating our objects for no apparent reason. It is always important to test optimizations to ensure they actually help and do not in fact slow things down.