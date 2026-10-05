import { useRef, useMemo, useState, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js'
import * as THREE from 'three'

export default function HeroJellyfish() {
  const groupRef    = useRef()
  const startTime   = useRef(null)
  const scrollOut   = useRef(0)   // 0 = visible, 1 = scrolled away

  // Track scroll to fade out with the hero text
  useEffect(() => {
    const handleWheel = (e) => {
      scrollOut.current = Math.min(1, scrollOut.current + Math.abs(e.deltaY) / 400)
    }
    window.addEventListener('wheel', handleWheel, { passive: true })
    return () => window.removeEventListener('wheel', handleWheel)
  }, [])

  const { scene } = useGLTF('/spiral_ribbon_jelly_fish_3d_model.glb')

  // Clone + apply bioluminescent cyan-pink hero material
  const clonedScene = useMemo(() => {
    const clone = SkeletonUtils.clone(scene)
    clone.traverse((child) => {
      if (child.isMesh && child.material) {
        child.material = child.material.clone()
        child.material.transparent  = true
        child.material.opacity      = 0.72
        child.material.side         = THREE.DoubleSide
        child.material.roughness    = 0.1
        child.material.metalness    = 0.05
        child.material.depthWrite   = false
        child.material.emissive     = new THREE.Color('#a0e8ff')
        child.material.emissiveIntensity = 1.8
      }
    })
    return clone
  }, [scene])

  // Normalize model size to a fixed display radius
  const sizeScale = useMemo(() => {
    const box = new THREE.Box3().setFromObject(scene)
    const size = new THREE.Vector3()
    box.getSize(size)
    const maxDim = Math.max(size.x, size.y, size.z)
    return maxDim > 0 ? 1 / maxDim : 1
  }, [scene])

  useFrame((state) => {
    if (!groupRef.current) return

    // Initialise start time on first frame
    if (startTime.current === null) startTime.current = state.clock.getElapsedTime()
    const elapsed = state.clock.getElapsedTime() - startTime.current

    // ── RISE ANIMATION ────────────────────────────────────────────────────
    // Duration 3.2s: rise from Y=-10 (below screen) to Y=2 (screen centre)
    const riseDuration = 3.2
    const riseT        = Math.min(elapsed / riseDuration, 1)
    // Ease-out cubic for a graceful deceleration at the top
    const eased        = 1 - Math.pow(1 - riseT, 3)
    const riseY        = -10 + eased * 12   // -10 → 2

    // ── IDLE FLOAT AFTER ARRIVAL ──────────────────────────────────────────
    const floatY = riseT >= 1
      ? Math.sin(state.clock.getElapsedTime() * 0.8) * 0.3
      : 0

    // ── GENTLE PULSE ROTATION ─────────────────────────────────────────────
    groupRef.current.rotation.y = state.clock.getElapsedTime() * 0.25

    // ── SCROLL FADE-OUT ───────────────────────────────────────────────────
    const fadeOpacity = 1 - scrollOut.current
    groupRef.current.traverse((child) => {
      if (child.isMesh && child.material) {
        child.material.opacity = 0.72 * fadeOpacity
      }
    })
    groupRef.current.visible = fadeOpacity > 0.01

    // Apply final Y position
    groupRef.current.position.set(0, riseY + floatY, 0)
  })

  // Hero jellyfish displayed at scale 0.45 of normalised size inside fishbowl group
  const finalScale = sizeScale * 0.45

  return (
    <group ref={groupRef} position={[0, -10, 0]}>
      <primitive object={clonedScene} scale={[finalScale, finalScale, finalScale]} />
    </group>
  )
}

useGLTF.preload('/spiral_ribbon_jelly_fish_3d_model.glb')
