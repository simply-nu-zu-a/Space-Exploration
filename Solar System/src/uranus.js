import { createPlanetScene } from "./scene.js";

const canvas = document.querySelector("#Uranus") || document.querySelector("canvas");
if (canvas) {
  createPlanetScene({
    canvas,
    planetKey: "uranus",
    planetRadius: 1.0,
    planetColor: 0xffffff,
    roughness: 0.70,
    metalness: 0.05,
    axialTilt: 97.77,
    rotationSpeed: -0.0012, // Retrograde rolling rotation
    hasAtmosphere: true,
    atmosphereDayColor: "#67e8f9",
    atmosphereTwilightColor: "#0284c7",
    atmosphereSurfaceStrength: 0.80,
    atmosphereScale: 1.060,
    texturePath: "../texture/planets/uranus.jpg",
    hasRings: true,
    ringInnerRadius: 1.45,
    ringOuterRadius: 1.85,
    ringColor: 0x334155,
    diameterText: "51,118 KM",
    surfaceAreaText: "8.083B KM²",
    heroMoons: [
      {
        name: "Miranda",
        radius: 0.04,
        orbitRadius: 2.10,
        speed: 0.022,
        color: 0xcfcfd4,
        distText: "129,390 KM"
      },
      {
        name: "Ariel",
        radius: 0.055,
        orbitRadius: 2.65,
        speed: 0.016,
        color: 0xe2e8f0,
        distText: "191,020 KM"
      },
      {
        name: "Umbriel",
        radius: 0.055,
        orbitRadius: 3.20,
        speed: 0.011,
        color: 0x475569,
        distText: "266,000 KM"
      },
      {
        name: "Titania",
        radius: 0.075,
        orbitRadius: 3.85,
        speed: 0.007,
        color: 0x94a3b8,
        distText: "435,910 KM"
      },
      {
        name: "Oberon",
        radius: 0.07,
        orbitRadius: 4.45,
        speed: 0.005,
        color: 0x64748b,
        distText: "583,520 KM"
      }
    ],
    showcaseMoons: [
      {
        name: "Miranda",
        color: 0xcfcfd4,
        roughness: 0.92,
        scale: [0.65, 0.58, 0.52],
        dist: "129,390 KM"
      },
      {
        name: "Ariel",
        color: 0xe2e8f0,
        roughness: 0.72,
        dist: "191,020 KM"
      },
      {
        name: "Umbriel",
        color: 0x334155,
        roughness: 0.88,
        dist: "266,000 KM"
      },
      {
        name: "Titania",
        color: 0x94a3b8,
        roughness: 0.80,
        dist: "435,910 KM"
      },
      {
        name: "Oberon",
        color: 0x64748b,
        roughness: 0.86,
        dist: "583,520 KM"
      }
    ]
  });
}
