import { createPlanetScene } from "./scene.js";

const canvas = document.querySelector("#Jupiter") || document.querySelector("canvas");
if (canvas) {
  createPlanetScene({
    canvas,
    planetKey: "jupiter",
    planetRadius: 1.15,
    planetColor: 0xffffff,
    roughness: 0.70,
    metalness: 0.05,
    axialTilt: 3.13,
    rotationSpeed: 0.0022,
    hasAtmosphere: true,
    atmosphereDayColor: "#fde047",
    atmosphereTwilightColor: "#b45309",
    atmosphereSurfaceStrength: 0.65,
    atmosphereScale: 1.050,
    texturePath: "../texture/planets/jupiter.jpg",
    diameterText: "142,984 KM",
    surfaceAreaText: "61.42B KM²",
    heroMoons: [
      {
        name: "Io",
        radius: 0.07,
        orbitRadius: 1.85,
        speed: 0.022,
        color: 0xfacc15,
        distText: "421,700 KM"
      },
      {
        name: "Europa",
        radius: 0.06,
        orbitRadius: 2.45,
        speed: 0.015,
        color: 0xf1f5f9,
        distText: "670,900 KM"
      },
      {
        name: "Ganymede",
        radius: 0.10,
        orbitRadius: 3.15,
        speed: 0.010,
        color: 0x94a3b8,
        distText: "1,070,400 KM"
      },
      {
        name: "Callisto",
        radius: 0.09,
        orbitRadius: 3.85,
        speed: 0.006,
        color: 0x64748b,
        distText: "1,882,700 KM"
      }
    ],
    showcaseMoons: [
      {
        name: "Io",
        color: 0xeab308,
        roughness: 0.65,
        dist: "421,700 KM"
      },
      {
        name: "Europa",
        color: 0xf8fafc,
        roughness: 0.45,
        dist: "670,900 KM"
      },
      {
        name: "Ganymede",
        color: 0x94a3b8,
        roughness: 0.82,
        dist: "1,070,400 KM"
      },
      {
        name: "Callisto",
        color: 0x475569,
        roughness: 0.90,
        dist: "1,882,700 KM"
      }
    ]
  });
}