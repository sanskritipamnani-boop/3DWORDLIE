import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// Helper to determine curved sand floor Y coordinate
const getSandHeight = (x, z) => {
  const r = 7.95
  const distSq = x * x + z * z
  if (distSq >= r * r) return -5.3
  return -Math.sqrt(r * r - distSq)
}

// Pure deterministic pseudo-random generator
const seedRandom = (str) => {
  let hash = 0
  const stringId = String(str)
  for (let i = 0; i < stringId.length; i++) {
    hash = stringId.charCodeAt(i) + ((hash << 5) - hash)
  }
  return Math.abs(Math.sin(hash))
}

export default function Bubbles({ count = 80 }) {
  const meshRef = useRef()

  // Column spawn locations aligned inside the curved sand floor area
  const columns = useMemo(() => [
    { x: -3.2, z: -1.2 }, // Left column
    { x: -1.0, z: -2.0 }, // Mid-left
    { x: 1.0, z: -2.2 },  // Mid-right
    { x: 3.0, z: -1.0 }   // Right column
  ], [])

  // Initialize bubble states deterministically to comply with purity rules
  const bubbles = useMemo(() => {
    const data = []
    for (let i = 0; i < count; i++) {
      const col = columns[i % columns.length]
      const bottomY = getSandHeight(col.x, col.z)
      
      // Pre-calculate 5 deterministic random offsets for reset wiggles
      const offsetsX = []
      const offsetsZ = []
      for (let j = 0; j < 5; j++) {
        offsetsX.push((seedRandom(i + '_x_' + j) - 0.5) * 0.3)
        offsetsZ.push((seedRandom(i + '_z_' + j) - 0.5) * 0.3)
      }
      
      const startY = bottomY + seedRandom(i + '_y') * (2.0 - bottomY)
      const speed = 0.8 + seedRandom(i + '_speed') * 1.2
      const wobbleSpeed = 2.5 + seedRandom(i + '_wobbleSpeed') * 3.0
      const wobbleRange = 0.03 + seedRandom(i + '_wobbleRange') * 0.06
      const scale = 0.03 + seedRandom(i + '_scale') * 0.05

      data.push({
        colX: col.x,
        colZ: col.z,
        bottomY: bottomY,
        y: startY,
        resetCount: 0,
        offsetsX,
        offsetsZ,
        offsetX: offsetsX[0],
        offsetZ: offsetsZ[0],
        speed,
        wobbleSpeed,
        wobbleRange,
        scale
      })
    }
    return data
  }, [count, columns])

  const tempObject = useMemo(() => new THREE.Object3D(), [])

  useFrame((state, delta) => {
    if (!meshRef.current) return
    const t = state.clock.getElapsedTime()

    bubbles.forEach((bubble, i) => {
      // Rise up
      bubble.y += bubble.speed * delta

      // Reset bubble to the bottom curved sand floor coordinate when it exceeds water surface level Y = 2.0
      if (bubble.y > 2.0) {
        bubble.y = bubble.bottomY
        bubble.resetCount = (bubble.resetCount + 1) % 5
        bubble.offsetX = bubble.offsetsX[bubble.resetCount]
        bubble.offsetZ = bubble.offsetsZ[bubble.resetCount]
      }

      // Wobble wave logic
      const currentX = bubble.colX + bubble.offsetX + Math.sin(t * bubble.wobbleSpeed + i) * bubble.wobbleRange
      const currentZ = bubble.colZ + bubble.offsetZ + Math.cos(t * bubble.wobbleSpeed + i) * bubble.wobbleRange

      tempObject.position.set(currentX, bubble.y, currentZ)
      tempObject.scale.setScalar(bubble.scale)
      tempObject.updateMatrix()

      meshRef.current.setMatrixAt(i, tempObject.matrix)
    })

    meshRef.current.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={meshRef} args={[null, null, count]}>
      {/* Smooth high-poly sphere so bubbles are round not faceted */}
      <sphereGeometry args={[1, 24, 24]} />
      {/*
        meshPhysicalMaterial — physically correct glass/water bubble look:
        - transmission: makes the inside see-through like glass
        - roughness near 0: perfectly smooth glassy surface
        - ior 1.33: water refractive index so light bends correctly
        - thickness: how much the bubble attenuates/tints light passing through
        - iridescence: subtle rainbow rim shimmer like real soap bubbles
      */}
      <meshPhysicalMaterial
        color="#d0f0ff"
        transmission={0.6}
        thickness={0.15}
        roughness={0.02}
        metalness={0.0}
        ior={1.33}
        transparent
        opacity={0.85}
        depthWrite={false}
        envMapIntensity={3.0}
        iridescence={1.0}
        iridescenceIOR={1.5}
        iridescenceThicknessRange={[100, 500]}
        attenuationColor="#aaddff"
        attenuationDistance={0.8}
      />
    </instancedMesh>
  )
}
