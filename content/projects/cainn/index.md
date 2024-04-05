---
title: C.A.I.N.N.
seo_title: C.A.I.N.N.
summary: C.A.I.N.N. (Christopher's Artifically Intelligent Neural Network) is a machine learning framework built in native C++ with a Python wrapper around it.
description: C.A.I.N.N. (Christopher's Artifically Intelligent Neural Network) is a machine learning framework built in native C++ with a Python wrapper around it. 
slug: portfolio-project-1
author: John Doe

draft: false
date: 2019-02-20T03:52:30-05:00
lastmod: 
expiryDate: 
publishDate: 

feature_image: cainn.png
feature_image_alt:
    - C++
    - Machine Learning

project types: 
    - Personal

techstack:
    - C++
    - Python
    - CMake
    - Deep Learning
live_url: https://youtu.be/NM_xdVMel8U
source_url: https://github.com/crweaver225/CAINN
---

## About
This project is designed to be a neural network trainer inspired by Tensorflow and Keras. The project exists as an external library coded in c++ to be performant and efficient. CAINN will do the following:
- Graph a neural network to user specifications
- Train the neural network using stochastic gradient descent
- Execute the neural network
- Save the neural network in JSON format

A demo of the project in action can be found here:
https://youtu.be/NM_xdVMel8U

### Requirements to run
- Python 3.0 or higher
- Cmake (https://cmake.org/install/)

This project must be compiled to run by following these steps. 

- Create a "build" directory within the CAINN directory and CD into it
- within the build directory, run cmake ..
- within the build directory, run make

After that, you should be compiled and ready to run. This project does utilize one third party dependency, nlohmann/json. Cmake will automatically download and install this dependency when running the steps above in a way that is cross-platform compliant.

## Example
The library can be accessed using Python 3.0 or higher. Just import the library like so:
```
from Neural_Network import Neural_Network
from Neural_Network import Activation_Function
from Neural_Network import Loss
```

Once imported, a network can be setup to train as simply as this:
```
nn = Neural_Network()
nn.add_input_layer([1])
nn.add_fully_connected_layer(20, Activation_Function.Sigmoid)
nn.add_fully_connected_layer(40, Activation_Function.Relu)
nn.add_fully_connected_layer(10, Activation_Function.Relu)
nn.add_output_layer(1, Activation_Function.Relu)
nn.build()
nn.setLearningRate(0.01)
```
Training the network is then as simple as calling this function. The four parameters are:
- the training examples
- the training targets
- the mini batch size
- how many iterations
- the loss function
```
nn.train(train_data,train_results, 10 ,500, Loss.MSE)
```

## Other features
by setting the neural networks file path, you can either call on the network to be saved at anytime
```
nn.set_filepath('temp-net.json')
nn.save_network()
```
You can add a dropout layer to your network to help ensure a more robust training process. The layer will turn off a percentage of neurons from the previous layer to itself. The layer takes one argument which is a float representing the percentage of neurons to randomly turn off per iteration. 
```
nn.add_dropout_layer(0.2)
```
An embedding layer can help turn sparse input into dense vector representations that are far more effcient for the neural network to handle. Generally these are seen with natural language processing. An embedding layer can be added by passing in the number of possible inputs, and the output size of the network. The layer will be able to figure out the rest on its own when the build() function is called. 
```
nn.add_embedding_layer(len(input_size), 100)
```
or you can tell the network to save after any iteration where the loss is less than previous iterations.
```
nn.save_best_automatically(True)
```
In order to track the progress of your training, you can set how often the network outputs the loss of any given iteration
```
nn.print_loss_every_iterations(100)
```
You can at anytime load an old network by calling this function with the correct file path
```
nn.load_network('temp-net.json')
```
After loading or training a network, you can then execute your network at any time with input of the same dimension as was used during the initial building of the network.
```
result = nn.execute([5.0])
```
To help ensure the network does not learn a pattern within your training data and better generalizes, you can set the following flag to true to get the network to shuffle the training data after each epoch.
```
nn.shuffle_training_data(True)
```

## Supported types

### This project currently supports these layers
- Input layer
    - add_input_layer()
- Fully connected layer
    - add_fully_connected_layer()
- Output layer
    - add_output_layer()
- Dropout layer
    add_dropout_layer()
- Embedding layer
    add_embedding_layer()
- Flatten Layer
    add_flatten_layer()
	

### This project currently supports five types of activation functions
- Sigmoid
- Relu
- Leaky Relu
- Pass
- Softmax

### This project currently supports three kinds of loss fuctions
- Mean squared error
    Loss.MSE
- Mean Absolute error
    Loss.ASE
- Cross Entropy
    Loss.CrossEntropy

## Highlights
- Utilizes multi-threading for speed and efficiency.
- A clean and simple pythonic interface
- Memory efficient 
- Modern C++ memory management practices 
- Stores networks in JSON which is widely adaptable to most enviornments for use