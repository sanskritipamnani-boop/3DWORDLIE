import { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js'
import * as THREE from 'three'

// Helper to determine height of sand cap inside Fish.jsx
const getSandHeight = (x, z) => {
  const r = 7.95
  const distSq = x * x + z * z
  if (distSq >= r * r) return -5.3
  return -Math.sqrt(r * r - distSq)
}

export default function Fish({ initialX = 0, speed = 1, color = 'orange', startFromRight = false }) {
  const fishRef = useRef()
  const modelRef = useRef()
  const mixerRef = useRef()
  const initializedRef = useRef(false)

  // Load clown fish GLB model and animations
  const { scene, animations } = useGLTF('/clown_fish.glb')

  const originalFish = scene

  // Clone the scene for this specific instance using SkeletonUtils
  const clonedScene = useMemo(() => {
    if (!originalFish) return null
    const clone = SkeletonUtils.clone(originalFish)
    
    // Tint color from prop
    const baseColor = new THREE.Color(color)
    const tintColor = baseColor.clone().lerp(new THREE.Color('#ffffff'), 0.15)

    clone.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true
        child.receiveShadow = true
        
        if (child.material) {
          child.material = child.material.clone()
          child.material.color.copy(tintColor)
          if (child.material.roughness !== undefined) {
            child.material.roughness = 0.5
          }

          // Desaturate texture/diffuse color in shader before lighting to prevent blown-out highlights
          child.material.onBeforeCompile = (shader) => {
            shader.fragmentShader = shader.fragmentShader.replace(
              '#include <map_fragment>',
              `
              #include <map_fragment>
              // Mix in grayscale to lower saturation and prevent overexposure under bright lights
              float luma = dot(diffuseColor.rgb, vec3(0.299, 0.587, 0.114));
              vec3 grayColor = vec3(luma);
              diffuseColor.rgb = mix(diffuseColor.rgb, grayColor, 0.45);
              `
            )
          }
        }
      }
    })
    return clone
  }, [originalFish, color])

  // Setup animations on the cloned scene
  useEffect(() => {
    if (clonedScene && animations && animations.length > 0) {
      const mixer = new THREE.AnimationMixer(clonedScene)
      mixerRef.current = mixer

      const clip = animations.find(c => c.name.includes('animate') || c.name.includes('preview')) || animations[0]
      const action = mixer.clipAction(clip)
      action.play()

      return () => {
        mixer.stopAllAction()
        mixerRef.current = null
      }
    }
  }, [clonedScene, animations])

  // Generate size variations and base scale factor using hardcoded model max dimension (88.14)
  const sizeScale = useMemo(() => {
    const maxDim = 88.14
    const baseScale = 1.0 / maxDim
    
    let hash = 0
    const str = String(initialX)
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash)
    }
    const randValue = Math.abs(Math.sin(hash))
    const randScale = 0.38 + randValue * 0.27
    return baseScale * randScale
  }, [initialX])

  // Derive unique offset factors for this fish
  const fishOffsets = useMemo(() => {
    let hash = 0
    const str = String(initialX)
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash)
    }
    const rand1 = Math.abs(Math.sin(hash))
    const rand2 = Math.abs(Math.cos(hash))
    
    return {
      phase: rand1 * Math.PI * 2 + (startFromRight ? Math.PI : 0),
      initialY: -2.4 + (rand1 - 0.5) * 2.2, // Lower vertical center, wider spread
      initialZ: (rand2 - 0.5) * 3.4,        // Expanded depth separation (front/back)
      speedModifier: 0.25 + rand1 * 0.45     // Larger speed variation to prevent clumping
    }
  }, [initialX, startFromRight])

  useFrame((r3fState, delta) => {
    if (!fishRef.current || !clonedScene) return

    const dt = Math.min(delta, 0.05)
    
    // Time traversal synced to clock and unique speeds
    const time = r3fState.clock.getElapsedTime() * fishOffsets.speedModifier * speed * 0.85
    const t = time + fishOffsets.phase

    // 1. Original Tuna X movement math (expanded to X = [-5.2, 5.2] sweep)
    const posX = Math.sin(t) * 5.2

    // 2. Original Tuna Bobbing & Vertical Layout
    let posY = fishOffsets.initialY + Math.cos(t * 2.0) * 0.35

    // Enforce strict vertical boundary check (middle 60-70% height)
    const sandY = getSandHeight(posX, fishOffsets.initialZ)
    if (posY < sandY + 0.65) {
      posY = sandY + 0.65
    }
    posY = THREE.MathUtils.clamp(posY, -3.9, -0.6)

    // Position the fish group (keeps Z static in its own plane to prevent perspective jitter)
    fishRef.current.position.set(posX, posY, fishOffsets.initialZ)

    // 3. Horizontal Direction (dx) represents velocity direction along X-axis
    const dx = Math.cos(t)

    // 4. Smooth Y-rotation (facing left/right)
    // When swimming right (dx > 0), rotation is Math.PI / 2. When swimming left (dx < 0), rotation is -Math.PI / 2.
    const targetRotY = dx > 0 ? Math.PI / 2 : -Math.PI / 2
    let diff = targetRotY - fishRef.current.rotation.y
    diff = Math.atan2(Math.sin(diff), Math.cos(diff))
    
    if (!initializedRef.current) {
      fishRef.current.rotation.y = targetRotY
      initializedRef.current = true
    } else {
      fishRef.current.rotation.y += diff * 0.05 * (dt * 60)
    }
    // Clear pitch/roll rotations so they stay horizontal
    fishRef.current.rotation.x = 0
    fishRef.current.rotation.z = 0

    // 5. Update skeletal animations
    if (mixerRef.current) {
      mixerRef.current.update(dt)
      // Sync animation playback speed to horizontal velocity
      const speedRatio = THREE.MathUtils.clamp(Math.abs(dx), 0.3, 1.8)
      mixerRef.current.timeScale = THREE.MathUtils.lerp(
        mixerRef.current.timeScale,
        speedRatio * 0.9,
        0.1
      )
    }
  })

  if (!clonedScene) return null

  return (
    <group ref={fishRef}>
      <group ref={modelRef}>
        {/* 
          Keep rotation={[0, 0, 0]} so the fish mesh retains its natural orientation:
          - Spine runs horizontally along X (mouth points +X, tail points -X)
          - Dorsal fin points vertically up along Y
          - Side body faces along Z (toward the screen)
        */}
        <group scale={[sizeScale, sizeScale, sizeScale]} rotation={[0, 0, 0]}>
          <primitive object={clonedScene} />
        </group>
      </group>
    </group>
  )
}

// Preload the model
useGLTF.preload('/clown_fish.glb')
