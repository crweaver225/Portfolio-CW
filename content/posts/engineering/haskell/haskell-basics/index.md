---
title: The Basics of Haskell
seo_title: The Basics of Haskell
summary: 
description: 
slug: The Basics of Haskell
author: Christopher Weaver

draft: false
date: 2025-02-20T09:38:32-06:00
lastmod: 2025-02-20T09:38:32-06:00
publishDate: 2025-02-20T09:38:32-06:00

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
Haskell is a unique beast. As a purely functional programming language it has vastly different benefits to offer over procedural and object oriented programming languages. The language requires a different way of thinking for the one programming in it. It demands significantly more of an initial cognitive load to learn compared to languages like Python, Javascript, and Rust which all tinker around the edges of each other as far as syntax goes. This requirement will put off many to the language and largely explains how little it has been adopted in the market, but the other side of the coin is that Haskell offers a different paradigm that can be significantly easier to reason about. Clear and concise syntax meets software largely devoid of hidden states that often produce bugs and unpredictable runtimes. Haskell makes writting concurrent code trivial, allows for better code reuse, and is optimal for test driven development. But in order to unlock these benefits, it is important to first get a grasp of the basics of the language.

### Declarations and Variables

```Haskell
x :: Int
x = 3
```
We have just created an integer value and assigned 3 to it. Perhaps not the most exciting thing ever at first glance, but in reality we have already come across the first interesting idiosyncrasy of Haskell. The following code will fail to compile with an error:
```Haskell
x :: Int
x = 3
x = 4
```
The secret sauce of Haskell is that it is a purely functional programming langauge that puts heavy emphasis upon non-mutable states. Once we assign x to be 3, it will be that value forever. In Haskell, variables are not mutable boxes, they are just names for values. 

### Primitive Types

The primitive types that come with Haskell include:
Bool - logical values
Char - single character
String - list of characters
Int - fixed precision integers
Integer = arbitrary-precision integers (generally 64 bit)
Float - single-precision floating point number
Double - double-precision floating point number

### Arithmetic

```Haskell
example1 = 5 + 3
example2 = 12 - 20
example3 = 4.3 * 12.2
example4 = 5.7 / 3.2
example5 = mod 17 3
example6 = 17 `mod` 3
```
The most interesting are the last two examples. In place of the % symbol used to peform modulos operations in other languages, Haskell uses the mod keyword. Mod is represented as a function in Haskell which means the natural way of computing the operation is to type out the function first, followed by its arguments. But Haskell does allow us a different way that many would argue is more readable, which is to type your first argument, places mod between `backticks` and then add your second argument. 

### Functions

As a functional programming language, this section is probably a must to have. Lets define a function that sums two values together
```Haskell
sumValues :: Integer -> Integer
sumValues n m = n + m
```
The first line is a definition of our sumValues function. It gives a name to the function, tells us that it takes in one argument in the form of an Integer and returns an Integer. The second line is the implementation details of the function. We can now use this function
```Haskell
a = sumvalues 10 20
```
The values for a will be 30. 

Because Haskell does not offer the same loop syntax as other langauges, recursion is a major aspect of the build process. Recursive functions tend to work like so
```Haskell
sumtorial :: Integer -> Integer
sumtorial 0 = 0
sumtorial n = n + sumtorial( n - 1 )

main = print (sumtorial 10)
```
Breaking this down, we define our function to take in one integer and return one integer. We also specify on the second line what the implementation of sumtorial should be when passed a zero specifically, this becomes our break case where the function ends calling itself. Finally we have our other impelementation that takes any value other than zero and adds it to a recusrive call to itself. 

### Guard Statements
Functions can utilize an arbitrary number of guard statements that get evaluated from top to bottom one at a time. Once a guard statement gets evaluated to True, its associated code gets executed
```Haskell
hailstone :: Integer -> Integer
hailstone n
  | n `mod` 2 == 0 = n `div` 2
  | otherwise      = 3 * n + 1

main = print ( hailstone 3 )
```
A guard statement starts with the | character where what follows get evaluated as a boolean. In this case, if n divided by two does not have a remainder then hailstone will execute the value n divided by two. If the first guard statement evaluates to false, we move to the second guard statement *otherwise* which is a alias for True and will always get executed if control flow reaches it. 

### Pairs
We can pair things together nicely like so
```Haskell
q :: (Int, Char)
q = (3,'x')
```
This can nicely get folded into our functions like so
```Haskell
sumPair :: (Int, Int) -> Int
sumPair (x,y) = x + y

main = print (sumPair(3,4))
```
### Lists
Declaring an empty list looks like this
```Haskell
emptyList = []
```
and explicit lists can be declared like this
```Haskell
a = [2,3,4]
```
but often lists are built up from an empty list using the *cons* operator :. Cons takes an element and a list and produces a new list with the element prepended to the front like so
```Haskell
b = 2 : 3 : 4 : []
```
In this scenario, b is now [2,3,4]. We often seen this leveraged in functions
```Haskell
hailstoneSequence :: Integer -> [Integer]
hailstoneSequence 1 = [1]
hailstoneSequence n = n : hailstoneSequence (hailstone n)
```
This will construct a list with the first value being n and the next value being whatever hailstone of n returns. The final value will be 1 as we defined that break case for our recursion. 

Another important aspect of Haskell is how it handles traversing lists. Take a look at this example that computes the length of a list
```Haskell
intListLength :: [Integer] -> Integer
intListLength [] = 0
intListLength (x:xs) = 1 + intListLength xs

main = print (intListLength [1,2,3,4,5])
```
The most important part here is the (x:xs) which acts as a xcons which means x is the first element in the list and xs is the rest of the elements. By continually passing xs to intListLength, we continue to strip values from the list until it is empty where our break case returns zero. Each recursive call returns + 1 to help us get the final count for the lenght of the list. For best practice, since we do no computations with x, we could replace it with an _ in this case making it (_:xs). 

### Lambdas
An alternative to defining functions as equations is to define them as lambdas. Lambda expressions are composed of a pattern for each of the arguments and a body that specifies how the result can be calculated in terms of the arguments. Just like in other langauges, Haskell lambdas are nameless functions. An example of a lambda that takes a single number x as its argument and produces the result x + x would look like:
```Haskell
 \x -> x + x
```
In use, this can look like
```Haskell
(\x -> x + x) 2
```
which would evaluate to 4. Often lambdas are incorporated into other functions like map
```Haskell
main :: IO ()
main = print (map (\x -> x * 2) [1, 2, 3, 4])
```
### Pattern Matching
In Haskell, pattern matching is a powerful feature that allows for the destructuring and matching of values against specific functional patterns, which can greatly simplify code and improve readability. Consider a function to compute the factorial of a value, we could use conditional statements:
```Haskell
factorial :: Int -> Int
factorial n = if n == 0 then 1 else n * factorial (n - 1)
```
This works correctly, but is significantly more challenging to read than this version that uses pattern matching
```Haskell
factorial :: Int -> Int
factorial 0 = 1
factorial n = n * factorial (n - 1)
```
Pattern matching is executed linearly from top to bottom. If the argument zero is passed into the function, it will execute the top option and return one. If we switched these two cases up, factorial 0 = 1 would never execute since it would also match the other option. This is generally the best option for handling stop cases during recursion.

Pattern matching also can take wildcard values which signal to Haskell that we do not care what is passed in there. This can be helpful when handling multiple arguments:
```Haskell
describeList :: [a] -> String
describeList [] = "Empty List"
describeList (_:[]) = "Single element list"
describeList (_,_,_) = "Multiple elements"
```
In the third example, we tell Haskell to ignore the first value in the tuple and just check to see if the second argument might be an empty list. We can use pattern matching to filter out invariants and write clean functions that do not need to worry about certain cases since they were already filtered out during the pattern matching phase. 

### List Comprehension
Generators help Haskell iterate through a list to generate a new list that has been transformed or modified in some way. This is called list comprehension and takes the form

[ expression | generator, filter ]

Expression: Defines what each element in the list will look like
Generator: Specifies how to produce elements
Filter (optional) : Restricts what elements make the final list

Lets build a function that takes a list of numbers and returns a new list where each number has been squared
```Haskell
squares :: [Int] -> [Int]
squares ns = [x * x | x <- xs]
```
This reads for each element x in xs, our new list should insert a new value of x * x. If, lets say, we only want elements in our new list that are even values, we add our filter
```Haskell
evenSquares :: [Int] -> [Int]
evenSquares xs = [x * x | x <- xs, even x]
```
What takes place after the generator and comma is the filter that determines if the first part of our list comprehension (x*x) will get executed for this element. If the filter evalutes to false, then the value is ignored and the generator moves on to the next element. 