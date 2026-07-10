---
title: Particle Simulation in Haskell - Part 1
seo_title: Particle Simulation in Haskell
summary: Exploring methods to optimize programs written in Haskell - Part 1
description: 
slug:
author: Christopher Weaver

draft: false
date: 2026-03-09T09:38:32-06:00
lastmod: 2026-03-09T09:38:32-06:00
publishDate: 2026-03-09T09:38:32-06:00

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
What follows is my attempt to simluate 50,000 particles bouncing around in a room at 60 frames per second. This is part 1, setting a minimal working example that in part 2 we will attempt to optimize against. For simplicity, these particles will selectively act like neurtrinos and refrain from interacting with one another. But these will honor walls that keep them bounded within the similation space. The goal is to further work through some optimization techniques that can help improve the runtime performance of our Haskell program. 

For this project, I choose to utilize the [Gloss](https://hackage.haskell.org/package/gloss) framework as my graphics engine. Under the hood it utilizes the famous OpenGL package for highly optimized graphical renderings. Lets start with a naive attempt at this simulation and see what kind of results we might accomplish. 

I start with a modest Particle module to define some basic elements that could be reusable across different simluations attempts
```Haskell
module Particle 
( Particle (..)
, Velocity
, Position 
, Index
, TimeStep
) where

import Linear.V2

type Position = V2 Float
type Velocity = V2 Float
type Index    = Int 
type TimeStep = Float 

data Particle = Particle 
    { index    :: Index
    , position :: Position 
    , velocity :: Velocity
    } deriving (Show)

instance Eq Particle where 
    particleA == particleB = index particleA == index particleB
```
The Linear.V2 library helps store a tuple of floats in an optimized manner with a nice clean api for updating and retrieving our values. I define a Particle record type that will store each particles position and velocity as (x,y) coordinates as well as an index as a unique identifier. Because this is Haskell, we redefine our intrinsic types to types with names we can more easily reason about like Position and Velocity. The meat of our simulation will live in a ParticleBox module
```Haskell
module ParticleBox.ParticleBox where 

import qualified Graphics.Gloss               as GG
import           Graphics.Gloss.Data.ViewPort
import qualified Particle                     as P
import           Linear.V2
import           Linear.Vector

type Model =       [P.Particle]
type Force =        V2 Float
type Acceleration = V2 Float

simulate :: GG.Display -> GG.Color -> Int -> IO()
simulate display color numParticles = do 
    GG.simulate display color 60 (initialModel numParticles) render update

initialModel :: Int -> Model 
initialModel numParticles = [ P.Particle 1 (V2 0 0) (V2 vx vy) | i <- [0 .. numParticles - 1],
                                                                   let vx = cos particleAngle
                                                                       vy = sin particleAngle
                                                                       particleAngle = fromIntegral i * 0.01]
render :: Model -> GG.Picture 
render = GG.pictures . (:) drawWalls . fmap drawParticle 

drawWalls :: GG.Picture
drawWalls = GG.lineLoop $ GG.rectanglePath (toPixels aLength) (toPixels bLength)

drawParticle :: P.Particle -> GG.Picture 
drawParticle (P.Particle _ (V2 x y) _) = 
    GG.translate x' y' $ color (GG.circleSolid $ toPixels dotSize)
    where 
        x'    = toPixels x 
        y'    = toPixels y 
        color = GG.color (GG.withAlpha 0.6 GG.blue)
    
update :: ViewPort -> P.TimeStep -> Model -> Model
update _ dt particles = map updateParticle particles
  where
    updateParticle particle@(P.Particle idx pos vel) = 
        let pos' = pos + vel' ^* dt
            vel' = vel * (boundaryCondition particle)
        in P.Particle idx pos' vel'

toPixels :: Float -> Float 
toPixels = (* 100.0)

dotSize :: Float 
dotSize = 0.025

aLength :: Float
aLength = 3.0

bLength :: Float
bLength = 3.0

boundaryCondition :: P.Particle -> V2 Float 
boundaryCondition (P.Particle _ (V2 x y) _)
    | (x' > aLength / 2) && (y' > bLength / 2) = V2 (-1) (-1)
    | x' > aLength / 2                         = V2 (-1) 1
    | y' > bLength / 2                         = V2 1 (-1)
    | otherwise                                = V2 1 1
    where 
        x' = (abs x) + dotSize
        y' = (abs y) + dotSize
```
A quick synopsis of what each discrete part in here does. We define our model which is just a list of the Particles we talked about earlier. This model is the foundational piece to our simulation as it keeps track of the state of our simluation. We modify each particle in it based on its position, velocity, and time passed and then reference this model to determine where to draw each particle on the screen. The simulate function is our exposed api to our simluation that Main.hs will call to kick things off. It generates the initial model and passed both our render and update function to the Gloss library so that it can animate our simluation on device for users to see. The number 60 passed into the function is worth an additional callout, as this is the targeted frames per second we are asking Gloss to try and operate at. 60 frames per second is the industry standard target for smooth animation. initialModel generates a list of Particles each with a starting point in the middle of the screen, but given a unique trajectory that results in particles moving outward from the center equidistant from the origin.
```Haskell
initialModel :: Int -> Model 
initialModel numParticles = [ P.Particle 1 (V2 0 0) (V2 vx vy) | i <- [0 .. numParticles - 1],
                                                                   let vx = cos particleAngle
                                                                       vy = sin particleAngle
                                                                       particleAngle = fromIntegral i * 0.01]
```
At certain increments, Gloss will call our update function with the model so that we can update the new position for each particle within that model. Applying the updateParticle function to each particle allows us to both modify the position based on its previous position, trajectory, and time passed. dt comes from Gloss and tells us how long it has been since the last time we updated the model, the ^* operator on dt just allows us to modify both x and y at the same time. This function also allows us to check and see if our particle has hit a wall. If it has, we need to modify its trajectory to act as if it "bounced" off that wall. 
```Haskell
update :: ViewPort -> P.TimeStep -> Model -> Model
update _ dt particles = map updateParticle particles
  where
    updateParticle particle@(P.Particle idx pos vel) = 
        let pos' = pos + vel' ^* dt
            vel' = vel * (boundaryCondition particle)
        in P.Particle idx pos' vel'

boundaryCondition :: P.Particle -> V2 Float 
boundaryCondition (P.Particle _ (V2 x y) _)
    | (x' > aLength / 2) && (y' > bLength / 2) = V2 (-1) (-1)
    | x' > aLength / 2                         = V2 (-1) 1
    | y' > bLength / 2                         = V2 1 (-1)
    | otherwise                                = V2 1 1
    where 
        x' = (abs x) + dotSize
        y' = (abs y) + dotSize
```
boundaryCondition pattern matches the existing position against the predermined size of the box the particles are meant to be in and will inverse its trajectory if the position surpasses the boundary. The render function takes the model and places it on the screen based on its position.

Ok enough talk, lets see our simulation in action. I generate a cabal project and call my module from main
```Haskell
module Main where

import qualified Graphics.Gloss as GG
import qualified ParticleBox.ParticleBox as PB

main :: IO ()
main = 
    PB.simulate 
        (GG.InWindow "Particle Simulator" (400, 400) (100, 100)) 
        GG.white 
        1000
```
<video width="350" controls>
  <source src="attempt1.mov" type="video/mp4">
</video>

Looks great for 1000 particles. Lets try with 50,000 particles

<video width="350" controls>
  <source src="attempt2-50000.mp4" type="video/mp4">
</video>

Here things already look jittery and lack the smoothness in animation that we likely desire. Unfortunatley, it is difficult to get a good idea on how well or poorly our simulation performs without some sort of metric. Lets make some modifications so that we render the frames per second on screen. As mentioned earlier, we are targeting 60 frames per second for a nice clean, smooth animation. Doing this in Haskell though is a little bit more tricky than it would be in other programming languages. That is because Haskell is by default a pure functional programming langauge that forces us to jump through hoops to have state. Calculating the frames per second involves tracking how many times an animation renders over a period of time. Maintaining a metric over time is by its very nature *state*, and Haskell requires extra care be taken here. To accomplisht his, we are going to add an IORef to our ParticleBox module. An IORef allows us to place stateful data within a contained box that we can explicitly read and write to from our simulation. Our new stateful data type will be called RenderState
```Haskell
data RenderState = RenderState 
    { lastRenderTime :: UTCTime
    , visualFPS      :: Double 
    }
```
Now our simluate function needs to instantiate this data type, wrap it in an IORef and pass it to Gloss as function argument to our render routine
```Haskell
simulate :: GG.Display -> GG.Color -> Int -> IO()
simulate display color numParticles = do 
    now <- getCurrentTime
    renderStateRef <- newIORef (RenderState now 0)
    GG.simulateIO display color 60 (initialModel numParticles) (render renderStateRef) update
```
Our Render function will now need to take the IORef, read from it to compute what our current frames per second value is, render text on the screen informing the user of this value, and then update the IORef for the next time render gets called. Calling readIORef gives us this current state and allows us to compute the difference in time between now and the last time render was called. writeIORef is called to modify the state with the current time and our new computed frames per second. 
```Haskell
render :: IORef RenderState -> Model -> IO GG.Picture
render ref model = do
    now <- getCurrentTime

    RenderState lastTime fpsPrev <- readIORef ref

    let dt = realToFrac (diffUTCTime now lastTime)
        fpsInstant = if dt > 0 then 1 / dt else 0

        alpha = 0.1
        fpsSmoothed = (1 - alpha) * fpsPrev + alpha * fpsInstant

    writeIORef ref (RenderState now fpsSmoothed)

    return $ GG.pictures $
        drawWalls
        : drawFPS fpsSmoothed
        : fmap drawParticle (particles model)
```
Finally we will need a new function that renders the text on the screen that our render function can call with our computed frames per second value
```Haskell
drawFPS :: Double -> GG.Picture
drawFPS fps =
  GG.translate (-200) 260 $
    GG.scale 0.1 0.1 $
      GG.color GG.black $
        GG.text ("FPS: " ++ show (round fps))
```
It is worth noting that, unfortunately, in order to make this work we need to remove purity from both our update and render function as they both need to return IO of some sort now. Not a big deal, certainly will not have much of a performance impact on our simulation, but it is something that should be refrained from doing in Haskell until required just for the sake of referential transparency. 

<video width="350" controls>
  <source src="attempt3-fps.mp4" type="video/mp4">
</video>

Now we can see how many frames per second our simulation is rendering at on the top left corner. Here are some of the initial numbers I was seeing while running on a 2020 m1 macbook pro:

- 1000 particles: 60 fps
- 10000 particles: 14 fps
- 50000 particles: 2 fps

We now officially have our baseline that we can optimize against. 