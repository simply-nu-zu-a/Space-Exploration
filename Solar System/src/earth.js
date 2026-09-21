// =========================================================
// SPACE EXPLORATION · THREE.JS CINEMATIC EARTH ENGINE
// (Restored & Enhanced with homepage.js Visual Effects)
// =========================================================

import * as THREE from "three";
import { OrbitControls } from "orbitalControls";

// 1. ATMOSPHERE SHADERS (GLSL)
const vertexShader = `
varying vec3 vNormalWorld;
varying vec3 vWorldPosition;

void main() {
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;
    vNormalWorld = normalize(vec3(modelMatrix * vec4(normal, 0.0)));
    gl_Position = projectionMatrix * viewMatrix * worldPosition;
}
`;

const fragmentShader = `
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

// 2. RENDERER INITIALIZATION
const canvas = document.querySelector('#Earth');
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
renderer.toneMappingExposure = 1.08;

// 3. SCENE & FIXED CAMERA
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x01040a);

const camera = new THREE.PerspectiveCamera(16.5, window.innerWidth / window.innerHeight, 0.1, 150);
camera.position.set(0, 0, 12);

// 4. PLANETARY ROOT CONTAINER (Synchronized Tilt & Position Lerp)
const earthGroup = new THREE.Group();
earthGroup.rotation.z = THREE.MathUtils.degToRad(23.44);
earthGroup.rotation.x = THREE.MathUtils.degToRad(4.0);

let targetGroupX = -0.55;
let targetGroupY = 0.0;
let targetGroupScale = 1.0;
let isHudHiddenGlobal = false;
let isDataMode = false;

function updateTargetPosition() {
  const aspect = window.innerWidth / window.innerHeight;
  const scrollY = window.scrollY || window.pageYOffset || 0;
  const scrollMax = Math.max(window.innerHeight * 0.92, 1);
  const scrollProgress = Math.min(Math.max(scrollY / scrollMax, 0), 1);

  // Hero Mode parameters
  let heroX = isHudHiddenGlobal ? 0.0 : (aspect > 1.35 ? -0.55 : (aspect > 0.9 ? -0.35 : 0.0));
  let heroY = isHudHiddenGlobal ? 0.0 : (aspect > 0.9 ? 0.0 : 0.45);
  let heroScale = 1.0;

  // Data Mode parameters (Earth shifted right, pushed down, and scaled larger)
  let dataX = aspect > 1.25 ? 1.18 : (aspect > 0.85 ? 0.88 : 0.0);
  let dataY = aspect > 1.25 ? 0.10 : (aspect > 0.85 ? 0.18 : 0.35);
  let dataScale = aspect > 1.25 ? 0.62 : (aspect > 0.85 ? 0.52 : 0.42);

  // Smooth continuous transition synchronized with scroll progress
  targetGroupX = THREE.MathUtils.lerp(heroX, dataX, scrollProgress);
  targetGroupY = THREE.MathUtils.lerp(heroY, dataY, scrollProgress);
  targetGroupScale = THREE.MathUtils.lerp(heroScale, dataScale, scrollProgress);

  isDataMode = scrollProgress > 0.4;
}
updateTargetPosition();
scene.add(earthGroup);

// Listen to HUD visibility toggles & scroll
window.addEventListener('hud-toggle', (e) => {
  isHudHiddenGlobal = e.detail.isHudHidden;
  updateTargetPosition();
});

window.addEventListener('scroll', () => {
  updateTargetPosition();
}, { passive: true });

// 5. LIGHTING ARCHITECTURE (Dramatic 50/50 Half-Day & Half-Night Setup)
const ambientLight = new THREE.AmbientLight(0x061122, 0.25);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 4.6);
directionalLight.position.set(7.5, 0.4, 0.6);
directionalLight.castShadow = true;
scene.add(directionalLight);

const maxAnisotropy = renderer.capabilities.getMaxAnisotropy();
const lightDirection = new THREE.Vector3();
lightDirection.copy(directionalLight.position).normalize();

// 6. TEXTURES & HIGH-FIDELITY DAY/NIGHT TERMINATOR GLOBE
const textureLoader = new THREE.TextureLoader();

const dayTexture = textureLoader.load('../texture/planets/earth_day.jpg');
dayTexture.colorSpace = THREE.SRGBColorSpace;
dayTexture.anisotropy = Math.min(8, maxAnisotropy);
dayTexture.wrapS = THREE.RepeatWrapping;
dayTexture.wrapT = THREE.RepeatWrapping;

const nightTexture = textureLoader.load('../texture/planets/earth_night.jpg');
nightTexture.colorSpace = THREE.SRGBColorSpace;
nightTexture.anisotropy = Math.min(8, maxAnisotropy);

const globeGeometry = new THREE.SphereGeometry(1, 64, 64);
const globeMaterial = new THREE.MeshStandardMaterial({
  map: dayTexture,
  roughness: 0.82,
  metalness: 0.08
});

globeMaterial.onBeforeCompile = (shader) => {
  shader.uniforms.dayMap = { value: dayTexture };
  shader.uniforms.nightMap = { value: nightTexture };
  shader.uniforms.lightDirection = { value: lightDirection };
  shader.uniforms.atmosphereDayColor = { value: new THREE.Color('#38bdf8') };
  shader.uniforms.atmosphereTwilightColor = { value: new THREE.Color('#0284c7') };

  shader.vertexShader = shader.vertexShader.replace(
    '#include <common>',
    `#include <common>
    uniform vec3 lightDirection;
    varying float vDayFactor;
    `
  );

  shader.vertexShader = shader.vertexShader.replace(
    '#include <normal_vertex>',
    `#include <normal_vertex>
    vec3 viewLightDirection = normalize((viewMatrix * vec4(lightDirection, 0.0)).xyz);
    vDayFactor = max(dot(normalize(normalMatrix * normal), viewLightDirection), 0.0);
    `
  );

  shader.fragmentShader = shader.fragmentShader.replace(
    '#include <common>',
    `#include <common>
    uniform sampler2D dayMap;
    uniform sampler2D nightMap;
    uniform vec3 atmosphereDayColor;
    uniform vec3 atmosphereTwilightColor;
    uniform vec3 lightDirection;
    varying float vDayFactor;
    `
  );

  shader.fragmentShader = shader.fragmentShader.replace(
    '#include <map_fragment>',
    `
    #ifdef USE_MAP
    vec4 dayColor = texture2D(dayMap, vMapUv);
    vec4 nightColor = texture2D(nightMap, vMapUv);
    // Smooth transition from day to night city lights across the 50/50 terminator
    float lightAmount = smoothstep(-0.04, 0.22, vDayFactor);
    diffuseColor *= dayColor;
    // Radiant night city glow on the dark half
    totalEmissiveRadiance += nightColor.rgb * (1.0 - lightAmount) * 2.6;
    #endif
    `
  );

  shader.fragmentShader = shader.fragmentShader.replace(
    '#include <opaque_fragment>',
    `
    vec3 viewDir = normalize(vViewPosition);
    vec3 normalDir = normalize(vNormal);
    float fresnel = 1.0 - abs(dot(viewDir, normalDir));
    
    vec3 viewLightDir = normalize((viewMatrix * vec4(lightDirection, 0.0)).xyz);
    float sunOrientation = dot(normalDir, viewLightDir);
    
    float atmosphereDayStrength = smoothstep(-0.4, 0.9, sunOrientation);
    float atmosphereMix = clamp(atmosphereDayStrength * pow(fresnel, 2.0), 0.0, 1.0);
    
    float dayMix = smoothstep(-0.2, 0.7, sunOrientation);
    vec3 atmColor = mix(atmosphereTwilightColor, atmosphereDayColor, dayMix);
    
    outgoingLight = mix(outgoingLight, atmColor, atmosphereMix * 0.85);

    #include <opaque_fragment>
    `
  );
};

const globe = new THREE.Mesh(globeGeometry, globeMaterial);
globe.castShadow = true;
globe.receiveShadow = true;
globe.rotation.y = 4.35;
earthGroup.add(globe);

// 7. ATMOSPHERIC HALO
const atmosphereGeometry = new THREE.SphereGeometry(1.0, 64, 64);
const atmosphereMaterial = new THREE.ShaderMaterial({
  uniforms: {
    atmosphereDayColor: { value: new THREE.Color('#38bdf8') },
    atmosphereTwilightColor: { value: new THREE.Color('#0284c7') },
    uLightDirection: { value: lightDirection }
  },
  vertexShader,
  fragmentShader,
  blending: THREE.AdditiveBlending,
  side: THREE.BackSide,
  transparent: true,
  depthWrite: false,
});

const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
atmosphere.scale.setScalar(1.045);
earthGroup.add(atmosphere);

// 8. CLOUD LAYER
const cloudsTexture = textureLoader.load('../texture/planets/earth_clouds.jpg');
cloudsTexture.anisotropy = Math.min(8, maxAnisotropy);
cloudsTexture.colorSpace = THREE.SRGBColorSpace;

const cloudGeometry = new THREE.SphereGeometry(1.018, 64, 64);
const cloudMaterial = new THREE.MeshPhongMaterial({
  map: cloudsTexture,
  transparent: true,
  opacity: 0.44,
  blending: THREE.AdditiveBlending,
  depthWrite: false,
});

const clouds = new THREE.Mesh(cloudGeometry, cloudMaterial);
clouds.renderOrder = 1;
clouds.rotation.y = 4.35;
earthGroup.add(clouds);

// =========================================================
// 9. 16,000 TWINKLING STARFIELD (From homepage.js)
// =========================================================
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

const starCount = 16000;
const starPositions = new Float32Array(starCount * 3);
const starSizes = new Float32Array(starCount);
const starTwinkleSpeeds = new Float32Array(starCount);
const starTwinklePhases = new Float32Array(starCount);
const starColors = new Float32Array(starCount * 3);

const starPalette = [
  new THREE.Color('#ffffff'),
  new THREE.Color('#f0f9ff'),
  new THREE.Color('#bae6fd'),
  new THREE.Color('#7dd3fc'),
  new THREE.Color('#38bdf8'),
  new THREE.Color('#fef08a')
];

for (let i = 0; i < starCount; i++) {
  const theta = Math.random() * Math.PI * 2;
  const phi = Math.acos((Math.random() * 2) - 1);
  const distance = 40 + Math.random() * 95;

  starPositions[i * 3] = distance * Math.sin(phi) * Math.cos(theta);
  starPositions[i * 3 + 1] = distance * Math.sin(phi) * Math.sin(theta);
  starPositions[i * 3 + 2] = distance * Math.cos(phi);

  starSizes[i] = 0.22 + Math.random() * 0.38;
  starTwinkleSpeeds[i] = 1.2 + Math.random() * 3.5;
  starTwinklePhases[i] = Math.random() * Math.PI * 2;

  const color = starPalette[Math.floor(Math.random() * starPalette.length)];
  starColors[i * 3] = color.r;
  starColors[i * 3 + 1] = color.g;
  starColors[i * 3 + 2] = color.b;
}

const starGeometry = new THREE.BufferGeometry();
starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
starGeometry.setAttribute('aSize', new THREE.BufferAttribute(starSizes, 1));
starGeometry.setAttribute('aTwinkleSpeed', new THREE.BufferAttribute(starTwinkleSpeeds, 1));
starGeometry.setAttribute('aTwinklePhase', new THREE.BufferAttribute(starTwinklePhases, 1));
starGeometry.setAttribute('aColor', new THREE.BufferAttribute(starColors, 3));

const starMaterial = new THREE.ShaderMaterial({
  uniforms: {
    uTexture: { value: starTexture },
    uTime: { value: 0 }
  },
  vertexShader: starVertexShader,
  fragmentShader: starFragmentShader,
  transparent: true,
  blending: THREE.AdditiveBlending,
  depthWrite: false
});

const stars = new THREE.Points(starGeometry, starMaterial);
scene.add(stars);

// =========================================================
// 10. 3D NATURAL SATELLITE: THE MOON (LUNA)
// =========================================================
function createLunarTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#b8c0c8';
  ctx.fillRect(0, 0, 1024, 512);

  const imgData = ctx.getImageData(0, 0, 1024, 512);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() - 0.5) * 35;
    data[i] = Math.min(255, Math.max(0, data[i] + noise));
    data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
  }
  ctx.putImageData(imgData, 0, 0);

  const maria = [
    { x: 380, y: 220, r: 85, opacity: 0.45 },
    { x: 480, y: 200, r: 70, opacity: 0.42 },
    { x: 310, y: 270, r: 95, opacity: 0.48 },
    { x: 420, y: 310, r: 60, opacity: 0.38 },
    { x: 580, y: 240, r: 50, opacity: 0.35 },
    { x: 230, y: 230, r: 65, opacity: 0.40 },
    { x: 670, y: 280, r: 55, opacity: 0.32 },
    { x: 800, y: 210, r: 45, opacity: 0.30 }
  ];

  maria.forEach(m => {
    const grad = ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, m.r);
    grad.addColorStop(0, `rgba(45, 52, 60, ${m.opacity})`);
    grad.addColorStop(0.7, `rgba(70, 78, 88, ${m.opacity * 0.7})`);
    grad.addColorStop(1, 'rgba(180, 190, 200, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
    ctx.fill();
  });

  const craters = [
    { x: 410, y: 380, r: 18, ray: true },
    { x: 340, y: 220, r: 14, ray: true },
    { x: 270, y: 210, r: 10, ray: false },
    { x: 520, y: 160, r: 12, ray: false },
    { x: 390, y: 140, r: 15, ray: false },
    { x: 620, y: 340, r: 16, ray: false },
    { x: 740, y: 260, r: 11, ray: false },
    { x: 180, y: 330, r: 13, ray: false }
  ];

  craters.forEach(c => {
    ctx.fillStyle = 'rgba(40, 45, 52, 0.6)';
    ctx.beginPath();
    ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(245, 250, 255, 0.75)';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    if (c.ray) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
      ctx.lineWidth = 1.2;
      for (let a = 0; a < Math.PI * 2; a += Math.PI / 6) {
        ctx.beginPath();
        ctx.moveTo(c.x, c.y);
        ctx.lineTo(c.x + Math.cos(a) * (c.r * 4.5), c.y + Math.sin(a) * (c.r * 4.5));
        ctx.stroke();
      }
    }
  });

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

const moonTexture = textureLoader.load('../texture/moons/luna.jpg');
moonTexture.colorSpace = THREE.SRGBColorSpace;
moonTexture.anisotropy = Math.min(8, maxAnisotropy);

const moonGeometry = new THREE.SphereGeometry(0.26, 64, 64);
const moonMaterial = new THREE.MeshStandardMaterial({
  map: moonTexture,
  bumpMap: moonTexture,
  bumpScale: 0.018,
  roughness: 0.90,
  metalness: 0.05,
  color: 0xffffff
});

const moonMesh = new THREE.Mesh(moonGeometry, moonMaterial);
moonMesh.castShadow = true;
moonMesh.receiveShadow = true;

const moonOrbitGroup = new THREE.Group();
moonOrbitGroup.rotation.z = THREE.MathUtils.degToRad(5.14);
moonOrbitGroup.rotation.x = THREE.MathUtils.degToRad(2.0);

const MOON_ORBIT_RADIUS = 2.65;
moonMesh.position.set(MOON_ORBIT_RADIUS, 0, 0);
moonMesh.scale.setScalar(0);
moonOrbitGroup.add(moonMesh);

// 3D Measuring Laser Line Between Earth & Moon
const moonDistLineGeom = new THREE.BufferGeometry();
const moonDistLinePositions = new Float32Array([0, 0, 0, MOON_ORBIT_RADIUS, 0, 0]);
moonDistLineGeom.setAttribute('position', new THREE.BufferAttribute(moonDistLinePositions, 3));
const moonDistLineMat = new THREE.LineBasicMaterial({
  color: 0xffffff,
  transparent: true,
  opacity: 0.0,
  depthWrite: false,
  blending: THREE.AdditiveBlending
});
const moonDistLine = new THREE.Line(moonDistLineGeom, moonDistLineMat);
moonDistLine.visible = false;
moonOrbitGroup.add(moonDistLine);

function createMoonDistanceBadgeTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 160;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = 'rgba(4, 16, 42, 0.90)';
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.roundRect(10, 10, 492, 140, 32);
  ctx.fill();
  ctx.stroke();

  ctx.font = 'bold 22px "Orbitron", monospace, sans-serif';
  ctx.fillStyle = '#38bdf8';
  ctx.textAlign = 'center';
  ctx.fillText('LUNAR DISTANCE', 256, 50);

  ctx.font = '900 48px "Orbitron", monospace, sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = 'rgba(56, 189, 248, 0.85)';
  ctx.shadowBlur = 16;
  ctx.fillText('384,400 KM', 256, 114);

  return new THREE.CanvasTexture(canvas);
}

const moonDistBadgeTexture = createMoonDistanceBadgeTexture();
const moonDistBadgeMaterial = new THREE.SpriteMaterial({
  map: moonDistBadgeTexture,
  transparent: true,
  opacity: 0.0,
  depthTest: false
});
const moonDistBadge = new THREE.Sprite(moonDistBadgeMaterial);
moonDistBadge.scale.set(0.88, 0.28, 1.0);
moonDistBadge.position.set(MOON_ORBIT_RADIUS * 0.5, 0.28, 0);
moonDistBadge.visible = false;
moonOrbitGroup.add(moonDistBadge);

earthGroup.add(moonOrbitGroup);

let isMoonActive = false;
let moonCurrentScale = 0;
let targetMoonScale = 0;
let moonOrbitAngle = 0;
let isDistanceActive = false;
let distanceLineOpacity = 0.0;

window.addEventListener('moon-toggle', (e) => {
  isMoonActive = e.detail.isMoonActive;
  targetMoonScale = isMoonActive ? 1.0 : 0.0;
});

// =========================================================
// 11. 3D DIAMETER MEASURING CALIPER RING & BADGE
// =========================================================
function createDiameterBadgeTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 160;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = 'rgba(4, 16, 42, 0.88)';
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 4;

  ctx.beginPath();
  ctx.roundRect(10, 10, 492, 140, 32);
  ctx.fill();
  ctx.stroke();

  ctx.strokeStyle = 'rgba(56, 189, 248, 0.9)';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.font = 'bold 22px "Orbitron", monospace, sans-serif';
  ctx.fillStyle = '#38bdf8';
  ctx.textAlign = 'center';
  ctx.fillText('EQUATORIAL DIAMETER', 256, 50);

  ctx.font = '900 50px "Orbitron", monospace, sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = 'rgba(56, 189, 248, 0.85)';
  ctx.shadowBlur = 16;
  ctx.fillText('⌀ 12,742 KM', 256, 114);

  return new THREE.CanvasTexture(canvas);
}

const diameterGroup = new THREE.Group();
diameterGroup.visible = false;

const ringGeometry = new THREE.TorusGeometry(1.055, 0.007, 16, 128);
const ringMaterial = new THREE.MeshBasicMaterial({
  color: 0xffffff,
  transparent: true,
  opacity: 0.0,
  blending: THREE.AdditiveBlending
});
const diameterRing = new THREE.Mesh(ringGeometry, ringMaterial);
diameterRing.rotation.x = Math.PI / 2;
diameterGroup.add(diameterRing);

const outerRingGeom = new THREE.RingGeometry(1.05, 1.085, 96);
const outerRingMat = new THREE.MeshBasicMaterial({
  color: 0x38bdf8,
  transparent: true,
  opacity: 0.0,
  side: THREE.DoubleSide,
  blending: THREE.AdditiveBlending
});
const outerScanRing = new THREE.Mesh(outerRingGeom, outerRingMat);
outerScanRing.rotation.x = Math.PI / 2;
diameterGroup.add(outerScanRing);

const caliperGeom = new THREE.BufferGeometry();
const caliperVertices = new Float32Array([
  -1.06, 0.06, 0, -1.06, -0.06, 0,
  -1.06, 0.06, 0, -1.02, 0.06, 0,
  -1.06, -0.06, 0, -1.02, -0.06, 0,
  1.06, 0.06, 0, 1.06, -0.06, 0,
  1.06, 0.06, 0, 1.02, 0.06, 0,
  1.06, -0.06, 0, 1.02, -0.06, 0,
  -1.06, 0, 0, 1.06, 0, 0
]);
caliperGeom.setAttribute('position', new THREE.BufferAttribute(caliperVertices, 3));
const caliperMaterial = new THREE.LineBasicMaterial({
  color: 0xffffff,
  transparent: true,
  opacity: 0.0,
  linewidth: 2,
  blending: THREE.AdditiveBlending
});
const caliperLines = new THREE.LineSegments(caliperGeom, caliperMaterial);
diameterGroup.add(caliperLines);

const badgeTexture = createDiameterBadgeTexture();
const badgeMaterial = new THREE.SpriteMaterial({
  map: badgeTexture,
  transparent: true,
  opacity: 0.0,
  depthTest: false
});
const diameterBadge = new THREE.Sprite(badgeMaterial);
diameterBadge.scale.set(0.85, 0.27, 1.0);
diameterBadge.position.set(0, 0.28, 1.06);
diameterGroup.add(diameterBadge);

earthGroup.add(diameterGroup);

let isDiameterActive = false;
let diameterOpacity = 0.0;

// =========================================================
// 12. 3D SURFACE AREA SQUARE-TESSELLATED OPAQUE LAYER & BADGE
// =========================================================
function createSurfaceGridTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = 'rgba(6, 24, 52, 0.55)';
  ctx.fillRect(0, 0, 512, 256);

  const cols = 32;
  const rows = 16;
  const cellW = 512 / cols;
  const cellH = 256 / rows;

  for (let c = 0; c < cols; c++) {
    for (let r = 0; r < rows; r++) {
      const x = c * cellW;
      const y = r * cellH;
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.85)';
      ctx.lineWidth = 1.4;
      ctx.strokeRect(x + 1, y + 1, cellW - 2, cellH - 2);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.fillRect(x + cellW / 2 - 1, y + cellH / 2 - 1, 2, 2);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

function createSurfaceBadgeTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 160;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = 'rgba(4, 16, 42, 0.88)';
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.roundRect(10, 10, 492, 140, 32);
  ctx.fill();
  ctx.stroke();

  ctx.font = 'bold 22px "Orbitron", monospace, sans-serif';
  ctx.fillStyle = '#38bdf8';
  ctx.textAlign = 'center';
  ctx.fillText('TOTAL SURFACE AREA', 256, 50);

  ctx.font = '900 50px "Orbitron", monospace, sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = 'rgba(56, 189, 248, 0.85)';
  ctx.shadowBlur = 16;
  ctx.fillText('510.0M KM²', 256, 114);

  return new THREE.CanvasTexture(canvas);
}

const surfaceGroup = new THREE.Group();
surfaceGroup.visible = false;

const surfaceGridTexture = createSurfaceGridTexture();
const surfaceGridGeom = new THREE.SphereGeometry(1.035, 64, 32);
const surfaceGridMat = new THREE.MeshBasicMaterial({
  map: surfaceGridTexture,
  transparent: true,
  opacity: 0.0,
  depthWrite: false,
  blending: THREE.AdditiveBlending
});
const surfaceGridMesh = new THREE.Mesh(surfaceGridGeom, surfaceGridMat);
surfaceGroup.add(surfaceGridMesh);

const surfaceWireGeom = new THREE.SphereGeometry(1.042, 32, 16);
const surfaceWireMat = new THREE.MeshBasicMaterial({
  wireframe: true,
  color: 0x38bdf8,
  transparent: true,
  opacity: 0.0,
  depthWrite: false,
  blending: THREE.AdditiveBlending
});
const surfaceWireMesh = new THREE.Mesh(surfaceWireGeom, surfaceWireMat);
surfaceGroup.add(surfaceWireMesh);

const surfaceBadgeTexture = createSurfaceBadgeTexture();
const surfaceBadgeMaterial = new THREE.SpriteMaterial({
  map: surfaceBadgeTexture,
  transparent: true,
  opacity: 0.0,
  depthTest: false
});
const surfaceBadge = new THREE.Sprite(surfaceBadgeMaterial);
surfaceBadge.scale.set(0.88, 0.28, 1.0);
surfaceBadge.position.set(0, 0.28, 1.06);
surfaceGroup.add(surfaceBadge);

earthGroup.add(surfaceGroup);

let isSurfaceActive = false;
let surfaceOpacity = 0.0;

// Listen to metric selections from Telemetry HUD
window.addEventListener('metric-selected', (e) => {
  const metric = e.detail.metric;
  isDiameterActive = (metric === 'diameter');
  isSurfaceActive = (metric === 'surface');
  isDistanceActive = (metric === 'distance');
});

window.addEventListener('metric-closed', () => {
  isDiameterActive = false;
  isSurfaceActive = false;
  isDistanceActive = false;
});

// =========================================================
// 13. ORBIT CONTROLS (SCROLL, DRAG, ROTATE, PAN & ZOOM)
// =========================================================
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.minDistance = 2.0;
controls.maxDistance = 18.0;
controls.enablePan = true;
controls.autoRotate = false;

// RESIZE LISTENER
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  updateTargetPosition();
});

// =========================================================
// 14. MAIN ANIMATION LOOP
// =========================================================
function animate() {
  requestAnimationFrame(animate);
  controls.update();

  const elapsedTime = performance.now() * 0.001;
  // Animate twinkling multi-colored starfield
  starMaterial.uniforms.uTime.value = elapsedTime;

  // Smooth cinematic repositioning & scaling between Hero & Data modes
  earthGroup.position.x += (targetGroupX - earthGroup.position.x) * 0.06;
  earthGroup.position.y += (targetGroupY - earthGroup.position.y) * 0.06;

  const currentScale = earthGroup.scale.x;
  const newScale = currentScale + (targetGroupScale - currentScale) * 0.06;
  earthGroup.scale.setScalar(newScale);

  // Subtle natural planetary rotation
  const baseRotation = isDataMode ? 0.0012 : 0.0006;
  globe.rotation.y += baseRotation;
  clouds.rotation.y += baseRotation * 1.4;

  // Smooth Moon scaling interpolation & 3D orbital revolution
  moonCurrentScale += (targetMoonScale - moonCurrentScale) * 0.08;
  moonMesh.scale.setScalar(moonCurrentScale);
  moonMesh.visible = moonCurrentScale > 0.005;

  if (moonMesh.visible) {
    moonOrbitAngle += 0.0035;
    moonMesh.position.x = Math.cos(moonOrbitAngle) * MOON_ORBIT_RADIUS;
    moonMesh.position.z = Math.sin(moonOrbitAngle) * MOON_ORBIT_RADIUS;
    moonMesh.position.y = Math.sin(moonOrbitAngle * 2) * 0.14;

    moonMesh.rotation.y += 0.0035;

    // Update Moon Laser Distance Line
    const posAttr = moonDistLineGeom.attributes.position;
    posAttr.setXYZ(1, moonMesh.position.x, moonMesh.position.y, moonMesh.position.z);
    posAttr.needsUpdate = true;

    // Update Moon Distance Badge position (midpoint)
    moonDistBadge.position.set(moonMesh.position.x * 0.5, moonMesh.position.y * 0.5 + 0.28, moonMesh.position.z * 0.5);
  }

  // Smooth Moon Distance Measuring Line & Badge (Strictly visible ONLY when Distance tag is selected AND Moon is active)
  const shouldShowMoonDist = isDistanceActive && isMoonActive;
  const targetDistanceLineOpacity = shouldShowMoonDist ? 1.0 : 0.0;
  distanceLineOpacity += (targetDistanceLineOpacity - distanceLineOpacity) * 0.10;

  moonDistLine.visible = distanceLineOpacity > 0.01;
  moonDistBadge.visible = distanceLineOpacity > 0.01;

  if (moonDistLine.visible) {
    moonDistLineMat.opacity = distanceLineOpacity * 0.95;
    moonDistBadgeMaterial.opacity = distanceLineOpacity;
  }

  // Smooth Diameter Ring & Numbers Animation
  const targetDiameterOpacity = isDiameterActive ? 1.0 : 0.0;
  diameterOpacity += (targetDiameterOpacity - diameterOpacity) * 0.09;
  diameterGroup.visible = diameterOpacity > 0.005;

  if (diameterGroup.visible) {
    ringMaterial.opacity = diameterOpacity * 0.95;
    outerRingMat.opacity = diameterOpacity * 0.45;
    caliperMaterial.opacity = diameterOpacity * 0.85;
    badgeMaterial.opacity = diameterOpacity;

    const scaleFactor = 0.94 + (diameterOpacity * 0.06);
    diameterGroup.scale.setScalar(scaleFactor);
    outerScanRing.rotation.z += 0.003;
  }

  // Smooth Surface Area Square Layer & Badge Animation
  const targetSurfaceOpacity = isSurfaceActive ? 1.0 : 0.0;
  surfaceOpacity += (targetSurfaceOpacity - surfaceOpacity) * 0.10;
  surfaceGroup.visible = surfaceOpacity > 0.005;

  if (surfaceGroup.visible) {
    surfaceGridMat.opacity = surfaceOpacity * 0.85;
    surfaceWireMat.opacity = surfaceOpacity * 0.45;
    surfaceBadgeMaterial.opacity = surfaceOpacity;

    const scaleFactor = 0.95 + (surfaceOpacity * 0.05);
    surfaceGroup.scale.setScalar(scaleFactor);
    surfaceGridMesh.rotation.y += 0.001;
    surfaceWireMesh.rotation.y -= 0.001;
  }

  lightDirection.copy(directionalLight.position).normalize();
  renderer.render(scene, camera);
}
animate();

// =========================================================
// 15. STANDALONE DATA SECTION 3D MOON SHOWCASE ENGINE
// (Renders ONLY when user scrolls to Data Section)
// =========================================================
const moonSectionCanvas = document.querySelector('#MoonCanvas');
const moonCanvasWrapper = document.querySelector('#moonCanvasWrapper');

if (moonSectionCanvas && moonCanvasWrapper) {
  const moonScene = new THREE.Scene();

  const initialWidth = moonCanvasWrapper.clientWidth || 400;
  const initialHeight = moonCanvasWrapper.clientHeight || 380;

  const moonCam = new THREE.PerspectiveCamera(
    28,
    initialWidth / initialHeight,
    0.1,
    50
  );
  moonCam.position.set(0, 0, 4.6);

  const moonRen = new THREE.WebGLRenderer({
    canvas: moonSectionCanvas,
    antialias: true,
    alpha: true,
    powerPreference: "high-performance"
  });
  moonRen.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  moonRen.setSize(initialWidth, initialHeight, false);
  moonRen.outputColorSpace = THREE.SRGBColorSpace;
  moonRen.toneMapping = THREE.ACESFilmicToneMapping;
  moonRen.toneMappingExposure = 1.12;

  // Cinematic Lighting for Moon showcase
  const moonAmb = new THREE.AmbientLight(0x0e1c33, 0.45);
  moonScene.add(moonAmb);

  const moonSun = new THREE.DirectionalLight(0xffffff, 4.2);
  moonSun.position.set(5.0, 1.8, 3.2);
  moonScene.add(moonSun);

  // =========================================================
  // CUSTOM MOON TEXTURE PLACEHOLDER:
  // When you obtain your high-resolution Moon texture image,
  // simply uncomment the lines below and specify your file path:
  //
  // const textureLoader = new THREE.TextureLoader();
  // textureLoader.load('../texture/planets/moon.jpg', (customMoonTex) => {
  //   customMoonTex.colorSpace = THREE.SRGBColorSpace;
  //   customMoonTex.anisotropy = Math.min(8, maxAnisotropy);
  //   standaloneMoonMat.map = customMoonTex;
  //   standaloneMoonMat.bumpMap = customMoonTex;
  //   standaloneMoonMat.bumpScale = 0.02;
  //   standaloneMoonMat.needsUpdate = true;
  // });
  // =========================================================

  const standaloneMoonGeom = new THREE.SphereGeometry(0.65, 64, 64);
  const standaloneMoonMat = new THREE.MeshStandardMaterial({
    map: moonTexture,
    bumpMap: moonTexture,
    bumpScale: 0.025,
    roughness: 0.90,
    metalness: 0.05,
    color: 0xffffff
  });

  const standaloneMoon = new THREE.Mesh(standaloneMoonGeom, standaloneMoonMat);
  standaloneMoon.position.set(0, 0, 0);
  moonScene.add(standaloneMoon);

  // Restricted Orbit Controls (allows basic revolution & gentle inspection)
  const moonControls = new OrbitControls(moonCam, moonRen.domElement);
  moonControls.enableDamping = true;
  moonControls.dampingFactor = 0.06;
  moonControls.enableZoom = false; // Restricted zoom (keeps Moon in frame)
  moonControls.enablePan = false;  // Restricted pan (keeps Moon centered)
  moonControls.autoRotate = true;  // Continuous basic revolution
  moonControls.autoRotateSpeed = 0.85;
  moonControls.minPolarAngle = Math.PI * 0.28;
  moonControls.maxPolarAngle = Math.PI * 0.72;

  // Responsive Resize Handler with ResizeObserver
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

  // IntersectionObserver: Render ONLY when user scrolls to Data Section
  let isMoonInView = false;
  moonSectionCanvas.style.opacity = '0';
  moonSectionCanvas.style.transition = 'opacity 0.6s ease';

  if (window.IntersectionObserver) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        isMoonInView = entry.isIntersecting;
        moonSectionCanvas.style.opacity = isMoonInView ? '1' : '0';
        moonControls.enabled = isMoonInView;
        if (isMoonInView) {
          handleMoonResize();
        }
      });
    }, { threshold: 0.05 });

    observer.observe(moonCanvasWrapper);
  } else {
    isMoonInView = true;
    moonSectionCanvas.style.opacity = '1';
  }

  function animateMoonShowcase() {
    requestAnimationFrame(animateMoonShowcase);
    if (!isMoonInView) return; // Saves GPU & eliminates background bugs
    moonControls.update();
    moonRen.render(moonScene, moonCam);
  }
  animateMoonShowcase();
}