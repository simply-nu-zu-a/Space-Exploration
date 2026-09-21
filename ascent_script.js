import * as THREE from "three";
import { OrbitControls } from "orbitalControls";
import { GLTFLoader } from "gltfLoader";
import WebGL from "webgl";

// WEBGL CAPABILITY VALIDATION
if (!WebGL.isWebGL2Available()) {
  const warning = WebGL.getWebGL2ErrorMessage();
  document.body.appendChild(warning);
}

// DOM ELEMENTS & HUD REFERENCES
const canvas = document.querySelector("#rocket");
const atmosCanvas = document.querySelector("#atmosphereCanvas");
const atmosCtx = atmosCanvas ? atmosCanvas.getContext("2d") : null;

const loadingOverlay = document.getElementById("loadingOverlay");
const progressBarFill = document.getElementById("progressBarFill");
const progressNumber = document.getElementById("progressNumber");
const meshCountChip = document.getElementById("meshCountChip");
const animCountChip = document.getElementById("animCountChip");
const errorDialog = document.getElementById("errorDialog");
const errorMessage = document.getElementById("errorMessage");
const errorDetail = document.getElementById("errorDetail");
const layerTransition = document.getElementById("layerTransition");
const hudTitleCard = document.querySelector(".hud-title-card");
const hudLayerCard = document.getElementById("hudLayerCard");
const hudLayerTitle = document.getElementById("hudLayerTitle");

const LAYER_DISPLAY_NAMES = {
  troposphere: "TROPOSPHERE",
  stratosphere: "STRATOSPHERE",
  mesosphere: "MESOSPHERE",
  thermosphere: "THERMOSPHERE",
  exosphere: "EXOSPHERE"
};

function updateLayerTitle(phase) {
  if (!hudLayerTitle) return;
  const name = LAYER_DISPLAY_NAMES[phase] || String(phase).toUpperCase();
  if (hudLayerTitle.textContent !== name) {
    hudLayerTitle.textContent = name;
    hudLayerTitle.classList.remove("layer-pulse");
    void hudLayerTitle.offsetWidth; // Force CSS reflow to re-trigger glow animation
    hudLayerTitle.classList.add("layer-pulse");
  }
}

// Elements for Launch Control Panel
const btnLaunch = document.getElementById("btnLaunch");
const btnLaunchText = document.getElementById("btnLaunchText");
const launchCounter = document.getElementById("launchCounter");
const btnResetAnim = document.getElementById("btnResetAnim");
const launchTimeline = document.getElementById("launchTimeline");
const animTimeDisplay = document.getElementById("animTimeDisplay");
const launchPulseDot = document.getElementById("launchPulseDot");
const missionPhaseLabel = document.getElementById("missionPhaseLabel");
const deckSubStatus = document.getElementById("deckSubStatus");
const btnOrbitControl = document.getElementById("btnOrbitControl") || document.getElementById("btnCameraMode");
const orbitGuideCard = document.getElementById("orbitGuideCard") || document.querySelector(".instructions-card");

const btnStrata = document.getElementById("btnStrata");
const btnLighting = document.getElementById("btnLighting");
const btnResetCamera = document.getElementById("btnResetCamera");
const strataSteps = document.querySelectorAll(".ladder-step");

// RENDERER
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
renderer.toneMappingExposure = 1.25;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;

// SCENE
const scene = new THREE.Scene();
scene.background = null;

// CAMERA
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.5, 4000);
camera.position.set(160, 95, 160);
// ORBIT CONTROLS
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.maxDistance = 2000;
controls.minDistance = 5;
controls.target.set(0, 35, 0);

// Orbit Control Restricted to Z-aix 
controls.minPolarAngle = Math.PI * 0.48;
controls.maxPolarAngle = Math.PI * 0.48;

const defaultCameraPos = new THREE.Vector3();
const defaultTarget = new THREE.Vector3(0, 35, 0);

// LIGHT
const ambientLight = new THREE.AmbientLight(0x1e293b, 1.4);
scene.add(ambientLight);

const hemiLight = new THREE.HemisphereLight(0xe0f2fe, 0x0f172a, 1.1);
hemiLight.position.set(0, 250, 0);
scene.add(hemiLight);

const sunLight = new THREE.DirectionalLight(0xfffbeb, 4.2);
sunLight.position.set(150, 240, 110);
sunLight.castShadow = true;
sunLight.shadow.mapSize.width = 2048;
sunLight.shadow.mapSize.height = 2048;
sunLight.shadow.camera.near = 10;
sunLight.shadow.camera.far = 800;
sunLight.shadow.camera.left = -200;
sunLight.shadow.camera.right = 200;
sunLight.shadow.camera.top = 200;
sunLight.shadow.camera.bottom = -200;
sunLight.shadow.bias = -0.0005;
scene.add(sunLight);

const fillLight = new THREE.DirectionalLight(0x60a5fa, 1.8);
fillLight.position.set(-150, 90, -110);
scene.add(fillLight);

const groundBounce = new THREE.DirectionalLight(0xf59e0b, 0.6);
groundBounce.position.set(0, -60, 40);
scene.add(groundBounce);

// Light Variation
const lightingPresets = [
  {
    name: "SUN",
    icon: "☀",
    sunColor: 0xfffbeb,
    sunIntensity: 4.2,
    fillColor: 0x60a5fa,
    fillIntensity: 1.8,
    ambientColor: 0x1e293b,
    ambientIntensity: 1.4,
    exposure: 1.25,
    sunsetRatio: 0.0
  },
  {
    name: "SUNSET",
    icon: "./Assets/sunset_icon.png",
    sunColor: 0xf97316,
    sunIntensity: 4.6,
    fillColor: 0x38bdf8,
    fillIntensity: 1.2,
    ambientColor: 0x451a03,
    ambientIntensity: 1.0,
    exposure: 1.15,
    sunsetRatio: 1.0
  },
  {
    name: "NIGHT",
    icon: "☾",
    sunColor: 0x9bb7e8,
    sunIntensity: 0.55,
    fillColor: 0x31558f,
    fillIntensity: 0.45,
    ambientColor: 0x071326,
    ambientIntensity: 0.7,
    exposure: 0.78,
    sunsetRatio: 0.0,
    atmosphereTheme: "night"
  }
];
let currentPresetIndex = 1;
let currentSunsetRatio = 1.0;
let targetSunsetRatio = 1.0;
let atmosphereTheme = "sunset";

function applyLightingPreset(index) {
  const p = lightingPresets[index];
  sunLight.color.setHex(p.sunColor);
  sunLight.intensity = p.sunIntensity;
  fillLight.color.setHex(p.fillColor);
  fillLight.intensity = p.fillIntensity;
  ambientLight.color.setHex(p.ambientColor);
  ambientLight.intensity = p.ambientIntensity;
  renderer.toneMappingExposure = p.exposure;
  targetSunsetRatio = p.sunsetRatio;
  atmosphereTheme = p.atmosphereTheme || (p.name === "SUNSET" ? "sunset" : "day");
  const iconMarkup = p.icon.includes("/")
    ? `<img src="${p.icon}" alt="${p.name} lighting icon" width="16" height="16" />`
    : `<span>${p.icon}</span>`;
  btnLighting.innerHTML = `${iconMarkup} LIGHT: ${p.name}`;
}

applyLightingPreset(currentPresetIndex);

// SHADER UNIFORMS: THRUSTER FLAME
// Custom GPU shader for Plane001 & Plane002 replacing flat solid preview
const fireVertexShader = `
  varying vec2 vUv;
  varying vec3 vWorldPosition;
  uniform float uTime;

  void main() {
    vUv = uv;
    vec3 pos = position;

    // Subtle supersonic exhaust flutter along the flame column
    float flutter = sin(pos.x * 4.5 - uTime * 28.0) * (pos.x / -10.481) * 0.06;
    pos.y += flutter;
    pos.z += flutter * 0.75;

    vec4 worldPos = modelMatrix * vec4(pos, 1.0);
    vWorldPosition = worldPos.xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

const fireFragmentShader = `
  varying vec2 vUv;
  varying vec3 vWorldPosition;
  uniform float uTime;
  uniform float uFlamePower;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }

  void main() {
    if (uFlamePower <= 0.01) {
      discard;
    }

    // u: 0.0 at nozzle throat -> 1.0 at exhaust tip
    float u = clamp(vUv.x, 0.0, 1.0);
    // v: 0.0 to 1.0 across the fin width (0.5 is center axis)
    float v = clamp(vUv.y, 0.0, 1.0);

    // Smooth volumetric radial falloff - eliminates hard polygon mesh edges!
    float radial = 1.0 - abs(v - 0.5) * 2.0;
    radial = clamp(radial, 0.0, 1.0);
    radial = pow(radial, 1.35);

    vec2 flowUv = vec2(u * 14.0 - uTime * 24.0, v * 6.0);
    float n1 = noise(flowUv);
    float n2 = noise(flowUv * 2.1 + vec2(-uTime * 9.0, uTime * 5.0));
    float turbulence = (n1 * 0.65 + n2 * 0.35) - 0.5;

    float shockDiamonds = sin(u * 26.0 - uTime * 4.0);
    shockDiamonds = clamp(shockDiamonds, 0.0, 1.0);
    shockDiamonds *= smoothstep(0.75, 0.08, u);

    // Plasma flicker
    float flicker = 0.92 + 0.08 * sin(uTime * 50.0 + u * 12.0);
    float uDistorted = clamp(u + turbulence * 0.14 * (0.25 + 0.75 * u), 0.0, 1.0);

    // Rocket_Combustion color gradient:- 
    vec3 cCore = vec3(1.0, 1.0, 1.0); // White plasma throat 
    vec3 cYellow = vec3(1.0, 0.92, 0.38); // electric lemon yellow
    vec3 cOrange = vec3(1.0, 0.44, 0.03); // blazing plasma orange
    vec3 cRed = vec3(0.88, 0.14, 0.01); // deep crimson amber
    vec3 cDark = vec3(0.32, 0.04, 0.01); // dark ember red

    vec3 flameColor;
    if (uDistorted < 0.12) {
      float t = uDistorted / 0.12;
      flameColor = mix(cCore, cYellow, t);
    } else if (uDistorted < 0.38) {
      float t = (uDistorted - 0.12) / 0.26;
      flameColor = mix(cYellow, cOrange, t);
    } else if (uDistorted < 0.72) {
      float t = (uDistorted - 0.38) / 0.34;
      flameColor = mix(cOrange, cRed, t);
    } else {
      float t = (uDistorted - 0.72) / 0.28;
      flameColor = mix(cRed, cDark, t);
    }

    // Add Mach shock diamond highlight along the central axis
    flameColor += shockDiamonds * vec3(0.45, 0.38, 0.20) * (1.0 - abs(v - 0.5) * 2.0);

    // Lengthwise alpha dissipation: full density near nozzle, fading to zero at the tip
    float lengthAlpha = 1.0 - smoothstep(0.60, 1.0, uDistorted);
    float alpha = radial * lengthAlpha * flicker * uFlamePower;

    // High-intensity white-hot core radiance
    float coreGlow = 1.0 + (1.0 - smoothstep(0.0, 0.35, u)) * 2.2 * radial;
    vec3 finalRgb = flameColor * coreGlow * 1.6;

    gl_FragColor = vec4(finalRgb, clamp(alpha, 0.0, 1.0));
  }
`;

const fireShaderMaterial = new THREE.ShaderMaterial({
  uniforms: {
    uTime: { value: 0 },
    uFlamePower: { value: 0.0 }
  },
  vertexShader: fireVertexShader,
  fragmentShader: fireFragmentShader,
  transparent: true,
  blending: THREE.AdditiveBlending,
  depthWrite: false,
  side: THREE.DoubleSide
});

// SHADER UNIFORMS: SMOKE PARTICLES
function createSmokeTexture() {
  const c = document.createElement("canvas");
  c.width = 64;
  c.height = 64;
  const ctx = c.getContext("2d");

  const grad = ctx.createRadialGradient(32, 32, 4, 32, 32, 32);
  grad.addColorStop(0, "rgba(255, 255, 255, 0.85)");
  grad.addColorStop(0.35, "rgba(235, 238, 242, 0.5)");
  grad.addColorStop(0.7, "rgba(180, 190, 205, 0.15)");
  grad.addColorStop(1, "rgba(100, 110, 125, 0.0)");

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 64, 64);

  const texture = new THREE.CanvasTexture(c);
  texture.needsUpdate = true;
  return texture;
}

const MAX_SMOKE_PARTICLES = 80;
const smokePositions = new Float32Array(MAX_SMOKE_PARTICLES * 3);
const smokeColors = new Float32Array(MAX_SMOKE_PARTICLES * 3);
const smokeAlphas = new Float32Array(MAX_SMOKE_PARTICLES);
const smokeSizes = new Float32Array(MAX_SMOKE_PARTICLES);

const smokeParticles = [];
for (let i = 0; i < MAX_SMOKE_PARTICLES; i++) {
  smokeParticles.push({
    active: false,
    x: 0, y: 0, z: 0,
    vx: 0, vy: 0, vz: 0,
    size: 15,
    maxSize: 65,
    life: 0,
    maxLife: 2.5,
    r: 0.85, g: 0.85, b: 0.88
  });
}

const smokeGeo = new THREE.BufferGeometry();
smokeGeo.setAttribute("position", new THREE.BufferAttribute(smokePositions, 3));
smokeGeo.setAttribute("color", new THREE.BufferAttribute(smokeColors, 3));
smokeGeo.setAttribute("alpha", new THREE.BufferAttribute(smokeAlphas, 1));
smokeGeo.setAttribute("size", new THREE.BufferAttribute(smokeSizes, 1));

const smokeMaterial = new THREE.ShaderMaterial({
  uniforms: {
    uTexture: { value: createSmokeTexture() }
  },
  vertexShader: `
    attribute float alpha;
    attribute float size;
    attribute vec3 color;
    varying float vAlpha;
    varying vec3 vColor;
    void main() {
      vAlpha = alpha;
      vColor = color;
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      gl_PointSize = size * (260.0 / -mvPosition.z);
      gl_Position = projectionMatrix * mvPosition;
    }
  `,
  fragmentShader: `
    uniform sampler2D uTexture;
    varying float vAlpha;
    varying vec3 vColor;
    void main() {
      if (vAlpha <= 0.01) discard;
      vec4 tex = texture2D(uTexture, gl_PointCoord);
      gl_FragColor = vec4(vColor * tex.rgb, tex.a * vAlpha);
    }
  `,
  transparent: true,
  depthWrite: false,
  blending: THREE.NormalBlending
});

const smokePoints = new THREE.Points(smokeGeo, smokeMaterial);
scene.add(smokePoints);

function updateSmokeParticles(delta, animTime) {
  let spawnCounter = 0;
  const isFiring = animTime >= 1.8;

  // Gather active thruster nozzle world positions
  const activeNozzlePositions = [];
  flamePlanes.forEach((plane) => {
    if (plane && plane.scale && plane.scale.x > 0.04) {
      const pos = new THREE.Vector3();
      plane.getWorldPosition(pos);
      activeNozzlePositions.push(pos);
    }
  });

  for (let i = 0; i < MAX_SMOKE_PARTICLES; i++) {
    const p = smokeParticles[i];

    if (!p.active) {
      if (isFiring && spawnCounter < 3 && Math.random() < 0.55) {
        p.active = true;
        p.life = 0;
        p.maxLife = 1.8 + Math.random() * 1.4;
        p.size = 14 + Math.random() * 8;
        p.maxSize = 65 + Math.random() * 30;

        if (animTime < 5.0) {
          // Launchpad trench billowing smoke
          const angle = Math.random() * Math.PI * 2;
          const speed = 12.0 + Math.random() * 22.0;
          p.x = (Math.random() - 0.5) * 8.0;
          p.y = 1.5 + Math.random() * 2.0;
          p.z = (Math.random() - 0.5) * 8.0;
          p.vx = Math.cos(angle) * speed;
          p.vy = 2.0 + Math.random() * 5.0;
          p.vz = Math.sin(angle) * speed;

          p.r = 0.96; p.g = 0.82; p.b = 0.65;
        } else {
          // Ascending exhaust smoke column trailing directly beneath active nozzles
          let basePos = null;
          if (activeNozzlePositions.length > 0) {
            basePos = activeNozzlePositions[Math.floor(Math.random() * activeNozzlePositions.length)];
          } else if (spacecraft) {
            basePos = new THREE.Vector3();
            spacecraft.getWorldPosition(basePos);
            basePos.y -= 13.0;
          }

          if (basePos) {
            p.x = basePos.x + (Math.random() - 0.5) * 3.0;
            p.y = basePos.y - Math.random() * 2.5;
            p.z = basePos.z + (Math.random() - 0.5) * 3.0;
            p.vx = (Math.random() - 0.5) * 4.0;
            p.vy = -16.0 - Math.random() * 12.0; // trailing downwards
            p.vz = (Math.random() - 0.5) * 4.0;
          }

          // Cool white-grey exhaust plume
          p.r = 0.88; p.g = 0.90; p.b = 0.94;
        }
        spawnCounter++;
      }
    } else {
      p.life += delta;
      if (p.life >= p.maxLife || !isFiring) {
        p.active = false;
        smokeAlphas[i] = 0.0;
        continue;
      }

      // Physics update: expansion and deceleration
      p.x += p.vx * delta;
      p.y += p.vy * delta;
      p.z += p.vz * delta;
      p.vx *= 0.95;
      p.vz *= 0.95;
      p.vy *= 0.92;

      const progress = p.life / p.maxLife;
      // Fade in quickly then smoothly fade out
      const alphaVal = progress < 0.2 ? (progress / 0.2) * 0.45 : (1.0 - progress) * 0.45;
      const curSize = p.size + (p.maxSize - p.size) * progress;

      smokePositions[i * 3] = p.x;
      smokePositions[i * 3 + 1] = p.y;
      smokePositions[i * 3 + 2] = p.z;

      smokeColors[i * 3] = p.r;
      smokeColors[i * 3 + 1] = p.g;
      smokeColors[i * 3 + 2] = p.b;

      smokeAlphas[i] = alphaVal;
      smokeSizes[i] = curSize;
    }
  }

  smokeGeo.attributes.position.needsUpdate = true;
  smokeGeo.attributes.color.needsUpdate = true;
  smokeGeo.attributes.alpha.needsUpdate = true;
  smokeGeo.attributes.size.needsUpdate = true;
}

// MESH BINDER AND ANIMATION TRACKER
let mixer = null;
const animationActions = [];
const STRATOSPHERE_START_TIME = 8.3333; // 200 frames @ 24fps
const MESOSPHERE_START_TIME = 19.0;
const THERMOSPHERE_START_TIME = 25.0;
const EXOSPHERE_START_TIME = 33.0;
const FINAL_TRANSITION_TIME = 38.0;
const FINAL_PAGE_URL = "./Solar System/planet-structure/index_earth.html";
let ANIMATION_DURATION = FINAL_TRANSITION_TIME;
let isAnimPlaying = false;
let animTime = 0.0;
let currentAtmospherePhase = "troposphere"; // "troposphere", "stratosphere", "mesosphere", "thermosphere", or "exosphere"
let isTransitioning = false;
let hasAutoPausedAtStratosphere = false;
let hasAutoPausedAtMesosphere = false;
let hasAutoPausedAtThermosphere = false;
let hasAutoPausedAtExosphere = false;
let hasTriggeredFinalTransition = false;
let cameraMode = "cinematic";

let modelCamera = null;
let spacecraft = null;
let fuelTank = null;
let leftRocketThrust = null;
let rightRocketThrust = null;

const flamePlanes = []; // All 5 thruster flame meshes (Plane001 - Plane005)
const vehicleNodes = []; // Spacecraft, Fuel_Tank, Left_Rocket_Thrust, Right_Rocket_Thrust
const groundNodes = []; // Launch_Infrastructure, Launching_Tower, Small_Building, Plane_Tower_1, Plane_Tower_2, Tower__1
const thrusterLights = []; // Dynamic point lights

// Helper to reliably set visibility of an object & all it's mesh descendants
function setSubtreeVisibility(object, visible) {
  if (!object) return;
  object.visible = visible;
  object.traverse((child) => {
    child.visible = visible;
  });
}

// MODEL CONTAINER & GLTF 2.0 LOADER 
const modelRootGroup = new THREE.Group();
scene.add(modelRootGroup);

let loadedModel = null;
const loader = new GLTFLoader();
const modelUrl = "./models/space-shuttle-low-poly.glb";

loader.load(
  modelUrl,
  (gltf) => {
    loadedModel = gltf.scene;

    let totalVertices = 0;
    let totalPolygons = 0;
    let meshCount = 0;

    spacecraft = loadedModel.getObjectByName("Spacecraft");
    fuelTank = loadedModel.getObjectByName("Fuel_Tank") || loadedModel.getObjectByName("Fuel Tank");
    leftRocketThrust = loadedModel.getObjectByName("Left_Rocket_Thrust") || loadedModel.getObjectByName("Left Rocket Thrust");
    rightRocketThrust = loadedModel.getObjectByName("Right_Rocket_Thrust") || loadedModel.getObjectByName("Right Rocket Thrust");

    vehicleNodes.length = 0;
    [spacecraft, fuelTank, leftRocketThrust, rightRocketThrust].forEach((v) => {
      if (v) vehicleNodes.push(v);
    });

    groundNodes.length = 0;
    [
      "Launch_Infrastructure", "Launch Infrastructure",
      "Launching_Tower", "Launching Tower",
      "Small_Building", "Small Building",
      "Plane_Tower_1", "Plane Tower 1",
      "Plane_Tower_2", "Plane Tower 2",
      "Tower__1", "Tower : 1", "Tower_1"
    ].forEach((name) => {
      const node = loadedModel.getObjectByName(name);
      if (node && !groundNodes.includes(node)) groundNodes.push(node);
    });

    flamePlanes.length = 0;
    for (let i = 1; i <= 5; i++) {
      const planeName1 = `Plane00${i}`;
      const planeName2 = `Plane.00${i}`;
      const planeMesh = loadedModel.getObjectByName(planeName1) || loadedModel.getObjectByName(planeName2);
      if (planeMesh && !flamePlanes.includes(planeMesh)) {
        flamePlanes.push(planeMesh);
      }
    }

    loadedModel.traverse((child) => {
      if (child.isMesh) {
        meshCount++;
        child.castShadow = true;
        child.receiveShadow = true;

        if (child.geometry) {
          const posCount = child.geometry.attributes.position ? child.geometry.attributes.position.count : 0;
          totalVertices += posCount;
          if (child.geometry.index) {
            totalPolygons += child.geometry.index.count / 3;
          } else {
            totalPolygons += posCount / 3;
          }
        }

        // Applies custom Fire ShaderMaterial to the 5 thruster flame meshes (Plane001 - Plane005)
        if (/^Plane(\.|_)?00[1-5]$/i.test(child.name)) {
          child.material = fireShaderMaterial;
          child.renderOrder = 2;
          if (!flamePlanes.includes(child)) flamePlanes.push(child);
        } else if (child.material) {
          const mats = Array.isArray(child.material) ? child.material : [child.material];
          mats.forEach((m) => {
            m.side = THREE.DoubleSide;
            if (m.isMeshStandardMaterial) {
              m.roughness = 0.75;
              m.metalness = 0.5;
            } else {
              const standardMat = new THREE.MeshStandardMaterial({
                color: m.color ? m.color.clone() : new THREE.Color(0xffffff),
                map: m.map || null,
                roughness: 0.75,
                metalness: 0.5,
                side: THREE.DoubleSide
              });
              if (Array.isArray(child.material)) {
                const idx = child.material.indexOf(m);
                child.material[idx] = standardMat;
              } else {
                child.material = standardMat;
              }
            }
            m.needsUpdate = true;
          });
        }
      }
    });

    // Dynamic Fire Glow
    thrusterLights.length = 0;
    const p1 = flamePlanes.find((p) => /^Plane(\.|_)?001$/i.test(p.name));
    const p2 = flamePlanes.find((p) => /^Plane(\.|_)?002$/i.test(p.name));
    const p3 = flamePlanes.find((p) => /^Plane(\.|_)?003$/i.test(p.name));

    if (p1) {
      const light1 = new THREE.PointLight(0xff6600, 0, 95, 1.4);
      p1.add(light1);
      thrusterLights.push({ light: light1, parentMesh: p1 });
    }
    if (p2) {
      const light2 = new THREE.PointLight(0xff6600, 0, 95, 1.4);
      p2.add(light2);
      thrusterLights.push({ light: light2, parentMesh: p2 });
    }
    if (p3) {
      const light3 = new THREE.PointLight(0xffaa22, 0, 95, 1.4);
      p3.add(light3);
      thrusterLights.push({ light: light3, parentMesh: p3 });
    }

    // Normalize imported model orientation to the launch pad axes.
    /* Different GLTF exports can arrive with a slightly different forward direction,
     which becomes more noticeable when the animation timing is extended. */
    loadedModel.rotation.set(0, -Math.PI / 2, 0);
    loadedModel.scale.setScalar(1.28);
    loadedModel.updateMatrixWorld(true);
    
    const box = new THREE.Box3().setFromObject(loadedModel);
    const center = box.getCenter(new THREE.Vector3());

    // Reset model's position
    loadedModel.position.x = -center.x;
    loadedModel.position.y = -box.min.y;
    loadedModel.position.z = -center.z;
    modelRootGroup.add(loadedModel);
    modelRootGroup.updateMatrixWorld(true);

    // Obtain the animated camera from the GLTF model
    if (gltf.cameras && gltf.cameras.length > 0) {
      modelCamera = gltf.cameras[0];
      modelCamera.aspect = window.innerWidth / window.innerHeight;
      modelCamera.far = 4000;
      modelCamera.near = 0.1;
      modelCamera.updateProjectionMatrix();

      // Free orbit camera defaults
      const camWorldPos = new THREE.Vector3();
      const camWorldQuat = new THREE.Quaternion();
      modelCamera.getWorldPosition(camWorldPos);
      modelCamera.getWorldQuaternion(camWorldQuat);

      // Keep the initial framing aligned to the shuttle's launch axis.
      const yawOffset = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, -Math.PI / 2, 0));
      camera.fov = modelCamera.fov || 22.895;
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.position.copy(camWorldPos);
      camera.quaternion.copy(camWorldQuat).multiply(yawOffset);
      camera.updateProjectionMatrix();

      const lookDir = new THREE.Vector3(0, 0, -1).applyQuaternion(camWorldQuat);
      const targetPoint = camWorldPos.clone().add(lookDir.multiplyScalar(Math.abs(camWorldPos.z)));
      controls.target.copy(targetPoint);
      controls.update();

      defaultCameraPos.copy(camera.position);
      defaultTarget.copy(controls.target);
    } else {
      controls.target.set(0, 35, 0);
      camera.position.set(0, 35, 260);
      camera.updateProjectionMatrix();
      controls.update();
      defaultCameraPos.copy(camera.position);
      defaultTarget.copy(controls.target);
    }

    // Initialize Animation Mixer with all GLTF animation clips
    if (gltf.animations && gltf.animations.length > 0) {
      ANIMATION_DURATION = Math.max(
        FINAL_TRANSITION_TIME,
        ...gltf.animations.map((clip) => clip.duration)
      );
      mixer = new THREE.AnimationMixer(loadedModel);
      gltf.animations.forEach((clip) => {
        const action = mixer.clipAction(clip);
        action.setLoop(THREE.LoopOnce);
        action.clampWhenFinished = true;
        action.play();
        animationActions.push(action);
      });

      // Default camera mode
      setCameraMode("cinematic");
      setAtmospherePhase("troposphere");
      setPlaying(false);
      seekAnimation(0.0);

      if (animCountChip) {
        animCountChip.textContent = `${gltf.animations.length} Anim Clips (${ANIMATION_DURATION.toFixed(1)}s)`;
      }
      if (launchTimeline) {
        launchTimeline.max = ANIMATION_DURATION.toFixed(2);
      }
    }

    //Mesh count display
    meshCountChip.textContent = `${meshCount} Meshes`;

    // Fade-Out Overlay
    loadingOverlay.classList.add("hidden");
  },
  (xhr) => {
    if (xhr.lengthComputable) {
      const percent = Math.min(100, Math.round((xhr.loaded / xhr.total) * 100));
      progressBarFill.style.width = `${percent}%`;
      progressNumber.textContent = `${percent}%`;
    }
  },
  (error) => {
    console.error("Error loading GLTF model:", error);
    loadingOverlay.classList.add("hidden");
    errorDialog.style.display = "block";
    errorMessage.textContent = "Failed to load 3D GLB model at: " + modelUrl;
    errorDetail.textContent = error.message || String(error);
  }
);

// ATMOSPHERIC PHASE & TIMELINE MANAGEMENT
function setAtmospherePhase(phase) {
  currentAtmospherePhase = phase;
  selectedLayerId = phase;
  updateLayerTitle(phase);

  if (phase === "troposphere") {
    groundNodes.forEach((node) => setSubtreeVisibility(node, true));
    vehicleNodes.forEach((node) => setSubtreeVisibility(node, true));
    flamePlanes.forEach((plane) => setSubtreeVisibility(plane, true));
    smokePoints.visible = true;

    // Update Strata Ladder UI
    strataSteps.forEach((step) => {
      const layer = step.getAttribute("data-layer");
      const indicator = step.querySelector(".status-indicator");
      if (layer === "troposphere") {
        step.classList.add("active");
        if (indicator) indicator.textContent = animTime >= 5.0 ? "ASCENDING" : "STANDBY";
      } else {
        step.classList.remove("active");
        if (indicator) indicator.textContent = "";
      }
    });
  } else if (phase === "stratosphere") {
    groundNodes.forEach((node) => setSubtreeVisibility(node, false));
    vehicleNodes.forEach((node) => setSubtreeVisibility(node, true));
    flamePlanes.forEach((plane) => setSubtreeVisibility(plane, true));
    smokePoints.visible = true;

    // Update Strata Ladder UI
    strataSteps.forEach((step) => {
      const layer = step.getAttribute("data-layer");
      const indicator = step.querySelector(".status-indicator");
      if (layer === "stratosphere") {
        step.classList.add("active");
        if (indicator) indicator.textContent = "SUPERSONIC";
      } else if (layer === "troposphere") {
        step.classList.remove("active");
        if (indicator) indicator.textContent = "CLEARED";
      }
    });

    if (cameraMode === "free" && spacecraft) {
      const scPos = new THREE.Vector3();
      spacecraft.getWorldPosition(scPos);
      controls.target.copy(scPos);
      controls.update();
    }
  } else if (phase === "mesosphere") {
    groundNodes.forEach((node) => setSubtreeVisibility(node, false));
    vehicleNodes.forEach((node) => setSubtreeVisibility(node, true));
    flamePlanes.forEach((plane) => setSubtreeVisibility(plane, true));
    smokePoints.visible = true;

    strataSteps.forEach((step) => {
      const layer = step.getAttribute("data-layer");
      const indicator = step.querySelector(".status-indicator");
      if (layer === "mesosphere") {
        step.classList.add("active");
        if (indicator) indicator.textContent = "METEOR ZONE";
      } else {
        step.classList.remove("active");
        if (indicator) indicator.textContent = "CLEARED";
      }
    });

    if (cameraMode === "free" && spacecraft) {
      const scPos = new THREE.Vector3();
      spacecraft.getWorldPosition(scPos);
      controls.target.copy(scPos);
      controls.update();
    }
  } else if (phase === "thermosphere") {
    groundNodes.forEach((node) => setSubtreeVisibility(node, false));
    vehicleNodes.forEach((node) => setSubtreeVisibility(node, true));
    flamePlanes.forEach((plane) => setSubtreeVisibility(plane, true));
    smokePoints.visible = true;

    strataSteps.forEach((step) => {
      const layer = step.getAttribute("data-layer");
      const indicator = step.querySelector(".status-indicator");
      if (layer === "thermosphere") {
        step.classList.add("active");
        if (indicator) indicator.textContent = "AURORA ZONE";
      } else {
        step.classList.remove("active");
        if (indicator) indicator.textContent = "CLEARED";
      }
    });

    if (cameraMode === "free" && spacecraft) {
      const scPos = new THREE.Vector3();
      spacecraft.getWorldPosition(scPos);
      controls.target.copy(scPos);
      controls.update();
    }
  } else if (phase === "exosphere") {
    groundNodes.forEach((node) => setSubtreeVisibility(node, false));
    vehicleNodes.forEach((node) => setSubtreeVisibility(node, true));
    flamePlanes.forEach((plane) => setSubtreeVisibility(plane, true));
    smokePoints.visible = false;

    strataSteps.forEach((step) => {
      const layer = step.getAttribute("data-layer");
      const indicator = step.querySelector(".status-indicator");
      if (layer === "exosphere") {
        step.classList.add("active");
        if (indicator) indicator.textContent = "ORBITAL EDGE";
      } else {
        step.classList.remove("active");
        if (indicator) indicator.textContent = "CLEARED";
      }
    });

    if (cameraMode === "free" && spacecraft) {
      const scPos = new THREE.Vector3();
      spacecraft.getWorldPosition(scPos);
      controls.target.copy(scPos);
      controls.update();
    }
  }
}

let isCountingDown = false;

function startLaunchCountdown() {
  if (isAnimPlaying) {
    // If clicked while counting down or in flight, reset to launchpad standby
    resetToPad();
    return;
  }

  // Begin launch sequence from T-0.0 at native 60fps/120fps display refresh rate
  seekAnimation(0.0);
  setAtmospherePhase("troposphere");
  isCountingDown = true;
  isAnimPlaying = true;
  if (hudTitleCard) hudTitleCard.classList.add("is-hidden");
  if (hudLayerCard) hudLayerCard.classList.remove("is-hidden");
  updateLayerTitle("troposphere");
  if (orbitGuideCard) orbitGuideCard.classList.add("title-position");

  if (btnLaunch) {
    btnLaunch.classList.add("counting-down");
    btnLaunch.classList.remove("launched");
  }
  if (launchCounter) {
    launchCounter.style.display = "inline-flex";
    launchCounter.textContent = "T-05s";
  }
  if (btnLaunchText) btnLaunchText.textContent = "COUNTDOWN";
  if (launchPulseDot) {
    launchPulseDot.classList.add("active");
    launchPulseDot.style.background = "#f59e0b";
    launchPulseDot.style.boxShadow = "0 0 14px #f59e0b";
  }
  if (missionPhaseLabel) {
    missionPhaseLabel.textContent = "COUNTDOWN INITIATED // T-05s";
  }
  if (deckSubStatus) {
    deckSubStatus.textContent = "PRE-LAUNCH SYSTEMS CHECK";
  }
}

function resetToPad() {
  isCountingDown = false;
  isAnimPlaying = false;
  if (hudTitleCard) hudTitleCard.classList.remove("is-hidden");
  if (hudLayerCard) hudLayerCard.classList.add("is-hidden");
  updateLayerTitle("troposphere");
  if (orbitGuideCard) orbitGuideCard.classList.remove("title-position");
  seekAnimation(0.0);
  setAtmospherePhase("troposphere");

  if (btnLaunch) {
    btnLaunch.classList.remove("counting-down", "launched");
  }
  if (btnLaunchText) btnLaunchText.textContent = "INITIATE LAUNCH";
  if (launchCounter) launchCounter.style.display = "none";
  if (launchPulseDot) {
    launchPulseDot.classList.remove("active");
    launchPulseDot.style.background = "#10b981";
    launchPulseDot.style.boxShadow = "0 0 8px #10b981";
  }
  if (missionPhaseLabel) {
    missionPhaseLabel.textContent = "MISSION STANDBY · READY FOR LAUNCH";
  }
  if (deckSubStatus) {
    deckSubStatus.textContent = "ALL SYSTEMS NOMINAL";
  }
}

function setPlaying(play) {
  if (play) {
    startLaunchCountdown();
  } else {
    resetToPad();
  }
}

function seekAnimation(targetTime) {
  animTime = Math.max(0, Math.min(ANIMATION_DURATION, targetTime));
  if (animTime < STRATOSPHERE_START_TIME) {
    hasAutoPausedAtStratosphere = false;
  }
  if (animTime < MESOSPHERE_START_TIME) {
    hasAutoPausedAtMesosphere = false;
  }
  if (animTime < THERMOSPHERE_START_TIME) {
    hasAutoPausedAtThermosphere = false;
  }
  if (animTime < EXOSPHERE_START_TIME) {
    hasAutoPausedAtExosphere = false;
  }
  if (animTime < FINAL_TRANSITION_TIME) {
    hasTriggeredFinalTransition = false;
  }
  if (mixer) {
    mixer.setTime(animTime);
  }

  // Synchronize atmosphere phase with scrubbed time
  const targetPhase = animTime >= EXOSPHERE_START_TIME
    ? "exosphere"
    : animTime >= THERMOSPHERE_START_TIME
      ? "thermosphere"
    : animTime >= MESOSPHERE_START_TIME
      ? "mesosphere"
    : animTime >= STRATOSPHERE_START_TIME ? "stratosphere" : "troposphere";
  if (targetPhase !== currentAtmospherePhase && !isTransitioning) {
    setAtmospherePhase(targetPhase);
  }

  updateTimelineUI(animTime);
}

function triggerAtmosphereTransition(targetPhase, targetTime) {
  if (isTransitioning) return;
  isTransitioning = true;
  if (targetPhase === "stratosphere") {
    hasAutoPausedAtStratosphere = true;
  } else if (targetPhase === "mesosphere") {
    hasAutoPausedAtMesosphere = true;
  } else if (targetPhase === "thermosphere") {
    hasAutoPausedAtThermosphere = true;
  } else {
    hasAutoPausedAtExosphere = true;
  }

  animTime = targetTime;
  if (mixer) mixer.setTime(animTime);

  if (layerTransition) {
    layerTransition.style.opacity = "1";
  }

  setTimeout(() => {
    setAtmospherePhase(targetPhase);
    if (mixer) mixer.setTime(targetTime);
    updateTimelineUI(targetTime);
  }, 800);

  setTimeout(() => {
    if (layerTransition) layerTransition.style.opacity = "0";
  }, 1600);

  setTimeout(() => {
    isTransitioning = false;
  }, 2400);
}

function triggerFinalPageTransition() {
  if (hasTriggeredFinalTransition) return;
  hasTriggeredFinalTransition = true;
  isAnimPlaying = false;
  animTime = FINAL_TRANSITION_TIME;
  if (mixer) mixer.setTime(animTime);
  updateTimelineUI(animTime);

  if (layerTransition) {
    layerTransition.style.opacity = "1";
  }

  // Keep the existing fade-in visible before opening the connected page.
  setTimeout(() => {
    window.location.href = FINAL_PAGE_URL;
  }, 800);
}

function updateTimelineUI(time, elapsed = 0) {
  if (launchTimeline) {
    launchTimeline.value = time.toFixed(2);
  }
  if (animTimeDisplay) {
    animTimeDisplay.textContent = `${time.toFixed(1)}s / ${ANIMATION_DURATION.toFixed(1)}s`;
  }

  // Launch Button & Telemetry Synchronization
  if (isAnimPlaying) {
    if (time < 5.0) {
      // Countdown phase during camera zoom-in
      const remainingSec = Math.max(1, Math.ceil(5.0 - time));
      if (launchCounter) {
        launchCounter.style.display = "inline-flex";
        launchCounter.textContent = `T-0${remainingSec}s`;
      }
      if (btnLaunch) {
        btnLaunch.classList.add("counting-down");
        btnLaunch.classList.remove("launched");
      }
      if (btnLaunchText) btnLaunchText.textContent = "COUNTDOWN";
      if (launchPulseDot) {
        launchPulseDot.classList.add("active");
        launchPulseDot.style.background = "#f59e0b";
        launchPulseDot.style.boxShadow = "0 0 14px #f59e0b";
      }
      if (missionPhaseLabel) {
        if (time < 1.8) {
          missionPhaseLabel.textContent = `COUNTDOWN IN PROGRESS // T-0${remainingSec}s`;
        } else if (time < 3.8) {
          missionPhaseLabel.textContent = `MAIN ENGINE IGNITION // T-0${remainingSec}s`;
        } else {
          missionPhaseLabel.textContent = `SRB IGNITION COMMENCED // T-01s`;
        }
      }
      if (deckSubStatus) {
        deckSubStatus.textContent = time >= 1.8
          ? "IGNITION SEQUENCE ARMED"
          : "PRE-LAUNCH SYSTEMS CHECK";
      }
    } else {
      // Liftoff & Ascent phase
      const flightSec = Math.max(0, Math.floor(time - 5.0));
      if (launchCounter) {
        launchCounter.style.display = "inline-flex";
        launchCounter.textContent = `T+${flightSec < 10 ? "0" : ""}${flightSec}s`;
      }
      if (btnLaunch) {
        btnLaunch.classList.remove("counting-down");
        btnLaunch.classList.add("launched");
      }
      if (btnLaunchText) {
        btnLaunchText.textContent = time < 7.0 ? "LIFTOFF!" : "ASCENDING (RESET)";
      }
      if (launchPulseDot) {
        launchPulseDot.classList.add("active");
        launchPulseDot.style.background = "#10b981";
        launchPulseDot.style.boxShadow = "0 0 16px #10b981";
      }
      if (missionPhaseLabel) {
        if (time < STRATOSPHERE_START_TIME) {
          missionPhaseLabel.textContent = `TROPOSPHERE ASCENT // T+0${(time - 5.0).toFixed(1)}s`;
        } else if (time < MESOSPHERE_START_TIME) {
          missionPhaseLabel.textContent = `STRATOSPHERE // MACH 3.5 // T+0${(time - 5.0).toFixed(1)}s`;
        } else if (time < THERMOSPHERE_START_TIME) {
          missionPhaseLabel.textContent = `MESOSPHERE // METEOR ZONE // T+${(time - 5.0).toFixed(1)}s`;
        } else if (time < EXOSPHERE_START_TIME) {
          missionPhaseLabel.textContent = `THERMOSPHERE // AURORA ZONE // T+${(time - 5.0).toFixed(1)}s`;
        } else {
          missionPhaseLabel.textContent = `EXOSPHERE // ORBITAL EDGE // T+${(time - 5.0).toFixed(1)}s`;
        }
      }
      if (deckSubStatus) {
        if (time >= EXOSPHERE_START_TIME) {
          deckSubStatus.textContent = "ALTITUDE: 600+ KM // ORBITAL VELOCITY: 28,000 KM/H";
        } else if (time >= THERMOSPHERE_START_TIME) {
          deckSubStatus.textContent = "ALTITUDE: 85-600 KM // KÁRMÁN LINE CLEARED";
        } else if (time >= MESOSPHERE_START_TIME) {
          deckSubStatus.textContent = "ALTITUDE: 50-85 KM // VELOCITY: MACH 12.0";
        } else if (time >= STRATOSPHERE_START_TIME) {
          deckSubStatus.textContent = "ALTITUDE: 12-50 KM // SUPERSONIC CRUISE";
        } else {
          deckSubStatus.textContent = "ALTITUDE: 0-12 KM // VERTICAL ASCENT";
        }
      }
    }
  } else {
    // Standby on Launchpad
    if (missionPhaseLabel) {
      missionPhaseLabel.textContent = "MISSION STANDBY · READY FOR LAUNCH";
    }
    if (deckSubStatus) {
      deckSubStatus.textContent = "ALL SYSTEMS NOMINAL";
    }
  }

  // Updated Fire_Shader uniforms 
  let flamePower = 0.0;
  if (time >= 1.8 && time < 2.5) {
    flamePower = (time - 1.8) / 0.7; // Ignition flare buildup
  } else if (time >= 2.5) {
    flamePower = 1.0; // Full thrust roar
  }
  fireShaderMaterial.uniforms.uFlamePower.value = flamePower;
  fireShaderMaterial.uniforms.uTime.value = elapsed;

  // Dynamic rocket thruster 
  const isFiring = time >= 1.8;
  thrusterLights.forEach((item) => {
    if (!item.light) return;
    let srbScale = 1.0;
    if (item.parentMesh && item.parentMesh.scale) {
      srbScale = Math.min(1.0, Math.max(0.0, item.parentMesh.scale.x));
    }
    const glow = isFiring ? (4.2 * flamePower * srbScale + Math.sin(elapsed * 45) * 1.2 * srbScale) : 0;
    item.light.intensity = Math.max(0, glow);
  });

  // Simulated altitude calculation
  const altitudeKm = currentAtmospherePhase === "exosphere"
    ? 600.0 + ((time - EXOSPHERE_START_TIME) / (ANIMATION_DURATION - EXOSPHERE_START_TIME)) * 9400.0
    : currentAtmospherePhase === "thermosphere"
    ? 85.0 + ((time - THERMOSPHERE_START_TIME) / (ANIMATION_DURATION - THERMOSPHERE_START_TIME)) * 515.0
    : currentAtmospherePhase === "mesosphere"
      ? 50.0 + ((time - MESOSPHERE_START_TIME) / (THERMOSPHERE_START_TIME - MESOSPHERE_START_TIME)) * 35.0
    : currentAtmospherePhase === "stratosphere"
      ? 12.0 + ((time - STRATOSPHERE_START_TIME) / (MESOSPHERE_START_TIME - STRATOSPHERE_START_TIME)) * 38.0
    : time >= 5.0 ? ((time - 5.0) / (STRATOSPHERE_START_TIME - 5.0)) * 12.0 : 0.0;

  // Synchronize Atmospheric Strata Hud
  strataSteps.forEach((step) => {
    const layer = step.getAttribute("data-layer");
    const indicator = step.querySelector(".status-indicator");

    if (currentAtmospherePhase === "exosphere" || altitudeKm >= 600.0) {
      if (layer === "exosphere") {
        step.classList.add("active");
        if (indicator) indicator.textContent = "ORBITAL EDGE";
      } else {
        step.classList.remove("active");
        if (indicator) indicator.textContent = "CLEARED";
      }
    } else if (currentAtmospherePhase === "thermosphere" || altitudeKm >= 85.0) {
      if (layer === "thermosphere") {
        step.classList.add("active");
        if (indicator) indicator.textContent = "AURORA ZONE";
      } else {
        step.classList.remove("active");
        if (indicator) indicator.textContent = "CLEARED";
      }
    } else if (currentAtmospherePhase === "mesosphere" || altitudeKm >= 50.0) {
      if (layer === "mesosphere") {
        step.classList.add("active");
        if (indicator) indicator.textContent = "METEOR ZONE";
      } else {
        step.classList.remove("active");
        if (indicator) indicator.textContent = "CLEARED";
      }
    } else if (currentAtmospherePhase === "stratosphere" || altitudeKm >= 12.0) {
      if (layer === "stratosphere") {
        step.classList.add("active");
        if (indicator) indicator.textContent = "SUPERSONIC";
      } else {
        step.classList.remove("active");
        if (indicator) indicator.textContent = "CLEARED";
      }
    } else if (time >= 5.0) {
      if (layer === "troposphere") {
        step.classList.add("active");
        if (indicator) indicator.textContent = "ASCENDING";
      }
    } else {
      if (layer === "troposphere") {
        step.classList.add("active");
        if (indicator) indicator.textContent = "STANDBY";
      } else {
        step.classList.remove("active");
      }
    }
  });
}

function setCameraMode(mode) {
  cameraMode = mode;
  if (cameraMode === "cinematic") {
    if (btnOrbitControl) {
      btnOrbitControl.classList.remove("active");
      btnOrbitControl.textContent = "ORBIT CONTROL";
    }
    if (orbitGuideCard) {
      orbitGuideCard.classList.remove("visible");
      orbitGuideCard.style.display = "none";
    }
    controls.enabled = false;
  } else {
    if (btnOrbitControl) {
      btnOrbitControl.classList.add("active");
      btnOrbitControl.textContent = "ORBIT: ACTIVE";
    }
    if (orbitGuideCard) {
      orbitGuideCard.classList.add("visible");
      orbitGuideCard.style.display = "block";
    }
    controls.enabled = true;

    // Sync free camera position so there's no jarring jump
    if (modelCamera) {
      const mWorldPos = new THREE.Vector3();
      modelCamera.getWorldPosition(mWorldPos);
      camera.position.copy(mWorldPos);
      if (spacecraft) {
        const scPos = new THREE.Vector3();
        spacecraft.getWorldPosition(scPos);
        controls.target.copy(scPos);
      }
      controls.update();

      // Restrict OrbitControls strictly to single-axis rotation around the vehicle axis
      const currentPitch = controls.getPolarAngle() || Math.PI * 0.48;
      controls.minPolarAngle = currentPitch;
      controls.maxPolarAngle = currentPitch;
    } else {
      controls.minPolarAngle = Math.PI * 0.48;
      controls.maxPolarAngle = Math.PI * 0.48;
    }
  }
}

// ---------------------------------------------------------
// 13. ATMOSPHERIC STRATA & BACKGROUND ENGINE
// ---------------------------------------------------------
let showStrataLines = true;
let selectedLayerId = "troposphere";
const STRATA_SECTIONS = [
  {
    id: "stratosphere",
    name: "STRATOSPHERE",
    subName: "OZONE LAYER & SUPERSONIC JET STREAMS",
    alt: "12 – 50 km",
    yStart: 0.56,
    yEnd: 0.74,
    boundaryLabel: "12 KM // TROPOPAUSE · STRATOSPHERE",
    leftTag: "ALT: 12 KM"
  },
  {
    id: "troposphere",
    name: "TROPOSPHERE",
    subName: "WEATHER SYSTEM & LAUNCH COMPLEX 39A",
    alt: "0 – 12 km",
    yStart: 0.74,
    yEnd: 1.00,
    boundaryLabel: "0 KM // SURFACE LAUNCHPAD COMPLEX 39A (STANDBY)",
    leftTag: "ALT: 0.00 KM"
  }
];

// Starfield 
const stars = [];
for (let i = 0; i < 150; i++) {
  stars.push({
    x: Math.random(),
    y: Math.random() * 0.38,
    radius: Math.random() * 1.5 + 0.05,
    baseAlpha: Math.random() * 0.7 + 0.3,
    twinkleFreq: Math.random() * 0.5 + 1.0,
    phase: Math.random() * Math.PI * 2
  });
}

let satelliteProgress = 0.15;
// Mesosphere Meteors
const meteors = [
  { active: false, x: 0, y: 0, vx: 0, vy: 0, len: 0, life: 0, cooldown: 1.2 },
  { active: false, x: 0, y: 0, vx: 0, vy: 0, len: 0, life: 0, cooldown: 3.5 },
  { active: false, x: 0, y: 0, vx: 0, vy: 0, len: 0, life: 0, cooldown: 5.0 }
];

// Stratospheric Jet Stream Filaments
const jetStreams = [
  { yRatio: 0.60, xOffset: 0.1, speed: 0.025, lengthRatio: 0.22, alpha: 0.12 },
  { yRatio: 0.64, xOffset: 0.45, speed: 0.035, lengthRatio: 0.28, alpha: 0.16 },
  { yRatio: 0.68, xOffset: 0.8, speed: 0.020, lengthRatio: 0.18, alpha: 0.10 },
  { yRatio: 0.71, xOffset: 0.25, speed: 0.030, lengthRatio: 0.25, alpha: 0.14 }
];

// Troposphere Volumetric Clouds
const clouds = [
  { xRatio: 0.08, yRatio: 0.20, speed: 0.008, scale: 1.1, puffs: [{ dx: 0, dy: 0, r: 42 }, { dx: 30, dy: -10, r: 35 }, { dx: 60, dy: 5, r: 38 }, { dx: -30, dy: 6, r: 32 }] },
  { xRatio: 0.45, yRatio: 0.28, speed: 0.012, scale: 0.9, puffs: [{ dx: 0, dy: 0, r: 38 }, { dx: 26, dy: -8, r: 30 }, { dx: -24, dy: 4, r: 28 }, { dx: 52, dy: 5, r: 34 }] },
  { xRatio: 0.78, yRatio: 0.22, speed: 0.006, scale: 1.3, puffs: [{ dx: 0, dy: 0, r: 50 }, { dx: 38, dy: -12, r: 40 }, { dx: -36, dy: 8, r: 36 }, { dx: 72, dy: 6, r: 42 }] },
  { xRatio: 0.25, yRatio: 0.18, speed: 0.010, scale: 0.85, puffs: [{ dx: 0, dy: 0, r: 34 }, { dx: 24, dy: -6, r: 26 }, { dx: -20, dy: 4, r: 24 }] },
  { xRatio: 0.92, yRatio: 0.15, speed: 0.014, scale: 0.75, puffs: [{ dx: 0, dy: 0, r: 30 }, { dx: 22, dy: -5, r: 24 }, { dx: -18, dy: 3, r: 22 }] }
];

function blendRGB(c1, c2, t) {
  const r = Math.round(c1[0] + (c2[0] - c1[0]) * t);
  const g = Math.round(c1[1] + (c2[1] - c1[1]) * t);
  const b = Math.round(c1[2] + (c2[2] - c1[2]) * t);
  return `rgb(${r}, ${g}, ${b})`;
}

function drawAtmosphereGradient(ctx, w, h, t) {
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0.00, blendRGB([18, 62, 120], [68, 42, 112], t));
  grad.addColorStop(0.24, blendRGB([32, 112, 184], [126, 58, 128], t));
  grad.addColorStop(0.50, blendRGB([75, 170, 224], [216, 106, 82], t));
  grad.addColorStop(0.72, blendRGB([145, 211, 240], [242, 158, 112], t));
  grad.addColorStop(0.90, blendRGB([105, 164, 190], [174, 103, 78], t));
  grad.addColorStop(1.00, blendRGB([32, 63, 82], [72, 45, 40], t));

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
}

function drawNightGradient(ctx, w, h) {
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, "rgb(3, 8, 24)");
  grad.addColorStop(0.45, "rgb(8, 23, 50)");
  grad.addColorStop(0.78, "rgb(15, 43, 70)");
  grad.addColorStop(1, "rgb(5, 14, 28)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
}

function drawMountainRange(ctx, w, h, sunsetRatio) {
  const horizon = h * 0.78;
  const rearPeaks = [
    [0.00, 0.12], [0.10, 0.07], [0.19, 0.18], [0.30, 0.08],
    [0.42, 0.16], [0.54, 0.06], [0.66, 0.20], [0.79, 0.09], [0.92, 0.17], [1.00, 0.10]
  ];
  const frontPeaks = [
    [0.00, 0.06], [0.14, 0.16], [0.27, 0.08], [0.40, 0.14],
    [0.55, 0.05], [0.69, 0.13], [0.84, 0.07], [1.00, 0.12]
  ];

  function fillPeaks(peaks, baseY, color) {
    ctx.beginPath();
    ctx.moveTo(0, baseY);
    peaks.forEach(([x, height]) => {
      ctx.lineTo(x * w, horizon - height * h);
    });
    ctx.lineTo(w, baseY);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
  }

  ctx.save();
  const rearColor = sunsetRatio > 0.5 ? "rgba(61, 39, 57, 0.72)" : "rgba(20, 48, 76, 0.62)";
  const frontColor = sunsetRatio > 0.5 ? "rgba(35, 25, 39, 0.92)" : "rgba(10, 29, 53, 0.86)";
  fillPeaks(rearPeaks, horizon + h * 0.08, rearColor);
  fillPeaks(frontPeaks, horizon + h * 0.13, frontColor);

  ctx.restore();
}

function drawStratosphereGradient(ctx, w, h, animationTime) {
  const progress = Math.max(0, Math.min(1,
    (animationTime - STRATOSPHERE_START_TIME) / (MESOSPHERE_START_TIME - STRATOSPHERE_START_TIME)
  ));
  const drift = progress * h * 0.12;
  const grad = ctx.createLinearGradient(0, -drift, 0, h - drift);
  grad.addColorStop(0, "rgb(5, 12, 34)");
  grad.addColorStop(0.42, "rgb(18, 54, 104)");
  grad.addColorStop(0.76, "rgb(42, 116, 174)");
  grad.addColorStop(1, "rgb(12, 31, 58)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
}

function drawThermosphereGradient(ctx, w, h, animationTime) {
  const progress = Math.max(0, Math.min(1,
    (animationTime - THERMOSPHERE_START_TIME) / (EXOSPHERE_START_TIME - THERMOSPHERE_START_TIME)
  ));
  const drift = progress * h * 0.14;
  const grad = ctx.createLinearGradient(0, -drift, 0, h - drift);
  grad.addColorStop(0, "rgb(2, 10, 32)");
  grad.addColorStop(0.3, "rgb(5, 38, 68)");
  grad.addColorStop(0.58, "rgb(8, 92, 104)");
  grad.addColorStop(0.78, "rgb(28, 105, 116)");
  grad.addColorStop(1, "rgb(5, 29, 58)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
}

function drawMesosphereGradient(ctx, w, h, animationTime) {
  const progress = Math.max(0, Math.min(1,
    (animationTime - MESOSPHERE_START_TIME) / (THERMOSPHERE_START_TIME - MESOSPHERE_START_TIME)
  ));
  const drift = progress * h * 0.1;
  const grad = ctx.createLinearGradient(0, -drift, 0, h - drift);
  grad.addColorStop(0, "rgb(4, 12, 38)");
  grad.addColorStop(0.28, "rgb(13, 35, 78)");
  grad.addColorStop(0.58, "rgb(38, 68, 112)");
  grad.addColorStop(0.78, "rgb(74, 61, 116)");
  grad.addColorStop(1, "rgb(12, 20, 54)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
}

function drawMesosphereHaze(ctx, w, h, elapsed, animationTime) {
  const flow = elapsed * 0.08 + animationTime * 0.015;

  ctx.save();
  ctx.globalCompositeOperation = "screen";
  for (let i = 0; i < 4; i++) {
    const y = ((i * 0.24 + flow * (0.18 + i * 0.025)) % 1) * h;
    const thickness = 18 + i * 7;
    const haze = ctx.createLinearGradient(0, y - thickness, 0, y + thickness);
    haze.addColorStop(0, "rgba(125, 211, 252, 0)");
    haze.addColorStop(0.5, `rgba(147, 197, 253, ${(0.035 + i * 0.01).toFixed(3)})`);
    haze.addColorStop(1, "rgba(99, 102, 241, 0)");

    ctx.fillStyle = haze;
    ctx.fillRect(0, y - thickness, w, thickness * 2);
  }
  ctx.restore();
}

function drawStratosphereMotion(ctx, w, h, animationTime, elapsed) {
  const progress = Math.max(0, Math.min(1,
    (animationTime - STRATOSPHERE_START_TIME) / (MESOSPHERE_START_TIME - STRATOSPHERE_START_TIME)
  ));
  const flowTime = elapsed * 0.34 + animationTime * 0.12;

  ctx.save();
  ctx.globalCompositeOperation = "screen";
  for (let i = 0; i < 34; i++) {
    const x = ((i * 0.37 + 0.11 + Math.sin(flowTime * 0.18 + i) * 0.012) % 1) * w;
    const y = ((i * 0.19 + flowTime * (0.55 + (i % 3) * 0.12)) % 1) * h;
    const length = 26 + (i % 4) * 11 + progress * 12;
    const alpha = 0.075 + progress * 0.045;
    const streak = ctx.createLinearGradient(x, y - length, x, y);
    streak.addColorStop(0, "rgba(186, 230, 253, 0)");
    streak.addColorStop(1, `rgba(186, 230, 253, ${alpha.toFixed(3)})`);

    ctx.strokeStyle = streak;
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(x, y - length);
    ctx.lineTo(x, y);
    ctx.stroke();
  }

  // Horizontal Stream Bands
  for (let i = 0; i < 3; i++) {
    const y = ((i * 0.38 + flowTime * 0.035) % 1) * h;
    const band = ctx.createLinearGradient(0, y - 22, 0, y + 22);
    band.addColorStop(0, "rgba(125, 211, 252, 0)");
    band.addColorStop(0.5, "rgba(125, 211, 252, 0.055)");
    band.addColorStop(1, "rgba(125, 211, 252, 0)");
    ctx.fillStyle = band;
    ctx.fillRect(0, y - 22, w, 44);
  }
  ctx.restore();
}

function drawStars(ctx, w, h, elapsed, t) {
  ctx.save();
  for (let i = 0; i < stars.length; i++) {
    const s = stars[i];
    const sx = s.x * w;
    const sy = s.y * h;
    const twinkle = 0.6 + 0.4 * Math.sin(elapsed * s.twinkleFreq + s.phase);
    const altitudeFade = Math.max(0, 1 - (s.y / 0.38) * 0.7);
    const daylightFade = Math.max(0.15, 1 - t * 0.3);
    const alpha = s.baseAlpha * twinkle * altitudeFade * daylightFade;

    if (alpha <= 0.02) continue;

    ctx.fillStyle = `rgba(255, 255, 255, ${alpha.toFixed(2)})`;
    ctx.beginPath();
    ctx.arc(sx, sy, s.radius, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawSatellite(ctx, w, h, elapsed, delta) {
  satelliteProgress = (satelliteProgress + delta * 0.012) % 1.1;
  const satX = satelliteProgress * w;
  const satY = 0.08 * h;

  ctx.save();
  const isBlink = Math.sin(elapsed * 5) > 0.6;
  ctx.fillStyle = isBlink ? "#38bdf8" : "#94a3b8";
  ctx.beginPath();
  ctx.arc(satX, satY, isBlink ? 2.5 : 1.8, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "rgba(148, 163, 184, 0.4)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(satX - 6, satY);
  ctx.lineTo(satX + 6, satY);
  ctx.stroke();
  ctx.restore();
}

function drawAurora(ctx, w, h, elapsed) {
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  const ribbons = [
    { yBase: 0.20 * h, amp1: 22, amp2: 12, width: 52, color: "rgba(34, 211, 238,", speed: 0.55 },
    { yBase: 0.27 * h, amp1: 28, amp2: 15, width: 64, color: "rgba(45, 212, 191,", speed: 0.72 },
    { yBase: 0.34 * h, amp1: 18, amp2: 10, width: 42, color: "rgba(129, 140, 248,", speed: 0.9 }
  ];

  for (let r = 0; r < ribbons.length; r++) {
    const rb = ribbons[r];
    ctx.beginPath();
    ctx.moveTo(0, rb.yBase);

    for (let x = 0; x <= w; x += 20) {
      const wave = Math.sin(x * 0.003 + elapsed * rb.speed) * rb.amp1
                 + Math.sin(x * 0.007 - elapsed * (rb.speed * 0.7)) * rb.amp2;
      ctx.lineTo(x, rb.yBase + wave);
    }
    ctx.lineTo(w, rb.yBase + 45);
    for (let x = w; x >= 0; x -= 20) {
      const wave = Math.sin(x * 0.003 + elapsed * rb.speed) * rb.amp1
                 + Math.sin(x * 0.007 - elapsed * (rb.speed * 0.7)) * rb.amp2;
      ctx.lineTo(x, rb.yBase + wave + 30);
    }
    ctx.closePath();

    const ribbonGrad = ctx.createLinearGradient(0, rb.yBase - 20, 0, rb.yBase + rb.width);
    ribbonGrad.addColorStop(0.0, rb.color + "0.0)");
    ribbonGrad.addColorStop(0.35, rb.color + "0.16)");
    ribbonGrad.addColorStop(0.70, rb.color + "0.10)");
    ribbonGrad.addColorStop(1.0, rb.color + "0.0)");

    ctx.fillStyle = ribbonGrad;
    ctx.fill();
  }
  ctx.restore();
}

function drawMeteors(ctx, w, h, elapsed, delta) {
  ctx.save();
  for (let i = 0; i < meteors.length; i++) {
    const m = meteors[i];
    if (!m.active) {
      m.cooldown -= delta;
      if (m.cooldown <= 0) {
        m.active = true;
        m.x = (0.15 + Math.random() * 0.7) * w;
        m.y = (0.38 + Math.random() * 0.04) * h;
        const angle = (Math.PI / 180) * (28 + Math.random() * 16);
        const speed = 420 + Math.random() * 260;
        m.vx = Math.cos(angle) * speed * (Math.random() > 0.4 ? 1 : -1);
        m.vy = Math.sin(angle) * speed;
        m.len = 45 + Math.random() * 35;
        m.life = 1.0;
        m.decay = 1.2 + Math.random() * 0.6;
        m.cooldown = 2.5 + Math.random() * 4.0;
      }
      continue;
    }

    m.x += m.vx * delta;
    m.y += m.vy * delta;
    m.life -= m.decay * delta;

    if (m.y > 0.55 * h || m.life <= 0) {
      m.active = false;
      continue;
    }

    const tailX = m.x - (m.vx / 400) * m.len;
    const tailY = m.y - (m.vy / 400) * m.len;

    const streakGrad = ctx.createLinearGradient(m.x, m.y, tailX, tailY);
    streakGrad.addColorStop(0, `rgba(255, 255, 255, ${(m.life * 0.95).toFixed(2)})`);
    streakGrad.addColorStop(0.3, `rgba(56, 189, 248, ${(m.life * 0.7).toFixed(2)})`);
    streakGrad.addColorStop(1, "rgba(56, 189, 248, 0)");

    ctx.strokeStyle = streakGrad;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(m.x, m.y);
    ctx.lineTo(tailX, tailY);
    ctx.stroke();

    ctx.fillStyle = `rgba(255, 255, 255, ${m.life.toFixed(2)})`;
    ctx.beginPath();
    ctx.arc(m.x, m.y, 2.2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawJetStreams(ctx, w, h, elapsed, delta) {
  ctx.save();
  ctx.lineWidth = 1.2;
  for (let i = 0; i < jetStreams.length; i++) {
    const js = jetStreams[i];
    js.xOffset = (js.xOffset + delta * js.speed) % 1.2;
    const x1 = (js.xOffset - 0.2) * w;
    const x2 = x1 + js.lengthRatio * w;
    const y = js.yRatio * h;

    const streamGrad = ctx.createLinearGradient(x1, y, x2, y);
    streamGrad.addColorStop(0, "rgba(56, 189, 248, 0)");
    streamGrad.addColorStop(0.5, `rgba(186, 230, 253, ${js.alpha})`);
    streamGrad.addColorStop(1, "rgba(56, 189, 248, 0)");

    ctx.strokeStyle = streamGrad;
    ctx.beginPath();
    ctx.moveTo(x1, y);
    ctx.lineTo(x2, y);
    ctx.stroke();
  }
  ctx.restore();
}

function drawClouds(ctx, w, h, elapsed, delta, t) {
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  for (let i = 0; i < clouds.length; i++) {
    const c = clouds[i];
    c.xRatio = (c.xRatio + delta * c.speed) % 1.2;
    const cx = (c.xRatio - 0.1) * w;
    const cy = c.yRatio * h;
    const width = (130 + c.puffs.length * 28) * c.scale;
    const height = 18 * c.scale;
    const left = cx - width * 0.5;
    const right = cx + width * 0.5;
    const wave = Math.sin(elapsed * (0.35 + i * 0.08) + i) * 3;
    const cloudGrad = ctx.createLinearGradient(0, cy - height, 0, cy + height);

    if (t < 0.5) {
      cloudGrad.addColorStop(0, "rgba(235, 247, 255, 0)");
      cloudGrad.addColorStop(0.42, "rgba(225, 242, 252, 0.18)");
      cloudGrad.addColorStop(0.62, "rgba(186, 218, 235, 0.12)");
      cloudGrad.addColorStop(1, "rgba(186, 230, 253, 0)");
    } else {
      cloudGrad.addColorStop(0, "rgba(255, 220, 190, 0)");
      cloudGrad.addColorStop(0.42, "rgba(255, 214, 178, 0.20)");
      cloudGrad.addColorStop(0.62, "rgba(234, 145, 112, 0.13)");
      cloudGrad.addColorStop(1, "rgba(126, 67, 78, 0)");
    }

    ctx.fillStyle = cloudGrad;
    ctx.beginPath();
    ctx.moveTo(left + width * 0.08, cy + height * 0.2 + wave);
    ctx.bezierCurveTo(left + width * 0.02, cy + height * 0.02 + wave, left + width * 0.08, cy - height * 0.55 + wave, left + width * 0.2, cy - height * 0.78 + wave);
    ctx.bezierCurveTo(left + width * 0.34, cy - height + wave, left + width * 0.48, cy - height * 0.4 + wave, cx, cy - height * 0.25 + wave);
    ctx.bezierCurveTo(right - width * 0.34, cy - height * 0.8 + wave, right - width * 0.08, cy - height * 0.02 + wave, right - width * 0.08, cy + height * 0.2 + wave);
    ctx.bezierCurveTo(right - width * 0.08, cy + height * 0.38 + wave, right - width * 0.18, cy + height * 0.52 + wave, right - width * 0.28, cy + height * 0.48 + wave);
    ctx.bezierCurveTo(right - width * 0.48, cy + height * 0.58 + wave, left + width * 0.48, cy + height * 0.58 + wave, left + width * 0.28, cy + height * 0.48 + wave);
    ctx.bezierCurveTo(left + width * 0.18, cy + height * 0.52 + wave, left + width * 0.08, cy + height * 0.38 + wave, left + width * 0.08, cy + height * 0.2 + wave);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

function drawGroundRunway(ctx, w, h, elapsed) {
  ctx.save();
  const groundY = 0.985 * h;

  ctx.fillStyle = "#020617";
  ctx.fillRect(0, groundY, w, h - groundY);

  ctx.strokeStyle = "rgba(56, 189, 248, 0.3)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, groundY);
  ctx.lineTo(w, groundY);
  ctx.stroke();

  ctx.font = "9px 'Space Mono', monospace";
  ctx.fillStyle = "rgba(148, 163, 184, 0.75)";
  ctx.textAlign = "center";
  ctx.restore();
}

function drawStrataDemarcations(ctx, w, h, elapsed, hoveredLayer) {
  ctx.save();

  if (hoveredLayer) {
    const targetStrata = STRATA_SECTIONS.find((s) => s.id === hoveredLayer);
    if (targetStrata) {
      const y1 = targetStrata.yStart * h;
      const y2 = targetStrata.yEnd * h;
      const bandHeight = y2 - y1;

      ctx.fillStyle = "rgba(56, 189, 248, 0.06)";
      ctx.fillRect(0, y1, w, bandHeight);

      const bracketSize = 16;
      ctx.strokeStyle = "#38bdf8";
      ctx.lineWidth = 2;

      ctx.beginPath();
      ctx.moveTo(18, y1 + bracketSize);
      ctx.lineTo(18, y1 + 4);
      ctx.lineTo(18 + bracketSize, y1 + 4);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(w - 18 - bracketSize, y1 + 4);
      ctx.lineTo(w - 18, y1 + 4);
      ctx.lineTo(w - 18, y1 + bracketSize);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(18, y2 - bracketSize);
      ctx.lineTo(18, y2 - 4);
      ctx.lineTo(18 + bracketSize, y2 - 4);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(w - 18 - bracketSize, y2 - 4);
      ctx.lineTo(w - 18, y2 - 4);
      ctx.lineTo(w - 18, y2 - bracketSize);
      ctx.stroke();

      ctx.font = "700 13px 'Orbitron', sans-serif";
      ctx.fillStyle = "rgba(56, 189, 248, 0.45)";
      ctx.textAlign = "center";
      ctx.letterSpacing = "0.2em";
      ctx.fillText(`✦ STRATUM SELECTED // ${targetStrata.name} (${targetStrata.alt}) ✦`, w * 0.5, y1 + bandHeight * 0.5 + 4);
    }
  }

  for (let i = 0; i < STRATA_SECTIONS.length; i++) {
    const s = STRATA_SECTIONS[i];
    const y = s.yEnd * h;

    if (s.id === "troposphere") continue;

    ctx.save();
    ctx.setLineDash([8, 8]);
    ctx.strokeStyle = "rgba(56, 189, 248, 0.35)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(w * 0.06, y);
    ctx.lineTo(w * 0.40, y);
    ctx.moveTo(w * 0.60, y);
    ctx.lineTo(w * 0.94, y);
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.font = "700 9px 'Space Mono', monospace";
    ctx.fillStyle = "#38bdf8";
    ctx.textAlign = "left";

    const tagText = `[${s.leftTag}]`;
    const textWidth = ctx.measureText(tagText).width;
    const leftLabelY = y - 12;
    ctx.fillStyle = "rgba(2, 6, 23, 0.85)";
    ctx.fillRect(16, leftLabelY - 9, textWidth + 12, 18);
    ctx.strokeStyle = "rgba(56, 189, 248, 0.3)";
    ctx.strokeRect(16, leftLabelY - 9, textWidth + 12, 18);

    ctx.fillStyle = "#7dd3fc";
    ctx.fillText(tagText, 22, leftLabelY + 3);

    ctx.textAlign = "right";
    const boundaryText = s.boundaryLabel;
    const bWidth = ctx.measureText(boundaryText).width;
    const rightLabelY = y + 12;
    ctx.fillStyle = "rgba(2, 6, 23, 0.85)";
    const boundaryX = Math.max(16, w - bWidth - 16);
    ctx.fillRect(boundaryX, rightLabelY - 9, bWidth + 12, 18);
    ctx.strokeStyle = "rgba(56, 189, 248, 0.25)";
    ctx.strokeRect(boundaryX, rightLabelY - 9, bWidth + 12, 18);

    ctx.fillStyle = "#94a3b8";
    ctx.fillText(boundaryText, w - 16, rightLabelY + 3);
    ctx.restore();

    if (s.karmanY) {
      const ky = s.karmanY * h;
      ctx.save();
      ctx.setLineDash([12, 6]);
      ctx.strokeStyle = "rgba(250, 204, 21, 0.55)";
      ctx.lineWidth = 1.5;
      ctx.shadowColor = "#facc15";
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.moveTo(0, ky);
      ctx.lineTo(w, ky);
      ctx.stroke();

      ctx.font = "700 9px 'Space Mono', monospace";
      const karmanTag = "[ALT: 100 KM // KÁRMÁN LINE · BOUNDARY OF SPACE]";
      const ktWidth = ctx.measureText(karmanTag).width;
      ctx.fillStyle = "rgba(2, 6, 23, 0.9)";
      ctx.fillRect(16, ky - 9, ktWidth + 14, 18);
      ctx.strokeStyle = "rgba(250, 204, 21, 0.6)";
      ctx.strokeRect(16, ky - 9, ktWidth + 14, 18);

      ctx.fillStyle = "#facc15";
      ctx.fillText(karmanTag, 23, ky + 3);
      ctx.restore();
    }
  }

  ctx.restore();
}

function drawAtmosphere(delta, elapsed, animationTime) {
  if (!atmosCtx || !atmosCanvas) return;

  const w = atmosCanvas.width;
  const h = atmosCanvas.height;

  currentSunsetRatio += (targetSunsetRatio - currentSunsetRatio) * 0.05;

  if (currentAtmospherePhase === "mesosphere") {
    drawMesosphereGradient(atmosCtx, w, h, animationTime);
    drawMesosphereHaze(atmosCtx, w, h, elapsed, animationTime);
    drawStratosphereMotion(atmosCtx, w, h, animationTime, elapsed);
    drawStars(atmosCtx, w, h, elapsed, 0.0);
    drawMeteors(atmosCtx, w, h, elapsed, delta);
  } else if (currentAtmospherePhase === "thermosphere") {
    drawThermosphereGradient(atmosCtx, w, h, animationTime);
    drawStratosphereMotion(atmosCtx, w, h, animationTime, elapsed);
    drawStars(atmosCtx, w, h, elapsed, 0.0);
    drawAurora(atmosCtx, w, h, elapsed);
  } else if (currentAtmospherePhase === "exosphere") {
    drawNightGradient(atmosCtx, w, h);
    drawStars(atmosCtx, w, h, elapsed, 0.0);
    drawSatellite(atmosCtx, w, h, elapsed, delta);
  } else if (currentAtmospherePhase === "stratosphere") {
    drawStratosphereGradient(atmosCtx, w, h, animationTime);
    drawStratosphereMotion(atmosCtx, w, h, animationTime, elapsed);
    drawJetStreams(atmosCtx, w, h, elapsed, delta);
  } else {
    if (atmosphereTheme === "night") {
      drawNightGradient(atmosCtx, w, h);
      drawStars(atmosCtx, w, h, elapsed, 0.0);
    } else {
      drawAtmosphereGradient(atmosCtx, w, h, currentSunsetRatio);
    }
    drawMountainRange(atmosCtx, w, h, atmosphereTheme === "night" ? 0.0 : currentSunsetRatio);
    drawClouds(atmosCtx, w, h, elapsed, delta, atmosphereTheme === "night" ? 0.0 : currentSunsetRatio);
    drawGroundRunway(atmosCtx, w, h, elapsed);
  }

}

// RESIZE : Camera & Canvas
function resizeCanvases() {
  const width = document.documentElement.clientWidth || window.innerWidth;
  const height = document.documentElement.clientHeight || window.innerHeight;
  const dpr = Math.min(window.devicePixelRatio, 2);

  camera.aspect = width / height;
  camera.updateProjectionMatrix();

  if (modelCamera) {
    modelCamera.aspect = width / height;
    modelCamera.updateProjectionMatrix();
  }

  renderer.setSize(width, height);
  renderer.setPixelRatio(dpr);

  if (atmosCanvas) {
    atmosCanvas.width = width;
    atmosCanvas.height = height;
    atmosCanvas.style.width = width + "px";
    atmosCanvas.style.height = height + "px";
  }
}

window.addEventListener("resize", resizeCanvases);
resizeCanvases();

// CONTROLS
if (launchTimeline) {
  launchTimeline.addEventListener("input", (e) => {
    const val = parseFloat(e.target.value);
    seekAnimation(val);
  });
}
// 1. Launch Button 
if (btnLaunch) {
  btnLaunch.addEventListener("click", () => {
    startLaunchCountdown();
  });
}

// 2. Rewind Launchpad Animation
if (btnResetAnim) {
  btnResetAnim.addEventListener("click", () => {
    resetToPad();
  });
}

// 3. Orbit Control Toggle Button
if (btnOrbitControl) {
  btnOrbitControl.addEventListener("click", () => {
    setCameraMode(cameraMode === "cinematic" ? "free" : "cinematic");
  });
}

// Strata Demarcations Toggle Button
// if (btnStrata) {
//   btnStrata.addEventListener("click", () => {
//     showStrataLines = !showStrataLines;
//     if (showStrataLines) {
//       btnStrata.classList.add("active");
//       btnStrata.innerHTML = `<span>≡</span> STRATA: ON`;
//     } else {
//       btnStrata.classList.remove("active");
//       btnStrata.innerHTML = `<span>≡</span> STRATA: OFF`;
//     }
//   });
// }

// 4. Light Switch Interaction [ Day / Sunset / Night ]
if (btnLighting) {
  btnLighting.addEventListener("click", () => {
    currentPresetIndex = (currentPresetIndex + 1) % lightingPresets.length;
    applyLightingPreset(currentPresetIndex);
  });
}

// 5. Reset to Default Camera View
if (btnResetCamera) {
  btnResetCamera.addEventListener("click", () => {
    setCameraMode("cinematic");
    if (currentAtmospherePhase === "troposphere") {
      if (defaultCameraPos.lengthSq() > 0) {
        camera.position.copy(defaultCameraPos);
        controls.target.copy(defaultTarget);
        controls.update();
      }
    } else if (spacecraft) {
      const scPos = new THREE.Vector3();
      spacecraft.getWorldPosition(scPos);
      camera.position.set(scPos.x - 20, scPos.y + 10, scPos.z + 180);
      controls.target.copy(scPos);
      controls.update();
    }
  });
}

// ANIMATION FRAME REQUEST 
let lastTime = performance.now();

function animate() {
  requestAnimationFrame(animate);

  const now = performance.now();
  const delta = Math.min((now - lastTime) * 0.001, 0.1);
  const elapsed = now * 0.001;
  lastTime = now;

  // 1. Advance Animation Mixer
  if (mixer && isAnimPlaying) {
    animTime += delta;

    // Transition between Atmospheric Layers
    if (currentAtmospherePhase === "troposphere" && animTime >= STRATOSPHERE_START_TIME && !isTransitioning && !hasAutoPausedAtStratosphere) {
      triggerAtmosphereTransition("stratosphere", STRATOSPHERE_START_TIME);
    } else if (currentAtmospherePhase === "stratosphere" && animTime >= MESOSPHERE_START_TIME && !isTransitioning && !hasAutoPausedAtMesosphere) {
      triggerAtmosphereTransition("mesosphere", MESOSPHERE_START_TIME);
    } else if (currentAtmospherePhase === "mesosphere" && animTime >= THERMOSPHERE_START_TIME && !isTransitioning && !hasAutoPausedAtThermosphere) {
      triggerAtmosphereTransition("thermosphere", THERMOSPHERE_START_TIME);
    } else if (currentAtmospherePhase === "thermosphere" && animTime >= EXOSPHERE_START_TIME && !isTransitioning && !hasAutoPausedAtExosphere) {
      triggerAtmosphereTransition("exosphere", EXOSPHERE_START_TIME);
    } else if (animTime >= FINAL_TRANSITION_TIME) {
      animTime = FINAL_TRANSITION_TIME;
      triggerFinalPageTransition();
    } else {
      if (animTime >= ANIMATION_DURATION) {
        animTime = ANIMATION_DURATION;
        isAnimPlaying = false;
        setPlaying(false);
      }
      mixer.setTime(animTime);
      updateTimelineUI(animTime, elapsed);
    }
  } else if (mixer) {
    updateTimelineUI(animTime, elapsed);
  }

  // 2. Get Spacecraft World Position for Tracking
  let scPos = null;
  if (spacecraft) {
    scPos = new THREE.Vector3();
    spacecraft.getWorldPosition(scPos);
  }

  // 3. Update Launchpad & Ascent Smoke Particle System
  updateSmokeParticles(delta, animTime);

  // 4. Render Dynamic Atmospheric Layers on 2D Canvas
  drawAtmosphere(delta, elapsed, animTime);

  // 5. Render 3D Scene with selected camera
  const activeCam = (cameraMode === "cinematic" && modelCamera) ? modelCamera : camera;

  if (cameraMode === "free") {
    if (scPos && animTime >= 5.0) {
      controls.target.y += (scPos.y - controls.target.y) * 0.08;
      controls.target.x += (scPos.x - controls.target.x) * 0.08;
      controls.target.z += (scPos.z - controls.target.z) * 0.08;
    }
    controls.update();
  }

  renderer.render(scene, activeCam);
}

animate();
