---
title: Lazy Evaluation in Haskell
seo_title: Lazy Evaluation in Haskell
summary: Exploring laziness in Haskell by computing the Fibonacci sequence
description: 
slug: Lazy Evaluation in Haskell
author: Christopher Weaver

draft: false
date: 2025-03-23T09:38:32-06:00
lastmod: 2025-03-23T09:38:32-06:00
publishDate: 2025-03-23T09:38:32-06:00

feature_image: haskell_lazy.jpeg
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
The Fibonacci sequence is a series of numbers where each number is the sum of the two numbers before it. The sequence starts with 0 and 1, and continues to infinity. The sequence is named after Leonardo Fibonacci, an Italian mathematician who introduced it to Western Europe in 1202. 

Computing the fibonacci sequence in Haskell can be done in a rather elequent way, mapping over a recursive function that utilizes guard statements for our base cases:

``` Haskell
fib :: Int -> Int
fib n
  | n == 0 = 0
  | n == 1 = 1
  | otherwise = (fib $ n - 1) + (fib $ n - 2)

fibs :: [Int]
fibs = map fib [0..]

computeList :: [Int]
computeList = takeWhile (<50) fibs
```
This little piece of code has a few interesting parts to it. Our fib function will generate the fibonacci value for the number given to it. This function is an example of tree recursion, branching downward towards our base cases and computing values on our way back up. Fibs though, only computes one fibonacci value based on the index we provide it, so we must also built out a fibs function to generate a list of the entire fibonacci sequence by mapping over a infinite list. For many other programming langauges, iterating over an infinite list is a recipe for trouble. But this is what makes Haskell so unique. Haskell is a lazily evaluated language which means all computation is put off until it is needed. This is where the computeList function comes in, takeWhile will only evaluate the first 50 elements within the fibs list therefore ensuring the computation does not continue until the end of time.

Lazy evaluation opens up a whole avenue of optimizations for the GHC compiler as well as allows for developers to build really elequent source code. The code above is a perfect example of a clean, stateless, side-effect free subroutine that can lazily compute the fibonacci sequence to any arbitrary value. But it has a problem. A runtime analysis of this program proves to execute in exponential runtime, 0(2^n). The reason for this is that fib makes two recursive calls, with each subsequent recursive call making two more recursive calls. The number of calls we make expands exponentially as we navigate down an expanding tree of calls n times. The call suffers from redundant work as many of the recursive calls compute the same subsequence of the fibonacci sequence. On top of that, our map function redudantly re-computes each subsequence of the fibonacci sequence as it maps through the sequence. 

Luckily, we can modify our algorithm and optimize it from an exponential runtime to a linear runtime O(n). To do so though will require a deeper comprehension of lazy evaluation in Haskell. Lets take the time to write out this optimized subroutine, explore how it works, and advance our intuition of lazy programming. 

The key to optimizing our algorithm is to keep a running tally of each value as it traverses the sequence:
```Haskell
-- Optimized
fibs' :: [Int]
fibs' = 0 : 1 : helper fibs' (tail fibs')
  where
    helper (a:as) (b:bs) =
        a + b : helper as bs
```
Our optimized subroutine starts by defaulting the first two values of the sequence since these are static. The third value of the sequence will implement a cons operation and call our helper function which passes in our fibs' list and the tail of our fibs' list. 

For many, this is a little mind-bending at first glance, but this is how this gets evaluated:
```
fibs' = 0 : 1 : helper [0 : 1 : <thunk>] [1 : <thunk>]
```
The first thing we need to address is this thunk. In Haskell, a thunk is an expression that Haskell puts off evaluating until it absolutley needs to evaluate it. This is the secret sauce to working with an infinite list. Our fibs' function does a cons operation using a helper function which recursively does another cons operation on itself. Usually this would cause an infinite recursion and stack overflow at runtime, but Haskell puts off evaluating each cons operation on the helper function until it is needed. A <thunk> here represents the next execution of the recursive helper function that may or more not get computed in the future. If we ever attempt to access the third element in the fib's list, Haskell we begin evaluating the helper function (thunk) like so
```
helper 0 + 1 : helper [1 : <thunk>] [<thunk>]
```
This gets returned and fibs' now looks like this:
```
fibs' = 0 : 1 : 1 : helper as bs
```
The easiest way to intuit what is happening is that 'as' and 'bs' now represent indexes to the fibs' list. Haskell is not going to compute the value of these indexes yet, but will if we need to.
```
as = index of fibs' at 1
bs = index of fibs' at 2
```
Lets say we want to get the next value (index 3) of the fibs list. Now Haskell will need to evalute that helper function
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
This can continue on indefinitely. The real trick here is understanding that a thunk is a pause in computation until needed. What took me a while to understand is that the thunk does not know about the (tail fibs') that we originally passed into the helper function. Instead our thunk operates more like an index that our helper function will execute on if evaluatoin is ever needed. A cons operated recursive function is a fundamental building block of Haskell, similar to a for loop in language like C++. When we see the parallel and better intuit how this fits in with lazy evaluation, we can better make sense of our optimized fibonacci sequence subroutine. 