import { createPlanetScene } from "./scene.js";

const canvas = document.querySelector("#Neptune") || document.querySelector("canvas");
if (canvas) {
  createPlanetScene({
    canvas,
    planetKey: "neptune",
    planetRadius: 1.0,
    planetColor: 0xffffff,
    roughness: 0.70,
    metalness: 0.05,
    axialTilt: 28.32,
    rotationSpeed: 0.0016,
    hasAtmosphere: true,
    atmosphereDayColor: "#38bdf8",
    atmosphereTwilightColor: "#1d4ed8",
    atmosphereSurfaceStrength: 0.85,
    atmosphereScale: 1.058,
    texturePath: "../texture/planets/neptune.jpg",
    diameterText: "49,528 KM",
    surfaceAreaText: "7.618B KM²",
    heroMoons: [
      {
        name: "Proteus",
        radius: 0.045,
        orbitRadius: 2.10,
        speed: 0.020,
        color: 0x475569,
        distText: "117,650 KM"
      },
      {
        name: "Triton",
        radius: 0.085,
        orbitRadius: 2.85,
        speed: -0.012, // Retrograde orbit
        color: 0xe0e7ff,
        texturePath: "../texture/moons/triton.jpg",
        distText: "354,760 KM"
      },
      {
        name: "Nereid",
        radius: 0.04,
        orbitRadius: 4.10,
        speed: 0.004,
        color: 0x64748b,
        distText: "5,513,400 KM"
      }
    ],
    showcaseMoons: [
      {
        name: "Triton",
        color: 0xdbeafe,
        texturePath: "../texture/moons/triton.jpg",
        roughness: 0.55,
        dist: "354,760 KM"
      },
      {
        name: "Proteus",
        color: 0x475569,
        roughness: 0.90,
        scale: [0.65, 0.55, 0.50],
        dist: "117,650 KM"
      },
      {
        name: "Nereid",
        color: 0x64748b,
        roughness: 0.85,
        dist: "5,513,400 KM"
      }
    ]
  });
}
