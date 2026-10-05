import { useThree, useFrame } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import * as THREE from 'three'

// === START: Inside fishbowl (right side of table, X=4.5), looking through the water ===
const START_POS    = new THREE.Vector3(4.5, -0.9, -7.0)
const START_TARGET = new THREE.Vector3(4.5, -1.3, -11.5)

// === END: Table overview — pulled further back for wider zoomed-out desk view ===
const END_POS    = new THREE.Vector3(0, 11.5, 7.5)
const END_TARGET = new THREE.Vector3(0, -3.5, -9.0)

export default function CinematicCamera() {
  const { camera } = useThree()

  // Scroll progress: 0 = inside fishbowl, 1 = table view
  const scrollProgress = useRef(0)
  // Smooth interpolated progress for buttery animation
  const smoothProgress = useRef(0)

  const currentTarget = useRef(START_TARGET.clone())

  useEffect(() => {
    // Set initial camera position inside the fishbowl
    camera.position.copy(START_POS)
    camera.lookAt(START_TARGET)

    const handleWheel = (e) => {
      // Scroll down = reveal table (increase progress), scroll up = go back inside bowl
      scrollProgress.current = Math.max(0, Math.min(1,
        scrollProgress.current + e.deltaY * 0.0008
      ))
    }

    // Touch support for mobile swipe
    let lastTouchY = null
    const handleTouchStart = (e) => { lastTouchY = e.touches[0].clientY }
    const handleTouchMove = (e) => {
      if (lastTouchY === null) return
      const delta = lastTouchY - e.touches[0].clientY
      scrollProgress.current = Math.max(0, Math.min(1,
        scrollProgress.current + delta * 0.003
      ))
      lastTouchY = e.touches[0].clientY
    }

    window.addEventListener('wheel', handleWheel, { passive: true })
    window.addEventListener('touchstart', handleTouchStart, { passive: true })
    window.addEventListener('touchmove', handleTouchMove, { passive: true })

    return () => {
      window.removeEventListener('wheel', handleWheel)
      window.removeEventListener('touchstart', handleTouchStart)
      window.removeEventListener('touchmove', handleTouchMove)
    }
  }, [camera])

  useFrame(() => {
    // Ease the scroll progress smoothly (exponential ease)
    smoothProgress.current += (scrollProgress.current - smoothProgress.current) * 0.06

    const t = smoothProgress.current

    // Interpolate camera position
    camera.position.lerpVectors(START_POS, END_POS, t)

    // Interpolate look-at target
    currentTarget.current.lerpVectors(START_TARGET, END_TARGET, t)
    camera.lookAt(currentTarget.current)
  })

  return null
}
