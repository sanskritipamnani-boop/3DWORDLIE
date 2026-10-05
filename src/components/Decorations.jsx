import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'

// Helper to calculate height of the curved sand bed at any (x, z) coordinate
const getSandHeight = (x, z) => {
  const r = 7.95
  const distSq = x * x + z * z
  if (distSq >= r * r) return -5.3
  return -Math.sqrt(r * r - distSq)
}

// Pure deterministic pseudo-random generator
function seedRandom(x, z, salt = 0) {
  const val = Math.sin(x * 12.9898 + z * 78.233 + salt) * 43758.5453123
  return val - Math.floor(val)
}

// ─── Animated Voronoi caustics sand floor ───
function CurvedSandFloor() {
  const materialRef = useRef()
  useFrame((state) => {
    if (materialRef.current)
      materialRef.current.uniforms.time.value = state.clock.getElapsedTime()
  })
  return (
    <mesh receiveShadow castShadow>
      <sphereGeometry args={[7.95, 64, 32, 0, Math.PI * 2, 2.25, Math.PI - 2.25]} />
      <shaderMaterial
        ref={materialRef}
        uniforms={{
          time: { value: 0 },
          lightDir: { value: new THREE.Vector3(2, 10, 4).normalize() }
        }}
        vertexShader={`
          varying vec3 vNormal;
          varying vec3 vWorldPosition;
          void main() {
            vNormal = normalize(normalMatrix * normal);
            vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `}
        fragmentShader={`
          varying vec3 vNormal;
          varying vec3 vWorldPosition;
          uniform float time;
          uniform vec3 lightDir;

          // Hash function for pseudo-random 2D → 2D
          vec2 hash2(vec2 p) {
            p = vec2(dot(p, vec2(127.1, 311.7)),
                     dot(p, vec2(269.5, 183.3)));
            return fract(sin(p) * 43758.5453123);
          }

          // 2D Voronoi: returns distance to nearest random point in a grid
          float voronoi(vec2 x, float t) {
            vec2 n = floor(x);
            vec2 f = fract(x);
            float md = 8.0;
            for (int j = -1; j <= 1; j++) {
              for (int i = -1; i <= 1; i++) {
                vec2 g = vec2(float(i), float(j));
                vec2 o = hash2(n + g);
                // Animate the cell point positions over time
                o = 0.5 + 0.5 * sin(t + 6.2831 * o);
                vec2 r = g + o - f;
                float d = dot(r, r);
                md = min(md, d);
              }
            }
            return sqrt(md);
          }

          void main() {
            vec3 normal = normalize(vNormal);
            float diffuse = max(dot(normal, lightDir), 0.0) * 0.75 + 0.25;

            vec2 uv = vWorldPosition.xz * 0.38;
            float t = time * 0.55;

            // 3 octaves of Voronoi at different scales and time offsets
            float v1 = voronoi(uv * 3.0 + vec2(t * 0.2, t * 0.15), t * 0.8);
            float v2 = voronoi(uv * 5.5 + vec2(-t * 0.15, t * 0.25), t * 1.2 + 3.0);
            float v3 = voronoi(uv * 9.0 + vec2(t * 0.1, -t * 0.1), t * 0.6 + 7.0);

            // Combine octaves — weight smaller scales less
            float combined = v1 * 0.5 + v2 * 0.35 + v3 * 0.15;

            // Invert (caustic lines are where Voronoi edges converge) and sharpen
            float causticRaw = 1.0 - combined;
            float caustic = pow(clamp(causticRaw, 0.0, 1.0), 5.0) * 0.4;

            // Warm sand base
            vec3 sandColor = vec3(0.93, 0.89, 0.83);
            // Subtle blue tint in caustic highlights
            vec3 causticColor = mix(vec3(1.0), vec3(0.7, 0.85, 1.0), 0.35) * caustic;

            vec3 finalColor = sandColor * diffuse + causticColor;
            gl_FragColor = vec4(finalColor, 1.0);
          }
        `}
      />
    </mesh>
  )
}

// ─── Rippling water surface with 3-harmonic waves ───
function WaterSurface() {
  const materialRef = useRef()

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.getElapsedTime()
    }
  })

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uScale: { value: 0.38 },
    uSmoothness: { value: 0.55 },
    uEdgeThreshold: { value: 0.067 },
    uEdgeSoftness: { value: 0.015 },
    uFlowX: { value: 0.02 },
    uFlowZ: { value: 0.06 },
    uCellSpeed: { value: 0.35 },
    uNoiseScale: { value: 1.50 },
    uNoiseFlowSpeed: { value: 0.18 },
    uDistortAmount: { value: 0.28 },
    uDeepColor: { value: new THREE.Color("#1a3a5c") },
    uMidColor: { value: new THREE.Color("#59c0e8") },
    uMidPos: { value: 0.084 },
    uHighlight: { value: new THREE.Color("#ffffff") },
    uOpacity: { value: 0.55 },
    uDeepOpacity: { value: 0.40 }
  }), [])

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 2.0, 0]}>
      <ringGeometry args={[0, 7.1, 64]} />
      <shaderMaterial
        ref={materialRef}
        uniforms={uniforms}
        transparent
        side={THREE.FrontSide}
        depthWrite={false}
        vertexShader={`
          varying vec2 vWorldPos;
          void main() {
            vec4 worldPos = modelMatrix * vec4(position, 1.0);
            vWorldPos = worldPos.xz;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `}
        fragmentShader={`
          uniform float uTime;
          uniform float uScale;
          uniform float uSmoothness;
          uniform float uEdgeThreshold;
          uniform float uEdgeSoftness;
          uniform float uFlowX;
          uniform float uFlowZ;
          uniform float uCellSpeed;
          uniform float uNoiseScale;
          uniform float uNoiseFlowSpeed;
          uniform float uDistortAmount;
          uniform vec3  uDeepColor;
          uniform vec3  uMidColor;
          uniform float uMidPos;
          uniform vec3  uHighlight;
          uniform float uOpacity;
          uniform float uDeepOpacity;

          varying vec2 vWorldPos;

          vec2 hash2(vec2 p) {
            p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
            return fract(sin(p) * 43758.5453);
          }

          float smin(float a, float b, float k) {
            float h = max(k - abs(a - b), 0.0) / k;
            return min(a, b) - h * h * h * k / 6.0;
          }

          vec2 cellPt(vec2 seed) {
            return 0.5 + 0.5 * sin(uTime * uCellSpeed + 6.2831 * seed);
          }

          float voronoiF1(vec2 p) {
            vec2 i = floor(p), f = fract(p);
            float md = 8.0;
            for (int y = -1; y <= 1; y++) {
              for (int x = -1; x <= 1; x++) {
                vec2 n  = vec2(float(x), float(y));
                vec2 pt = cellPt(hash2(i + n));
                md = min(md, length(n + pt - f));
              }
            }
            return md;
          }

          float voronoiSF1(vec2 p) {
            vec2 i = floor(p), f = fract(p);
            float res = 8.0;
            for (int y = -1; y <= 1; y++) {
              for (int x = -1; x <= 1; x++) {
                vec2 n  = vec2(float(x), float(y));
                vec2 pt = cellPt(hash2(i + n));
                res = smin(res, length(n + pt - f), uSmoothness);
              }
            }
            return res;
          }

          float nHash(vec2 p) {
            p = fract(p * vec2(127.1, 311.7));
            p += dot(p, p + 45.32);
            return fract(p.x * p.y);
          }

          float vnoise(vec2 p) {
            vec2 i = floor(p), f = fract(p);
            f = f * f * (3.0 - 2.0 * f);
            return mix(
              mix(nHash(i),                  nHash(i + vec2(1.0, 0.0)), f.x),
              mix(nHash(i + vec2(0.0, 1.0)), nHash(i + vec2(1.0, 1.0)), f.x),
              f.y
            );
          }

          float fbm(vec2 p) {
            float v = 0.0, a = 0.5;
            for (int i = 0; i < 2; i++) { v += a * vnoise(p); p *= 2.0; a *= 0.5; }
            return v;
          }

          void main() {
            vec2 noiseUV  = vWorldPos * uNoiseScale + vec2(uTime * uNoiseFlowSpeed, 0.0);
            float noiseFac = fbm(noiseUV);
            vec2 distort   = vec2(noiseFac - 0.5) * uDistortAmount;

            vec2 uv = vWorldPos * uScale + vec2(uFlowX, uFlowZ) * uTime + distort;

            float f1   = voronoiF1(uv);
            float sf1  = voronoiSF1(uv);

            float edge = f1 - sf1;

            float t = smoothstep(
              uEdgeThreshold - uEdgeSoftness,
              uEdgeThreshold + uEdgeSoftness,
              edge
            );

            float safeMP = max(uMidPos, 1e-4);
            float seg0 = clamp(t / safeMP, 0.0, 1.0);
            float seg1 = clamp((t - safeMP) / max(1.0 - safeMP, 1e-4), 0.0, 1.0);
            float inSeg1 = step(safeMP, t);
            vec3 color = mix(
              mix(uDeepColor, uMidColor, seg0),
              mix(uMidColor, uHighlight, seg1),
              inSeg1
            );

            gl_FragColor = vec4(color, mix(uDeepOpacity, 1.0, t) * uOpacity);
          }
        `}
      />
    </mesh>
  )
}

// ─── Volumetric water with Beer's law absorption and caustics ───
function VolumetricWater() {
  const materialRef = useRef()
  useFrame((state) => {
    if (materialRef.current)
      materialRef.current.uniforms.time.value = state.clock.getElapsedTime()
  })
  return (
    <mesh position={[0, 0, 0]} raycast={() => null}>
      {/* Water fills from surface to bowl bottom — radius inside bowl wall */}
      <sphereGeometry args={[7.6, 48, 48, 0, Math.PI * 2, 1.30, 1.50]} />
      <shaderMaterial
        ref={materialRef}
        transparent
        depthWrite={false}
        side={THREE.BackSide}
        uniforms={{
          time: { value: 0 },
          waterColorTop:    { value: new THREE.Color('#59c0e8') },
          waterColorBottom: { value: new THREE.Color('#1a3a5c') }
        }}
        vertexShader={`
          varying vec3 vNormal;
          varying vec3 vWorldPosition;
          varying vec3 vViewPosition;
          void main() {
            vNormal = normalize(normalMatrix * normal);
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            vViewPosition = -mvPosition.xyz;
            vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
            gl_Position = projectionMatrix * mvPosition;
          }
        `}
        fragmentShader={`
          varying vec3 vNormal;
          varying vec3 vWorldPosition;
          varying vec3 vViewPosition;
          uniform float time;
          uniform vec3 waterColorTop;
          uniform vec3 waterColorBottom;

          // Hash for volumetric caustics and turbidity noise
          vec2 hash2(vec2 p) {
            p = vec2(dot(p, vec2(127.1, 311.7)),
                     dot(p, vec2(269.5, 183.3)));
            return fract(sin(p) * 43758.5453);
          }

          // Simple value noise for turbidity
          float hash1(vec3 p) {
            float h = dot(p, vec3(127.1, 311.7, 74.7));
            return fract(sin(h) * 43758.5453123);
          }

          float valueNoise(vec3 p) {
            vec3 i = floor(p);
            vec3 f = fract(p);
            f = f * f * (3.0 - 2.0 * f); // smoothstep
            float a = hash1(i);
            float b = hash1(i + vec3(1.0, 0.0, 0.0));
            float c = hash1(i + vec3(0.0, 1.0, 0.0));
            float d = hash1(i + vec3(1.0, 1.0, 0.0));
            float e = hash1(i + vec3(0.0, 0.0, 1.0));
            float ff = hash1(i + vec3(1.0, 0.0, 1.0));
            float g = hash1(i + vec3(0.0, 1.0, 1.0));
            float h = hash1(i + vec3(1.0, 1.0, 1.0));
            return mix(mix(mix(a, b, f.x), mix(c, d, f.x), f.y),
                       mix(mix(e, ff, f.x), mix(g, h, f.x), f.y), f.z);
          }

          // Voronoi caustic for volume interior
          float voronoiCaustic(vec2 x, float t) {
            vec2 n = floor(x);
            vec2 f = fract(x);
            float md = 8.0;
            for (int j = -1; j <= 1; j++) {
              for (int i = -1; i <= 1; i++) {
                vec2 g = vec2(float(i), float(j));
                vec2 o = hash2(n + g);
                o = 0.5 + 0.5 * sin(t + 6.2831 * o);
                vec2 r = g + o - f;
                md = min(md, dot(r, r));
              }
            }
            float raw = 1.0 - sqrt(md);
            return pow(clamp(raw, 0.0, 1.0), 4.0);
          }

          void main() {
            vec3 normal = normalize(vNormal);
            vec3 viewDir = normalize(vViewPosition);

            // Depth: 0 at surface (y=2), 1 at bottom
            float depth = clamp((2.0 - vWorldPosition.y) / 9.95, 0.0, 1.0);

            // ── Beer's law absorption ──
            // Red absorbed first, green next, blue last (realistic water)
            vec3 absorptionCoeff = vec3(0.4, 0.1, 0.05);
            vec3 absorption = exp(-depth * 3.5 * absorptionCoeff);

            float extinction = exp(-depth * 2.8);
            // Cel-shaded bands for depth
            float depthStep = step(0.35, extinction) * 0.5 + step(0.75, extinction) * 0.5;
            vec3 baseColor = mix(waterColorBottom, waterColorTop, depthStep);
            baseColor *= absorption;

            // Fresnel scattering
            float fresnel = pow(1.0 - max(dot(viewDir, normal), 0.0), 3.0);
            vec3 scatterTint = vec3(0.12, 0.72, 0.78);
            vec3 scatterColor = mix(baseColor, scatterTint, fresnel * 0.4);

            // ── Animated caustic pattern on interior ──
            vec2 causticUV = vWorldPosition.xz * 0.35;
            float t = time * 0.5;
            float c1 = voronoiCaustic(causticUV * 3.5 + vec2(t * 0.15, t * 0.1), t * 0.8);
            float c2 = voronoiCaustic(causticUV * 5.0 + vec2(-t * 0.1, t * 0.2), t * 1.1 + 4.0);
            float caustic = c1 * 0.6 + c2 * 0.4;
            // Caustics are stronger near the top (light hasn't scattered as much)
            float causticStrength = caustic * 0.2 * (1.0 - depth * 0.7);
            vec3 causticColor = vec3(causticStrength * 0.7, causticStrength * 0.85, causticStrength);

            // ── Turbidity — subtle suspended particles ──
            vec3 noisePos = vWorldPosition * 1.5 + vec3(time * 0.08, time * 0.05, -time * 0.06);
            float turbidity = valueNoise(noisePos) * 0.06;
            // Particles scatter light slightly — warm tint
            vec3 turbidColor = vec3(0.15, 0.18, 0.12) * turbidity;

            vec3 finalColor = scatterColor + causticColor + turbidColor;

            // Gentler opacity near surface so the top doesn't create a harsh line
            float alpha = mix(0.15, 0.85, depth) + fresnel * 0.25;
            alpha = clamp(alpha, 0.15, 0.90);
            gl_FragColor = vec4(finalColor, alpha);
          }
        `}
      />
    </mesh>
  )
}

// Single GLB coral model — auto-scales and re-centers via JSX groups
function CoralModel({ file, position, targetHeight, rotationY }) {
  const { scene } = useGLTF(file)
  const sandY = getSandHeight(position[0], position[2])

  const { clone, scale, offsetX, offsetY, offsetZ } = useMemo(() => {
    // Measure on original scene
    const box = new THREE.Box3().setFromObject(scene)
    const size = new THREE.Vector3()
    box.getSize(size)
    const center = new THREE.Vector3()
    box.getCenter(center)

    const maxDim = Math.max(size.x, size.y, size.z)
    const s = maxDim > 0.001 ? targetHeight / maxDim : 1

    // Clone after measuring
    const c = scene.clone(true)

    // Force all meshes visible and shadow-casting
    c.traverse((child) => {
      if (child.isMesh) {
        child.visible = true
        child.castShadow = true
        child.receiveShadow = true
      }
    })

    return {
      clone: c,
      scale: s,
      offsetX: -center.x,
      offsetY: -box.min.y,
      offsetZ: -center.z
    }
  }, [scene, file, targetHeight])

  return (
    <group
      position={[position[0], sandY, position[2]]}
      rotation={[0, rotationY, 0]}
      scale={[scale, scale, scale]}
    >
      <primitive object={clone} position={[offsetX, offsetY, offsetZ]} />
    </group>
  )
}

export default function Decorations() {
  const corals = useMemo(() => {
    // Only use coral1 and coral3 — coral2 is 34MB and too heavy
    const models = ['/coral1.glb', '/coral3.glb']

    const placements = [
      { x: -3.5, z: -1.5 }, { x:  3.5, z: -1.5 },
      { x: -1.5, z: -2.5 }, { x:  1.5, z: -2.5 },
      { x: -3.0, z:  1.0 }, { x:  3.0, z:  1.0 },
    ]

    return placements.map((p, i) => {
      const file = models[i % models.length]
      const rotY = seedRandom(p.x, p.z, i) * Math.PI * 2
      const targetHeight = 1.2 + seedRandom(p.x, p.z, i * 7) * 1.6
      return { id: i, file, x: p.x, z: p.z, targetHeight, rotY }
    })
  }, [])

  return (
    <group>
      <CurvedSandFloor />
      <VolumetricWater />
      {/* <WaterSurface /> */}

      {corals.map((c) => (
        <CoralModel
          key={c.id}
          file={c.file}
          position={[c.x, 0, c.z]}
          targetHeight={c.targetHeight}
          rotationY={c.rotY}
        />
      ))}



    </group>
  )
}

// Preload coral GLBs
useGLTF.preload('/coral1.glb')
useGLTF.preload('/coral3.glb')
