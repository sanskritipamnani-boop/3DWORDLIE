import { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// Pure deterministic pseudo-random generator
const seedRandom = (seed) => {
  const x = Math.sin(seed) * 10000
  return x - Math.floor(x)
}

export default function MarineSnow({ count = 350 }) {
  const pointsRef = useRef()

  // Generate a realistic bubble texture dynamically using HTML5 Canvas
  const bubbleTexture = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 64
    canvas.height = 64
    const ctx = canvas.getContext('2d')
    
    // Draw bubble outer ring
    ctx.beginPath()
    ctx.arc(32, 32, 26, 0, Math.PI * 2)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.95)'
    ctx.lineWidth = 3
    ctx.stroke()
    
    // Soft highlight reflection spot
    ctx.beginPath()
    ctx.arc(22, 22, 5, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'
    ctx.fill()
    
    // Soft interior glow
    const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32)
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.05)')
    gradient.addColorStop(0.7, 'rgba(255, 255, 255, 0.15)')
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)')
    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.arc(32, 32, 26, 0, Math.PI * 2)
    ctx.fill()
    
    const texture = new THREE.CanvasTexture(canvas)
    return texture
  }, [])

  // Clean up texture resources on unmount
  useEffect(() => {
    return () => {
      bubbleTexture.dispose()
    }
  }, [bubbleTexture])

  // Generate deterministic particle configurations
  const particles = useMemo(() => {
    const data = []
    for (let i = 0; i < count; i++) {
      // Random coordinates inside a sphere of radius 7.2
      const theta = seedRandom(i * 12.3) * Math.PI * 2
      const phi = Math.acos(seedRandom(i * 45.6) * 2 - 1)
      const r = seedRandom(i * 78.9) * 7.2
      
      const x = r * Math.sin(phi) * Math.cos(theta)
      const z = r * Math.sin(phi) * Math.sin(theta)
      let y = r * Math.cos(phi)
      
      // Limit vertical height to fit inside water volume Y bounds: [-5.0, 1.8]
      if (y > 1.8) y = 1.8
      if (y < -5.0) y = -5.0

      data.push({
        x,
        y,
        z,
        speed: 0.15 + seedRandom(i * 92.1) * 0.3, // slow drift speed
        wobbleSpeed: 0.6 + seedRandom(i * 3.4) * 1.4,
        wobbleRange: 0.04 + seedRandom(i * 5.6) * 0.08,
        seed: i
      })
    }
    return data
  }, [count])

  // Flat Float32Array buffer representing particle positions
  const initialPositions = useMemo(() => {
    const pos = new Float32Array(count * 3)
    particles.forEach((p, i) => {
      pos[i * 3] = p.x
      pos[i * 3 + 1] = p.y
      pos[i * 3 + 2] = p.z
    })
    return pos
  }, [particles, count])

  useFrame((state, delta) => {
    if (!pointsRef.current) return
    const t = state.clock.getElapsedTime()
    const geo = pointsRef.current.geometry
    const posAttr = geo.attributes.position

    particles.forEach((p, i) => {
      // Slow upward drift
      p.y += p.speed * delta

      // Reset to bottom Y = -5.0 when it exceeds Y = 1.8
      if (p.y > 1.8) {
        p.y = -5.0
      }

      // Wiggle horizontally
      const currentX = p.x + Math.sin(t * p.wobbleSpeed + p.seed) * p.wobbleRange
      const currentZ = p.z + Math.cos(t * p.wobbleSpeed * 0.8 + p.seed) * p.wobbleRange

      posAttr.setXYZ(i, currentX, p.y, currentZ)
    })

    posAttr.needsUpdate = true
  })

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[initialPositions, 3]}
        />
      </bufferGeometry>
      {/* Matte, soft glowing blue-white suspended bubbles */}
      <pointsMaterial
        color="#d0f8ff"
        size={0.15} // Size increased slightly to render bubble ring details clearly
        sizeAttenuation
        transparent
        opacity={0.65}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        map={bubbleTexture}
      />
    </points>
  )
}
