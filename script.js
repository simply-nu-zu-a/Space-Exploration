const countdownOverlay = document.getElementById('countdownOverlay');
const countdownValue = document.querySelector('.countdown-value');
const launchBtn = document.getElementById('launch_btn');
const navbar = document.querySelector('.navbar');
const baseSection = document.getElementById('troposphere');
const flightContainer = document.getElementById('flightContainer');
const flightRocket = document.getElementById('flightRocket');
const launchpadRocket = document.getElementById('launchpadRocket');
const canvas = document.getElementById('atmosphereCanvas');
const ctx = canvas?.getContext('2d');

let isLaunching = false;
let isFlew = false;
let scrollProgress = 0;
let stars = [];
let particles = [];
let meteors = [];
let lastActiveLayer = '';
let transitionTimer = null;

function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function lerpColor(a, b, t) {
  const [ar, ag, ab] = a;
  const [br, bg, bb] = b;
  return `rgb(${Math.round(lerp(ar, br, t))}, ${Math.round(lerp(ag, bg, t))}, ${Math.round(lerp(ab, bb, t))})`;
}

function getScrollProgress() {
  const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
  return Math.max(0, Math.min(1, 1 - window.scrollY / maxScroll));
}

function resizeCanvas() {
  if (!canvas || !ctx) return;

  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.floor(window.innerWidth * dpr);
  canvas.height = Math.floor(window.innerHeight * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  createStars();
  createParticles();
  createMeteors();
}

function createStars() {
  stars = Array.from({ length: Math.min(260, Math.floor(window.innerWidth / 3.5)) }, () => ({
    x: Math.random() * window.innerWidth,
    y: Math.random() * window.innerHeight,
    size: randomBetween(0.4, 1.8),
    alpha: randomBetween(0.2, 1),
    twinkle: randomBetween(0.005, 0.025),
    direction: Math.random() > 0.5 ? 1 : -1
  }));
}

function createParticles() {
  particles = Array.from({ length: 140 }, () => ({
    x: Math.random() * window.innerWidth,
    y: Math.random() * window.innerHeight,
    size: randomBetween(0.8, 2.2),
    alpha: randomBetween(0.1, 0.6),
    speed: randomBetween(0.2, 0.8)
  }));
}

function createMeteors() {
  meteors = Array.from({ length: 4 }, () => ({
    x: randomBetween(0, window.innerWidth),
    y: randomBetween(0, window.innerHeight * 0.3),
    length: randomBetween(30, 90),
    speed: randomBetween(2.8, 5.2),
    active: false,
    timer: randomBetween(0, 4000)
  }));
}

// Realistic Stratified Atmospheric Palette
function sampleAtmosphereColor(progress) {
  const palette = [
    [32, 108, 206], // 0.00: Troposphere (sea-level bright blue)
    [22, 72, 165],  // 0.15: Upper Troposphere
    [14, 40, 118],  // 0.30: Stratosphere (deep cobalt azure)
    [8, 20, 72],    // 0.50: Mesosphere (cold midnight indigo)
    [4, 10, 32],    // 0.70: Thermosphere (deep space black with plasma hue)
    [2, 4, 14],     // 0.88: Exosphere (cosmic threshold)
    [1, 2, 6]       // 1.00: Deep Space vacuum
  ];

  const clamped = Math.max(0, Math.min(1, progress));
  const index = clamped * (palette.length - 1);
  const floor = Math.floor(index);
  const ceil = Math.min(palette.length - 1, floor + 1);
  const blend = index - floor;

  return lerpColor(palette[floor], palette[ceil], blend);
}

function drawAtmosphere() {
  if (!canvas || !ctx) return;

  const width = window.innerWidth;
  const height = window.innerHeight;
  const progress = scrollProgress;

  ctx.clearRect(0, 0, width, height);

  // 1. Realistic Stratified Background Gradient
  const topColor = sampleAtmosphereColor(Math.min(1, progress + 0.08));
  const midColor = sampleAtmosphereColor(progress);
  const bottomColor = sampleAtmosphereColor(Math.max(0, progress - 0.08));

  const sky = ctx.createLinearGradient(0, 0, 0, height);
  sky.addColorStop(0, topColor);
  sky.addColorStop(0.5, midColor);
  sky.addColorStop(1, bottomColor);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, width, height);

  // 2. Solar Horizon Radiance (Fades as altitude increases)
  if (progress < 0.85) {
    const sunGlow = ctx.createRadialGradient(
      width * 0.5,
      height * 0.15,
      0,
      width * 0.5,
      height * 0.15,
      height * 0.55
    );
    sunGlow.addColorStop(0, `rgba(255, 225, 140, ${0.12 * (1 - progress * 0.9)})`);
    sunGlow.addColorStop(0.4, `rgba(0, 213, 255, ${0.05 * (1 - progress * 0.85)})`);
    sunGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = sunGlow;
    ctx.fillRect(0, 0, width, height);
  }

  // 3. Lower Atmospheric Rayleigh Scattering Haze
  if (progress < 0.4) {
    const haze = ctx.createRadialGradient(
      width * 0.5,
      height * 0.8,
      0,
      width * 0.5,
      height * 0.8,
      height * 0.75
    );
    haze.addColorStop(0, `rgba(180, 225, 255, ${0.18 * (1 - progress * 2.5)})`);
    haze.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = haze;
    ctx.fillRect(0, 0, width, height);
  }

  // 4. Twinkling Stars (Appear in upper stratosphere, intensify in mesosphere/space)
  const starAlpha = Math.max(0, Math.min(1, (progress - 0.2) / 0.65));
  if (starAlpha > 0) {
    stars.forEach((star) => {
      star.alpha += star.twinkle * star.direction;
      if (star.alpha >= 1) {
        star.alpha = 1;
        star.direction = -1;
      } else if (star.alpha <= 0.1) {
        star.alpha = 0.1;
        star.direction = 1;
      }

      ctx.fillStyle = `rgba(255, 255, 255, ${star.alpha * starAlpha})`;
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  // 5. Thermosphere Aurora Borealis Shimmer (Green / Cyan Auroral Arcs)
  if (progress > 0.52 && progress < 0.88) {
    const auroraIntensity = Math.sin(((progress - 0.52) / 0.36) * Math.PI);
    ctx.save();
    ctx.globalAlpha = 0.22 * auroraIntensity;
    ctx.strokeStyle = 'rgba(40, 255, 170, 0.4)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 3; i += 1) {
      ctx.beginPath();
      ctx.moveTo(-50, height * 0.25 + i * 50);
      ctx.quadraticCurveTo(
        width * 0.4,
        height * 0.18 + i * 35,
        width + 50,
        height * 0.28 + i * 50
      );
      ctx.stroke();
    }
    ctx.restore();
  }

  // 6. Mesosphere Meteors
  if (progress > 0.42 && progress < 0.75) {
    meteors.forEach((meteor) => {
      meteor.timer -= 16;
      if (meteor.timer <= 0) {
        meteor.active = true;
        meteor.x = -80;
        meteor.y = randomBetween(40, height * 0.3);
        meteor.timer = randomBetween(2000, 4800);
      }
      if (meteor.active) {
        meteor.x += meteor.speed * 1.35;
        meteor.y += meteor.speed * 0.45;
        ctx.save();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
        ctx.lineWidth = 1.3;
        ctx.beginPath();
        ctx.moveTo(meteor.x, meteor.y);
        ctx.lineTo(meteor.x - meteor.length, meteor.y - meteor.length * 0.3);
        ctx.stroke();
        ctx.restore();
        if (meteor.x > width + 100 || meteor.y > height + 100) {
          meteor.active = false;
        }
      }
    });
  }

  // 7. Micro-Atmospheric Dust Particles
  if (progress > 0.25) {
    particles.forEach((particle) => {
      particle.y -= particle.speed * (0.4 + progress * 0.6);
      particle.x += Math.sin((particle.y + progress) / 120) * 0.2;
      if (particle.y < -8) {
        particle.y = height + 8;
        particle.x = Math.random() * width;
      }
      ctx.fillStyle = `rgba(210, 235, 255, ${particle.alpha * (0.3 + progress * 0.7)})`;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  // 8. Earth Horizon Limb Glow at Bottom (Exosphere / Space view)
  if (progress > 0.75) {
    const spaceEarthGlow = ctx.createRadialGradient(
      width * 0.5,
      height * 1.15,
      0,
      width * 0.5,
      height * 1.15,
      height * 0.6
    );
    spaceEarthGlow.addColorStop(0, 'rgba(0, 213, 255, 0.2)');
    spaceEarthGlow.addColorStop(0.5, 'rgba(14, 55, 120, 0.1)');
    spaceEarthGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = spaceEarthGlow;
    ctx.fillRect(0, 0, width, height);
  }

  requestAnimationFrame(drawAtmosphere);
}

function updateRocketVisuals(progress) {
  if (!flightContainer) return;
  const scale = lerp(1, 0.6, progress);
  flightContainer.style.setProperty('--rocket-scale', scale.toFixed(3));
}

function triggerLayerTransition(title, alt) {
  const alertBox = document.getElementById('layerTransitionAlert');
  const titleEl = document.getElementById('alertLayerTitle');
  const altEl = document.getElementById('alertLayerAlt');

  if (!alertBox || !titleEl || !altEl) return;

  titleEl.textContent = `ENTERING ${title}`;
  altEl.textContent = alt;

  alertBox.classList.add('show');

  if (transitionTimer) clearTimeout(transitionTimer);
  transitionTimer = setTimeout(() => {
    alertBox.classList.remove('show');
  }, 2400);
}

function updateTelemetry() {
  const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
  if (maxScroll <= 0) return;

  scrollProgress = Math.max(0, Math.min(1, 1 - window.scrollY / maxScroll));
  updateRocketVisuals(scrollProgress);

  const altitude = Math.round(scrollProgress * 10400);
  const speed = (scrollProgress * 7.8).toFixed(1);

  const altitudeElements = document.querySelectorAll('[data-altitude]');
  const speedElements = document.querySelectorAll('[data-speed]');
  const stageElements = document.querySelectorAll('[data-stage]');

  altitudeElements.forEach((el) => {
    el.textContent = `${altitude.toLocaleString()} km`;
  });

  speedElements.forEach((el) => {
    el.textContent = `${speed} km/s`;
  });

  let stageName = 'Standby';
  let activeLayer = 'troposphere';
  let layerTitle = 'TROPOSPHERE';
  let layerAlt = 'ALTITUDE: 0 – 12 KM // SURFACE BOUNDARY';

  if (scrollProgress < 0.14) {
    activeLayer = 'troposphere';
    layerTitle = 'TROPOSPHERE';
    layerAlt = 'ALTITUDE: 0 – 12 KM // SURFACE BOUNDARY';
    stageName = isLaunching ? 'Stage 1: Ascent' : 'Troposphere / Standby';
  } else if (scrollProgress < 0.31) {
    activeLayer = 'stratosphere';
    layerTitle = 'STRATOSPHERE';
    layerAlt = 'ALTITUDE: 12 – 50 KM // OZONE SHIELD';
    stageName = 'Stage 1: Stratosphere';
  } else if (scrollProgress < 0.52) {
    activeLayer = 'mesosphere';
    layerTitle = 'MESOSPHERE';
    layerAlt = 'ALTITUDE: 50 – 80 KM // METEOR INCINERATION';
    stageName = 'Stage 2: Max-Q / Mesosphere';
  } else if (scrollProgress < 0.72) {
    activeLayer = 'thermosphere';
    layerTitle = 'THERMOSPHERE';
    layerAlt = 'ALTITUDE: 80 – 700 KM // AURORAL PLASMA & KÁRMÁN LINE';
    stageName = 'Stage 2: Thermosphere';
  } else if (scrollProgress < 0.90) {
    activeLayer = 'exosphere';
    layerTitle = 'EXOSPHERE';
    layerAlt = 'ALTITUDE: 700 – 10,000 KM // GEOCORONA THRESHOLD';
    stageName = 'Stage 2: Exosphere Boundary';
  } else {
    activeLayer = 'outer-space';
    layerTitle = 'LOW EARTH ORBIT & SPACE';
    layerAlt = 'ALTITUDE: > 10,000 KM // ORBITAL INSERTION';
    stageName = isFlew ? 'Orbit Achieved' : 'Orbital Insertion';
  }

  if (isFlew) {
    stageName = 'Orbit Achieved';
  }

  stageElements.forEach((el) => {
    el.textContent = stageName;
  });

  // Highlight current stratum in the flight ladder
  const ladderSteps = document.querySelectorAll('.ladder-step');
  ladderSteps.forEach((step) => {
    step.classList.toggle('active', step.getAttribute('data-layer') === activeLayer);
  });

  // Trigger layer transition notification banner on stratum change
  if (lastActiveLayer && lastActiveLayer !== activeLayer) {
    triggerLayerTransition(layerTitle, layerAlt);
  }
  lastActiveLayer = activeLayer;
}

if (launchBtn) {
  launchBtn.addEventListener('click', (event) => {
    event.preventDefault();
    if (isLaunching || isFlew) return;

    isLaunching = true;
    baseSection?.classList.add('launching');

    if (countdownOverlay) {
      countdownOverlay.style.opacity = '1';
      countdownOverlay.style.visibility = 'visible';
      countdownOverlay.setAttribute('aria-hidden', 'false');
    }

    launchBtn.textContent = 'Mission Armed';
    launchBtn.style.opacity = '0.6';

    let count = 3;
    if (countdownValue) countdownValue.textContent = count;

    const countdownInterval = window.setInterval(() => {
      count -= 1;
      if (count > 0 && countdownValue) {
        countdownValue.textContent = count;
      } else if (count === 0 && countdownValue) {
        countdownValue.textContent = 'LAUNCH!';
      } else {
        window.clearInterval(countdownInterval);
        startFlightSequence();
      }
    }, 1000);
  });
}

function startFlightSequence() {
  if (countdownOverlay) {
    countdownOverlay.style.opacity = '0';
    countdownOverlay.style.visibility = 'hidden';
    countdownOverlay.setAttribute('aria-hidden', 'true');
  }

  baseSection?.classList.remove('launching');
  baseSection?.classList.add('launched');

  if (launchpadRocket) {
    launchpadRocket.style.opacity = '0';
  }

  if (flightContainer) {
    flightContainer.classList.add('active');
    flightContainer.style.transition = 'opacity 0.5s ease';
    flightContainer.style.setProperty('--rocket-scale', '1');
  }

  if (flightRocket) {
    flightRocket.classList.add('shake');
  }

  const stageElements = document.querySelectorAll('[data-stage]');
  stageElements.forEach((el) => {
    el.textContent = 'Ignition';
  });

  window.setTimeout(() => {
    animateCameraScroll();
  }, 180);
}

function animateCameraScroll() {
  const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
  const startScroll = window.scrollY > 0 ? window.scrollY : maxScroll;
  const targetScroll = 0;
  const duration = 12000;
  const startTime = performance.now();

  function scrollStep(timestamp) {
    const elapsed = timestamp - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const ease = progress < 0.5
      ? 4 * progress * progress * progress
      : 1 - Math.pow(-2 * progress + 2, 3) / 2;

    const currentScroll = startScroll + (targetScroll - startScroll) * ease;
    window.scrollTo(0, currentScroll);

    if (progress < 1) {
      requestAnimationFrame(scrollStep);
    } else {
      triggerDisassembly();
    }
  }

  requestAnimationFrame(scrollStep);
}

function triggerDisassembly() {
  isFlew = true;
  const stageElements = document.querySelectorAll('[data-stage]');
  stageElements.forEach((el) => {
    el.textContent = 'Booster Separation';
  });

  flightRocket?.classList.add('separated');
  flightRocket?.classList.remove('shake');

  window.setTimeout(() => {
    fireThrusters();
  }, 1000);

  window.setTimeout(() => {
    stageElements.forEach((el) => {
      el.textContent = 'Orbit Achieved';
    });

    if (launchBtn) {
      launchBtn.textContent = 'Orbit Active';
      launchBtn.style.background = 'linear-gradient(135deg, rgba(74, 255, 150, 0.2), rgba(74, 255, 150, 0.05))';
      launchBtn.style.borderColor = '#4aff96';
    }

    if (flightContainer) {
      flightContainer.style.transition = 'opacity 5s cubic-bezier(0.16, 1, 0.3, 1), transform 5s cubic-bezier(0.16, 1, 0.3, 1)';
      flightContainer.style.setProperty('--rocket-scale', '0.55');
    }

    window.setTimeout(() => {
      window.location.href = './Solar System/planet-structure/solar_system.html';
    }, 1800);
  }, 4000);
}

function fireThrusters() {
  const leftPuff = document.querySelector('.thruster-puff.left');
  const rightPuff = document.querySelector('.thruster-puff.right');

  leftPuff?.classList.add('active');
  window.setTimeout(() => {
    leftPuff?.classList.remove('active');
    rightPuff?.classList.add('active');
    window.setTimeout(() => {
      rightPuff?.classList.remove('active');
    }, 400);
  }, 600);
}

// Mission Log Modal Event Listeners
const missionLogBtn = document.getElementById('missionLogBtn');
const missionLogModal = document.getElementById('missionLogModal');
const modalCloseBtn = document.getElementById('modalCloseBtn');

if (missionLogBtn && missionLogModal) {
  missionLogBtn.addEventListener('click', () => {
    missionLogModal.classList.add('open');
    missionLogModal.setAttribute('aria-hidden', 'false');
  });
}

if (modalCloseBtn && missionLogModal) {
  modalCloseBtn.addEventListener('click', () => {
    missionLogModal.classList.remove('open');
    missionLogModal.setAttribute('aria-hidden', 'true');
  });
}

if (missionLogModal) {
  missionLogModal.addEventListener('click', (e) => {
    if (e.target === missionLogModal) {
      missionLogModal.classList.remove('open');
      missionLogModal.setAttribute('aria-hidden', 'true');
    }
  });
}

window.addEventListener('scroll', () => {
  navbar?.classList.toggle('scrolled', window.scrollY > 40);
  updateTelemetry();
}, { passive: true });

window.addEventListener('resize', () => {
  resizeCanvas();
  updateTelemetry();
});

window.addEventListener('DOMContentLoaded', () => {
  if (!window.location.hash) {
    const troposphere = document.getElementById('troposphere');
    if (troposphere) {
      window.scrollTo({
        top: document.documentElement.scrollHeight,
        behavior: 'instant'
      });
    }
  }
  resizeCanvas();
  updateTelemetry();
  drawAtmosphere();

  // Navbar Active Link Toggling
  const navLinks = document.querySelectorAll('.nav-link');
  navLinks.forEach((link) => {
    link.addEventListener('click', function () {
      navLinks.forEach((l) => l.classList.remove('active'));
      this.classList.add('active');
    });
  });
});

updateTelemetry();
resizeCanvas();
drawAtmosphere();