import { createPlanetScene } from "./scene.js";

const canvas = document.querySelector("#Mercury") || document.querySelector("canvas");
if (canvas) {
  createPlanetScene({
    canvas,
    planetKey: "mercury",
    planetRadius: 0.92,
    planetColor: 0xffffff,
    roughness: 0.90,
    metalness: 0.12,
    axialTilt: 0.034,
    rotationSpeed: 0.0006,
    hasAtmosphere: true,
    atmosphereDayColor: "#fcd34d",
    atmosphereTwilightColor: "#f59e0b",
    atmosphereSurfaceStrength: 0.55,
    atmosphereScale: 1.045,
    texturePath: "../texture/planets/mercury.jpg",
    diameterText: "4,879 KM",
    surfaceAreaText: "74.8M KM²",
    heroMoons: [],
    showcaseMoons: []
  });
}
