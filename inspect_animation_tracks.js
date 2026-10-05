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
    console.log('--- CLOWN FISH ANIMATION TRACKS ---')
    gltf.animations.forEach((anim) => {
      console.log(`Animation Clip: "${anim.name}"`)
      anim.tracks.forEach((track, idx) => {
        // print name, type, and first few values if it's a position track
        if (track.name.includes('position') || idx < 10) {
          console.log(`- Track ${idx}: "${track.name}", Type: ${track.ValueTypeName}, Keyframes Count: ${track.times.length}`)
          if (track.name.includes('position')) {
            console.log(`  First values: [${Array.from(track.values.slice(0, 9)).map(v => v.toFixed(2)).join(', ')}]`)
          }
        }
      })
    })
    process.exit(0)
  }, (err) => {
    console.error(err)
    process.exit(1)
  })
}

inspect()
