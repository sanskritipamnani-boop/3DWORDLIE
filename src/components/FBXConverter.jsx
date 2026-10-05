import { useEffect } from 'react'
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js'
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js'

export default function FBXConverter() {
  useEffect(() => {
    console.log('FBXConverter: Starting load of FBX file...')
    const loader = new FBXLoader()
    
    loader.load(
      '/uploads_files_6405736_free_fish_pack.fbx',
      (fbx) => {
        console.log('FBXConverter: Load successful! Loaded object structure:', fbx)
        
        // Print hierarchy to console
        fbx.traverse((child) => {
          if (child.isMesh) {
            console.log(`Mesh found: "${child.name}", Position:`, child.position, 'Geometry groups:', child.geometry.groups)
          }
        })

        console.log('FBXConverter: Exporting to GLB...')
        const exporter = new GLTFExporter()
        
        exporter.parse(
          fbx,
          (gltf) => {
            const blob = new Blob([gltf], { type: 'application/octet-stream' })
            const link = document.createElement('a')
            link.href = URL.createObjectURL(blob)
            link.download = 'fish_pack.glb'
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            console.log('FBXConverter: Export complete! Download triggered.')
          },
          (error) => {
            console.error('FBXConverter: Export failed:', error)
          },
          { binary: true }
        )
      },
      (xhr) => {
        console.log(`FBXConverter: Loading progress: ${(xhr.loaded / xhr.total) * 100}%`)
      },
      (error) => {
        console.error('FBXConverter: Failed to load FBX:', error)
      }
    )
  }, [])

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '20px',
        left: '20px',
        background: 'rgba(0,0,0,0.85)',
        color: '#ffeb3b',
        padding: '10px 16px',
        borderRadius: '8px',
        zIndex: 9999,
        fontFamily: 'monospace',
        fontSize: '12px',
        pointerEvents: 'none'
      }}
    >
      Converting FBX to GLB... Check DevTools Console
    </div>
  )
}
