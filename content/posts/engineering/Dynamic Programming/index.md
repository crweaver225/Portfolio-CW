---
title: Dynamic Programming
seo_title: Dynamic Programming
summary: 
description: 
slug: Dynamic Programming
author: Christopher Weaver

draft: false
date: 2024-02-21T07:07:50-05:00
lastmod: 2024-02-21T07:07:50-05:00
publishDate: 2024-02-21T07:07:50-05:00

feature_image: 
feature_image_alt: 

categories:
- Data Structures & Algorithms
- Engineering
tags:
- Data Structures & Algorithms
- Engineering
series:
- Data Structures & Algorithms
- Engineering

toc: true
related: true
social_share: true
newsletter: false
disable_comments: false
---

Dynamic programming is a method for solving complex problems by breaking them down into simpler subproblems and solving each subproblem only once. It's typically used when a problem has overlapping subproblems and optimal substructure, meaning that the solution to a larger problem can be constructed from the solutions of its smaller subproblems.

In dynamic programming, solutions to subproblems are stored in memory so that they can be reused when needed, which avoids redundant computation. This makes dynamic programming particularly useful for optimization problems and problems involving optimization of some value, where the solution involves making a sequence of decisions. Some people will differentiate dynamic programming from memoization (such as storing fibonacci results as you break the bigger problem into smaller subproblems until you get to the smallest) and say dynamic programming is only bottom up (starting at the smallest subproblem and working your way up). I consider both bottom up and top down to be dynamic programming. 

Let us consider this further with an example problem:
```
You are given an integer array coins representing coins of different denominations and an integer amount representing a total amount of money.

Return the fewest number of coins that you need to make up that amount. If that amount of money cannot be made up by any combination of the coins, return -1.

You may assume that you have an infinite number of each kind of coin.
```
So there are a bunch of different ways to solve this, but in this instance we are going to consider how to using dynamic programming to solve it. Again, dynamic programming is about solving subproblems until the larger solution is revealed. In this problem our sub-problem can be defined as *what is the minimal number of coins needed to represent all denominations up to the integer amount of money in the problem (1,2,3,4..)*. In other words, if given an array of coins and an integer value of 5, we will look to see the minimal amount of coins required to match 1 and 2 and 3 and 4 before we do 5. This is a bottom up approach that is more efficient than it initially sounds considering we can reference back to computations already done. 

Lets assume the amount is 6 and we are given the coins [1,2,5]. The first step is to generate a vector that represents all the solutions for 0 up to 6
```
{0, INT_MAX, INT_MAX, INT_MAX, INT_MAX, INT_MAX, INT_MAX}
```
We now loop 1 through 6 representing each index in this array. For each index, we will have an inside loop that will loop through all coins in the array. We need to compute all combinations of coins that add up to 1 and pick the smallest. For any coin less than the target of 1, see if the *target - coin* has already been solved. In this case only the one will be:

target<1> - coin<1> == 0 (when we equal zero than we know we have a match). Our vector will now look like this:
```
{0, 1, INT_MAX, INT_MAX, INT_MAX, INT_MAX, INT_MAX}
```
We next move to 2. We compute target<2> - coin<1> = vector<1> == 1. Which means it takes one coin plus the solution we found at 2 - 1. The answer is 2. But we need to continue to loop through the coins list to find out if this is the optimal solution. We next try target<2> - coin<2> = vector<0> == 0. In this case the one coin for 2 + the solution at vector<0> 0 equals only 1 coin being used. This is the optimal solution for the vector index 2. 
```
{0, 1, 1, INT_MAX, INT_MAX, INT_MAX, INT_MAX}
```
We continue this until we get to the final target value. The code looks like this:
```C++
int coinChange(vector<int>& coins, int amount) {
        vector<int> dp(amount + 1, INT_MAX);
        dp[0] = 0;
        sort(coins.begin(), coins.end());
        for (int i = 1; i <= amount; i++) {
            for (int c : coins) {
                if (i - c < 0) { break; }
                if (dp[i - c] != INT_MAX) {
                    dp[i] = min(dp[i - c] + 1, dp[i]);
                }
            }
        }
        return dp[amount] == INT_MAX ? -1 : dp[amount];
    }
```

Lets try another problem. This one is called Rod Cutting:

Given a rod of length n and a list of rod prices where each index represents the size of a rod cut and each value the price for that cut, find the optimial way to cut the rod into smaller rods to maximize profit:

price[] = [1, 5, 8, 9, 10, 17, 17, 20]   

Rod length: 4    
Best: Cut the rod into two pieces of length 2 each to gain revenue of 5 + 5 = 10 

```
 Cut           Profit 
 4                9 
 1, 3            (1 + 8) = 9 
 2, 2            (5 + 5) = 10 
 3, 1            (8 + 1) = 9 
 1, 1, 2         (1 + 1 + 5) = 7 
 1, 2, 1         (1 + 5 + 1) = 7 
 2, 1, 1         (5 + 1 + 1) = 7 
 1, 1, 1, 1      (1 + 1 + 1 + 1) = 4
 ```

As we begin to cut the pipe down into smaller pieces we then need to consider how to handle these smaller pieces (should they be further cut down?). These are our sub problems that if first solved bottom up means they are only ever computed once and a solution should be available by the time we consider not making a cut at all... 

To solve sub problems first, we start with a rod length of 1, then we will loop through all possible cuts on that length and compute the maximum prices. So first we would get:

n = 1, we can make a cut at 1 with a price = 1. We store this price:

T[1] = max(1, T[0])

That is all the cuts we can make at 1. Next lets consider a rod of size 2:

n = 2, we can make a cut at 1 with a price = 1. This leaves 1 left on the rod which we already computed and stored in T. We can set:

T[2] = max(1 + T[1], T[2])

Now we see what happens if we have a cut of 2 from the rod (meaning we make no cut), price = 5 and set:

T[2] = max(5 + T[0], T[2])

Here we compute that the most optimal price we get when a rod is of size 2 will be to not cut it and get a price of 5. This value is stored in the T array and usable as we continue to scale up our rod size to what was originally asked for in the question. The entire code can be found here:

```C++
int rodCut(int price[], int n) {
    // `T[i]` stores the maximum profit achieved from a rod of length `i`
    int T[n + 1];
 
    // initialize maximum profit to 0
    for (int i = 0; i <= n; i++) {
        T[i] = 0;
    }
 
    // consider a rod of length `i`
    for (int i = 1; i <= n; i++) {
        // divide the rod of length `i` into two rods of length `j`
        // and `i-j` each and take maximum
        for (int j = 1; j <= i; j++) {
            T[i] = max(T[i], price[j - 1] + T[i - j]);
        }
    }
 
    // `T[n]` stores the maximum profit achieved from a rod of length `n`
    return T[n];
}
```
As a rule of thumb, whenever I come across a problem that seems to be a good fit for recursion, I also check to see if dynamic programming can help alleviate the quadratic runtime recursion often produces. But beyond that, dynamic programming can clear up the problem we are trying to tackle in our head. I find there is an initial cognitive cost to thinking through a dynamic programming solution but this initial extra work pays off in the long run as things start to come together. Solving smaller sub-problems is an easier cognitive task and can be rather intuitive to program once a strategy is settled in your head. 