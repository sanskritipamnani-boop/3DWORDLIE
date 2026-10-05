import * as THREE from 'three'

export default function Fishbowl() {
  return (
    <group>
      {/* Main glass bowl — thin, refractive, crystal clear */}
      <mesh castShadow receiveShadow raycast={() => null}>
        <sphereGeometry args={[8.0, 64, 64, 0, Math.PI * 2, 0.35, Math.PI - 0.35]} />
        <meshPhysicalMaterial
          color="#e8f8ff"
          roughness={0.0}
          metalness={0.0}
          ior={1.52}
          transparent
          opacity={0.08}
          clearcoat={1.0}
          clearcoatRoughness={0.0}
          reflectivity={0.9}
          side={THREE.FrontSide}
          envMapIntensity={2.0}
          specularIntensity={1.0}
          specularColor="#ffffff"
        />
      </mesh>

      {/* Thin glass rim at the top opening */}
      <mesh position={[0, 8.0 * Math.cos(0.35), 0]} rotation={[Math.PI / 2, 0, 0]} raycast={() => null}>
        <torusGeometry args={[8.0 * Math.sin(0.35), 0.06, 8, 64]} />
        <meshPhysicalMaterial
          color="#d0eef8"
          roughness={0.0}
          ior={1.52}
          transparent
          opacity={0.15}
          clearcoat={1.0}
          side={THREE.FrontSide}
          envMapIntensity={2.5}
        />
      </mesh>
    </group>
  )
}
