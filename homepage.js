import * as THREE from "three";
import { OrbitControls } from "orbitalControls";
import { GLTFLoader } from "gltfLoader";

// Earth's Atmospheric shaders in GLSL
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

// Render Intialisation
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

// Scene  
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x01040a);

// Camera
const camera = new THREE.PerspectiveCamera(16.5, window.innerWidth / window.innerHeight, 0.1, 150);
camera.position.set(0, 0, 12);

// Setup
const earthGroup = new THREE.Group();
earthGroup.rotation.z = THREE.MathUtils.degToRad(23.44);
earthGroup.rotation.x = THREE.MathUtils.degToRad(4.0);

let targetGroupX = -1.25;
let targetGroupY = 0.0;

function updateTargetPosition() {
  const aspect = window.innerWidth / window.innerHeight;
  if (aspect > 1.35) {
    targetGroupX = -1.25;
    targetGroupY = 0.0;
    earthGroup.scale.setScalar(1.0);
  } else if (aspect > 0.95) {
    targetGroupX = -0.80;
    targetGroupY = 0.0;
    earthGroup.scale.setScalar(0.92);
  } else {
    targetGroupX = 0.0;
    targetGroupY = 0.42;
    earthGroup.scale.setScalar(0.78);
  }
}
updateTargetPosition();
scene.add(earthGroup);

// Light
const ambientLight = new THREE.AmbientLight(0x061122, 0.22);
scene.add(ambientLight);

// Directional light
const directionalLight = new THREE.DirectionalLight(0xffffff, 4.2);
directionalLight.position.set(7.5, 0.4, 0.6);
directionalLight.castShadow = true;
scene.add(directionalLight);

const maxAnisotropy = renderer.capabilities.getMaxAnisotropy();
const lightDirection = new THREE.Vector3();
lightDirection.copy(directionalLight.position).normalize();

// Textures and Globe Material
const textureLoader = new THREE.TextureLoader();

const dayTexture = textureLoader.load('./Solar System/texture/planets/earth_day.jpg');
dayTexture.colorSpace = THREE.SRGBColorSpace;
dayTexture.anisotropy = Math.min(8, maxAnisotropy);
dayTexture.wrapS = THREE.RepeatWrapping;
dayTexture.wrapT = THREE.RepeatWrapping;

const nightTexture = textureLoader.load('./Solar System/texture/planets/earth_night.jpg');
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

// Earth's Atmosphere
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

// Earth's Clouds Texture
const cloudsTexture = textureLoader.load('./Solar System/texture/planets/earth_clouds.jpg');
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

// Stars Background
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

  // Star Variations
  starSizes[i] = 0.22 + Math.random() * 0.5;
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

// Earth's Controlled Damping & Rotation
let isDragging = false;
let previousPointerX = 0;
let previousPointerY = 0;
let spinVelocityY = 0;
let spinVelocityX = 0;

window.addEventListener('pointerdown', (e) => {
  if (e.target.closest('a, button, input, textarea, select')) return;
  isDragging = true;
  previousPointerX = e.clientX;
  previousPointerY = e.clientY;
}, { passive: true });

window.addEventListener('pointermove', (e) => {
  if (!isDragging) return;
  const deltaX = e.clientX - previousPointerX;
  const deltaY = e.clientY - previousPointerY;
  previousPointerX = e.clientX;
  previousPointerY = e.clientY;

  spinVelocityY = deltaX * 0.004;
  spinVelocityX = deltaY * 0.002;
}, { passive: true });

window.addEventListener('pointerup', () => {
  isDragging = false;
}, { passive: true });

window.addEventListener('pointercancel', () => {
  isDragging = false;
}, { passive: true });

// Resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  updateTargetPosition();
});

// Animation frame request
function animate() {
  requestAnimationFrame(animate);

  const elapsedTime = performance.now() * 0.001;
  starMaterial.uniforms.uTime.value = elapsedTime;

  earthGroup.position.x += (targetGroupX - earthGroup.position.x) * 0.05;
  earthGroup.position.y += (targetGroupY - earthGroup.position.y) * 0.08;

 // Earth's Rotation
  globe.rotation.y += spinVelocityY + 0.0006;
  clouds.rotation.y += spinVelocityY * 1.1 + 0.0009;

  globe.rotation.x += spinVelocityX;
  globe.rotation.x *= 0.96;

  spinVelocityY *= 0.88;
  spinVelocityX *= 0.88;

  lightDirection.copy(directionalLight.position).normalize();
  renderer.render(scene, camera);
}
animate();

// Coordinated Universal Time Clock
function initUIControls() {
  const navLinks = document.querySelectorAll('.nav-link');
  navLinks.forEach((link) => {
    link.addEventListener('click', function () {
      navLinks.forEach((l) => l.classList.remove('active'));
      this.classList.add('active');
    });
  });

  const utcClockEl = document.getElementById('liveUtcClock');
  function updateUtcClock() {
    if (!utcClockEl) return;
    const now = new Date();
    const hours = String(now.getUTCHours()).padStart(2, '0');
    const mins = String(now.getUTCMinutes()).padStart(2, '0');
    const secs = String(now.getUTCSeconds()).padStart(2, '0');
    utcClockEl.textContent = `${hours}:${mins}:${secs} UTC`;
  }
  updateUtcClock();
  setInterval(updateUtcClock, 1000);
}
// DATASET REFERENCE FOR ATMOSPHERIC STRATA & SPACECRAFT
const STRATA_DATA = {
  troposphere: {
    badge: "0 – 12 KM",
    pill: "STRATUM 01 - SURFACE BOUNDARY",
    title: "TROPOSPHERE",
    subtitle: "THE WEATHER ENGINE & BIOSPHERE BLANKET",
    alt: "0 – 12 km",
    temp: "+15°C to -56°C",
    mass: "~75% of Total",
    pressure: "1.013 bar (101.3 kPa)",
    narrative:
      "The troposphere is the lowest and densest atmospheric layer where virtually all weather originates. Heated from below by solar radiation absorbed by Earth's continental crust and oceans, temperature decreases steadily with elevation at an average lapse rate of 6.5°C per kilometer until reaching the tropopause boundary.",
    image: "./Assets/layer_troposphere.jpg",
    caption: "Tropospheric convective clouds & dense planetary boundary.",
    phenomena: [
      "Cloud Formations (Cumulonimbus & Cirrus)",
      "Commercial Aviation (10–12 km)",
      "Mount Everest Peak (8,848 m)",
      "Convective Jet Streams"
    ]
  },
  stratosphere: {
    badge: "12 – 50 KM",
    pill: "STRATUM 02 - OZONE SHIELD",
    title: "STRATOSPHERE",
    subtitle: "THE ULTRAVIOLET ABSORPTION SHIELD",
    alt: "12 – 50 km",
    temp: "-56°C to -3°C",
    mass: "~20% of Total",
    pressure: "100 to 1 hPa",
    narrative:
      "Characterized by thermal inversion where temperatures rise with altitude, the stratosphere houses Earth's ozone layer (O₃). This protective barrier absorbs lethal high-energy solar UV radiation. Free of weather turbulence, it offers hyper-stable conditions for supersonic flight and high-altitude meteorological balloons.",
    image: "./Assets/layer_stratosphere.jpg",
    caption: "Stratospheric dry laminar flow and protective ozone absorption tier.",
    phenomena: [
      "Ozone Layer : 15–35 km peak",
      "Supersonic Reconnaissance : SR-71 / Concorde",
      "Felix Baumgartner Stratos Jump : 39 km",
      "Polar Stratospheric Clouds : Nacreous"
    ]
  },
  mesosphere: {
    badge: "50 – 85 KM",
    pill: "STRATUM 03 - METEOR INCINERATOR",
    title: "MESOSPHERE",
    subtitle: "THE COLD FRONTIER & METEOR SHIELD",
    alt: "50 – 85 km",
    temp: "-3°C to -90°C",
    mass: "~0.1% of Total",
    pressure: "1 to 0.01 hPa",
    narrative:
      "The coldest atmospheric strata where temperatures plummet to -90°C near the mesopause. Despite extreme rarification, atmospheric density is sufficient to incinerate millions of colliding space debris particles and meteoroids through hypersonic aerodynamic friction, lighting up noctilucent blue-electric ice clouds.",
    image: "./Assets/layer_mesosphere.jpg",
    caption: "Hypersonic meteor ablation & ice crystals glowing near the mesopause.",
    phenomena: [
      "Meteoroid Incineration & Shooting Stars",
      "Night-Shining Ice Clouds",
      "Upper Atmospheric Lightning : Sprites & ELVES",
      "Suborbital Sounding Rocket Apogee"
    ]
  },
  thermosphere: {
    badge: "85 – 600 KM",
    pill: "STRATUM 04 - IONIZED AURORAL CORRIDOR",
    title: "THERMOSPHERE",
    subtitle: "THE SOLAR STORM SHIELD & ORBITAL CORRIDOR",
    alt: "85 – 600 km",
    temp: "500°C to 2,000°C (Kinetic)",
    mass: "<0.01% of Total",
    pressure: "10⁻³ to 10⁻⁸ hPa",
    narrative:
      "Crossed by the Kármán line at 100 km (the formal frontier of space), the thermosphere is energized by extreme ultraviolet solar flux. Highly energized gas ions collide with solar wind particles along Earth's geomagnetic field lines, producing dazzling polar auroras. Hosts the International Space Station and Low Earth Orbit satellites.",
    image: "./Assets/layer_thermosphere.jpg",
    caption: "Geomagnetic auroral curtains glowing above the Kármán boundary line.",
    phenomena: [
      "The Kármán Line : 100 km boundary",
      "Aurora Borealis & Australis",
      "International Space Station : ISS at 408 km",
      "Ionospheric Radio Reflection Waveguides"
    ]
  },
  exosphere: {
    badge: "600 – 10,000 KM",
    pill: "STRATUM 05 - DEEP SPACE THRESHOLD",
    title: "EXOSPHERE",
    subtitle: "THE BALLISTIC ESCAPE REALM & GEOCORONA",
    alt: "600 – 10,000 km",
    temp: "Up to 1,500°C (Kinetic gas)",
    mass: "Trace / Negligible",
    pressure: "Deep Space Vacuum (<10⁻¹⁰ hPa)",
    narrative:
      "The outermost fringe where Earth's atmosphere diffuses smoothly into the vacuum of interplanetary space. Hydrogen, helium, and atomic oxygen follow ballistic trajectories without colliding, with high-velocity atoms escaping Earth's gravitational pull into space. Encompasses geosynchronous satellite orbits and the luminous hydrogen geocorona.",
    image: "./Assets/layer_exosphere.jpg",
    caption: "Interplanetary diffuse hydrogen geocorona merging into deep space.",
    phenomena: [
      "Hydrogen Geocorona Exhalations",
      "Geostationary Telecommunications Orbits : 35,786 km",
      "Hubble Space Telescope Orbit : 540 km",
      "Gravitational Atmospheric Jeans Escape"
    ]
  }
};

// 3D SPACE SHUTTLE MINI-CANVAS
let shuttleRenderer = null;
let shuttleScene = null;
let shuttleCamera = null;
let shuttleControls = null;
let shuttleMeshGroup = null;
let shuttleAnimFrameId = null;
let isShuttleLoading = false;
let shuttleHomePosition = null;
let shuttleHomeRotation = null;
let shuttleHomeCameraPosition = null;

function resetShuttlePosition() {
  if (!shuttleMeshGroup || !shuttleCamera || !shuttleControls) return;

  if (shuttleHomePosition) {
    shuttleMeshGroup.position.copy(shuttleHomePosition);
  }
  if (shuttleHomeRotation) {
    shuttleMeshGroup.rotation.copy(shuttleHomeRotation);
  }
  if (shuttleHomeCameraPosition) {
    shuttleCamera.position.copy(shuttleHomeCameraPosition);
  }

  shuttleControls.target.set(0, 0, 0);
  shuttleControls.update();
}

function initShuttleViewer() {
  const container = document.getElementById("shuttle3dContainer");
  const canvasEl = document.getElementById("shuttleCanvas");
  const loaderEl = document.getElementById("shuttleLoader");
  const resetButton = document.getElementById("resetShuttleView");
  if (!container || !canvasEl || shuttleRenderer) return;

  const width = container.clientWidth || 380;
  const height = container.clientHeight || 250;

  shuttleRenderer = new THREE.WebGLRenderer({
    canvas: canvasEl,
    antialias: true,
    alpha: true,
    powerPreference: "high-performance"
  });
  shuttleRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  shuttleRenderer.setSize(width, height, false);
  shuttleRenderer.outputColorSpace = THREE.SRGBColorSpace;
  shuttleRenderer.toneMapping = THREE.ACESFilmicToneMapping;
  shuttleRenderer.toneMappingExposure = 1.25;

  shuttleScene = new THREE.Scene();

  shuttleCamera = new THREE.PerspectiveCamera(38, width / height, 0.1, 1000);
  shuttleCamera.position.set(22, 14, 26);
  shuttleCamera.lookAt(0, 0, 0);

  shuttleControls = new OrbitControls(shuttleCamera, canvasEl);
  shuttleControls.enableDamping = true;
  shuttleControls.dampingFactor = 0.07;
  shuttleControls.minDistance = 3;
  shuttleControls.maxDistance = 90;
  shuttleControls.target.set(0, 0, 0);
  resetButton?.addEventListener("click", resetShuttlePosition);

  // Sunset lighting
  const ambLight = new THREE.AmbientLight(0x2a183c, 0.55);
  shuttleScene.add(ambLight);

  const mainLight = new THREE.DirectionalLight(0xff9a52, 4.2);
  mainLight.position.set(-24, 10, 22);
  shuttleScene.add(mainLight);

  const fillLight = new THREE.DirectionalLight(0x7c4d9e, 1.65);
  fillLight.position.set(24, 12, -18);
  shuttleScene.add(fillLight);

  const duskRimLight = new THREE.DirectionalLight(0x376ca8, 2.1);
  duskRimLight.position.set(0, 18, -28);
  shuttleScene.add(duskRimLight);

  shuttleScene.background = new THREE.Color(0x090511);

  shuttleMeshGroup = new THREE.Group();
  shuttleScene.add(shuttleMeshGroup);

  // Load Model
  if (!isShuttleLoading) {
    isShuttleLoading = true;
    const loader = new GLTFLoader();
    loader.load(
      "./models/space-shuttle-low-poly.glb",
      (gltf) => {
        const vehiclePartNames = [
          "Spacecraft",
          "Fuel_Tank",
          "Left_Rocket_Thrust",
          "Right_Rocket_Thrust"
        ];
        const vehicleParts = vehiclePartNames
          .map((name) => gltf.scene.getObjectByName(name))
          .filter(Boolean)
          .map((part) => part.clone(true));

        vehicleParts.forEach((part) => {
          part.traverse((child) => {
            if (child.isMesh) {
              child.castShadow = true;
              child.receiveShadow = true;
              if (child.material) {
                child.material.side = THREE.DoubleSide;
              }
            }
          });
          shuttleMeshGroup.add(part);
        });

        if (vehicleParts.length === 0) {
          shuttleMeshGroup.add(gltf.scene.clone(true));
        }

        // Center the complete vehicle stack within shuttleMeshGroup
        const bbox = new THREE.Box3().setFromObject(shuttleMeshGroup);
        const center = bbox.getCenter(new THREE.Vector3());
        const size = bbox.getSize(new THREE.Vector3());
        shuttleMeshGroup.position.sub(center);
        shuttleHomePosition = shuttleMeshGroup.position.clone();
        shuttleHomeRotation = shuttleMeshGroup.rotation.clone();

        // Position camera to fit the orbiter nicely
        const maxDim = Math.max(size.x, size.y, size.z) || 16;
        shuttleCamera.position.set(maxDim * 0.95, maxDim * 0.65, maxDim * 1.35);
        shuttleHomeCameraPosition = shuttleCamera.position.clone();
        shuttleControls.target.set(0, 0, 0);
        shuttleControls.update();

        if (loaderEl) {
          loaderEl.classList.add("hidden");
        }
      },
      undefined,
      (err) => {
        console.error("Shuttle GLTF load error:", err);
        if (loaderEl) {
          loaderEl.innerHTML = "<span>FAILED TO LOAD 3D MODEL</span>";
        }
      }
    );
  }

  function renderShuttle() {
    shuttleAnimFrameId = requestAnimationFrame(renderShuttle);

    const modal = document.getElementById("atmosphereModal");
    if (!modal || !modal.classList.contains("open")) {
      return; // Pause rendering when modal is closed
    }

    if (shuttleControls) shuttleControls.update();

    if (shuttleRenderer && shuttleScene && shuttleCamera) {
      shuttleRenderer.render(shuttleScene, shuttleCamera);
    }
  }

  renderShuttle();
}

function resizeShuttleViewer() {
  const container = document.getElementById("shuttle3dContainer");
  if (!container || !shuttleRenderer || !shuttleCamera) return;
  const width = container.clientWidth;
  const height = container.clientHeight;
  if (width === 0 || height === 0) return;
  shuttleCamera.aspect = width / height;
  shuttleCamera.updateProjectionMatrix();
  shuttleRenderer.setSize(width, height, false);
}

// MODAL CONTROLLER & STRATA TAB SWITCHER
function setupAtmosphereModal() {
  const modal = document.getElementById("atmosphereModal");
  const backdrop = document.getElementById("modalBackdrop");
  const closeBtn = document.getElementById("closeModalBtn");
  const navDataBtn = document.getElementById("navData");
  const cardAtmosphere = document.getElementById("cardAtmosphere");

  if (!modal) return;

  function openModal() {
    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    if (window.location.hash !== "#data") {
      history.replaceState(null, "", "#data");
    }

    if (!shuttleRenderer) {
      initShuttleViewer();
    }
    requestAnimationFrame(() => {
      resizeShuttleViewer();
    });
    setTimeout(() => {
      resizeShuttleViewer();
    }, 150);
  }

  function closeModal() {
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    if (window.location.hash === "#data") {
      history.replaceState(null, "", window.location.pathname + window.location.search);
    }
  }

  if (navDataBtn) {
    navDataBtn.addEventListener("click", (e) => {
      e.preventDefault();
      openModal();
    });
  }

  if (cardAtmosphere) {
    cardAtmosphere.addEventListener("click", (e) => {
      e.preventDefault();
      openModal();
    });
    cardAtmosphere.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openModal();
      }
    });
  }

  if (closeBtn) {
    closeBtn.addEventListener("click", closeModal);
  }

  if (backdrop) {
    backdrop.addEventListener("click", closeModal);
  }

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal.classList.contains("open")) {
      closeModal();
    }
  });

  if (window.location.hash === "#data") {
    openModal();
  }

  // Strata Tab Switcher
  const strataTabs = document.querySelectorAll(".strata-tab");
  const stratumImage = document.getElementById("stratumImage");
  const stratumAltBadge = document.getElementById("stratumAltBadge");
  const stratumCaption = document.getElementById("stratumImageCaption");
  const stratumLayerPill = document.getElementById("stratumLayerPill");
  const stratumTitle = document.getElementById("stratumTitle");
  const stratumSub = document.getElementById("stratumSub");
  const stratumAlt = document.getElementById("stratumAlt");
  const stratumTemp = document.getElementById("stratumTemp");
  const stratumMass = document.getElementById("stratumMass");
  const stratumPressure = document.getElementById("stratumPressure");
  const stratumNarrative = document.getElementById("stratumNarrative");
  const stratumPhenomena = document.getElementById("stratumPhenomena");

  function switchStratum(layerKey) {
    const data = STRATA_DATA[layerKey];
    if (!data) return;

    strataTabs.forEach((tab) => {
      const isCurrent = tab.getAttribute("data-layer") === layerKey;
      tab.classList.toggle("active", isCurrent);
      tab.setAttribute("aria-selected", isCurrent ? "true" : "false");
    });

    if (stratumImage) {
      stratumImage.style.opacity = "0.3";
      stratumImage.src = data.image;
      stratumImage.alt = `Earth's ${data.title}`;
      stratumImage.onload = () => {
        stratumImage.style.opacity = "1";
      };
    }
    if (stratumAltBadge) stratumAltBadge.textContent = data.badge;
    if (stratumCaption) stratumCaption.textContent = data.caption;
    if (stratumLayerPill) stratumLayerPill.textContent = data.pill;
    if (stratumTitle) stratumTitle.textContent = data.title;
    if (stratumSub) stratumSub.textContent = data.subtitle;
    if (stratumAlt) stratumAlt.textContent = data.alt;
    if (stratumTemp) stratumTemp.textContent = data.temp;
    if (stratumMass) stratumMass.textContent = data.mass;
    if (stratumPressure) stratumPressure.textContent = data.pressure;
    if (stratumNarrative) stratumNarrative.textContent = data.narrative;

    if (stratumPhenomena) {
      stratumPhenomena.innerHTML = data.phenomena
        .map((p) => `<span class="p-chip">${p}</span>`)
        .join("");
    }
  }

  strataTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const layer = tab.getAttribute("data-layer");
      if (layer) switchStratum(layer);
    });
  });

  window.addEventListener("resize", () => {
    if (modal.classList.contains("open")) {
      resizeShuttleViewer();
    }
  });
}

// Initialize Loading of Data Panel
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    initUIControls();
    setupAtmosphereModal();
  });
} else {
  initUIControls();
  setupAtmosphereModal();
}