import { useMemo } from 'react'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js'

function Laptop({ position = [-5.2, -4.00, -8.2], rotation = [0, -Math.PI / 2 - (10 * Math.PI / 180), 0], targetWidth = 5.55 }) {
  const { scene } = useGLTF('/laptop.glb')

  const clonedScene = useMemo(() => {
    if (!scene) return null
    const clone = SkeletonUtils.clone(scene)
    clone.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true
        child.receiveShadow = true
      }
    })
    return clone
  }, [scene])

  const scaleFactor = useMemo(() => {
    if (!scene) return 1
    const box = new THREE.Box3().setFromObject(scene)
    const size = new THREE.Vector3()
    box.getSize(size)
    const maxDim = Math.max(size.x, size.z)
    return maxDim > 0 ? targetWidth / maxDim : 1
  }, [scene, targetWidth])

  if (!clonedScene) return null

  return (
    <primitive
      object={clonedScene}
      position={position}
      rotation={rotation}
      scale={[scaleFactor, scaleFactor, scaleFactor]}
    />
  )
}

export default function StudyTable() {
  const { scene } = useGLTF('/Standing Desk.glb')

  const bowlBottomY = -4.01
  const scale = 13.0

  // Calculate offsets based on tabletop Y = 0.94, Z center = -6.572, X center = -0.456
  // Calculate offsets based on 180-degree Y rotation (Math.PI)
  const posX = -5.928
  const posY = -16.295
  const posZ = -91.636

  // Lower keyboard and monitors to rest on the tabletop (0.94) instead of floating in the air
  // Shift them and other left-side items to the left to prevent collisions with the centered fishbowl
  const monitors = scene.getObjectByName('Dual_Monitors_on_sit-stand_arm')
  if (monitors) {
    monitors.visible = false // Hide monitors from scene
  }
  const keyboard = scene.getObjectByName('Keyboard')
  if (keyboard) {
    keyboard.position.x = 0.08  // Shifted slightly right (was 0.159)
    keyboard.position.y = 0.98  // Lower keyboard tray to tabletop level with minor offset to prevent clipping
  }
  const phone = scene.getObjectByName('Office_Phone001')
  if (phone) {
    phone.position.x = 0.40     // Shifted slightly right (was 0.50)
  }
  const notebook = scene.getObjectByName('Notebook')
  if (notebook) {
    notebook.position.x = 0.38  // Shifted slightly right (was 0.48)
  }
  // Move calendar to front-right of table, parallel to keyboard (same Z depth)
  // worldX≈4.5 → localX=-0.80 | front Z same as keyboard (localZ≈-6.71)
  const calendar = scene.getObjectByName('Calendar-8GqQAqxi3qk')
  if (calendar) {
    calendar.position.x = -0.80   // worldX ≈ 4.5 (right side near fishbowl)
    calendar.position.z = -6.71   // same Z as keyboard — front of table
  }
  // Move mug next to calendar with a small side gap
  // Calendar left edge ≈ worldX 2.5 | mug center at worldX≈1.0 gives ~0.6 unit gap
  const mug = scene.getObjectByName('Mug_With_Office_Tool')
  if (mug) {
    mug.position.x = -0.53        // worldX ≈ 1.0 — just to the left of calendar with gap
    mug.position.z = -6.71        // same Z as keyboard and calendar — front of table
  }
  // Remove straw soda cup from the scene
  const soda = scene.getObjectByName('Soda001')
  if (soda) {
    soda.visible = false        // Hide soda cup from scene
  }

  // Recolor the desk surface to warm light wood brown
  const desk = scene.getObjectByName('Desk')
  if (desk) {
    desk.traverse((child) => {
      if (child.isMesh && child.material) {
        child.material = child.material.clone()
        child.material.color.set('#8B5E3C')   // darker walnut wood brown
        child.material.roughness = 0.55       // slight sheen like polished wood
        child.material.metalness = 0.0
      }
    })
  }

  // Enable shadows on the loaded desk model meshes
  scene.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true
      child.receiveShadow = true
    }
  })

  return (
    <group>
      {/* GLTF Standing Desk Model */}
      <primitive
        object={scene}
        position={[posX, posY, posZ]}
        rotation={[0, Math.PI, 0]}
        scale={[scale, scale, scale]}
      />

      {/* Laptop placed on the desk near telephone, behind keyboard */}
      <Laptop />

      {/* === FLOOR === */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, bowlBottomY - 10.3, -10]} receiveShadow>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial color="#1a1410" roughness={0.9} />
      </mesh>

      {/* === WALL BEHIND === */}
      <mesh position={[0, bowlBottomY + 5, -25]} receiveShadow>
        <planeGeometry args={[100, 50]} />
        <meshStandardMaterial color="#5a8aa0" roughness={0.95} />
      </mesh>
    </group>
  )
}

useGLTF.preload('/Standing Desk.glb')
useGLTF.preload('/laptop.glb')
