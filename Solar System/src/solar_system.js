import * as THREE from "three";
import { OrbitControls } from "orbitalControls";
import WebGL from "webgl";

const canvas = document.querySelector("#solarSystemCanvas");
const loadingOverlay = document.querySelector("#solarLoadingOverlay");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x01030a);
const solarSystem = new THREE.Group();
scene.add(solarSystem);

const camera = new THREE.PerspectiveCamera(
	45,
	window.innerWidth / window.innerHeight,
	0.1,
	220
);
camera.position.set(0, 15, 45);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.minDistance = 6;
controls.maxDistance = 60;
controls.target.set(0, 0, 0);

const textureLoader = new THREE.TextureLoader();
const maxAnisotropy = renderer.capabilities.getMaxAnisotropy();

// Ambient deep-space fill
scene.add(new THREE.AmbientLight(0x30466b, 0.45));

// 1. ATMOSPHERE GLSL SHADERS
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
    float dayMix = smoothstep(-0.35, 0.65, sunOrientation);
    vec3 atmosphereColor = mix(atmosphereTwilightColor, atmosphereDayColor, dayMix);
    
    float intensity = pow(fresnel, 2.2) * 1.65;
    float sunFactor = smoothstep(-0.45, 0.85, sunOrientation);
    float alpha = intensity * sunFactor;
    gl_FragColor = vec4(atmosphereColor, clamp(alpha, 0.0, 1.0));
}
`;

// 2. CENTRAL STAR: THE SUN (SOL)
const sunTexture = textureLoader.load("../texture/stars/sun.jpg");
sunTexture.colorSpace = THREE.SRGBColorSpace;
sunTexture.anisotropy = Math.min(8, maxAnisotropy);

const sun = new THREE.Mesh(
	new THREE.SphereGeometry(1.15, 64, 64),
	new THREE.MeshBasicMaterial({ map: sunTexture })
);
scene.add(sun);
solarSystem.add(sun);

const sunCoronaMaterial = new THREE.ShaderMaterial({
	uniforms: {
		coronaInnerColor: { value: new THREE.Color("#ffe066") },
		coronaOuterColor: { value: new THREE.Color("#fb8500") }
	},
	vertexShader: atmosphereVertexShader,
	fragmentShader: `
		uniform vec3 coronaInnerColor;
		uniform vec3 coronaOuterColor;

		varying vec3 vNormalWorld;
		varying vec3 vWorldPosition;

		void main() {
			vec3 viewDirection = normalize(vWorldPosition - cameraPosition);
			vec3 normalWorld = normalize(vNormalWorld);
			float fresnel = 1.0 - abs(dot(viewDirection, normalWorld));
			float remappedFresnel = clamp((fresnel - 0.73) / (1.0 - 0.73), 0.0, 1.0);
			float alpha = pow(1.0 - remappedFresnel, 2.0);
			vec3 coronaColor = mix(coronaInnerColor, coronaOuterColor, remappedFresnel);
			gl_FragColor = vec4(coronaColor, alpha * 0.95);
		}
	`,
	blending: THREE.AdditiveBlending,
	side: THREE.BackSide,
	transparent: true,
	depthWrite: false
});

const sunGlow = new THREE.Mesh(
	new THREE.SphereGeometry(1.15 * 1.08, 64, 64),
	sunCoronaMaterial
);
scene.add(sunGlow);
solarSystem.add(sunGlow);

const sunLight = new THREE.PointLight(0xfffaed, 280, 0, 1.8);
sunLight.castShadow = true;
scene.add(sunLight);
solarSystem.add(sunLight);

const animationSpeed = 0.22;

// 3. PLANETARY CATALOGUE WITH REALISTIC TEXTURE & ATMOSPHERE MAPPINGS
const planetData = [
	{
		name: "Mercury",
		radius: 0.16,
		distance: 2.0,
		eccentricity: 0.12,
		inclination: 0.07,
		color: 0xaaa39a,
		speed: 0.020,
		texture: "../texture/planets/mercury.jpg",
		hasAtmosphere: true,
		atmosphereDayColor: "#fcd34d",
		atmosphereTwilightColor: "#f59e0b",
		atmosphereScale: 1.035
	},
	{
		name: "Venus",
		radius: 0.25,
		distance: 3.0,
		eccentricity: 0.05,
		inclination: 0.03,
		color: 0xd99a55,
		speed: 0.015,
		texture: "../texture/planets/venus.jpg",
		cloudsTexture: "../texture/planets/venus_clouds.jpg",
		hasAtmosphere: true,
		atmosphereDayColor: "#fef08a",
		atmosphereTwilightColor: "#d97706",
		atmosphereScale: 1.055
	},
	{
		name: "Earth",
		radius: 0.28,
		distance: 4.1,
		eccentricity: 0.03,
		inclination: 0.02,
		color: 0x3f8edb,
		speed: 0.012,
		texture: "../texture/planets/earth_day.jpg",
		nightTexture: "../texture/planets/earth_night.jpg",
		cloudsTexture: "../texture/planets/earth_clouds.jpg",
		hasAtmosphere: true,
		atmosphereDayColor: "#38bdf8",
		atmosphereTwilightColor: "#0284c7",
		atmosphereScale: 1.068,
		moons: [{ name: "Moon", distance: 2.4, radius: 0.25, speed: 0.045, color: 0xbfc6ce, texture: "../texture/moons/luna.jpg" }]
	},
	{
		name: "Mars",
		radius: 0.21,
		distance: 5.2,
		eccentricity: 0.09,
		inclination: 0.04,
		color: 0xc9573e,
		speed: 0.010,
		texture: "../texture/planets/mars.jpg",
		hasAtmosphere: true,
		atmosphereDayColor: "#f97316",
		atmosphereTwilightColor: "#9a3412",
		atmosphereScale: 1.035,
		moons: [
			{ name: "Phobos", distance: 2.1, radius: 0.14, speed: 0.065, color: 0x9b8c7b },
			{ name: "Deimos", distance: 2.8, radius: 0.10, speed: 0.045, color: 0x85786d }
		]
	},
	{
		name: "Jupiter",
		radius: 0.66,
		distance: 7.2,
		eccentricity: 0.05,
		inclination: 0.02,
		color: 0xd5a678,
		speed: 0.006,
		texture: "../texture/planets/jupiter.jpg",
		hasAtmosphere: true,
		atmosphereDayColor: "#fde047",
		atmosphereTwilightColor: "#ca8a04",
		atmosphereScale: 1.040,
		moons: [
			{ name: "Io", distance: 2.2, radius: 0.13, speed: 0.050, color: 0xd1b38e },
			{ name: "Europa", distance: 2.8, radius: 0.11, speed: 0.040, color: 0xc8d0d1 },
			{ name: "Ganymede", distance: 3.4, radius: 0.15, speed: 0.030, color: 0xd1a16b },
			{ name: "Callisto", distance: 4.0, radius: 0.10, speed: 0.022, color: 0xbfc5c9 }
		]
	},
	{
		name: "Saturn",
		radius: 0.56,
		distance: 9.4,
		eccentricity: 0.06,
		inclination: 0.03,
		color: 0xd8c18f,
		speed: 0.004,
		texture: "../texture/planets/saturn.jpg",
		rings: true,
		ringTexture: "../texture/planets/saturn_ring.png",
		hasAtmosphere: true,
		atmosphereDayColor: "#fef08a",
		atmosphereTwilightColor: "#b45309",
		atmosphereScale: 1.042,
		moons: [
			{ name: "Titan", distance: 3.4, radius: 0.14, speed: 0.035, color: 0xd1c2a5 },
			{ name: "Enceladus", distance: 4.1, radius: 0.09, speed: 0.025, color: 0xaeb6bd },
			{ name: "Mimas", distance: 4.7, radius: 0.07, speed: 0.018, color: 0xaea18b }
		]
	},
	{
		name: "Uranus",
		radius: 0.40,
		distance: 11.4,
		eccentricity: 0.05,
		inclination: 0.06,
		color: 0x78c8d2,
		speed: 0.003,
		texture: "../texture/planets/uranus.jpg",
		rings: true,
		hasAtmosphere: true,
		atmosphereDayColor: "#67e8f9",
		atmosphereTwilightColor: "#0284c7",
		atmosphereScale: 1.050,
		moons: [
			{ name: "Miranda", distance: 2.2, radius: 0.11, speed: 0.028, color: 0xbfc6c4 },
			{ name: "Ariel", distance: 2.9, radius: 0.09, speed: 0.020, color: 0x9faeae }
		]
	},
	{
		name: "Neptune",
		radius: 0.39,
		distance: 13.3,
		eccentricity: 0.01,
		inclination: 0.05,
		color: 0x4169c1,
		speed: 0.002,
		texture: "../texture/planets/neptune.jpg",
		hasAtmosphere: true,
		atmosphereDayColor: "#38bdf8",
		atmosphereTwilightColor: "#1d4ed8",
		atmosphereScale: 1.048,
		moons: [
			{ name: "Triton", distance: 2.4, radius: 0.15, speed: 0.022, color: 0xb6b7b5, texture: "../texture/moons/triton.jpg" }
		]
	}
];

const planetGeometry = new THREE.SphereGeometry(1, 48, 48);
const planets = [];

function addPlanetRings(planet, radius, ringTexturePath, planetName) {
	let ringMaterial;
	const isSaturn = planetName === "Saturn" || (ringTexturePath && ringTexturePath.includes("saturn"));
	
	const innerR = radius * (isSaturn ? 1.25 : 1.35);
	const outerR = radius * (isSaturn ? 3.10 : 2.25);

	if (ringTexturePath) {
		const ringTex = textureLoader.load(ringTexturePath);
		ringTex.colorSpace = THREE.SRGBColorSpace;
		ringTex.anisotropy = Math.min(8, maxAnisotropy);
		ringMaterial = new THREE.MeshStandardMaterial({
			map: ringTex,
			side: THREE.DoubleSide,
			transparent: true,
			opacity: 0.95,
			roughness: 0.45,
			metalness: 0.05
		});
	} else {
		ringMaterial = new THREE.MeshBasicMaterial({
			color: 0xa0c0d0,
			side: THREE.DoubleSide,
			transparent: true,
			opacity: 0.55
		});
	}

	const ringGeo = new THREE.RingGeometry(innerR, outerR, 128);

	// Map UV coordinates radially for concentric ring texture bands
	const pos = ringGeo.attributes.position;
	const uvs = ringGeo.attributes.uv;
	for (let i = 0; i < pos.count; i++) {
		const vertex = new THREE.Vector3(pos.getX(i), pos.getY(i), pos.getZ(i));
		const dist = vertex.length();
		const u = (dist - innerR) / (outerR - innerR);
		uvs.setXY(i, u, 0.5);
	}
	uvs.needsUpdate = true;

	const ring = new THREE.Mesh(ringGeo, ringMaterial);
	ring.rotation.x = Math.PI / 2;
	planet.add(ring);
}

function addPlanetAtmosphere(planet, radius, data) {
	if (!data.hasAtmosphere) return null;

	const dayColorObj = new THREE.Color(data.atmosphereDayColor || 0x38bdf8);
	const twilightColorObj = new THREE.Color(data.atmosphereTwilightColor || 0x0284c7);
	const scale = data.atmosphereScale || 1.045;

	const atmosphereGeometry = new THREE.SphereGeometry(radius * scale, 32, 32);
	const atmosphereMaterial = new THREE.ShaderMaterial({
		uniforms: {
			atmosphereDayColor: { value: dayColorObj },
			atmosphereTwilightColor: { value: twilightColorObj },
			uLightDirection: { value: new THREE.Vector3(1, 0, 0) }
		},
		vertexShader: atmosphereVertexShader,
		fragmentShader: atmosphereFragmentShader,
		blending: THREE.AdditiveBlending,
		side: THREE.BackSide,
		transparent: true,
		depthWrite: false
	});

	const atmosphereMesh = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
	planet.add(atmosphereMesh);
	return atmosphereMesh;
}

function addPlanetClouds(planet, radius, cloudsPath, planetName) {
	if (!cloudsPath) return null;
	const cloudsTex = textureLoader.load(cloudsPath);
	cloudsTex.colorSpace = THREE.SRGBColorSpace;
	cloudsTex.anisotropy = Math.min(8, maxAnisotropy);

	const scale = planetName === "Venus" ? 1.025 : 1.015;
	const opacity = planetName === "Venus" ? 0.65 : 0.85;

	const cloudsGeo = new THREE.SphereGeometry(radius * scale, 48, 48);
	const cloudsMat = new THREE.MeshStandardMaterial({
		map: cloudsTex,
		transparent: true,
		opacity: opacity,
		blending: THREE.AdditiveBlending
	});
	const cloudsMesh = new THREE.Mesh(cloudsGeo, cloudsMat);
	planet.add(cloudsMesh);
	return cloudsMesh;
}

function addMoons(planetData, planet) {
	if (!planetData.moons) return;
	const moonGeometry = new THREE.SphereGeometry(1, 24, 24);
	for (const moonData of planetData.moons) {
		let moonMaterial;
		if (moonData.texture) {
			const moonTex = textureLoader.load(moonData.texture);
			moonTex.colorSpace = THREE.SRGBColorSpace;
			moonTex.anisotropy = Math.min(4, maxAnisotropy);
			moonMaterial = new THREE.MeshStandardMaterial({
				map: moonTex,
				roughness: 0.85
			});
		} else {
			moonMaterial = new THREE.MeshStandardMaterial({
				color: moonData.color,
				roughness: 0.90
			});
		}
		const moon = new THREE.Mesh(moonGeometry, moonMaterial);
		moon.scale.setScalar(moonData.radius);
		moon.castShadow = true;
		planet.add(moon);
		moonData.angle = Math.random() * Math.PI * 2;
		moonData.mesh = moon;
	}
}

function createOrbitLine(planetData) {
	const points = [];
	const segments = 256;
	const a = planetData.distance;
	const e = planetData.eccentricity;
	const inc = planetData.inclination;

	for (let i = 0; i <= segments; i++) {
		const angle = (i / segments) * Math.PI * 2;
		const r = a * (1 - e * e) / (1 + e * Math.cos(angle));
		const x = Math.cos(angle) * r;
		const y = Math.sin(inc) * Math.sin(angle) * r;
		const z = Math.sin(angle) * r;
		points.push(new THREE.Vector3(x, y, z));
	}

	const geometry = new THREE.BufferGeometry().setFromPoints(points);
	const orbitColor = planetData.atmosphereDayColor || planetData.color || 0x38bdf8;
	const material = new THREE.LineDashedMaterial({
		color: new THREE.Color(orbitColor),
		dashSize: Math.max(0.12, a * 0.035),
		gapSize: Math.max(0.08, a * 0.022),
		scale: 1,
		transparent: true,
		opacity: 0.14,
		depthWrite: false
	});

	const orbitLine = new THREE.LineLoop(geometry, material);
	orbitLine.computeLineDistances();
	solarSystem.add(orbitLine);
	return orbitLine;
}

for (const data of planetData) {
	let planetMaterial;
	if (data.texture) {
		const planetTex = textureLoader.load(data.texture);
		planetTex.colorSpace = THREE.SRGBColorSpace;
		planetTex.anisotropy = Math.min(8, maxAnisotropy);

		let nightTex = null;
		if (data.nightTexture) {
			nightTex = textureLoader.load(data.nightTexture);
			nightTex.colorSpace = THREE.SRGBColorSpace;
			nightTex.anisotropy = Math.min(8, maxAnisotropy);
		}

		planetMaterial = new THREE.MeshStandardMaterial({
			map: planetTex,
			emissiveMap: nightTex,
			emissive: nightTex ? new THREE.Color(0xffffff) : new THREE.Color(0x000000),
			emissiveIntensity: nightTex ? 0.85 : 0.0,
			roughness: 0.72,
			metalness: 0.05
		});
	} else {
		planetMaterial = new THREE.MeshStandardMaterial({
			color: data.color,
			roughness: 0.78,
			metalness: 0.04
		});
	}

	const planet = new THREE.Mesh(planetGeometry, planetMaterial);
	planet.scale.setScalar(data.radius);
	planet.castShadow = true;
	planet.receiveShadow = true;
	solarSystem.add(planet);

	if (data.rings) addPlanetRings(planet, data.radius, data.ringTexture, data.name);
	const atmosphereMesh = addPlanetAtmosphere(planet, data.radius, data);
	const cloudsMesh = addPlanetClouds(planet, data.radius, data.cloudsTexture, data.name);
	const orbitLine = createOrbitLine(data);
	addMoons(data, planet);

	planets.push({
		...data,
		mesh: planet,
		atmosphereMesh,
		cloudsMesh,
		orbitLine,
		angle: Math.random() * Math.PI * 2
	});
}

function addAsteroidBelt(innerRadius, outerRadius, count, color, verticalSpread) {
	const positions = new Float32Array(count * 3);
	for (let index = 0; index < count; index += 1) {
		const angle = Math.random() * Math.PI * 2;
		const radius = innerRadius + Math.random() * (outerRadius - innerRadius);
		positions[index * 3] = Math.cos(angle) * radius;
		positions[index * 3 + 1] = (Math.random() - 0.5) * verticalSpread;
		positions[index * 3 + 2] = Math.sin(angle) * radius;
	}
	const geometry = new THREE.BufferGeometry();
	geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
	solarSystem.add(new THREE.Points(geometry, new THREE.PointsMaterial({ color, size: 0.035, transparent: true, opacity: 0.82 })));
}

addAsteroidBelt(5.65, 6.65, 2600, 0xa99478, 0.30);
addAsteroidBelt(15.2, 18.5, 1800, 0x718397, 0.75);

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

// RAYCASTER & INTERACTIVE CELESTIAL TARGET CATALOGUE
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2(-1000, -1000);

const interactiveTargets = [
	{
		mesh: sun,
		name: "00 · SUN",
		tag: "00 · SUN",
		url: "./index_sun.html",
		accentColor: "#ffb703",
		glowScale: 1.15 * 1.55,
		orbitLine: null
	}
];

for (const p of planets) {
	let tagLabel = "";
	if (p.name === "Mercury") tagLabel = "01 · MERCURY";
	else if (p.name === "Venus") tagLabel = "02 · VENUS";
	else if (p.name === "Earth") tagLabel = "03 · EARTH";
	else if (p.name === "Mars") tagLabel = "04 · MARS";
	else if (p.name === "Jupiter") tagLabel = "05 · JUPITER";
	else if (p.name === "Saturn") tagLabel = "06 · SATURN";
	else if (p.name === "Uranus") tagLabel = "07 · URANUS";
	else if (p.name === "Neptune") tagLabel = "08 · NEPTUNE";

	let accentHex = "#38bdf8";
	if (p.name === "Mercury") accentHex = "#fcd34d";
	else if (p.name === "Venus") accentHex = "#fef08a";
	else if (p.name === "Earth") accentHex = "#38bdf8";
	else if (p.name === "Mars") accentHex = "#f97316";
	else if (p.name === "Jupiter") accentHex = "#fde047";
	else if (p.name === "Saturn") accentHex = "#fef08a";
	else if (p.name === "Uranus") accentHex = "#67e8f9";
	else if (p.name === "Neptune") accentHex = "#38bdf8";

	interactiveTargets.push({
		mesh: p.mesh,
		name: p.name.toUpperCase(),
		tag: tagLabel,
		url: `./index_${p.name.toLowerCase()}.html`,
		accentColor: accentHex,
		glowScale: p.radius * 1.50,
		orbitLine: p.orbitLine || null
	});
}

// 5. SPHERICAL HOVER GLOW SHELL MESH
const hoverGlowMaterial = new THREE.ShaderMaterial({
	uniforms: {
		uColor: { value: new THREE.Color("#38bdf8") },
		uTime: { value: 0.0 }
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
		uniform vec3 uColor;
		uniform float uTime;
		varying vec3 vNormalWorld;
		varying vec3 vWorldPosition;
		void main() {
			vec3 viewDirection = normalize(vWorldPosition - cameraPosition);
			vec3 normalWorld = normalize(vNormalWorld);
			float fresnel = 1.0 - abs(dot(viewDirection, normalWorld));
			float remappedFresnel = clamp((fresnel - 0.65) / (1.0 - 0.65), 0.0, 1.0);
			float alpha = pow(1.0 - remappedFresnel, 1.6);
			float pulse = 0.85 + 0.15 * sin(uTime * 5.0);
			gl_FragColor = vec4(uColor, alpha * pulse * 0.95);
		}
	`,
	blending: THREE.AdditiveBlending,
	side: THREE.BackSide,
	transparent: true,
	depthWrite: false
});

const hoverGlowMesh = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 48), hoverGlowMaterial);
hoverGlowMesh.visible = false;
solarSystem.add(hoverGlowMesh);

// 6. DOM HOVER TOOLTIP HUD CARD
let tooltipEl = document.getElementById("planetHoverTooltip");
if (!tooltipEl) {
	tooltipEl = document.createElement("div");
	tooltipEl.id = "planetHoverTooltip";
	tooltipEl.className = "planet-hover-tooltip";
	tooltipEl.innerHTML = `
		<span class="tooltip-badge" id="tooltipBadge">03 · EARTH</span>
	`;
	document.body.appendChild(tooltipEl);
}
const tooltipBadge = document.getElementById("tooltipBadge");

// 7. HOVER TIMER & INTERACTION CONTROLLER
let currentCandidateTarget = null;
let activeHoverTarget = null;
let hoverTimer = null;
let pointerDownTime = 0;
let pointerDownPos = { x: 0, y: 0 };

function hideHoverEffects() {
	if (hoverTimer) {
		clearTimeout(hoverTimer);
		hoverTimer = null;
	}
	if (activeHoverTarget && activeHoverTarget.orbitLine) {
		activeHoverTarget.orbitLine.material.opacity = 0.14;
	}
	currentCandidateTarget = null;
	activeHoverTarget = null;
	hoverGlowMesh.visible = false;
	tooltipEl.classList.remove("visible");
	document.body.style.cursor = "default";
}

function showHoverEffects(target) {
	if (activeHoverTarget && activeHoverTarget !== target && activeHoverTarget.orbitLine) {
		activeHoverTarget.orbitLine.material.opacity = 0.14;
	}

	activeHoverTarget = target;
	hoverGlowMaterial.uniforms.uColor.value.set(target.accentColor);
	hoverGlowMesh.scale.setScalar(target.glowScale);
	hoverGlowMesh.position.copy(target.mesh.position);
	hoverGlowMesh.visible = true;

	if (target.orbitLine) {
		target.orbitLine.material.opacity = 0.45;
	}

	tooltipBadge.textContent = target.tag;
	tooltipEl.style.setProperty("--hover-accent-color", target.accentColor);
	tooltipEl.style.setProperty("--hover-glow-color", target.accentColor + "44");

	updateTooltipPosition(target);
	tooltipEl.classList.add("visible");
	document.body.style.cursor = "pointer";
}

function updateTooltipPosition(target) {
	if (!target) return;
	const worldPos = new THREE.Vector3();
	target.mesh.getWorldPosition(worldPos);
	worldPos.project(camera);

	const x = (worldPos.x * 0.5 + 0.5) * window.innerWidth;
	const y = (-worldPos.y * 0.5 + 0.5) * window.innerHeight;

	tooltipEl.style.left = `${x}px`;
	tooltipEl.style.top = `${y - 18}px`;
}

function getIntersectedTarget(clientX, clientY) {
	mouse.x = (clientX / window.innerWidth) * 2 - 1;
	mouse.y = -(clientY / window.innerHeight) * 2 + 1;

	raycaster.setFromCamera(mouse, camera);
	const checkMeshes = interactiveTargets.map(t => t.mesh);
	const intersects = raycaster.intersectObjects(checkMeshes, false);

	if (intersects.length > 0) {
		const hitMesh = intersects[0].object;
		return interactiveTargets.find(t => t.mesh === hitMesh) || null;
	}
	return null;
}

window.addEventListener("pointermove", (e) => {
	const target = getIntersectedTarget(e.clientX, e.clientY);

	if (target) {
		if (currentCandidateTarget !== target) {
			if (hoverTimer) clearTimeout(hoverTimer);
			currentCandidateTarget = target;

			// Quick 250ms hover activation for instant responsiveness
			hoverTimer = setTimeout(() => {
				showHoverEffects(target);
			}, 250);
		} else if (activeHoverTarget === target) {
			updateTooltipPosition(target);
		}
	} else {
		hideHoverEffects();
	}
});

window.addEventListener("pointerdown", (e) => {
	pointerDownTime = performance.now();
	pointerDownPos = { x: e.clientX, y: e.clientY };
});

window.addEventListener("pointerup", (e) => {
	const dt = performance.now() - pointerDownTime;
	const dx = Math.abs(e.clientX - pointerDownPos.x);
	const dy = Math.abs(e.clientY - pointerDownPos.y);

	// Ensure click was not a camera drag
	if (dt < 400 && dx < 6 && dy < 6) {
		const target = getIntersectedTarget(e.clientX, e.clientY);
		if (target && target.url) {
			document.body.classList.add("solar-page-fadeout");
			setTimeout(() => {
				window.location.href = target.url;
			}, 320);
		}
	}
});

function animate() {
	requestAnimationFrame(animate);
	const elapsedTime = performance.now() * 0.001;
	starMaterial.uniforms.uTime.value = elapsedTime;

	const galacticTime = performance.now() * 0.00002 * animationSpeed;
	solarSystem.position.set(
		Math.sin(galacticTime) * 3.8,
		Math.sin(galacticTime * 0.7) * 1.2,
		Math.cos(galacticTime) * 3.8
	);
	solarSystem.rotation.y = galacticTime * 0.45;
	solarSystem.rotation.z = Math.sin(galacticTime * 0.8) * 0.045;
	sun.rotation.y += 0.002 * animationSpeed;
	sunGlow.rotation.y -= 0.001 * animationSpeed;

	for (const planet of planets) {
		planet.angle += planet.speed * animationSpeed;
		const orbitalRadius = planet.distance * (1 - planet.eccentricity * planet.eccentricity) /
			(1 + planet.eccentricity * Math.cos(planet.angle));
		planet.mesh.position.set(
			Math.cos(planet.angle) * orbitalRadius,
			Math.sin(planet.inclination) * Math.sin(planet.angle) * orbitalRadius,
			Math.sin(planet.angle) * orbitalRadius
		);
		planet.mesh.rotation.y += planet.speed * 1.8 * animationSpeed;

		if (planet.cloudsMesh) {
			const cloudRotMultiplier = planet.name === "Venus" ? -1.6 : 2.2;
			planet.cloudsMesh.rotation.y += planet.speed * cloudRotMultiplier * animationSpeed;
		}

		if (planet.atmosphereMesh && planet.atmosphereMesh.material.uniforms) {
			const lightDir = planet.mesh.position.clone().negate().normalize();
			planet.atmosphereMesh.material.uniforms.uLightDirection.value.copy(lightDir);
		}

		for (const moon of planet.moons || []) {
			moon.angle += moon.speed * animationSpeed;
			moon.mesh.position.set(
				Math.cos(moon.angle) * moon.distance,
				Math.sin(moon.angle * 0.7) * moon.distance * 0.08,
				Math.sin(moon.angle) * moon.distance
			);
			moon.mesh.rotation.y += moon.speed * 0.8 * animationSpeed;
		}
	}

	// Update active hover glow position and animation pulse
	if (hoverGlowMesh.visible && activeHoverTarget) {
		hoverGlowMesh.position.copy(activeHoverTarget.mesh.position);
		hoverGlowMaterial.uniforms.uTime.value = elapsedTime;
		updateTooltipPosition(activeHoverTarget);
	}

	controls.update();
	renderer.render(scene, camera);
}

window.addEventListener("resize", () => {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize(window.innerWidth, window.innerHeight);
	renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

window.addEventListener("load", () => {

	if (loadingOverlay) loadingOverlay.classList.add("hidden");
});

animate();
