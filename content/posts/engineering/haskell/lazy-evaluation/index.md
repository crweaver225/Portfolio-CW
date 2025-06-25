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

feature_image:
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
The Fibonacci sequence is a series of numbers where each number is the sum of the two numbers before it. The sequence starts with 0 and 1, and continues to infinity. It’s named after Leonardo Fibonacci, an Italian mathematician who introduced it to Western Europe in 1202.

Computing the Fibonacci sequence in Haskell can be done in a rather elegant way, mapping over a recursive function that utilizes guard statements for our base cases:
```Haskell
fib :: Int -> Int
fib n
  | n == 0 = 0
  | n == 1 = 1
  | otherwise = fib (n - 1) + fib (n - 2)

fibs :: [Int]
fibs = map fib [0..]

computeList :: [Int]
computeList = takeWhile (< 50) fibs
```
This little piece of code has a few interesting parts to it. Our fib function generates the Fibonacci value for the number given to it. This is an example of tree recursion, branching downward toward our base cases and computing values on the way back up.

The fib function only computes a single Fibonacci value based on the index we provide it, so we also define a fibs function to generate a list of the entire Fibonacci sequence by mapping fib over an infinite list. In many other programming languages, iterating over an infinite list would be a recipe for disaster. But this is what makes Haskell so unique.

Haskell is a lazily evaluated language, which means all computation is deferred until the result is actually needed. This is where the computeList function comes in. takeWhile will only evaluate values from the fibs list up to the first one ≥ 50, ensuring that computation does not continue until the end of time.

Lazy evaluation opens up an entire avenue of optimizations for the GHC compiler, and also allows developers to write really elegant source code. The code above is a perfect example of a clean, stateless, side-effect-free subroutine that can lazily compute the Fibonacci sequence to any arbitrary value.

But it has a problem.

A runtime analysis of this program shows it executes in exponential time, O(2^n). This is because fib makes two recursive calls, and each of those calls makes two more, and so on. The number of calls expands exponentially as we navigate down an increasingly wide tree of recursive calls. Many of these recursive calls are redundant, repeatedly computing the same subparts of the sequence.

On top of that, our map function redundantly re-computes each subsequence of the Fibonacci sequence as it builds out the list.

Optimizing the Algorithm

Luckily, we can optimize our algorithm and reduce the runtime from exponential O(2^n) to linear O(n). To do so, though, will require a deeper understanding of lazy evaluation in Haskell.

Let’s write out this optimized subroutine, explore how it works, and deepen our intuition about lazy programming.

The key to optimizing our algorithm is to keep a running tally of each value as it traverses the sequence:
```Haskell
-- Optimized
fibs' :: [Int]
fibs' = 0 : 1 : helper fibs' (tail fibs')
  where
    helper (a:as) (b:bs) = a + b : helper as bs
```
Our optimized subroutine starts by hardcoding the first two values of the sequence, since these are fixed. The third value is computed using a cons operation (:), and then calls our helper function, passing in fibs' and tail fibs'.

For many, this looks a little mind-bending at first glance, but here’s how it gets evaluated:
```
fibs' = 0 : 1 : helper [0, 1, <thunk>] [1, <thunk>]
```
The first thing to address here is the <thunk>. In Haskell, a thunk is a suspended computation—an expression that Haskell defers until it’s absolutely needed. This is the secret sauce that makes infinite lists possible.

Our fibs' function performs a cons operation using a helper function that recursively cons-es on itself. Normally this would cause an infinite loop and crash at runtime, but Haskell delays each recursive call in the helper function until it's needed. The <thunk> represents the next execution of the helper function, which may or may not be evaluated.

If we try to access the third element in the list, Haskell will begin evaluating the thunk like this:
```
helper 0 + 1 : helper [1, <thunk>] [<thunk>]
```
This gets returned and fibs' now looks like this:
```
fibs' = 0 : 1 : 1 : helper as bs
```
The easiest way to understand what’s going on is to realize that as and bs now represent slices of the fibs' list itself. Haskell won't compute the values of these slices yet—but it will if we need them:
```
as = fibs' starting at index 1
bs = fibs' starting at index 2
```
If we want to compute the next value (index 3), Haskell will need to evaluate that helper function:
```
helper as bs
= helper (fibs' !! 1) (fibs' !! 2)
= helper [1, 1, <thunk>] [1, <thunk>]
= 1 + 1 : helper (fibs' !! 2) (fibs' !! 3)
= 2 : helper ...
```
This continues as needed, indefinitely. The key is understanding that a thunk is a pause button on computation. It doesn’t remember the full expression like (tail fibs'), but it acts like a reference to the position in the list that the helper function will use when the value is eventually needed.

In this sense, a cons-operated recursive function is a fundamental building block of Haskell—just like a for loop is in C++. Once we see the parallel, and better understand how lazy evaluation works, the optimized Fibonacci subroutine makes perfect sense.

### Conclusion

The naive version of our Fibonacci function shows the expressive beauty of recursion in Haskell, but suffers from serious performance issues due to redundant computation. By using lazy evaluation and carefully structuring our recursion, we were able to transform an exponential-time function into a linear-time one—all while keeping the code clean, declarative, and idiomatic.

Understanding lazy evaluation—and the role of thunks—opens the door to writing highly efficient and elegant code in Haskell. The Fibonacci sequence is just one example, but the techniques we used here apply broadly across the language.