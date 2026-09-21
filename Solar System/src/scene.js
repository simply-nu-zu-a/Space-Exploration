// =========================================================
// SPACE EXPLORATION · THREE.JS UNIFIED PLANET ENGINE
// =========================================================

import * as THREE from "three";
import { OrbitControls } from "orbitalControls";
import WebGL from 'webgl';

// ---------------------------------------------------------
// Helper: 3D Canvas Badge Generator (Diameter & Surface Area)
// ---------------------------------------------------------
function createMetricBadgeTexture(text, accentColor = '#38bdf8') {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 140;
  const ctx = canvas.getContext('2d');

  // Pill Background
  ctx.fillStyle = 'rgba(2, 6, 23, 0.92)';
  ctx.beginPath();
  ctx.roundRect(16, 16, 480, 108, 54);
  ctx.fill();

  // Glowing Outer Border
  ctx.lineWidth = 4;
  ctx.strokeStyle = accentColor;
  ctx.stroke();

  // Inner Glow
  ctx.shadowColor = accentColor;
  ctx.shadowBlur = 18;
  ctx.stroke();

  // Typography
  ctx.shadowBlur = 0;
  ctx.font = 'bold 36px Orbitron, "Space Mono", sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 256, 70);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

// ---------------------------------------------------------
// Helper: Procedural Moon Texture Generator
// ---------------------------------------------------------
export function generateProceduralMoonTexture(moonName, baseColorHex = 0x94a3b8) {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 256;
  const ctx = c.getContext('2d');

  const baseColor = new THREE.Color(baseColorHex);
  ctx.fillStyle = `#${baseColor.getHexString()}`;
  ctx.fillRect(0, 0, 512, 256);

  // Add noise and craters based on moon character
  const isVolcanic = moonName.toLowerCase().includes('io');
  const isIcy = moonName.toLowerCase().includes('europa') || moonName.toLowerCase().includes('enceladus');
  const isTitan = moonName.toLowerCase().includes('titan');

  if (isVolcanic) {
    // Sulfur stains & dark volcanic calderas
    for (let i = 0; i < 40; i++) {
      const cx = Math.random() * 512;
      const cy = Math.random() * 256;
      const r = 6 + Math.random() * 28;
      ctx.fillStyle = Math.random() > 0.4 ? 'rgba(234, 88, 12, 0.65)' : 'rgba(20, 10, 5, 0.85)';
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (isIcy) {
    // Ice cracks and fractures
    ctx.strokeStyle = 'rgba(180, 83, 9, 0.4)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 25; i++) {
      ctx.beginPath();
      let sx = Math.random() * 512;
      let sy = Math.random() * 256;
      ctx.moveTo(sx, sy);
      for (let j = 0; j < 6; j++) {
        sx += (Math.random() - 0.5) * 80;
        sy += (Math.random() - 0.5) * 60;
        ctx.lineTo(sx, sy);
      }
      ctx.stroke();
    }
  } else if (isTitan) {
    // Smooth hazy atmospheric bands
    const grad = ctx.createLinearGradient(0, 0, 0, 256);
    grad.addColorStop(0, 'rgba(217, 119, 6, 0.9)');
    grad.addColorStop(0.5, 'rgba(245, 158, 11, 0.95)');
    grad.addColorStop(1, 'rgba(180, 83, 9, 0.9)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 256);
  } else {
    // Classic impact craters and Maria
    for (let i = 0; i < 60; i++) {
      const cx = Math.random() * 512;
      const cy = Math.random() * 256;
      const r = 4 + Math.random() * 22;
      ctx.fillStyle = 'rgba(15, 23, 42, 0.35)';
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();

      // Rim highlight
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(cx + 1, cy + 1, r, 0, Math.PI);
      ctx.stroke();
    }
  }

  const texture = new THREE.CanvasTexture(c);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// ---------------------------------------------------------
// Helper: 16,000 Twinkling Starfield
// ---------------------------------------------------------
function createRoundStarTexture() {
  const c = document.createElement('canvas');
  c.width = 32;
  c.height = 32;
  const ctx = c.getContext('2d');
  const grad = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
  grad.addColorStop(0.0, 'rgba(255, 255, 255, 1)');
  grad.addColorStop(0.25, 'rgba(224, 242, 254, 0.95)');
  grad.addColorStop(0.6, 'rgba(56, 189, 248, 0.4)');
  grad.addColorStop(1.0, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 32, 32);
  return new THREE.CanvasTexture(c);
}

export function addStarField(scene, count = 16000) {
  const starTexture = createRoundStarTexture();
  const starVertexShader = `
    attribute float aSize;
    attribute float aTwinkleSpeed;
    attribute float aTwinklePhase;
    attribute vec3 aColor;

    uniform float uTime;

    varying vec3 vColor;
    varying float vAlpha;

    void main() {
        vColor = aColor;
        float twinkle = sin(uTime * aTwinkleSpeed + aTwinklePhase) * 0.45 + 0.55;
        vAlpha = twinkle;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = aSize * (150.0 / -mvPosition.z) * (0.7 + 0.6 * twinkle);
        gl_Position = projectionMatrix * mvPosition;
    }
  `;

  const starFragmentShader = `
    uniform sampler2D uTexture;
    varying vec3 vColor;
    varying float vAlpha;

    void main() {
        vec4 texColor = texture2D(uTexture, gl_PointCoord);
        if (texColor.a < 0.02) discard;
        gl_FragColor = vec4(vColor, texColor.a * vAlpha * 0.98);
    }
  `;

  const starGeo = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const speeds = new Float32Array(count);
  const phases = new Float32Array(count);
  const colors = new Float32Array(count * 3);

  const starPalette = [
    new THREE.Color('#ffffff'),
    new THREE.Color('#f0f9ff'),
    new THREE.Color('#bae6fd'),
    new THREE.Color('#7dd3fc'),
    new THREE.Color('#38bdf8'),
    new THREE.Color('#fef08a')
  ];

  for (let i = 0; i < count; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos((Math.random() * 2) - 1);
    const distance = 40 + Math.random() * 95;

    positions[i * 3] = distance * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = distance * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = distance * Math.cos(phi);

    sizes[i] = 0.22 + Math.random() * 0.38;
    speeds[i] = 1.2 + Math.random() * 3.5;
    phases[i] = Math.random() * Math.PI * 2;

    const chosenColor = starPalette[Math.floor(Math.random() * starPalette.length)];
    colors[i * 3] = chosenColor.r;
    colors[i * 3 + 1] = chosenColor.g;
    colors[i * 3 + 2] = chosenColor.b;
  }

  starGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  starGeo.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
  starGeo.setAttribute('aTwinkleSpeed', new THREE.BufferAttribute(speeds, 1));
  starGeo.setAttribute('aTwinklePhase', new THREE.BufferAttribute(phases, 1));
  starGeo.setAttribute('aColor', new THREE.BufferAttribute(colors, 3));

  const starMat = new THREE.ShaderMaterial({
    uniforms: {
      uTexture: { value: starTexture },
      uTime: { value: 0 }
    },
    vertexShader: starVertexShader,
    fragmentShader: starFragmentShader,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });

  const starMesh = new THREE.Points(starGeo, starMat);
  scene.add(starMesh);
  return { mesh: starMesh, material: starMat };
}

// =========================================================
// ATMOSPHERE SHADERS (GLSL Inspired by earth.js)
// =========================================================
const atmosphereVertexShader = `
varying vec3 vNormalWorld;
varying vec3 vWorldPosition;

void main() {
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;
    vNormalWorld = normalize(vec3(modelMatrix * vec4(normal, 0.0)));
    gl_Position = projectionMatrix * viewMatrix * worldPosition;
}
`;

const atmosphereFragmentShader = `
uniform vec3 atmosphereDayColor;
uniform vec3 atmosphereTwilightColor;
uniform vec3 uLightDirection;

varying vec3 vNormalWorld;
varying vec3 vWorldPosition;

void main() {
    vec3 viewDirection = normalize(vWorldPosition - cameraPosition);
    vec3 normalWorld = normalize(vNormalWorld);
    float fresnel = 1.0 - abs(dot(viewDirection, normalWorld));
    float sunOrientation = dot(normalWorld, uLightDirection);
    float dayMix = smoothstep(-0.25, 0.75, sunOrientation);
    vec3 atmosphereColor = mix(atmosphereTwilightColor, atmosphereDayColor, dayMix);
    float remappedFresnel = clamp((fresnel - 0.73) / (1.0 - 0.73), 0.0, 1.0);
    float alpha = pow(1.0 - remappedFresnel, 2.0);
    alpha *= smoothstep(-0.5, 1.0, sunOrientation);
    gl_FragColor = vec4(atmosphereColor, alpha);
}
`;

// =========================================================
// MAIN EXPORT: createPlanetScene
// =========================================================
export function createPlanetScene({
  canvas,
  planetKey = "earth",
  planetRadius = 1.0,
  planetColor = 0xffffff,
  roughness = 0.85,
  metalness = 0.05,
  axialTilt = 0.0,
  rotationSpeed = 0.001,
  hasAtmosphere = false,
  atmosphereColor = 0x38bdf8,
  atmosphereDayColor = null,
  atmosphereTwilightColor = null,
  atmosphereSurfaceStrength = 0.65,
  atmosphereScale = 1.045,
  texturePath = null,
  bumpPath = null,
  hasClouds = false,
  cloudsPath = null,
  cloudsOpacity = 0.40,
  cloudsScale = 1.018,
  emissiveIntensity = 0.0,
  emissiveColor = 0xffffff,
  hasRings = false,
  ringInnerRadius = 1.3,
  ringOuterRadius = 2.4,
  ringColor = 0xc8b28a,
  ringTexturePath = null,
  diameterText = "12,742 KM",
  surfaceAreaText = "510.0M KM²",
  heroMoons = [],
  showcaseMoons = [],
  cameraDistance = 10.8,
  fov = 15.5
}) {
  if (!canvas) throw new Error("Canvas element not provided.");

  // 1. RENDERER INITIALIZATION
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: "high-performance"
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;
  canvas.__threeRenderer = renderer;

  // 2. SCENE
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x01040a);

  // 3. CAMERA
  const camera = new THREE.PerspectiveCamera(fov, window.innerWidth / window.innerHeight, 0.1, 150);
  camera.position.set(0, 0, cameraDistance);

  const isStar = (planetKey === "sun");

  // 4. PLANETARY GROUP
  const planetGroup = new THREE.Group();
  planetGroup.rotation.z = THREE.MathUtils.degToRad(axialTilt);
  planetGroup.rotation.x = THREE.MathUtils.degToRad(5.0);
  scene.add(planetGroup);

  // 5. LIGHTING (Stars emit their own omnidirectional light; planets use directional sunlight)
  const lightDirection = new THREE.Vector3(-6.5, 3.2, 4.2).normalize();
  if (isStar) {
    const starAmbient = new THREE.AmbientLight(0xfff7e6, 1.8);
    scene.add(starAmbient);

    const starOmniLight = new THREE.PointLight(0xfffaed, 8.0, 300);
    starOmniLight.position.set(0, 0, 0);
    scene.add(starOmniLight);
  } else {
    const ambientLight = new THREE.AmbientLight(0x0e1c33, 0.35);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 5.2);
    sunLight.position.copy(lightDirection).multiplyScalar(10);
    scene.add(sunLight);
  }

  // 6. TEXTURES LOADER
  const textureLoader = new THREE.TextureLoader();
  const maxAnisotropy = renderer.capabilities.getMaxAnisotropy();

  let planetTexture = null;
  if (texturePath) {
    planetTexture = textureLoader.load(texturePath);
    planetTexture.colorSpace = THREE.SRGBColorSpace;
    planetTexture.anisotropy = Math.min(8, maxAnisotropy);
  }

  let bumpTexture = null;
  if (bumpPath) {
    bumpTexture = textureLoader.load(bumpPath);
    bumpTexture.anisotropy = Math.min(8, maxAnisotropy);
  }

  // 7. GLOBE MESH & CINEMATIC FRESNEL ATMOSPHERE LIMB BLEND
  const globeGeometry = new THREE.SphereGeometry(planetRadius, 64, 64);
  const globeMaterial = isStar
    ? new THREE.MeshBasicMaterial({
      map: planetTexture || null,
      color: 0xffffff
    })
    : new THREE.MeshStandardMaterial({
      color: planetColor,
      roughness: roughness,
      metalness: metalness,
      map: planetTexture || null,
      bumpMap: bumpTexture || null,
      bumpScale: bumpTexture ? 0.025 : 0.0,
      emissive: (planetTexture && emissiveIntensity > 0) ? (new THREE.Color(emissiveColor)) : (new THREE.Color(0x000000)),
      emissiveMap: (planetTexture && emissiveIntensity > 0) ? planetTexture : null,
      emissiveIntensity: emissiveIntensity
    });

  // 8. OPTIONAL ATMOSPHERE & SOLAR CORONA
  let atmosphereMesh = null;

  if (hasAtmosphere) {
    const dayColorObj = new THREE.Color(atmosphereDayColor || atmosphereColor || 0x38bdf8);
    const twilightColorObj = new THREE.Color(atmosphereTwilightColor || atmosphereColor || 0x0284c7);

    if (isStar) {
      const coronaGeometry = new THREE.SphereGeometry(planetRadius * (atmosphereScale || 1.075), 64, 64);
      const coronaMaterial = new THREE.ShaderMaterial({
        uniforms: {
          coronaColor1: { value: dayColorObj },
          coronaColor2: { value: twilightColorObj }
        },
        vertexShader: `
          varying vec3 vNormalWorld;
          varying vec3 vWorldPosition;
          void main() {
            vec4 worldPosition = modelMatrix * vec4(position, 1.0);
            vWorldPosition = worldPosition.xyz;
            vNormalWorld = normalize(vec3(modelMatrix * vec4(normal, 0.0)));
            gl_Position = projectionMatrix * viewMatrix * worldPosition;
          }
        `,
        fragmentShader: `
          uniform vec3 coronaColor1;
          uniform vec3 coronaColor2;
          varying vec3 vNormalWorld;
          varying vec3 vWorldPosition;
          void main() {
            vec3 viewDirection = normalize(vWorldPosition - cameraPosition);
            vec3 normalWorld = normalize(vNormalWorld);
            float fresnel = 1.0 - abs(dot(viewDirection, normalWorld));
            float remappedFresnel = clamp((fresnel - 0.73) / (1.0 - 0.73), 0.0, 1.0);
            float alpha = pow(1.0 - remappedFresnel, 2.0);
            vec3 coronaColor = mix(coronaColor1, coronaColor2, remappedFresnel);
            gl_FragColor = vec4(coronaColor, alpha * 0.95);
          }
        `,
        blending: THREE.AdditiveBlending,
        side: THREE.BackSide,
        transparent: true,
        depthWrite: false
      });
      atmosphereMesh = new THREE.Mesh(coronaGeometry, coronaMaterial);
      planetGroup.add(atmosphereMesh);
    } else {
      globeMaterial.onBeforeCompile = (shader) => {
        shader.uniforms.atmosphereDayColor = { value: dayColorObj };
        shader.uniforms.atmosphereTwilightColor = { value: twilightColorObj };
        shader.uniforms.uAtmLightDir = { value: lightDirection };

        shader.fragmentShader = shader.fragmentShader.replace(
          '#include <common>',
          `#include <common>
          uniform vec3 atmosphereDayColor;
          uniform vec3 atmosphereTwilightColor;
          uniform vec3 uAtmLightDir;
          `
        );

        shader.fragmentShader = shader.fragmentShader.replace(
          '#include <opaque_fragment>',
          `
          vec3 viewDir = normalize(vViewPosition);
          vec3 normalDir = normalize(vNormal);
          float fresnel = 1.0 - abs(dot(viewDir, normalDir));
          
          vec3 viewLightDir = normalize((viewMatrix * vec4(uAtmLightDir, 0.0)).xyz);
          float sunOrientation = dot(normalDir, viewLightDir);
          
          float atmosphereDayStrength = smoothstep(-0.4, 0.9, sunOrientation);
          float atmosphereMix = clamp(atmosphereDayStrength * pow(fresnel, 2.0), 0.0, 1.0);
          
          float dayMix = smoothstep(-0.2, 0.7, sunOrientation);
          vec3 atmColor = mix(atmosphereTwilightColor, atmosphereDayColor, dayMix);
          
          outgoingLight = mix(outgoingLight, atmColor, atmosphereMix * ${atmosphereSurfaceStrength.toFixed(2)});

          #include <opaque_fragment>
          `
        );
      };

      const atmosphereGeometry = new THREE.SphereGeometry(planetRadius * atmosphereScale, 64, 64);
      const atmosphereMaterial = new THREE.ShaderMaterial({
        uniforms: {
          atmosphereDayColor: { value: dayColorObj },
          atmosphereTwilightColor: { value: twilightColorObj },
          uLightDirection: { value: lightDirection }
        },
        vertexShader: atmosphereVertexShader,
        fragmentShader: atmosphereFragmentShader,
        blending: THREE.AdditiveBlending,
        side: THREE.BackSide,
        transparent: true,
        depthWrite: false
      });
      atmosphereMesh = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
      planetGroup.add(atmosphereMesh);
    }
  }

  const globe = new THREE.Mesh(globeGeometry, globeMaterial);
  if (!isStar) {
    globe.castShadow = true;
    globe.receiveShadow = true;
  }
  planetGroup.add(globe);

  // 9. OPTIONAL CLOUD LAYER
  let cloudsMesh = null;
  if (hasClouds && cloudsPath) {
    const cloudsTex = textureLoader.load(cloudsPath);
    cloudsTex.colorSpace = THREE.SRGBColorSpace;
    cloudsTex.anisotropy = Math.min(8, maxAnisotropy);

    const cloudGeometry = new THREE.SphereGeometry(planetRadius * cloudsScale, 64, 64);
    const cloudMaterial = new THREE.MeshPhongMaterial({
      map: cloudsTex,
      transparent: true,
      opacity: cloudsOpacity,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    cloudsMesh = new THREE.Mesh(cloudGeometry, cloudMaterial);
    cloudsMesh.renderOrder = 1;
    planetGroup.add(cloudsMesh);
  }

  // 10. OPTIONAL RINGS
  let ringMesh = null;
  if (hasRings) {
    const ringGeometry = new THREE.RingGeometry(ringInnerRadius, ringOuterRadius, 128, 8);

    let ringMaterial;
    if (ringTexturePath) {
      const ringTex = textureLoader.load(ringTexturePath);
      ringTex.colorSpace = THREE.SRGBColorSpace;
      ringTex.anisotropy = Math.min(8, maxAnisotropy);

      // Re-map RingGeometry UVs radially so the 1D/2D strip maps from inner to outer radius
      const pos = ringGeometry.attributes.position;
      const uv = ringGeometry.attributes.uv;
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const y = pos.getY(i);
        const r = Math.sqrt(x * x + y * y);
        const u = (r - ringInnerRadius) / (ringOuterRadius - ringInnerRadius);
        uv.setXY(i, Math.max(0, Math.min(1, u)), 0.5);
      }
      uv.needsUpdate = true;

      ringMaterial = new THREE.MeshStandardMaterial({
        map: ringTex,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.95,
        roughness: 0.50,
        metalness: 0.05,
        alphaTest: 0.01
      });
    } else {
      ringMaterial = new THREE.MeshStandardMaterial({
        color: ringColor,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.88,
        roughness: 0.55
      });
    }

    ringMesh = new THREE.Mesh(ringGeometry, ringMaterial);
    ringMesh.rotation.x = Math.PI / 2;
    ringMesh.castShadow = true;
    ringMesh.receiveShadow = true;
    planetGroup.add(ringMesh);
  }

  // =========================================================
  // 11. DIAMETER 3D CALIPER RING & FLOATING BADGE
  // =========================================================
  const caliperGroup = new THREE.Group();
  caliperGroup.visible = false;

  const ringGeo = new THREE.TorusGeometry(planetRadius * 1.035, 0.012, 16, 120);
  const ringMat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.95,
    blending: THREE.AdditiveBlending
  });
  const caliperRing = new THREE.Mesh(ringGeo, ringMat);
  caliperRing.rotation.x = Math.PI / 2;
  caliperGroup.add(caliperRing);

  // Extension ticks
  const lineMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.85 });
  const makeTick = (x) => {
    const g = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(x, 0, -planetRadius * 1.25),
      new THREE.Vector3(x, 0, planetRadius * 1.25)
    ]);
    return new THREE.Line(g, lineMat);
  };
  caliperGroup.add(makeTick(-planetRadius * 1.035));
  caliperGroup.add(makeTick(planetRadius * 1.035));

  // Floating Diameter Badge
  const diameterBadgeTex = createMetricBadgeTexture(`⌀ ${diameterText}`, '#ffffff');
  const diameterBadgeMat = new THREE.SpriteMaterial({
    map: diameterBadgeTex,
    transparent: true,
    depthWrite: false
  });
  const diameterBadge = new THREE.Sprite(diameterBadgeMat);
  diameterBadge.scale.set(1.4, 0.38, 1);
  diameterBadge.position.set(0, planetRadius * 1.28, 0);
  caliperGroup.add(diameterBadge);
  planetGroup.add(caliperGroup);

  // =========================================================
  // 12. SURFACE AREA SQUARE-TESSELLATED GRID & BADGE
  // =========================================================
  const surfaceGroup = new THREE.Group();
  surfaceGroup.visible = false;

  const gridGeo = new THREE.SphereGeometry(planetRadius * 1.025, 36, 18);
  const gridMat = new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
    wireframe: true,
    transparent: true,
    opacity: 0.65,
    blending: THREE.AdditiveBlending
  });
  const surfaceGrid = new THREE.Mesh(gridGeo, gridMat);
  surfaceGroup.add(surfaceGrid);

  const surfaceBadgeTex = createMetricBadgeTexture(`◫ ${surfaceAreaText}`, '#38bdf8');
  const surfaceBadgeMat = new THREE.SpriteMaterial({
    map: surfaceBadgeTex,
    transparent: true,
    depthWrite: false
  });
  const surfaceBadge = new THREE.Sprite(surfaceBadgeMat);
  surfaceBadge.scale.set(1.5, 0.41, 1);
  surfaceBadge.position.set(0, planetRadius * 1.28, 0);
  surfaceGroup.add(surfaceBadge);
  planetGroup.add(surfaceGroup);

  // =========================================================
  // 13. 3D ORBITING MOONS IN HERO SECTION
  // =========================================================
  const heroMoonsGroup = new THREE.Group();
  heroMoonsGroup.visible = false;
  planetGroup.add(heroMoonsGroup);

  const heroMoonObjects = [];
  heroMoons.forEach((mDef) => {
    const mRadius = mDef.radius || 0.12;
    const mDist = mDef.orbitRadius || (planetRadius * 2.6);
    const mGeom = new THREE.SphereGeometry(mRadius, 32, 32);
    let mMat;
    if (mDef.texturePath) {
      const mTex = textureLoader.load(mDef.texturePath);
      mTex.colorSpace = THREE.SRGBColorSpace;
      mTex.anisotropy = Math.min(8, maxAnisotropy);
      mMat = new THREE.MeshStandardMaterial({
        map: mTex,
        roughness: 0.80,
        metalness: 0.05
      });
    } else {
      mMat = new THREE.MeshStandardMaterial({
        color: mDef.color || 0xd1d5db,
        roughness: 0.85,
        metalness: 0.05
      });
    }

    const mMesh = new THREE.Mesh(mGeom, mMat);

    // Orbit Ring
    const orbitRingGeo = new THREE.RingGeometry(mDist - 0.006, mDist + 0.006, 96);
    const orbitRingMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.25,
      depthWrite: false
    });
    const orbitRing = new THREE.Mesh(orbitRingGeo, orbitRingMat);
    orbitRing.rotation.x = Math.PI / 2;
    heroMoonsGroup.add(orbitRing);

    // Laser distance line to primary moon
    const laserMat = new THREE.LineBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.85,
      depthWrite: false
    });
    const laserGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(mDist, 0, 0)
    ]);
    const laserLine = new THREE.Line(laserGeo, laserMat);
    laserLine.visible = false;
    heroMoonsGroup.add(laserLine);

    heroMoonsGroup.add(mMesh);
    heroMoonObjects.push({
      mesh: mMesh,
      dist: mDist,
      speed: mDef.speed || 0.008,
      angle: Math.random() * Math.PI * 2,
      laserLine,
      distText: mDef.distText || "384,400 KM"
    });
  });

  // =========================================================
  // 14. STARFIELD
  // =========================================================
  const starfield = addStarField(scene, 12000);

  // =========================================================
  // 15. CONTROLS
  // =========================================================
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.minDistance = 2.2;
  controls.maxDistance = 22.0;

  // =========================================================
  // 16. DYNAMIC CENTERING & DATA MODE LERPING
  // =========================================================
  let targetGroupX = -0.55;
  let targetGroupY = 0.0;
  let targetScale = 1.0;
  let isHudHiddenGlobal = false;

  function updateLayoutTargets() {
    const scrollY = window.scrollY || window.pageYOffset || 0;
    const aspect = window.innerWidth / window.innerHeight;
    const inData = scrollY > window.innerHeight * 0.35;

    if (inData) {
      targetGroupX = aspect > 1.25 ? 1.18 : (aspect > 0.85 ? 0.88 : 0.0);
      targetGroupY = aspect > 1.25 ? 0.10 : (aspect > 0.85 ? 0.18 : 0.35);
      targetScale = aspect > 1.25 ? 0.62 : (aspect > 0.85 ? 0.52 : 0.42);
    } else if (isHudHiddenGlobal) {
      targetGroupX = 0.0;
      targetGroupY = 0.0;
      targetScale = 1.0;
    } else {
      if (aspect > 1.35) {
        targetGroupX = -0.55;
        targetGroupY = 0.0;
      } else if (aspect > 0.9) {
        targetGroupX = -0.35;
        targetGroupY = 0.0;
      } else {
        targetGroupX = 0.0;
        targetGroupY = 0.45;
      }
      targetScale = 1.0;
    }
  }
  updateLayoutTargets();

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    updateLayoutTargets();
  });

  window.addEventListener('scroll', updateLayoutTargets, { passive: true });

  window.addEventListener('hud-toggle', (e) => {
    isHudHiddenGlobal = e.detail.isHudHidden;
    updateLayoutTargets();
  });

  // Metric Selection Listener
  let isDistanceActive = false;
  window.addEventListener('metric-selected', (e) => {
    const metric = e.detail.metric;
    const isMoon = e.detail.isMoonActive;

    caliperGroup.visible = (metric === 'diameter');
    surfaceGroup.visible = (metric === 'surface');
    isDistanceActive = (metric === 'distance' && isMoon);

    heroMoonObjects.forEach(obj => {
      if (obj.laserLine) obj.laserLine.visible = isDistanceActive;
    });
  });

  window.addEventListener('metric-closed', () => {
    caliperGroup.visible = false;
    surfaceGroup.visible = false;
    isDistanceActive = false;
    heroMoonObjects.forEach(obj => {
      if (obj.laserLine) obj.laserLine.visible = false;
    });
  });

  window.addEventListener('moon-toggle', (e) => {
    heroMoonsGroup.visible = e.detail.isMoonActive;
  });

  // =========================================================
  // 17. ANIMATION LOOP (Using performance.now() to replace deprecated THREE.Clock)
  // =========================================================
  const startTime = performance.now();
  let lastTime = startTime;

  function animate() {
    requestAnimationFrame(animate);
    const now = performance.now();
    const delta = (now - lastTime) * 0.001;
    const elapsedTime = (now - startTime) * 0.001;
    lastTime = now;

    controls.update();

    // Smooth Lerp Position & Scale
    planetGroup.position.x += (targetGroupX - planetGroup.position.x) * 0.06;
    planetGroup.position.y += (targetGroupY - planetGroup.position.y) * 0.06;

    const currentScale = planetGroup.scale.x;
    const nextScale = currentScale + (targetScale - currentScale) * 0.06;
    planetGroup.scale.set(nextScale, nextScale, nextScale);

    // Planet & Solar Corona Rotations
    globe.rotation.y += rotationSpeed;
    if (cloudsMesh) cloudsMesh.rotation.y += rotationSpeed * 1.15;
    if (ringMesh) ringMesh.rotation.z += rotationSpeed * 0.35;
    if (surfaceGrid) surfaceGrid.rotation.y += rotationSpeed * 0.5;

    // Update dynamic atmosphere animation timing if uniform exists
    if (atmosphereMesh && atmosphereMesh.material && atmosphereMesh.material.uniforms && atmosphereMesh.material.uniforms.uTime) {
      atmosphereMesh.material.uniforms.uTime.value = elapsedTime;
    }

    // Orbiting Hero Moons
    heroMoonObjects.forEach(obj => {
      obj.angle += obj.speed;
      obj.mesh.position.set(
        Math.cos(obj.angle) * obj.dist,
        0,
        Math.sin(obj.angle) * obj.dist
      );
      obj.mesh.rotation.y += 0.01;

      if (obj.laserLine && isDistanceActive) {
        const pts = [new THREE.Vector3(0, 0, 0), obj.mesh.position];
        obj.laserLine.geometry.setFromPoints(pts);
      }
    });

    // Starfield Twinkle Uniform
    if (starfield && starfield.material.uniforms) {
      starfield.material.uniforms.uTime.value = elapsedTime;
    }

    renderer.render(scene, camera);
  }
  animate();

  // =========================================================
  // 18. STANDALONE DATA SECTION 3D MOON SHOWCASE ENGINE
  // =========================================================
  initMultiMoonShowcaseEngine(showcaseMoons, planetKey);

  return { renderer, scene, camera, controls, planetGroup, globe, ringMesh, atmosphereMesh };
}

// ---------------------------------------------------------
// STANDALONE DATA SECTION 3D MULTI-MOON CAROUSEL RENDERER
// ---------------------------------------------------------
function initMultiMoonShowcaseEngine(showcaseMoons = [], planetKey = "earth") {
  const moonSectionCanvas = document.querySelector('#MoonCanvas');
  const moonCanvasWrapper = document.querySelector('#moonCanvasWrapper');

  if (!moonSectionCanvas || !moonCanvasWrapper || !showcaseMoons || showcaseMoons.length === 0) return;

  const moonScene = new THREE.Scene();

  const initialWidth = moonCanvasWrapper.clientWidth || 400;
  const initialHeight = moonCanvasWrapper.clientHeight || 380;

  const moonCam = new THREE.PerspectiveCamera(28, initialWidth / initialHeight, 0.1, 50);
  moonCam.position.set(0, 0, 4.4);

  let moonRen;
  try {
    moonRen = new THREE.WebGLRenderer({
      canvas: moonSectionCanvas,
      antialias: true,
      alpha: true,
      powerPreference: "default"
    });
  } catch (e) {
    console.warn("Multi-moon showcase WebGLRenderer creation failed:", e);
    return;
  }
  moonRen.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  moonRen.setSize(initialWidth, initialHeight, false);
  moonRen.outputColorSpace = THREE.SRGBColorSpace;
  moonRen.toneMapping = THREE.ACESFilmicToneMapping;
  moonRen.toneMappingExposure = 1.12;

  const showcaseTextureLoader = new THREE.TextureLoader();
  const showcaseMaxAnisotropy = moonRen.capabilities.getMaxAnisotropy();

  // Lighting
  const moonAmb = new THREE.AmbientLight(0x0e1c33, 0.45);
  moonScene.add(moonAmb);

  const moonSun = new THREE.DirectionalLight(0xffffff, 4.2);
  moonSun.position.set(5.0, 1.8, 3.2);
  moonScene.add(moonSun);

  // Mesh setup
  const standaloneMoonGeom = new THREE.SphereGeometry(0.65, 64, 64);
  const initialMoonDef = showcaseMoons[0] || {
    name: "Moon",
    color: 0xd1d5db,
    roughness: 0.85
  };

  function getShowcaseMoonTexture(mDef) {
    if (mDef && mDef.texturePath) {
      const tex = showcaseTextureLoader.load(mDef.texturePath);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = Math.min(8, showcaseMaxAnisotropy);
      return tex;
    }
    return generateProceduralMoonTexture(mDef ? mDef.name : "Moon", mDef ? mDef.color : 0xd1d5db);
  }

  const standaloneMoonMat = new THREE.MeshStandardMaterial({
    color: (initialMoonDef && initialMoonDef.texturePath) ? 0xffffff : (initialMoonDef.color || 0xd1d5db),
    roughness: initialMoonDef.roughness !== undefined ? initialMoonDef.roughness : 0.85,
    metalness: 0.05,
    map: getShowcaseMoonTexture(initialMoonDef)
  });

  const standaloneMoon = new THREE.Mesh(standaloneMoonGeom, standaloneMoonMat);
  standaloneMoon.position.set(0, 0, 0);
  moonScene.add(standaloneMoon);

  // OrbitControls
  const moonControls = new OrbitControls(moonCam, moonRen.domElement);
  moonControls.enableDamping = true;
  moonControls.dampingFactor = 0.06;
  moonControls.enableZoom = false;
  moonControls.enablePan = false;
  moonControls.autoRotate = true;
  moonControls.autoRotateSpeed = 0.85;
  moonControls.minPolarAngle = Math.PI * 0.28;
  moonControls.maxPolarAngle = Math.PI * 0.72;

  // ResizeObserver
  const handleMoonResize = () => {
    const width = moonCanvasWrapper.clientWidth;
    const height = moonCanvasWrapper.clientHeight;
    if (width > 0 && height > 0) {
      moonCam.aspect = width / height;
      moonCam.updateProjectionMatrix();
      moonRen.setSize(width, height, false);
    }
  };

  if (window.ResizeObserver) {
    const resizeObserver = new ResizeObserver(() => handleMoonResize());
    resizeObserver.observe(moonCanvasWrapper);
  }
  window.addEventListener('resize', handleMoonResize);

  // IntersectionObserver: Render ONLY in Data Section
  let isMoonInView = false;
  moonSectionCanvas.style.opacity = '0';
  moonSectionCanvas.style.transition = 'opacity 0.6s ease';

  if (window.IntersectionObserver) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        isMoonInView = entry.isIntersecting;
        moonSectionCanvas.style.opacity = isMoonInView ? '1' : '0';
        moonControls.enabled = isMoonInView;
        if (isMoonInView) handleMoonResize();
      });
    }, { threshold: 0.05 });
    observer.observe(moonCanvasWrapper);
  } else {
    isMoonInView = true;
    moonSectionCanvas.style.opacity = '1';
  }

  // Multi-Moon Carousel Change Listener
  window.addEventListener('moon-carousel-change', (e) => {
    const { moonIndex, moonData } = e.detail;
    const mDef = showcaseMoons[moonIndex] || {
      name: moonData.name,
      color: 0x94a3b8,
      roughness: 0.85
    };

    if (mDef.texturePath) {
      const tex = showcaseTextureLoader.load(mDef.texturePath);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = Math.min(8, showcaseMaxAnisotropy);
      standaloneMoonMat.map = tex;
      standaloneMoonMat.color.setHex(0xffffff);
    } else {
      standaloneMoonMat.map = generateProceduralMoonTexture(mDef.name || moonData.name, mDef.color || 0x94a3b8);
      standaloneMoonMat.color.setHex(mDef.color || 0x94a3b8);
    }
    standaloneMoonMat.roughness = mDef.roughness !== undefined ? mDef.roughness : 0.85;
    standaloneMoonMat.needsUpdate = true;
    standaloneMoonMat.needsUpdate = true;

    // Optional scale variation (e.g. potato shape for Phobos)
    if (mDef.scale) {
      standaloneMoon.scale.set(mDef.scale[0], mDef.scale[1], mDef.scale[2]);
    } else {
      standaloneMoon.scale.set(1, 1, 1);
    }
  });

  function animateMoonShowcase() {
    requestAnimationFrame(animateMoonShowcase);
    if (!isMoonInView) return;
    moonControls.update();
    moonRen.render(moonScene, moonCam);
  }
  animateMoonShowcase();
}
