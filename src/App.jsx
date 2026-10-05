import { useState, useRef, Suspense } from 'react'
import * as THREE from 'three'
import { Caustics } from '@react-three/drei'
import AquariumStage from './components/AquariumStage'
import SchoolOfFish from './components/SchoolOfFish'
import Decorations from './components/Decorations'
import Bubbles from './components/Bubbles'
import Food from './components/Food'
import Fishbowl from './components/Fishbowl'
import CinematicCamera from './components/CinematicCamera'
import GodRays from './components/GodRays'
import MarineSnow from './components/MarineSnow'
import JellyfishSchool from './components/Jellyfish'
import HeroText from './components/HeroText'
import StudyTable from './components/StudyTable'
import HeroJellyfish from './components/HeroJellyfish'
import './App.css'

export default function App() {
  // Shared ref for high-performance coordinate lookup by fish boids
  const foodRef = useRef([])



  // State for rendering foods in React
  const [foods, setFoods] = useState([])

  // Add a food item at a specific location
  const handleAddFood = (position) => {
    const foodId = Date.now() + Math.random()
    const newFood = {
      id: foodId,
      initialPosition: position
    }

    // Update React rendering list
    setFoods((prev) => [...prev, newFood])

    // Update shared mutable coordinates list for fish detection
    foodRef.current.push({
      id: foodId,
      position: new THREE.Vector3(...position)
    })
  }

  // Remove food when eaten or hits bottom
  const handleEatFood = (id) => {
    // Remove from rendering state
    setFoods((prev) => prev.filter((food) => food.id !== id))
    // Remove from shared position lookup ref
    foodRef.current = foodRef.current.filter((food) => food.id !== id)
  }

  return (
    <div className="app-container">
      {/* 3D WebGL Canvas Layer wrapped in AquariumStage */}
      <div className="canvas-wrapper">
        <AquariumStage>
          {/* Scale the entire fishbowl + contents together */}
          <group scale={0.35} position={[4.5, -1.20, -9.0]}>
            {/* Spherical glass fishbowl boundary enclosing the scene */}
            <Fishbowl />

            {/* Volumetric God Rays (Sun Shafts) and Marine Snow Particles */}
            <GodRays />
            <MarineSnow count={400} />

            {/* Projected light caustics on the aquatic ecosystem */}
            <Caustics
              color="#e0f7fa"
              position={[0, 1.95, 0]}
              lightSource={[5, 10, 5]}
              intensity={1.8}
              worldLimit={8.0}
              backfaces
            >
              {/* School of Tuna Fish */}
              <SchoolOfFish />

              {/* Volumetric Glowing Jellyfish School */}
              <JellyfishSchool />

              {/* Substrate, Seaweed, and Rocks */}
              <Suspense fallback={null}>
                <Decorations />
              </Suspense>
            </Caustics>

            {/* Dynamic bubble system */}
            <Bubbles count={120} />

            {/* Hero jellyfish — rises through the welcome text on page load */}
            <HeroJellyfish />

            {/* Sinking Food Flakes */}
            <Food foods={foods} foodRef={foodRef} onEaten={handleEatFood} />

            {/* Invisible Click Detector */}
            <mesh 
              rotation={[-Math.PI / 2, 0, 0]} 
              position={[0, 2.0, 0]} 
              onClick={(e) => {
                e.stopPropagation()
                const distSq = e.point.x * e.point.x + e.point.z * e.point.z
                if (distSq < 7.6 * 7.6) {
                  handleAddFood([e.point.x, 1.95, e.point.z])
                }
              }}
              visible={false}
            >
              <planeGeometry args={[20, 20]} />
              <meshBasicMaterial transparent opacity={0.0} />
            </mesh>
          </group>

          {/* Study table — positioned to match scaled bowl bottom (8.02 * 0.5 = 4.01) */}
          <StudyTable />

          {/* Free orbit camera controls */}
          <CinematicCamera />
        </AquariumStage>
      </div>

      {/* Hero text overlay — fades out on scroll */}
      <HeroText />
    </div>
  )
}
