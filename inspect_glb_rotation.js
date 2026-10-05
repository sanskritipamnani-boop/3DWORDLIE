import fs from 'fs'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

global.window = global
global.self = global
global.document = {
  createElement: () => ({})
}

async function inspect() {
  const glbData = fs.readFileSync('public/fish_pack.glb')
  const arrayBuffer = glbData.buffer.slice(glbData.byteOffset, glbData.byteOffset + glbData.byteLength)

  const loader = new GLTFLoader()
  loader.parse(arrayBuffer, '', (gltf) => {
    const root = gltf.scene.children[0]
    root.children.forEach((child, index) => {
      console.log(`Fish ${index} ("${child.name}"):`)
      console.log(`- position:`, child.position)
      console.log(`- rotation:`, child.rotation)
      console.log(`- scale:`, child.scale)
    })
    process.exit(0)
  }, (err) => {
    console.error(err)
    process.exit(1)
  })
}

inspect()
