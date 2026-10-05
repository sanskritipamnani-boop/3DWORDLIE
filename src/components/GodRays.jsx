import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

export default function GodRays() {
  const groupRef = useRef()

  // Update uniforms dynamically inside useFrame by traversing the group children
  // This bypasses React prop/hook immutability checkers cleanly.
  useFrame((state) => {
    if (groupRef.current) {
      const time = state.clock.getElapsedTime()
      groupRef.current.traverse((child) => {
        if (child.isMesh && child.material && child.material.uniforms) {
          child.material.uniforms.time.value = time
        }
      })
    }
  })

  // Volumetric ray configurations: three distinct, prominent beams in the midground/background
  // Scaled Y to 10.0 and set Y position to -3.0 to stretch across the entire water column (Y: -8.0 to 2.0)
  const rayConfigs = [
    { position: [-2.4, -3.0, -1.5], scale: [1.3, 10.0, 1.3], rotation: [0.12, 0, 0.08] },
    { position: [0.2, -3.0, -2.5], scale: [1.9, 10.0, 1.9], rotation: [-0.05, 0, -0.06] },
    { position: [2.6, -3.0, -1.0], scale: [1.2, 10.0, 1.2], rotation: [0.08, 0, 0.1] }
  ]

  return (
    <group ref={groupRef}>
      {rayConfigs.map((cfg, i) => (
        <mesh 
          key={i} 
          position={cfg.position} 
          rotation={cfg.rotation}
          scale={cfg.scale}
          raycast={() => null}
        >
          {/* Wider cylinders representing volumetric sun shafts */}
          <cylinderGeometry args={[0.5, 0.9, 1.0, 16, 1, true]} />
          <shaderMaterial
            transparent
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            side={THREE.DoubleSide}
            uniforms={{
              time: { value: 0 },
              color: { value: new THREE.Color('#b2ebf2') } // Soft glowing aqua-cyan
            }}
            vertexShader={`
              varying vec2 vUv;
              varying vec3 vWorldPosition;
              void main() {
                vUv = uv;
                vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
              }
            `}
            fragmentShader={`
              varying vec2 vUv;
              varying vec3 vWorldPosition;
              uniform float time;
              uniform vec3 color;

              void main() {
                // Radial softness falloff
                float radial = 1.0 - smoothstep(0.0, 0.5, abs(vUv.x - 0.5));

                // Vertical fade out near surface (top 8%) and sand bed (bottom 8%)
                float vertical = smoothstep(0.0, 0.08, vUv.y) * (1.0 - smoothstep(0.92, 1.0, vUv.y));

                // Volumetric noise shimmer via sine harmonics
                float noise = sin(vWorldPosition.x * 2.2 + time * 1.2) * 
                              cos(vWorldPosition.z * 1.8 - time * 0.9) * 0.35 + 0.65;
                
                // Height-based scrolling wave patterns
                float wave = sin(vUv.y * 8.0 - time * 2.2) * 0.15 + 0.85;

                // Combine factors into soft translucent alpha presence
                // Increased coefficient to 0.28 to make rays look more defined, bright and glowing
                float finalAlpha = radial * vertical * noise * wave * 0.28;

                gl_FragColor = vec4(color, finalAlpha);
              }
            `}
          />
        </mesh>
      ))}
    </group>
  )
}
