---
title: Value Semantics in C++
seo_title: Value Semantics
summary: 
description: 
slug: Value Semantics
author: Christopher Weaver

draft: true
date: 2024-08-6T09:38:32-06:00
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

Modern C++ has to some important degree moved away from the Gang of Four style of programming found in the famous 1994 book ***Design Patterns: Elements of Reusable Object-Oriented Software***. This style relied heavily on object oriented programming, dynamic polymorphism, and reference semantics. This style of programming incurs performance hits due to the overhead produced by virtual functions, the cost of creating small polymorphic objects, and the indirection of accessing data within complex schemes. But its utilization not only costs us in runtime performance, but provides also tends to be the 