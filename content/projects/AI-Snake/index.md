---
title: AI Snake Agent
seo_title: AI Snake Agent
summary: Using my Console Game Engine, this is a reinforcement learning project using the C++ Pytorch framework to train a neural network to play the classic arcade game Snake. 
description: Using my Console Game Engine, this is a reinforcement learning project using the C++ Pytorch framework to train a neural network to play the classic arcade game Snake. Both the Snake game and its and the AI agent that power it are built in C++ using the NCurses library and Pytorch for the artificial neural network. 
slug: AI Snake Agent
author: Christopher Weaver

draft: false
date: 2024-5-9T13:54:46-06:00
publishDate: 2024-5-9T13:54:46-06:00

project types: 
- personal

techstack:
- C++
- Ncurses
- LibTorch

live_url: https://youtu.be/1wsHiSgqyq4
source_url: https://github.com/crweaver225/ConsoleGameEngine

newsletter: false
---

# AI Snake Agent
![video](AI-snake.mov)

### About
Using the Console Game Engine I built [here](https://www.christopher-weaver.com/projects/consolegameengine/), the game of Snake can both be played by a human using the keyboard, or by an AI agent.

Snake is a classic arcade game where a user navigates a virtual snake an attempt to each as much fruit as possible. The game uses the ← ↑ → ↓ buttons on the keyboard to control the snakes movement. The snake body grows with each piece of fruit that it eats. A user loses by navigating off the screen or eatting its own body. 

### AI Mode
This game supports training an AI snake agent to play that game instead of a human player. This requires the libtorch library. When initializing the Snake game, pass true for the AI constructor parameter. The model will automatically save to the local project as it trains. Pass false as the second constructor parameter if you are happy with the model and wish for it to no longer train. 

```
Snake snake = Snake(/*AI=*/true, /*train=*/ false);
```
The model uses reinforcement learning to train, awarding 10 points when it eats a fruit and negates 10 points when it goes out of bounds or eats its own tail. The model does a training iteration after each move and also does a final iteration of all moves during the game after they agent loses. 

The default model has three layers:
- Input of 11 values (all default 0, and 1 if the value should be true):
  - index 0: is the snake moving up
  - index 1: is the snake moving right
  - index 2: is the snake moving down
  - index 3: is the snake moving left
  
  - index 4: is there danger to the left of the snake
  - index 5: is there danger straight of the snake
  - index 6 : is there danger to the right of the snake

  - index 7: is the fruit up from the snake
  - index 8: is the fruit right from the snake
  - index 9: is the fruit down from the snake
  - index 10: is the fruit left of the snake
- A hidden layer with 256 parameters
- An output layer with three values (the max value is the decided snake movement)
  - index 0: turn left
  - index 1: go straight
  - index 2: turn right

From my experience, the model takes about 200-250 games before it really starts to play well. But modifying the model, the learning rate, gamma, or reward system might change this. 

### Requirements
- C++ 17 or higher
- CMake
- LibTorch v. 2.4.0
- libomp