import * as THREE from 'three'

console.log('--- TESTING DESK ROTATION MATH ---')

const scale = 13.0
const bowlBottomY = -4.01
const targetZ = -5.4 // Shifted tabletop center Z to avoid clipping

// Local coordinates from model:
const localTabletopCenter = new THREE.Vector3(-0.456, 0.945, -6.572)
const localKeyboard = new THREE.Vector3(-0.35, 1.22, -6.68)
const localFrontEdge = new THREE.Vector3(-0.46, 0.93, -5.86)

// Let's test rotating 180 degrees around Y:
const euler = new THREE.Euler(0, Math.PI, 0, 'XYZ')
const rotMat = new THREE.Matrix4().makeRotationFromEuler(euler)

// Apply rotation to local points
const rotatedCenter = localTabletopCenter.clone().applyMatrix4(rotMat)
const rotatedKeyboard = localKeyboard.clone().applyMatrix4(rotMat)
const rotatedFrontEdge = localFrontEdge.clone().applyMatrix4(rotMat)

console.log(`Rotated Local Tabletop Center: (${rotatedCenter.x.toFixed(3)}, ${rotatedCenter.y.toFixed(3)}, ${rotatedCenter.z.toFixed(3)})`)
console.log(`Rotated Local Keyboard: (${rotatedKeyboard.x.toFixed(3)}, ${rotatedKeyboard.y.toFixed(3)}, ${rotatedKeyboard.z.toFixed(3)})`)
console.log(`Rotated Local Front Edge: (${rotatedFrontEdge.x.toFixed(3)}, ${rotatedFrontEdge.y.toFixed(3)}, ${rotatedFrontEdge.z.toFixed(3)})`)

// Calculate translations:
// We want rotatedCenter * scale + Translation = (0, bowlBottomY, targetZ)
const posX = 0 - (rotatedCenter.x * scale)
const posY = bowlBottomY - (rotatedCenter.y * scale)
const posZ = targetZ - (rotatedCenter.z * scale)

console.log(`\nCalculated Positions for Primitive:`)
console.log(`posX = ${posX.toFixed(3)}`)
console.log(`posY = ${posY.toFixed(3)}`)
console.log(`posZ = ${posZ.toFixed(3)}`)

// Let's check the resulting world coordinates:
const worldCenter = rotatedCenter.clone().multiplyScalar(scale).add(new THREE.Vector3(posX, posY, posZ))
const worldKeyboard = rotatedKeyboard.clone().multiplyScalar(scale).add(new THREE.Vector3(posX, posY, posZ))
const worldFrontEdge = rotatedFrontEdge.clone().multiplyScalar(scale).add(new THREE.Vector3(posX, posY, posZ))

console.log(`\nResulting World Coordinates:`)
console.log(`- Tabletop Center: (${worldCenter.x.toFixed(2)}, ${worldCenter.y.toFixed(2)}, ${worldCenter.z.toFixed(2)})`)
console.log(`- Keyboard: (${worldKeyboard.x.toFixed(2)}, ${worldKeyboard.y.toFixed(2)}, ${worldKeyboard.z.toFixed(2)})`)
console.log(`- Front Edge of Desk: (${worldFrontEdge.x.toFixed(2)}, ${worldFrontEdge.y.toFixed(2)}, ${worldFrontEdge.z.toFixed(2)})`)
