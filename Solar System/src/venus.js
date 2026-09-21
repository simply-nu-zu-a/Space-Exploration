import { createPlanetScene } from "./scene.js";

const canvas = document.querySelector("#Venus") || document.querySelector("canvas");
if (canvas) {
  createPlanetScene({
    canvas,
    planetKey: "venus",
    planetRadius: 1.0,
    planetColor: 0xffffff,
    roughness: 0.85,
    metalness: 0.05,
    axialTilt: 177.36,
    rotationSpeed: -0.0004, // Retrograde rotation
    hasAtmosphere: true,
    atmosphereDayColor: "#fef08a",
    atmosphereTwilightColor: "#d97706",
    atmosphereSurfaceStrength: 0.78,
    atmosphereScale: 1.065,
    texturePath: "../texture/planets/venus.jpg",
    hasClouds: true,
    cloudsPath: "../texture/planets/venus_clouds.jpg",
    cloudsOpacity: 0.48,
    cloudsScale: 1.018,
    diameterText: "12,104 KM",
    surfaceAreaText: "460.2M KM²",
    heroMoons: [],
    showcaseMoons: []
  });
}
