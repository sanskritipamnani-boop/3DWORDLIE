import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// Helper to determine height of the curved sand bed
const getSandHeight = (x, z) => {
  const r = 7.95
  const distSq = x * x + z * z
  if (distSq >= r * r) return -5.3
  return -Math.sqrt(r * r - distSq)
}

// Pure deterministic pseudo-random generator based on seed string
const seedRandom = (str) => {
  let hash = 0
  const stringId = String(str)
  for (let i = 0; i < stringId.length; i++) {
    hash = stringId.charCodeAt(i) + ((hash << 5) - hash)
  }
  return Math.abs(Math.sin(hash))
}

function FoodFlake({ id, initialPosition, foodRef, onEaten }) {
  const meshRef = useRef()

  // Deterministically generate random parameters using food ID to satisfy purity rules
  const speedVal = useMemo(() => 0.5 + seedRandom(id + '_speed') * 0.4, [id])
  const wobbleSpeedVal = useMemo(() => 2.5 + seedRandom(id + '_wobbleSpeed') * 2.5, [id])
  const wobbleRangeVal = useMemo(() => 0.03 + seedRandom(id + '_wobbleRange') * 0.03, [id])

  const speed = useRef(speedVal)
  const wobbleSpeed = useRef(wobbleSpeedVal)
  const wobbleRange = useRef(wobbleRangeVal)
  const position = useRef(new THREE.Vector3(...initialPosition))

  useFrame((state, delta) => {
    if (!meshRef.current) return
    const t = state.clock.getElapsedTime()

    // Sink down
    position.current.y -= speed.current * delta

    // Wobble horizontally (falling leaf effect)
    position.current.x += Math.sin(t * wobbleSpeed.current + id) * wobbleRange.current
    position.current.z += Math.cos(t * wobbleSpeed.current * 0.7 + id) * wobbleRange.current

    // Apply rotation
    meshRef.current.rotation.x += delta * 1.5
    meshRef.current.rotation.y += delta * 0.8

    // Update the position of the mesh
    meshRef.current.position.copy(position.current)

    // Sync with the shared parent Ref (for fish navigation)
    const sharedItem = foodRef.current.find((item) => item.id === id)
    if (sharedItem) {
      sharedItem.position.copy(position.current)
    }

    // Remove food when it reaches the curved sand bed coordinate
    const sandY = getSandHeight(position.current.x, position.current.z)
    if (position.current.y < sandY + 0.08) {
      onEaten(id)
    }
  })

  const colors = ['#ff8a65', '#ffb74d', '#ffd54f', '#a1887f']
  const flakeColor = colors[Math.abs(id) % colors.length]

  return (
    <mesh ref={meshRef} position={initialPosition} castShadow>
      <boxGeometry args={[0.12, 0.03, 0.12]} />
      <meshStandardMaterial 
        color={flakeColor} 
        roughness={0.8}
        metalness={0.1}
      />
    </mesh>
  )
}

export default function Food({ foods, foodRef, onEaten }) {
  return (
    <group>
      {foods.map((food) => (
        <FoodFlake
          key={food.id}
          id={food.id}
          initialPosition={food.initialPosition}
          foodRef={foodRef}
          onEaten={onEaten}
        />
      ))}
    </group>
  )
}
