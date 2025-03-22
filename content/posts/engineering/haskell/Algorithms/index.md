---
title: Haskell Algorithms
seo_title: Haskell Algorithms
summary: 
description: 
slug: Haskell Algorithms
author: Christopher Weaver

draft: false
date: 2025-03-21T09:38:32-06:00
lastmod: 2025-03-21T09:38:32-06:00
publishDate: 2025-03-21T09:38:32-06:00

feature_image: haskell.png
feature_image_alt: 

categories:
- Engineering
tags:
- Haskell
series:
- Haskell

toc: true
related: true
social_share: true
newsletter: false
disable_comments: false

---

### Fibonacci

A recursive function that pattern matches for the computation of a single fibonacci sequence up to a certain number generally tends to look like this:

``` Haskell
fib :: Int -> Int
fib n
  | n == 0 = 0
  | n == 1 = 1
  | otherwise = (fib $ n - 1) + (fib $ n - 2)
```
Say we wanted to compute all fibonacci numbers up until a certain number. The naive approach would look like this:
```Haskell
fibs :: [Int]
fibs = map fib [0..]

computeList :: [Int]
computeList = takeWhile (<500) fibs
```
Fibs will generate an infinite list of fibonacci numbers, but because Haskell evaluates functions like this lazily, which means a new value will only ever be computed by fibs when evaluated by the function calling fibs. takeWhile will continue to evaluate results from fibs until its condition returns false. This all works, but it is highly inefficient as which each additional number fibs computes, it will recompute all the lower number of the fibonacci sequence that were already computed previously. This algorithm above runs in O(2^n). What we want instead is for fibs to keep a running tally of each value as it traverses the sequence:
```Haskell
-- Optimized
fibs' :: [Int]
fibs' = 0 : 1 : helper fibs' (tail fibs')
  where
    helper (a:as) (b:bs) =
        a + b : helper as bs
```
Understanding how this function works will go a long way to understanding laziness in Haskell. We default our first two values since we know what they will be. We next call our helper function passing in our fibs' list and the tail of the fibs' list. This is wildly confusing at first, but this is how this gets evaluated
```
fibs' = 0 : 1 : helper [0 : 1 : <thunk>] [1 : <thunk>]
```
If we ever attempt to access the third element in the fib's list, Haskell we begin evaluating the helper function like so
```
helper 0 + 1 : helper [1 : <thunk>] [<thunk>]
```
This gets returned and fibs' now looks like this:
```
fibs' = 0 : 1 : 1 : helper as bs
```
The easiest way to intuit this is that as and bs now represent indexes to the fibs' list. Haskell is not going to compute the value of these indexes yet, but will if we need to.
```
as = index of fibs' at 1
bs = index of fibs' at 2
```
Lets say we want to get the next value (index 3) of the fibs list. Now Haskell will needs to evalute that helper function
```
helper as bs
helper (fibs !! 1) (fibs !! 2)
helper [1 : 1 : <thunk>] [1 : <thunk>]
helper 1 + 1 : helper as bs
helper 2 : helper (fibs !! 2) (fibs !! 3)
fibs' = 0 : 1 : 1 : 2 : helper as bs
```
Lets compute again for the next value in fibs' which means calling our helper function

```
helper (fibs !! 2) (fibs !! 3)
helper [1, 2, <thunk>] [2, <thunk>]
helper 1 + 2 : helper as bs
helper 3 : helper (fibs !! 3) (fibs !! 4)
```

This can continue on indefinitely. The real trick here is understanding that a thunk is a pause in computation until needed. What took me a while to understand is that thunk does not know about (tail fibs') or anything like that. It will just continue to evaluate the cons operation as needed. 

[Github](https://github.com/crweaver225/Haskell-Algorithms/blob/main/Fibonacci/main.hs)

### Factorial
```Haskell
fact :: Int -> Int
fact 1 = 1
fact n = n * fact $ n - 1
```

### Quicksort
The quicksort algorithm for sorting an list works by choosing a pivot element, moving all other elements to the left or right of the pivot based on its relatively order, and then recursively doing the same approach to the sub-lists to the right and left of the pivot element. The algorithm operates in O(n log n).
```Haskell
quicksort :: (Ord a) => [a] -> [a]
quicksort [] = []
quicksort (x:xs) = (quicksort lesser) ++ [x] ++ (quicksort greater)
  where
    lesser = filter (< x) xs
    greater = filter (>= x) xs
```
This quicksort properly picks the first element as a pivot, then will recursively call quicksort again with all elements less than the pivor and greater than the pivot. Finally it appends the order so that the pivot element is properly in the middle of the greater than and lesser than elements. 

This algorithm is significantly less efficient than what you would find in a C/C++ algorithm because nothing is ordered in-place. Haskell is by default a pure language that does not easily lend to editing any data in memory. Instead, this algorithm continously constructs a new list everytime we call lesser and greater. There are ways around this that I will explore at some further point in the future. 

[Github](https://github.com/crweaver225/Haskell-Algorithms/blob/main/QuickSort/main.hs)