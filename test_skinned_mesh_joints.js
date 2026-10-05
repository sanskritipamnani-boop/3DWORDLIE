import fs from 'fs'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import * as THREE from 'three'

global.window = global
global.self = global
global.document = {
  createElement: () => ({})
}

async function inspect() {
  const data = fs.readFileSync('public/clown_fish.glb')
  const arrayBuffer = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength)

  const loader = new GLTFLoader()
  loader.parse(arrayBuffer, '', (gltf) => {
    const scene = gltf.scene
    const animations = gltf.animations

    // Initialize animation mixer
    const mixer = new THREE.AnimationMixer(scene)
    const action = mixer.clipAction(animations[0])
    action.play()
    
    // Update mixer by a tiny step to apply keyframes
    mixer.update(0.01)

    // Traverse the scene and find the SkinnedMesh and its bones
    let skinnedMesh = null
    scene.traverse((child) => {
      if (child.isSkinnedMesh) {
        skinnedMesh = child
      }
    })

    if (!skinnedMesh) {
      console.log('No skinned mesh found!')
      process.exit(1)
    }

    console.log(`SkinnedMesh: "${skinnedMesh.name}"`)
    
    // Check skeleton bones
    console.log(`Skeleton has ${skinnedMesh.skeleton.bones.length} bones.`)
    
    // Check root bone rotation in world space after mixer update
    const rootBone = skinnedMesh.skeleton.bones[0]
    const worldPos = new THREE.Vector3()
    const worldQuat = new THREE.Quaternion()
    const worldScale = new THREE.Vector3()
    
    rootBone.matrixWorld.decompose(worldPos, worldQuat, worldScale)
    const euler = new THREE.Euler().setFromQuaternion(worldQuat, 'XYZ')
    
    console.log(`Root Bone: "${rootBone.name}"`)
    console.log(`World Pos: (${worldPos.x.toFixed(2)}, ${worldPos.y.toFixed(2)}, ${worldPos.z.toFixed(2)})`)
    console.log(`World Rot (Euler XYZ): (${(euler.x/Math.PI).toFixed(2)}pi, ${(euler.y/Math.PI).toFixed(2)}pi, ${(euler.z/Math.PI).toFixed(2)}pi)`)
    
    // Calculate world transform of a vertex in the middle of the body
    // Vertex 0: pos = (0, -13.87, -27.58) bound to bone index 40
    const v0 = new THREE.Vector3(0, -13.87, -27.58)
    const bone40 = skinnedMesh.skeleton.bones[40]
    const bone40WorldMat = bone40.matrixWorld.clone()
    const bindMatrixInverse = skinnedMesh.bindMatrixInverse.clone()
    const bindMatrix = skinnedMesh.bindMatrix.clone()
    
    // vertex in world space:
    // vWorld = scene.matrixWorld * skinnedMesh.matrixWorld * bindMatrixInverse * boneMatrixWorld * bindMatrix * v0
    // (Assuming scene.matrixWorld is Identity)
    const transformMat = new THREE.Matrix4()
      .multiply(skinnedMesh.matrixWorld)
      .multiply(bindMatrixInverse)
      .multiply(bone40WorldMat)
      .multiply(bindMatrix)
      
    const vWorld = v0.clone().applyMatrix4(transformMat)
    console.log(`World position of V0 (tail/body): (${vWorld.x.toFixed(2)}, ${vWorld.y.toFixed(2)}, ${vWorld.z.toFixed(2)})`)
    
    // Check vertex near head (e.g. V100 or something, let's find one with positive Z)
    const geom = skinnedMesh.geometry
    const posAttr = geom.attributes.position
    const skinIndexAttr = geom.attributes.skinIndex
    let headVertexIdx = -1
    let maxZ = -Infinity
    for (let i = 0; i < posAttr.count; i++) {
      if (posAttr.getZ(i) > maxZ) {
        maxZ = posAttr.getZ(i)
        headVertexIdx = i
      }
    }
    
    if (headVertexIdx !== -1) {
      const vHead = new THREE.Vector3(posAttr.getX(headVertexIdx), posAttr.getY(headVertexIdx), posAttr.getZ(headVertexIdx))
      const boneIdx = skinIndexAttr.getX(headVertexIdx)
      const boneHead = skinnedMesh.skeleton.bones[boneIdx]
      const boneHeadWorldMat = boneHead.matrixWorld.clone()
      
      const headTransformMat = new THREE.Matrix4()
        .multiply(skinnedMesh.matrixWorld)
        .multiply(bindMatrixInverse)
        .multiply(boneHeadWorldMat)
        .multiply(bindMatrix)
        
      const vHeadWorld = vHead.clone().applyMatrix4(headTransformMat)
      console.log(`World position of Head Vertex (V${headVertexIdx}): (${vHeadWorld.x.toFixed(2)}, ${vHeadWorld.y.toFixed(2)}, ${vHeadWorld.z.toFixed(2)})`)
      
      // The vector from tail to head shows the current spine direction in world space!
      const spineDir = vHeadWorld.clone().sub(vWorld).normalize()
      console.log(`Current Spine Direction (World Space): (${spineDir.x.toFixed(2)}, ${spineDir.y.toFixed(2)}, ${spineDir.z.toFixed(2)})`)
    }

    process.exit(0)
  }, (err) => {
    console.error(err)
    process.exit(1)
  })
}

inspect()
