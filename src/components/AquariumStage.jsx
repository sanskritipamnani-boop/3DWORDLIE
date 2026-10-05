import { Canvas } from '@react-three/fiber'
import { useControls, folder, Leva } from 'leva'
import * as THREE from 'three'

import { useThree } from '@react-three/fiber'
import { useEffect } from 'react'

function SceneLights() {
  const { gl, scene } = useThree()

  const { bgColor, fogDensity } = useControls('Environment & Mood', {
    bgColor:    { value: '#52290a', label: 'Background/Fog' },
    fogDensity: { value: 0.03, min: 0, max: 0.05, step: 0.001, label: 'Fog Density' },
  })

  const { ambientColor, ambientIntensity } = useControls('Ambient', {
    ambientColor:     { value: '#ead0b9', label: 'Color' },
    ambientIntensity: { value: 1.13, min: 0, max: 3, step: 0.01, label: 'Intensity' },
  })

  const { keyColor, keyIntensity, keyX, keyY, keyZ } = useControls('Key Light (Golden Sun)', {
    keyColor:     { value: '#dca464', label: 'Color' },
    keyIntensity: { value: 7.85, min: 0, max: 12, step: 0.05, label: 'Intensity' },
    keyX:         { value: -17.0, min: -20, max: 20, step: 0.1, label: 'Pos X' },
    keyY:         { value: 12.0,  min: -20, max: 20, step: 0.1, label: 'Pos Y' },
    keyZ:         { value: 4.0,   min: -20, max: 20, step: 0.1, label: 'Pos Z' },
  })

  const { rimColor, rimIntensity } = useControls('Back Rim', {
    rimColor:     { value: '#efb89c', label: 'Color' },
    rimIntensity: { value: 1.50, min: 0, max: 5, step: 0.01, label: 'Intensity' },
  })

  const { fillColor, fillIntensity } = useControls('Fill Light', {
    fillColor:     { value: '#d46533', label: 'Color' },
    fillIntensity: { value: 0.65, min: 0, max: 5, step: 0.01, label: 'Intensity' },
  })

  const { bounceColor, bounceIntensity } = useControls('Bottom Bounce', {
    bounceColor:     { value: '#ff9036', label: 'Color' },
    bounceIntensity: { value: 0.55, min: 0, max: 5, step: 0.01, label: 'Intensity' },
  })

  const { rightColor, rightIntensity, rightX, rightY, rightZ, rightDist } = useControls('Right Desk Lamp', {
    rightColor:     { value: '#ffbe59', label: 'Color' },
    rightIntensity: { value: 5.5, min: 0, max: 20, step: 0.1, label: 'Intensity' },
    rightX:         { value: 9,   min: -30, max: 30, step: 0.1, label: 'Pos X' },
    rightY:         { value: 4,   min: -20, max: 20, step: 0.1, label: 'Pos Y' },
    rightZ:         { value: -5,  min: -30, max: 10, step: 0.1, label: 'Pos Z' },
    rightDist:      { value: 30,  min: 0,   max: 60, step: 0.5, label: 'Distance' },
  })

  const { exposure } = useControls('Tone Mapping', {
    exposure: { value: 0.95, min: 0.1, max: 3, step: 0.01, label: 'ACES Exposure' },
  })

  useEffect(() => {
    gl.toneMappingExposure = exposure
  }, [exposure, gl])

  useEffect(() => {
    scene.background = new THREE.Color(bgColor)
    scene.fog = new THREE.FogExp2(bgColor, fogDensity)
  }, [bgColor, fogDensity, scene])

  return (
    <>
      <ambientLight color={ambientColor} intensity={ambientIntensity} />

      <directionalLight
        color={keyColor}
        position={[keyX, keyY, keyZ]}
        intensity={keyIntensity}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-far={22}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
        shadow-bias={-0.0005}
      />

      <directionalLight color={rimColor}    position={[-6, 8, -6]} intensity={rimIntensity} />
      <directionalLight color={fillColor}   position={[-8, 2,  4]} intensity={fillIntensity} />
      <directionalLight color={bounceColor} position={[0, -10, 0]} intensity={bounceIntensity} />

      {/* Right-side warm lamp light */}
      <pointLight
        color={rightColor}
        position={[rightX, rightY, rightZ]}
        intensity={rightIntensity}
        distance={rightDist}
        decay={2}
      />
    </>
  )
}

export default function AquariumStage({ children }) {
  return (
    <>
      {/* Leva panel — floats top-right, collapsible */}
      <Leva collapsed={false} titleBar={{ title: '💡 Lighting Controls' }} />

      <Canvas
        shadows
        dpr={[1, 1.5]}
        performance={{ min: 0.5 }}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
        camera={{ position: [0, 2.2, 12.0], fov: 45 }}
        onCreated={({ gl }) => {
          gl.shadowMap.enabled = true
          gl.shadowMap.type    = THREE.PCFSoftShadowMap
          gl.toneMapping         = THREE.ACESFilmicToneMapping
          gl.toneMappingExposure = 0.95
        }}
      >
        <SceneLights />
        {children}
      </Canvas>
    </>
  )
}
