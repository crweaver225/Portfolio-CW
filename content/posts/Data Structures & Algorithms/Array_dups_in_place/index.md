---
title: Remove Duplicates from Sorted Array
seo_title: Remove Duplicates from Sorted Array
summary: 
description: 
slug: 
author: Christopher Weaver

draft: false
date: 2024-01-16T07:07:50-05:00
lastmod: 
expiryDate: 
publishDate: 

feature_image: 
feature_image_alt: 

categories:
- Data Structures & Algorithms
tags:
- Data Structures & Algorithms
series:
- Data Structures & Algorithms

toc: true
related: true
social_share: true
newsletter: false
disable_comments: false
---

### Problem 
Given an integer array nums sorted in non-decreasing order, remove the duplicates in-place such that each unique element appears only once. The relative order of the elements should be kept the same. Then return the number of unique elements in nums.

Consider the number of unique elements of nums to be k, to get accepted, you need to do the following things:

Change the array nums such that the first k elements of nums contain the unique elements in the order they were present in nums initially. The remaining elements of nums are not important as well as the size of nums.
Return k.

### Solution

```
class Solution {
public:
    int removeDuplicates(vector<int>& nums) {

        int current_idx = 1;
        
        for (int i = current_idx; i < nums.size(); i++) {
            if (nums[i] != nums[current_idx - 1]) {
                nums[current_idx] = nums[i];
                current_idx ++;
            }
        }
        return current_idx;
    }
};
```
Because we do not care about what exists at the end of the legitimate new vector, we can iterate of this in O(n) to get our solution. We start at index 1 because the first value is always going to be unique. We use current_idx to always track the new index where a new value should be inserted that is unique from the previous value. Once a value of i does not equal the last known legitimate value (current_idx - 1), we can insert into current_idx and increment that index to the new value where we would insert if possible. 
