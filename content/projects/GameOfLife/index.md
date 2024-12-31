---
title: Conways Game of Life
seo_title: Conways Game of Life
summary: The Game of Life, also known as Conway's Game of Life or simply Life, is a cellular automaton devised by the British mathematician John Horton Conway in 1970.
description: The game is played on a grid of square cells, where each cell is either alive or dead. The cells interact with their eight neighbors, which are the cells that are adjacent to them horizontally, vertically, or diagonally.

slug: Rust Game of Life
author: Christopher Weaver

draft: false
date: 2024-12-10T03:52:30-05:00
publishDate: 2024-12-10T03:52:30-05:00

project types: 
    - Personal

techstack:
    - Rust
    - ggez
live_url: https://github.com/crweaver225/Conways-Game-of-Life/tree/main
source_url: https://github.com/crweaver225/Conways-Game-of-Life/tree/main
---

# Conways Game of Life

<img src="ConwaysGameOfLife.mov" width="350em">

### Built in Rust 

#### Description
The rules for Conway's Game of Life are:

- Birth: A dead cell becomes alive if it has exactly three live neighbors
- Death by isolation: A live cell dies if it has one or fewer live neighbors
- Death by overcrowding: A live cell dies if it has four or more live neighbors
- Survival: A live cell survives if it has two or three live neighbors 

The game is played on a grid of square cells, where each cell is either alive or dead. The cells interact with their eight neighbors, which are the cells that are adjacent to them horizontally, vertically, or diagonally. 

To play, you start by clicking on dead (empty) cells to make them alive (black). When the grid is to your liking, click the space bar to start or pause the game. Clicking the up arrow on your keyboard will speed up the game. Clicking the down arrow on your keyboad will slow down the game. 

#### Dependencies
- ggez