import { createPlanetScene } from "./scene.js";

const canvas = document.querySelector("#Sun") || document.querySelector("canvas");
if (canvas) {
  createPlanetScene({
    canvas,
    planetKey: "sun",
    planetRadius: 1.15,
    planetColor: 0xffffff,
    roughness: 0.35,
    metalness: 0.0,
    axialTilt: 7.25,
    rotationSpeed: 0.0012,
    hasAtmosphere: true,
    atmosphereDayColor: "#ff7700",
    atmosphereTwilightColor: "#ffbb00",
    atmosphereSurfaceStrength: 0.90,
    atmosphereScale: 1.075,
    texturePath: "../texture/stars/sun.jpg",
    emissiveIntensity: 0.85,
    emissiveColor: 0xffe082,
    diameterText: "1,392,700 KM",
    surfaceAreaText: "6.09T KM²",
    heroMoons: [],
    showcaseMoons: []
  });
}
