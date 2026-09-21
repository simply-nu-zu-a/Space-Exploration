import { createPlanetScene } from "./scene.js";

const canvas = document.querySelector("#Saturn") || document.querySelector("canvas");
if (canvas) {
  createPlanetScene({
    canvas,
    planetKey: "saturn",
    planetRadius: 1.05,
    planetColor: 0xffffff,
    roughness: 0.70,
    metalness: 0.05,
    axialTilt: 26.73,
    rotationSpeed: 0.0020,
    hasAtmosphere: true,
    atmosphereDayColor: "#fef08a",
    atmosphereTwilightColor: "#d97706",
    atmosphereSurfaceStrength: 0.68,
    atmosphereScale: 1.052,
    texturePath: "../texture/planets/saturn.jpg",
    hasRings: true,
    ringInnerRadius: 1.25,
    ringOuterRadius: 2.35,
    ringColor: 0xd4b483,
    ringTexturePath: "../texture/planets/saturn_ring.png",
    diameterText: "120,536 KM",
    surfaceAreaText: "42.70B KM²",
    heroMoons: [
      {
        name: "Mimas",
        radius: 0.04,
        orbitRadius: 2.75,
        speed: 0.024,
        color: 0x94a3b8,
        distText: "185,520 KM"
      },
      {
        name: "Enceladus",
        radius: 0.045,
        orbitRadius: 3.10,
        speed: 0.018,
        color: 0xf8fafc,
        distText: "238,000 KM"
      },
      {
        name: "Rhea",
        radius: 0.065,
        orbitRadius: 3.65,
        speed: 0.012,
        color: 0xd1d5db,
        distText: "527,108 KM"
      },
      {
        name: "Titan",
        radius: 0.10,
        orbitRadius: 4.45,
        speed: 0.007,
        color: 0xf59e0b,
        distText: "1,221,870 KM"
      },
      {
        name: "Iapetus",
        radius: 0.06,
        orbitRadius: 5.25,
        speed: 0.004,
        color: 0x64748b,
        distText: "3,560,820 KM"
      }
    ],
    showcaseMoons: [
      {
        name: "Titan",
        color: 0xd97706,
        roughness: 0.60,
        dist: "1,221,870 KM"
      },
      {
        name: "Enceladus",
        color: 0xf8fafc,
        roughness: 0.35,
        dist: "238,000 KM"
      },
      {
        name: "Mimas",
        color: 0x94a3b8,
        roughness: 0.90,
        dist: "185,520 KM"
      },
      {
        name: "Rhea",
        color: 0xd1d5db,
        roughness: 0.82,
        dist: "527,108 KM"
      },
      {
        name: "Iapetus",
        color: 0x475569,
        roughness: 0.88,
        dist: "3,560,820 KM"
      }
    ]
  });
}
