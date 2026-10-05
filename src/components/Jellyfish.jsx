import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js'
import * as THREE from 'three'

// Helper to calculate height of the curved sand bed
const getSandHeight = (x, z) => {
  const r = 7.95
  const distSq = x * x + z * z
  if (distSq >= r * r) return -5.3
  return -Math.sqrt(r * r - distSq)
}

// Pure deterministic pseudo-random generator
function seedRandom(x, z, salt = 0) {
  const val = Math.sin(x * 12.9898 + z * 78.233 + salt) * 43758.5453123
  return val - Math.floor(val)
}

function JellyfishInstance({ initialX, initialZ, speed = 0.5, color = '#e0f7fa', scaleMultiplier = 1.0 }) {
  const groupRef = useRef()

  // Load the GLB model
  const { scene } = useGLTF('/spiral_ribbon_jelly_fish_3d_model.glb')

  // Clone scene and apply transparent, glowing materials
  const clonedScene = useMemo(() => {
    const clone = SkeletonUtils.clone(scene)
    
    clone.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true
        child.receiveShadow = true
        
        if (child.material) {
          child.material = child.material.clone()
          child.material.transparent = true
          child.material.opacity = 0.55
          child.material.side = THREE.DoubleSide
          child.material.roughness = 0.15
          child.material.metalness = 0.1
          child.material.depthWrite = false
          
          // Apply emissive color for bioluminescent glow
          child.material.emissive = new THREE.Color(color)
          child.material.emissiveIntensity = 1.4
        }
      }
    })
    
    return clone
  }, [scene, color])

  // Normalize size scale dynamically
  const sizeScale = useMemo(() => {
    const box = new THREE.Box3().setFromObject(scene)
    const sizeVec = new THREE.Vector3()
    box.getSize(sizeVec)
    const maxDim = Math.max(sizeVec.x, sizeVec.y, sizeVec.z)
    
    // Target size is roughly 0.8 units, adjusted by instance multiplier
    const baseScale = 0.8 / (maxDim || 1)
    return baseScale * scaleMultiplier
  }, [scene, scaleMultiplier])

  // Deterministically randomize initial parameters using position coords
  const randomPhase = useMemo(() => seedRandom(initialX, initialZ, 5.7) * Math.PI * 2, [initialX, initialZ])
  const pulseFreq = useMemo(() => 1.8 + seedRandom(initialX, initialZ, 9.2) * 1.2, [initialX, initialZ])
  
  // Track vertical Y coordinate
  const sandY = getSandHeight(initialX, initialZ)
  const yRef = useRef(sandY + seedRandom(initialX, initialZ, 12.4) * (1.8 - sandY))

  useFrame((state, delta) => {
    if (!groupRef.current) return

    const time = state.clock.getElapsedTime()
    const pulseTime = time * pulseFreq + randomPhase
    const pulse = Math.sin(pulseTime)

    // Calculate horizontal sways (drifting gently in X and Z)
    const swayX = initialX + Math.sin(time * 0.4 + randomPhase) * 0.45
    const swayZ = initialZ + Math.cos(time * 0.4 + randomPhase) * 0.45

    // Pulsating climb: Jellyfish shoots upwards during contraction (pulse > 0)
    // and drifts slower/glides during relaxation (pulse <= 0)
    const swimPush = 1.0 + Math.max(0, pulse) * 2.0
    yRef.current += delta * speed * swimPush

    // Construct raw position vector
    const pos = new THREE.Vector3(swayX, yRef.current, swayZ)

    // Constrain position to stay strictly inside the spherical container of water (radius 7.5)
    // This automatically handles sand bottom curvature and outer glass wall constraints
    if (pos.length() > 7.5) {
      pos.setLength(7.5)
      // Sync yRef back to the constrained Y coordinate to keep the climb path continuous
      yRef.current = pos.y
    }

    // Wrap-around check: If it reaches the water surface Y = 1.8, reset to sand bottom
    const currentSandY = getSandHeight(pos.x, pos.z)
    if (pos.y > 1.8) {
      yRef.current = currentSandY - 0.2
      pos.y = currentSandY - 0.2
    }

    // Calculate smooth fade-in at bottom and fade-out at water surface using constrained Y
    const bottomFade = THREE.MathUtils.mapLinear(pos.y, currentSandY - 0.2, currentSandY + 0.8, 0.0, 1.0)
    const topFade = THREE.MathUtils.mapLinear(pos.y, 1.0, 1.8, 1.0, 0.0)
    const fade = Math.max(0, Math.min(1, bottomFade * topFade))

    // Update material opacity dynamically to apply the fade transition
    groupRef.current.traverse((child) => {
      if (child.isMesh && child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach((mat) => {
            mat.opacity = 0.55 * fade
            mat.emissiveIntensity = 1.4 * fade
          })
        } else {
          child.material.opacity = 0.55 * fade
          child.material.emissiveIntensity = 1.4 * fade
        }
      }
    })

    // Position group
    groupRef.current.position.copy(pos)

    // Pulsating 3D scale morph:
    // Squeezes horizontally (X/Z) and stretches vertically (Y) during the upward push
    let scaleX = sizeScale
    let scaleY = sizeScale
    let scaleZ = sizeScale

    if (pulse > 0) {
      scaleY *= 1.0 + pulse * 0.16
      scaleX *= 1.0 - pulse * 0.12
      scaleZ *= 1.0 - pulse * 0.12
    } else {
      scaleY *= 1.0 + pulse * 0.08
      scaleX *= 1.0 - pulse * 0.1
      scaleZ *= 1.0 - pulse * 0.1
    }

    groupRef.current.scale.set(scaleX, scaleY, scaleZ)

    // Gentle forward-tilting rotation in the sway direction
    groupRef.current.rotation.x = Math.sin(time * 0.8 + randomPhase) * 0.08
    groupRef.current.rotation.z = Math.cos(time * 0.8 + randomPhase) * 0.08
  })

  return (
    <group ref={groupRef}>
      <primitive object={clonedScene} />
    </group>
  )
}

export default function JellyfishSchool() {
  // Spawn 4 beautiful glowing jellyfish at different spots in the bowl
  // Focus on foreground (Z > 0) to frame the camera opening perfectly,
  // and some in the background/sides
  const configs = useMemo(() => [
    // Left Background
    { initialX: -2.2, initialZ: -1.8, speed: 0.20, color: '#b2ebf2', scaleMultiplier: 1.1 },
    // Right Background
    { initialX: 2.0, initialZ: -1.5, speed: 0.22, color: '#e1bee7', scaleMultiplier: 0.95 },
    // Center Foreground (Right in front of page load camera Z = 2.5)
    { initialX: -0.5, initialZ: 1.0, speed: 0.18, color: '#f8bbd0', scaleMultiplier: 1.05 },
    // Right Foreground
    { initialX: 1.8, initialZ: 0.8, speed: 0.21, color: '#e0f2f1', scaleMultiplier: 0.85 }
  ], [])

  return (
    <group>
      {configs.map((cfg, idx) => (
        <JellyfishInstance
          key={idx}
          initialX={cfg.initialX}
          initialZ={cfg.initialZ}
          speed={cfg.speed}
          color={cfg.color}
          scaleMultiplier={cfg.scaleMultiplier}
        />
      ))}
    </group>
  )
}

// Preload the jellyfish GLB asset
useGLTF.preload('/spiral_ribbon_jelly_fish_3d_model.glb')
