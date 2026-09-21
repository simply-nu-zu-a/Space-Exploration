import { createPlanetScene } from "./scene.js";

const canvas = document.querySelector("#Mars") || document.querySelector("canvas");
if (canvas) {
  createPlanetScene({
    canvas,
    planetKey: "mars",
    planetRadius: 0.95,
    planetColor: 0xffffff,
    roughness: 0.88,
    metalness: 0.05,
    axialTilt: 25.19,
    rotationSpeed: 0.0008,
    hasAtmosphere: true,
    atmosphereDayColor: "#fb923c",
    atmosphereTwilightColor: "#c2410c",
    atmosphereSurfaceStrength: 0.55,
    atmosphereScale: 1.050,
    texturePath: "../texture/planets/mars.jpg",
    hasClouds: false,
    diameterText: "6,779 KM",
    surfaceAreaText: "144.8M KM²",
    heroMoons: [
      {
        name: "Phobos",
        radius: 0.06,
        orbitRadius: 1.65,
        speed: 0.016,
        color: 0x8a7f7d,
        distText: "9,376 KM"
      },
      {
        name: "Deimos",
        radius: 0.04,
        orbitRadius: 2.35,
        speed: 0.009,
        color: 0x9e9795,
        distText: "23,463 KM"
      }
    ],
    showcaseMoons: [
      {
        name: "Phobos",
        color: 0x8a7f7d,
        roughness: 0.92,
        scale: [0.68, 0.55, 0.48], // Irregular potato shape
        dist: "9,376 KM"
      },
      {
        name: "Deimos",
        color: 0x9e9795,
        roughness: 0.88,
        scale: [0.60, 0.52, 0.45],
        dist: "23,463 KM"
      }
    ]
  });
}
