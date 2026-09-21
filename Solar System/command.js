// [ SPACE EXPLORATION · MULTI-PLANET TELEMETRY ENGINE ]
const infoBtn = document.querySelector(".info-btn");
const content = document.querySelector(".content");
const infoLabel = document.querySelector(".info-label");

// Left Detail Panel Elements
const detailPanel = document.getElementById("detailPanel");
const detailTitle = document.getElementById("detailTitle");
const detailIcon = document.getElementById("detailIcon");
const detailHeroLabel = document.getElementById("detailHeroLabel");
const detailHeroValue = document.getElementById("detailHeroValue");
const detailSpecsGrid = document.getElementById("detailSpecsGrid");
const detailAnalysis = document.getElementById("detailAnalysis");
const closeDetailBtn = document.getElementById("closeDetailBtn");
const infoCards = document.querySelectorAll(".info-card");

let isHudHidden = false;
let activeMetric = null;

// Determine Current Planet (default to earth)
const currentPlanet = document.body.dataset.planet ||
  (window.location.pathname.includes("sun") ? "sun" :
    window.location.pathname.includes("mars") ? "mars" :
      window.location.pathname.includes("mercury") ? "mercury" :
        window.location.pathname.includes("venus") ? "venus" :
          window.location.pathname.includes("jupiter") ? "jupiter" :
            window.location.pathname.includes("saturn") ? "saturn" :
              window.location.pathname.includes("uranus") ? "uranus" :
                window.location.pathname.includes("neptune") ? "neptune" : "earth");

// Universal Planetary Database with Pure Narrative Stories
const allPlanetsData = {
  sun: {
    diameter: {
      title: "Stellar Dimensions",
      narrativeHtml: `
        <p class="telemetry-narrative-para">
          The Sun is an enormous yellow dwarf star (G2V spectral class) with a mean equatorial diameter of <span class="highlight-val">1,392,700 Kilometers</span>—roughly <span class="highlight-val">109 times the diameter of Earth</span>.
        </p>
        <p class="telemetry-narrative-para">
          Its colossal volume can easily contain approximately <span class="highlight-val">1.3 Million Earths</span>. Because it is a massive ball of fluid plasma with no rigid surface, centrifugal flattening is virtually zero (<span class="highlight-val">f ≈ 9 × 10⁻⁶</span>), making the Sun the most perfectly spherical celestial body known in the Solar System.
        </p>
      `
    },
    distance: {
      title: "Galactic Position & Orbit",
      narrativeHtml: `
        <p class="telemetry-narrative-para">
          The Sun anchors the Solar System, situated approximately <span class="highlight-val">26,000 Light-Years (8,000 Parsecs)</span> from the supermassive black hole Sagittarius A* at the center of the Milky Way galaxy.
        </p>
        <p class="telemetry-narrative-para">
          Located within the Orion-Cygnus spiral arm, the Sun orbits the galactic core at an astounding orbital velocity of <span class="highlight-val">220 km/s (792,000 km/h)</span>, completing one full Cosmic Galactic Year every <span class="highlight-val">230 Million Earth Years</span>.
        </p>
      `
    },
    surface: {
      title: "Photosphere & Convection",
      narrativeHtml: `
        <p class="telemetry-narrative-para">
          The Sun's visible surface—the <span class="accent-text">Photosphere</span>—spans <span class="highlight-val">6.09 Trillion Square Kilometers (6.09 × 10¹² km²)</span>, radiating stellar energy produced by core nuclear fusion at an effective temperature of <span class="highlight-val">5,500°C (5,778 K)</span>.
        </p>
        <p class="telemetry-narrative-para">
          The photosphere is covered in dynamic boiling plasma convection cells called <span class="accent-text">Granules</span> (each ~1,000 km wide) and magnetized <span class="accent-text">Sunspots</span> with tangled magnetic field lines that trigger energetic solar flares and Coronal Mass Ejections (CMEs).
        </p>
      `
    },
    atmosphere: {
      title: "Corona & Extreme Plasma",
      narrativeHtml: `
        <p class="telemetry-narrative-para">
          The Sun's atmosphere consists of the <span class="accent-text">Chromosphere</span>, the <span class="accent-text">Transition Region</span>, and the expansive, superheated <span class="accent-text">Corona</span>, composed of <span class="highlight-val">73.46% Hydrogen</span>, <span class="highlight-val">24.85% Helium</span>, and trace metals.
        </p>
        <p class="telemetry-narrative-para">
          Magnetic reconnection heats the outer Corona to extreme temperatures between <span class="highlight-val">1,000,000°C and 3,000,000°C</span>. This plasma expands outward into interplanetary space as the supersonic <span class="accent-text">Solar Wind</span> (~400 to 800 km/s), inflating the protective global heliosphere bubble past the Kuiper Belt.
        </p>
      `
    },
    mass: {
      title: "Stellar Mass & Gravitation",
      narrativeHtml: `
        <p class="telemetry-narrative-para">
          The Sun contains a monumental stellar mass of <span class="highlight-val">1.989 × 10³⁰ Kilograms</span>—representing <span class="highlight-val">99.86% of the total mass</span> of the entire Solar System (333,000 times the mass of Earth).
        </p>
        <p class="telemetry-narrative-para">
          Its enormous gravitational field produces a surface acceleration of <span class="highlight-val">274.0 m/s² (27.94g)</span>. Every second, the core fuses 600 million tons of hydrogen into helium, converting 4 million tons of matter into pure radiant energy (<span class="accent-text">E = mc²</span>).
        </p>
      `
    },
    orbit: {
      title: "Differential Rotation",
      narrativeHtml: `
        <p class="telemetry-narrative-para">
          Because the Sun is gaseous plasma rather than solid rock, it exhibits <span class="accent-text">Differential Rotation</span>: the equator completes a full sidereal rotation in just <span class="highlight-val">25.05 Days</span>, while polar regions lag behind at <span class="highlight-val">34.4 Days</span>.
        </p>
        <p class="telemetry-narrative-para">
          This shearing differential rotation winds and twists solar magnetic field lines, driving the famous <span class="accent-text">11-Year Solar Magnetic Cycle</span>, during which the Sun's magnetic north and south poles completely flip polarity.
        </p>
      `
    }
  },
  mercury: {
    diameter: {
      title: "Planetary Dimensions",
      narrativeHtml: `
        <p class="telemetry-narrative-para">
          Mercury is the smallest of all major planets, measuring <span class="highlight-val">4,879 Kilometers</span> in equatorial diameter—only about 38% the width of Earth and barely larger than our Moon.
        </p>
        <p class="telemetry-narrative-para">
          Despite its diminutive size, Mercury contains an enormous metallic iron-nickel core spanning approximately <span class="highlight-val">4,100 Kilometers</span> (over 85% of the planet's radius), surrounded by a thin silicate mantle and rugged crust that shrank and wrinkled into massive lobate thrust scarps as the interior cooled.
        </p>
      `
    },
    distance: {
      title: "Orbital Distance & Sun",
      narrativeHtml: `
        <p class="telemetry-narrative-para">
          Cruising closest to our central star at an average distance of <span class="highlight-val">57.9 Million Kilometers (0.387 AU)</span>, Mercury endures the most eccentric orbit of any major planet in the Solar System.
        </p>
        <p class="telemetry-narrative-para">
          During its swift 88-day journey, sunlight travels to Mercury in just <span class="highlight-val">3.2 Minutes</span>. Its orbital distance swings between 46.0M km at perihelion and 69.8M km at aphelion, subjecting its sunlit hemisphere to intense solar radiation 6.5 times stronger than Earth receives.
        </p>
      `
    },
    surface: {
      title: "Surface Geography",
      narrativeHtml: `
        <p class="telemetry-narrative-para">
          Mercury has a total surface area of <span class="highlight-val">74.8 Million Square Kilometers</span>, densely peppered with billions of years of cosmic impact craters resembling the lunar highlands.
        </p>
        <p class="telemetry-narrative-para">
          Its most colossal landmark is the <span class="accent-text">Caloris Basin</span>, a massive multi-ring impact crater spanning <span class="highlight-val">1,550 km</span> across. Within permanently shadowed craters at the freezing north and south poles, radar observations have discovered substantial deposits of clean water ice protected from the scorching sun.
        </p>
      `
    },
    atmosphere: {
      title: "Surface Exosphere",
      narrativeHtml: `
        <p class="telemetry-narrative-para">
          Mercury technically has an <span class="accent-text">Exosphere</span>, not a substantial atmosphere. It is extremely thin with a surface pressure under <span class="highlight-val">10⁻¹⁴ Bar</span>; atmospheric particles are so sparse that they generally don't collide with each other.
        </p>
        <p class="telemetry-narrative-para">
          It is made mainly of <span class="highlight-val">Oxygen (42%)</span>, <span class="highlight-val">Sodium (29%)</span>, <span class="highlight-val">Hydrogen (22%)</span>, <span class="highlight-val">Helium (6%)</span>, and trace <span class="highlight-val">Potassium (0.5%)</span>, continuously stripped away by solar wind pressure and replenished by micrometeorite impacts and thermal mineral outgassing.
        </p>
      `
    },
    mass: {
      title: "Mass & Gravitation",
      narrativeHtml: `
        <p class="telemetry-narrative-para">
          Mercury packs a total planetary mass of <span class="highlight-val">3.301 × 10²³ Kilograms</span>. Because of its disproportionately massive metallic iron core, it has a mean density of <span class="highlight-val">5.427 g/cm³</span>, making it the second densest planet in Sol after Earth.
        </p>
        <p class="telemetry-narrative-para">
          Surface gravitational acceleration measures <span class="highlight-val">3.70 m/s² (0.38g)</span>, meaning an explorer would weigh only 38% of their terrestrial weight while navigating its rugged volcanic basins.
        </p>
      `
    },
    orbit: {
      title: "Orbital Chronometry",
      narrativeHtml: `
        <p class="telemetry-narrative-para">
          Hurtling through space at <span class="highlight-val">47.36 km/s</span>, Mercury completes an entire orbit around the Sun in just <span class="highlight-val">87.97 Earth Days</span>.
        </p>
        <p class="telemetry-narrative-para">
          It is locked in a rare <span class="accent-text">3:2 Spin-Orbit Resonance</span>, rotating on its axis three times for every two orbits around the Sun. Coupled with an axial tilt of virtually zero (<span class="highlight-val">0.034°</span>), Mercury experiences no seasonal weather changes, but a single day-night cycle from sunrise to sunrise lasts 176 Earth days.
        </p>
      `
    }
  },
  venus: {
    diameter: {
      title: "Planetary Dimensions",
      narrativeHtml: `
        <p class="telemetry-narrative-para">
          Venus is nearly identical to Earth in physical size and internal structure, earning its reputation as Earth's planetary twin sister with a mean volumetric diameter of <span class="highlight-val">12,104 Kilometers</span> (about 95% of Earth's width).
        </p>
        <p class="telemetry-narrative-para">
          Because Venus rotates exceptionally slowly, it experiences almost zero centrifugal flattening, making it the most perfectly spherical planet in our Solar System with a global circumference of <span class="highlight-val">38,025 Kilometers</span>.
        </p>
      `
    },
    distance: {
      title: "Orbital Distance & Sun",
      narrativeHtml: `
        <p class="telemetry-narrative-para">
          Venus orbits the Sun at an average distance of <span class="highlight-val">108.2 Million Kilometers (0.723 AU)</span>, where sunlight takes just <span class="highlight-val">6.0 Minutes</span> to reach its swirling cloud deck.
        </p>
        <p class="telemetry-narrative-para">
          With an orbital eccentricity of only <span class="highlight-val">0.0067</span>, Venus travels along the most circular path of any planet in Sol, maintaining a nearly constant distance from the Sun as it glides along its 225-day heliocentric orbit.
        </p>
      `
    },
    surface: {
      title: "Surface Geography",
      narrativeHtml: `
        <p class="telemetry-narrative-para">
          Venus has a global surface area of <span class="highlight-val">460.2 Million Square Kilometers</span>, blanketed by vast rolling volcanic basalt plains, massive lava channels, and highland tectonic continents like Aphrodite Terra and Ishtar Terra.
        </p>
        <p class="telemetry-narrative-para">
          Its highest mountain, <span class="accent-text">Maxwell Montes</span>, towers <span class="highlight-val">+11 Kilometers</span> above the average surface radius. Under extreme greenhouse entrapment, surface temperatures average a uniform <span class="highlight-val">+465°C (869°F)</span>—hot enough to melt lead day and night.
        </p>
      `
    },
    atmosphere: {
      title: "Atmospheric Envelope",
      narrativeHtml: `
        <p class="telemetry-narrative-para">
          Venus has a very thick, dense atmosphere composed mostly of <span class="highlight-val">96.5% Carbon Dioxide</span> and <span class="highlight-val">3.5% Molecular Nitrogen</span>, surrounded by opaque clouds of concentrated <span class="accent-text">Sulfuric Acid (H₂SO₄)</span>.
        </p>
        <p class="telemetry-narrative-para">
          Its surface pressure reaches a crushing <span class="highlight-val">92–93 Bar (9.2 MPa)</span>—about <span class="accent-text">93× Earth's surface pressure</span>, equivalent to being 900 meters underwater. Ferocious high-altitude jet streams super-rotate around the planet in just 4 Earth days at over <span class="highlight-val">360 km/h</span>.
        </p>
      `
    },
    mass: {
      title: "Mass & Gravitation",
      narrativeHtml: `
        <p class="telemetry-narrative-para">
          Venus possesses a total planetary mass of <span class="highlight-val">4.867 × 10²⁴ Kilograms</span> (roughly 81.5% of Earth's mass) and an average density of <span class="highlight-val">5.243 g/cm³</span>.
        </p>
        <p class="telemetry-narrative-para">
          This substantial mass produces a surface gravity of <span class="highlight-val">8.87 m/s² (0.904g)</span>. An astronaut on Venus would feel 90% of their terrestrial weight, making surface gravity comfortable even as external atmospheric suits withstand extreme pressures and acidic hazes.
        </p>
      `
    },
    orbit: {
      title: "Orbital Chronometry",
      narrativeHtml: `
        <p class="telemetry-narrative-para">
          Venus completes one full revolution around the Sun in <span class="highlight-val">224.70 Earth Days</span> at an average orbital speed of <span class="highlight-val">35.02 km/s</span>.
        </p>
        <p class="telemetry-narrative-para">
          Venus exhibits unique <span class="accent-text">Retrograde Rotation</span>: it spins backwards on its axis with an obliquity of <span class="highlight-val">177.36°</span>. Taking 243 Earth days to complete a single sidereal rotation, a Venusian day is longer than its orbital year, resulting in a solar day from sunrise to sunset lasting 116.75 Earth days.
        </p>
      `
    }
  },
  earth: {
    diameter: {
      title: "Planetary Dimensions",
      narrativeHtml: `
        <p class="telemetry-narrative-para">
          Earth is the fifth-largest planet in our Solar System and the largest terrestrial rocky world. Because Earth spins on its axis, centrifugal force creates an equatorial bulge, giving the planet an oblate spheroid shape rather than a perfect sphere.
        </p>
        <p class="telemetry-narrative-para">
          Its <span class="accent-text">Mean Volumetric Diameter</span> measures <span class="highlight-val">12,742 Kilometers</span>. The diameter stretches slightly wider at the equator (<span class="highlight-val">12,756 km</span>) than from the North to South pole (<span class="highlight-val">12,714 km</span>), creating a total global circumference of approximately <span class="highlight-val">40,075 Kilometers</span> around the equator.
        </p>
      `
    },
    distance: {
      title: "Orbital Distance & Sun",
      narrativeHtml: `
        <p class="telemetry-narrative-para">
          Earth cruises around the Sun at an average distance of <span class="highlight-val">149.6 Million Kilometers</span>, which scientists use as the foundational measuring stick of astronomy: <span class="accent-text">1.0 Astronomical Unit (AU)</span>.
        </p>
        <p class="telemetry-narrative-para">
          Sunlight traveling across the cold vacuum of space takes about <span class="highlight-val">8 minutes and 20 seconds</span> to reach Earth, providing the perfect thermal balance within the circumstellar Habitable Zone to keep global oceans liquid and life thriving.
        </p>
      `
    },
    moonDistance: {
      title: "Lunar Orbit & Distance",
      narrativeHtml: `
        <p class="telemetry-narrative-para">
          The Moon is Earth's only natural satellite, orbiting at an average distance of <span class="highlight-val">384,400 Kilometers</span> (approximately 30 Earth diameters or <span class="highlight-val">1.28 Light-Seconds</span>).
        </p>
        <p class="telemetry-narrative-para">
          As the Moon orbits, its gravitational pull generates ocean tides and stabilizes Earth's 23.44-degree axial tilt, preventing wild climate swings and creating the stable seasons that allow life to flourish.
        </p>
      `
    },
    surface: {
      title: "Surface Geography",
      narrativeHtml: `
        <p class="telemetry-narrative-para">
          Earth has a total surface area of <span class="highlight-val">510 Million Square Kilometers</span>, making it the only world in the Solar System covered predominantly by liquid water.
        </p>
        <p class="telemetry-narrative-para">
          Vast interconnected oceans cover roughly <span class="highlight-val">70.8% (361M km²)</span> of the globe, while seven continental landmasses and island archipelagos account for the remaining <span class="highlight-val">29.2% (149M km²)</span>, shaped by dynamic plate tectonics from Mount Everest to the Mariana Trench.
        </p>
      `
    },
    atmosphere: {
      title: "Atmospheric Layers",
      narrativeHtml: `
        <p class="telemetry-narrative-para">
          Earth is enveloped by a protective, breathable atmosphere held close by gravity, extending up to the internationally recognized edge of space at the <span class="highlight-val">100 km</span> Kármán line.
        </p>
        <p class="telemetry-narrative-para">
          It is composed of <span class="highlight-val">78% Nitrogen</span>, <span class="highlight-val">21% Oxygen</span>, and trace gases like Argon and Carbon Dioxide. This envelope shields the surface from cosmic radiation, filters harmful UV rays with its ozone layer, and regulates global temperatures.
        </p>
      `
    },
    mass: {
      title: "Mass & Gravitation",
      narrativeHtml: `
        <p class="telemetry-narrative-para">
          Earth is the densest planet in the Solar System, possessing a total planetary mass of <span class="highlight-val">5.972 × 10²⁴ Kilograms</span>.
        </p>
        <p class="telemetry-narrative-para">
          This immense mass generates a steady surface gravitational pull of <span class="highlight-val">9.807 m/s² (1.00g)</span>, anchoring oceans and atmosphere to the crust. Deep inside, a churning molten iron-nickel core produces a protective geomagnetic shield that deflects destructive solar winds.
        </p>
      `
    },
    orbit: {
      title: "Orbital Chronometry",
      narrativeHtml: `
        <p class="telemetry-narrative-para">
          Earth hurtles through space along its heliocentric path at an average speed of <span class="highlight-val">29.78 km/s</span> (about 107,200 km/h), completing one full orbit around the Sun in <span class="highlight-val">365.25 Days</span>.
        </p>
        <p class="telemetry-narrative-para">
          Its permanent <span class="accent-text">23.44° Axial Tilt</span> causes varying sunlight across the Northern and Southern hemispheres throughout the year, generating our cycle of four distinct seasons.
        </p>
      `
    }
  },
  mars: {
    diameter: {
      title: "Planetary Dimensions",
      narrativeHtml: `
        <p class="telemetry-narrative-para">
          Mars has a mean volumetric diameter of <span class="highlight-val">6,779 Kilometers</span>—roughly half the diameter of Earth. Because it lacks liquid water oceans, its dry continental land area (<span class="highlight-val">144.8M km²</span>) is virtually identical to all of Earth's dry land combined.
        </p>
        <p class="telemetry-narrative-para">
          The Martian equatorial diameter measures <span class="highlight-val">6,792 km</span> while its polar diameter is <span class="highlight-val">6,752 km</span>, shaped by low-density basaltic crust and the immense volcanic Tharsis rise.
        </p>
      `
    },
    distance: {
      title: "Orbital Distance & Sun",
      narrativeHtml: `
        <p class="telemetry-narrative-para">
          Mars orbits at the outer boundary of the habitable zone at an average distance of <span class="highlight-val">227.9 Million Kilometers (1.524 AU)</span> from the Sun.
        </p>
        <p class="telemetry-narrative-para">
          Sunlight takes about <span class="highlight-val">12.6 Minutes</span> to reach the Red Planet. Its elongated orbit creates dramatic seasonal temperature swings between perihelion (206.7M km) and aphelion (249.2M km), often triggering planet-wide dust storms.
        </p>
      `
    },
    moonDistance: {
      title: "Martian Moons Distance",
      narrativeHtml: `
        <p class="telemetry-narrative-para">
          Mars is orbited by two small, potato-shaped captured asteroids: <span class="accent-text">Phobos</span> orbiting at a close <span class="highlight-val">9,376 km</span> and <span class="accent-text">Deimos</span> orbiting at <span class="highlight-val">23,463 km</span>.
        </p>
        <p class="telemetry-narrative-para">
          Phobos orbits so close that it completes an entire lap around Mars in just 7 hours and 39 minutes—faster than Mars rotates—rising in the west and setting in the east twice every single Martian sol.
        </p>
      `
    },
    surface: {
      title: "Surface Geography",
      narrativeHtml: `
        <p class="telemetry-narrative-para">
          The Martian surface spans <span class="highlight-val">144.8 Million Square Kilometers</span> of rusted iron-oxide red sand, hosting the most dramatic geological landmarks in the Solar System.
        </p>
        <p class="telemetry-narrative-para">
          Here rises <span class="accent-text">Olympus Mons</span>, the tallest volcano in the Solar System towering <span class="highlight-val">+21.9 km</span> high (three times Everest), and <span class="accent-text">Valles Marineris</span>, a grand canyon stretching <span class="highlight-val">4,000 km</span> long and up to 7 km deep across the equator.
        </p>
      `
    },
    atmosphere: {
      title: "Atmospheric Layers",
      narrativeHtml: `
        <p class="telemetry-narrative-para">
          Mars has a tenuous atmosphere composed of <span class="highlight-val">~95% Carbon Dioxide (CO₂)</span>, <span class="highlight-val">~2.7% Nitrogen (N₂)</span>, and <span class="highlight-val">~1.6% Argon</span>, with trace oxygen, water vapor, and noble gases.
        </p>
        <p class="telemetry-narrative-para">
          Its surface pressure is only <span class="highlight-val">0.636 kPa (~0.6% of Earth's)</span>—equivalent to Earth's atmospheric pressure at an altitude of <span class="accent-text">~35 km</span>. Average surface temperatures hover around <span class="highlight-val">-63°C</span>, supporting wispy water-ice clouds, seasonal CO₂ dry-ice clouds, and colossal planet-wide dust storms. Lacking a global magnetic dynamo, solar wind ablation continuously strips its upper atmosphere into space.
        </p>
      `
    },
    mass: {
      title: "Mass & Gravitation",
      narrativeHtml: `
        <p class="telemetry-narrative-para">
          Mars has a total planetary mass of <span class="highlight-val">6.417 × 10²³ Kilograms</span> (about 10.7% of Earth's mass) and an average density of <span class="highlight-val">3.933 g/cm³</span>.
        </p>
        <p class="telemetry-narrative-para">
          Surface gravitational pull is <span class="highlight-val">3.721 m/s² (0.379g)</span>. A human weighing 100 kg on Earth would weigh just 38 kg on Mars, enabling effortless locomotion across low-gravity dune fields and crater rims.
        </p>
      `
    },
    orbit: {
      title: "Orbital Chronometry",
      narrativeHtml: `
        <p class="telemetry-narrative-para">
          Mars takes <span class="highlight-val">686.98 Earth Days (1.88 Earth Years)</span> to complete one revolution around the Sun, cruising along at a mean velocity of <span class="highlight-val">24.07 km/s</span>.
        </p>
        <p class="telemetry-narrative-para">
          Its daily rotation period—known as a <span class="accent-text">Sol</span>—is <span class="highlight-val">24 Hours, 37 Minutes, 22 Seconds</span>, nearly matching Earth's day. With an axial obliquity of <span class="highlight-val">25.19°</span>, Mars experiences four seasonal cycles very similar to Earth's, but each season lasts almost twice as long.
        </p>
      `
    }
  },
  jupiter: {
    diameter: {
      title: "Planetary Dimensions",
      narrativeHtml: `
        <p class="telemetry-narrative-para">
          Jupiter is the undisputed titan of our planetary family, spanning an equatorial diameter of <span class="highlight-val">142,984 Kilometers</span>—eleven times wider than Earth and voluminous enough to fit 1,321 Earths inside.
        </p>
        <p class="telemetry-narrative-para">
          Due to its ferocious 10-hour axial rotation, immense centrifugal forces flatten its gas envelope, making its polar diameter (<span class="highlight-val">133,708 km</span>) noticeably shorter than its equator with a global circumference of <span class="highlight-val">449,197 km</span>.
        </p>
      `
    },
    distance: {
      title: "Orbital Distance & Sun",
      narrativeHtml: `
        <p class="telemetry-narrative-para">
          Jupiter orbits at an average distance of <span class="highlight-val">778.5 Million Kilometers (5.204 AU)</span> from the Sun, where light takes approximately <span class="highlight-val">43.2 Minutes</span> to arrive.
        </p>
        <p class="telemetry-narrative-para">
          As the gravitational anchor of the outer Solar System, Jupiter's massive presence shepherds the Main Asteroid Belt, sweeps clear rogue comets, and stabilizes planetary orbital resonance throughout the system.
        </p>
      `
    },
    moonDistance: {
      title: "Galilean Moons Distance",
      narrativeHtml: `
        <p class="telemetry-narrative-para">
          Jupiter hosts a miniature solar system of 95 confirmed moons, crowned by the four giant <span class="accent-text">Galilean Moons</span> discovered in 1610: volcanic <span class="highlight-val">Io (421,700 km)</span>, ocean-bearing <span class="highlight-val">Europa (670,900 km)</span>, magnetic <span class="highlight-val">Ganymede (1,070,400 km)</span>, and ancient <span class="highlight-val">Callisto (1,882,700 km)</span>.
        </p>
        <p class="telemetry-narrative-para">
          Their orbital resonance creates intense tidal heating inside Io and Europa, warming subterranean oceans and fueling hundreds of active volcanic sulfur calderas.
        </p>
      `
    },
    surface: {
      title: "Atmospheric Ocean & Storms",
      narrativeHtml: `
        <p class="telemetry-narrative-para">
          Jupiter has no solid surface crust; its atmospheric clouds transition smoothly under extreme depth and pressure into an immense supercritical ocean of liquid metallic hydrogen conducting planet-wide electrical currents.
        </p>
        <p class="telemetry-narrative-para">
          Its iconic feature is the <span class="accent-text">Great Red Spot</span>, an anticyclonic vortex over <span class="highlight-val">16,000 km</span> across—larger than Earth—that has raged across the southern cloud bands for at least 350 years.
        </p>
      `
    },
    atmosphere: {
      title: "Atmospheric Cloud Belts",
      narrativeHtml: `
        <p class="telemetry-narrative-para">
          The Jovian atmosphere is composed of <span class="highlight-val">89.8% Molecular Hydrogen</span> and <span class="highlight-val">10.2% Helium</span>, laced with crystals of frozen ammonia, ammonium hydrosulfide, and water vapor.
        </p>
        <p class="telemetry-narrative-para">
          Opposing jet streams reaching speeds of <span class="highlight-val">540 km/h</span> shear the clouds into alternating light zones and dark belts, generating massive lightning storms and turbulent atmospheric vortexes thousands of kilometers wide.
        </p>
      `
    },
    mass: {
      title: "Mass & Gravitation",
      narrativeHtml: `
        <p class="telemetry-narrative-para">
          Jupiter possesses a staggering mass of <span class="highlight-val">1.898 × 10²⁷ Kilograms</span>—2.5 times greater than all other planets in the Solar System combined (318 times Earth's mass).
        </p>
        <p class="telemetry-narrative-para">
          Its surface gravity at the 1-bar level is <span class="highlight-val">24.79 m/s² (2.53g)</span>. Its churning metallic core generates a gargantuan magnetosphere 20,000 times stronger than Earth's, trapping lethal belts of energetic particles spanning millions of kilometers.
        </p>
      `
    },
    orbit: {
      title: "Orbital Chronometry",
      narrativeHtml: `
        <p class="telemetry-narrative-para">
          Jupiter takes <span class="highlight-val">4,332.59 Earth Days (11.86 Earth Years)</span> to complete one grand orbit around the Sun at a mean speed of <span class="highlight-val">13.07 km/s</span>.
        </p>
        <p class="telemetry-narrative-para">
          It has the fastest rotation in Sol: a single Jovian day lasts just <span class="highlight-val">9 Hours, 55 Minutes, 30 Seconds</span>. With an axial tilt of only <span class="highlight-val">3.13°</span>, Jupiter experiences virtually no seasonal changes, maintaining steady, violent atmospheric weather year-round.
        </p>
      `
    }
  },
  saturn: {
    diameter: {
      title: "Planetary Dimensions",
      narrativeHtml: `
        <p class="telemetry-narrative-para">
          Saturn is the second-largest planet in Sol, boasting an equatorial diameter of <span class="highlight-val">120,536 Kilometers</span> (about 9.5 times Earth's width) and a majestic ring system extending over <span class="highlight-val">282,000 Kilometers</span> across.
        </p>
        <p class="telemetry-narrative-para">
          As the most oblate planet in the Solar System, rapid rotation compresses its polar diameter to <span class="highlight-val">108,728 km</span> (nearly 10% flattening), creating a global circumference of <span class="highlight-val">378,675 km</span>.
        </p>
      `
    },
    distance: {
      title: "Orbital Distance & Sun",
      narrativeHtml: `
        <p class="telemetry-narrative-para">
          Saturn orbits in the frigid outer Solar System at an average distance of <span class="highlight-val">1.434 Billion Kilometers (9.582 AU)</span> from the Sun, where light requires <span class="highlight-val">79.7 Minutes (1.33 Hours)</span> to reach its rings.
        </p>
        <p class="telemetry-narrative-para">
          Sunlight at Saturn is 100 times dimmer than at Earth, maintaining a freezing upper atmosphere of <span class="highlight-val">-178°C (-288°F)</span> across its 29.5-year heliocentric voyage.
        </p>
      `
    },
    moonDistance: {
      title: "Saturnian Moons Distance",
      narrativeHtml: `
        <p class="telemetry-narrative-para">
          Saturn is orbited by a bustling swarm of 146 moons, crowned by giant <span class="accent-text">Titan</span> orbiting at <span class="highlight-val">1,221,870 km</span> (with a dense atmosphere and methane oceans) and active cryovolcanic <span class="accent-text">Enceladus</span> at <span class="highlight-val">238,000 km</span>.
        </p>
        <p class="telemetry-narrative-para">
          Enceladus sprays plumes of water vapor and organic molecules directly into space from south polar fractures, replenishing Saturn's expansive diffuse E-ring.
        </p>
      `
    },
    surface: {
      title: "Ring System & Hexagon",
      narrativeHtml: `
        <p class="telemetry-narrative-para">
          Saturn's crowning glory is its magnificent ring system, composed of billions of individual particles of <span class="highlight-val">99% pure water ice</span> ranging from microscopic dust to mountain-sized chunks, averaging only <span class="highlight-val">10 to 30 meters</span> in thickness.
        </p>
        <p class="telemetry-narrative-para">
          At Saturn's north pole sits a bizarre, persistent six-sided jet stream known as the <span class="accent-text">North Polar Hexagon</span>, measuring over <span class="highlight-val">30,000 km</span> wide—large enough to swallow two Earths side-by-side.
        </p>
      `
    },
    atmosphere: {
      title: "Atmospheric Layers",
      narrativeHtml: `
        <p class="telemetry-narrative-para">
          Saturn's golden atmosphere is composed of <span class="highlight-val">96.3% Molecular Hydrogen</span>, <span class="highlight-val">3.25% Helium</span>, and trace methane and ammonia crystals that give the planet its soft butterscotch hue.
        </p>
        <p class="telemetry-narrative-para">
          Supersonic equatorial winds reach staggering speeds of up to <span class="highlight-val">1,800 km/h (1,100 mph)</span>, significantly faster than Jupiter's winds, driving deep planetary convective thermal plumes.
        </p>
      `
    },
    mass: {
      title: "Mass & Gravitation",
      narrativeHtml: `
        <p class="telemetry-narrative-para">
          Saturn has a total mass of <span class="highlight-val">5.683 × 10²⁶ Kilograms</span> (about 95.2 times Earth's mass). Despite this vast mass, Saturn is the only planet in the Solar System with a mean density lower than liquid water: just <span class="highlight-val">0.687 g/cm³</span>.
        </p>
        <p class="telemetry-narrative-para">
          If you could build a bathtub large enough to hold it, Saturn would literally float. Surface gravity at the cloud tops is a comfortable <span class="highlight-val">10.44 m/s² (1.065g)</span>, nearly identical to Earth.
        </p>
      `
    },
    orbit: {
      title: "Orbital Chronometry",
      narrativeHtml: `
        <p class="telemetry-narrative-para">
          Saturn takes <span class="highlight-val">10,759.22 Earth Days (29.45 Earth Years)</span> to complete one full orbit around the Sun at a mean speed of <span class="highlight-val">9.69 km/s</span>.
        </p>
        <p class="telemetry-narrative-para">
          Its day lasts just <span class="highlight-val">10 Hours, 33 Minutes, 38 Seconds</span>. An axial tilt of <span class="highlight-val">26.73°</span> causes Saturn's rings to change orientation relative to Earth, tilting wide open and then appearing edge-on (invisible) every 14.5 Earth years.
        </p>
      `
    }
  },
  uranus: {
    diameter: {
      title: "Planetary Dimensions",
      narrativeHtml: `
        <p class="telemetry-narrative-para">
          Uranus is the third-largest planet by diameter in Sol, spanning an equatorial diameter of <span class="highlight-val">51,118 Kilometers</span>—about 4.0 times the width of Earth and large enough to contain 63 Earth volumes.
        </p>
        <p class="telemetry-narrative-para">
          Classified alongside Neptune as an <span class="accent-text">Ice Giant</span>, Uranus is composed predominantly of dense, hot supercritical fluids of water, ammonia, and methane ices surrounding a small rocky silicate core.
        </p>
      `
    },
    distance: {
      title: "Orbital Distance & Sun",
      narrativeHtml: `
        <p class="telemetry-narrative-para">
          Uranus orbits at an average distance of <span class="highlight-val">2.871 Billion Kilometers (19.19 AU)</span> from the Sun, where sunlight takes <span class="highlight-val">2.66 Hours (160 Minutes)</span> to reach its cyan cloud tops.
        </p>
        <p class="telemetry-narrative-para">
          Discovered in 1781 by William Herschel, it was the first planet discovered using a telescope, doubling the known boundary of the Solar System overnight.
        </p>
      `
    },
    moonDistance: {
      title: "Uranian Moons Distance",
      narrativeHtml: `
        <p class="telemetry-narrative-para">
          Uranus is orbited by 28 known moons named after characters from Shakespeare and Alexander Pope, including chaotic canyon world <span class="accent-text">Miranda (129,390 km)</span>, bright rifted <span class="accent-text">Ariel (191,020 km)</span>, and giant <span class="accent-text">Titania (435,910 km)</span>.
        </p>
        <p class="telemetry-narrative-para">
          Miranda features Verona Rupes, the tallest sheer cliff in the Solar System, dropping vertically over 20 kilometers into icy chasms.
        </p>
      `
    },
    surface: {
      title: "Ice Mantle & Magnetic Tumble",
      narrativeHtml: `
        <p class="telemetry-narrative-para">
          Uranus has a total surface area of <span class="highlight-val">8.083 Billion Square Kilometers</span> over a mantle of supercritical water-methane-ammonia slush. It is encircled by 13 faint, narrow dark rings composed of boulder-sized organic-rich ice rocks.
        </p>
        <p class="telemetry-narrative-para">
          Its magnetic field is extraordinary: tilted <span class="highlight-val">59°</span> from its rotational axis and offset from the planet's geometric center by a third of the planetary radius, creating a chaotic, tumbling magnetosphere.
        </p>
      `
    },
    atmosphere: {
      title: "Atmospheric Layers",
      narrativeHtml: `
        <p class="telemetry-narrative-para">
          The Uranian atmosphere is composed of <span class="highlight-val">82.5% Hydrogen</span>, <span class="highlight-val">15.2% Helium</span>, and <span class="highlight-val">2.3% Methane</span>. Atmospheric methane absorbs red light, scattering vibrant cyan and aquamarine hues into space.
        </p>
        <p class="telemetry-narrative-para">
          Uranus holds the record for the coldest atmosphere in the entire Solar System, plunging down to <span class="highlight-val">-224°C (49 K)</span>, radiating virtually no internal geothermal heat into space.
        </p>
      `
    },
    mass: {
      title: "Mass & Gravitation",
      narrativeHtml: `
        <p class="telemetry-narrative-para">
          Uranus has a total mass of <span class="highlight-val">8.681 × 10²⁵ Kilograms</span> (about 14.5 times Earth's mass) and an average density of <span class="highlight-val">1.270 g/cm³</span>.
        </p>
        <p class="telemetry-narrative-para">
          Surface gravity at the cloud tops is <span class="highlight-val">8.69 m/s² (0.886g)</span>. An explorer on Uranus would weigh only 89% of their terrestrial weight, floating gently above supercritical mantle layers.
        </p>
      `
    },
    orbit: {
      title: "Orbital Chronometry",
      narrativeHtml: `
        <p class="telemetry-narrative-para">
          Uranus requires <span class="highlight-val">30,685.40 Earth Days (84.02 Earth Years)</span> to complete one orbit around the Sun at a mean speed of <span class="highlight-val">6.80 km/s</span>.
        </p>
        <p class="telemetry-narrative-para">
          Its most bizarre feature is its extreme <span class="accent-text">97.77° Axial Tilt</span>: Uranus rotates on its side, rolling like a bowling ball along its orbital plane. This produces extreme 42-year-long polar days of continuous sunlight followed by 42 years of continuous polar darkness.
        </p>
      `
    }
  },
  neptune: {
    diameter: {
      title: "Planetary Dimensions",
      narrativeHtml: `
        <p class="telemetry-narrative-para">
          Neptune has an equatorial diameter of <span class="highlight-val">49,528 Kilometers</span> (about 3.9 times Earth's width), making it slightly smaller in physical size than Uranus but significantly denser and more massive.
        </p>
        <p class="telemetry-narrative-para">
          Its polar diameter measures <span class="highlight-val">48,682 km</span> with a global circumference of <span class="highlight-val">155,600 km</span>, holding a compact supercritical mantle of water, methane, and ammonia ices above a rocky iron-nickel core.
        </p>
      `
    },
    distance: {
      title: "Orbital Distance & Sun",
      narrativeHtml: `
        <p class="telemetry-narrative-para">
          Neptune is the outermost major planet of the Solar System, orbiting at a vast average distance of <span class="highlight-val">4.495 Billion Kilometers (30.07 AU)</span> from the Sun.
        </p>
        <p class="telemetry-narrative-para">
          Sunlight takes <span class="highlight-val">4.16 Hours (250 Minutes)</span> to bridge this immense cosmic expanse, illuminating Neptune with sunlight 900 times dimmer than Earth experiences.
        </p>
      `
    },
    moonDistance: {
      title: "Triton & Moons Distance",
      narrativeHtml: `
        <p class="telemetry-narrative-para">
          Neptune is orbited by 16 confirmed moons, overwhelmingly dominated by giant frozen moon <span class="accent-text">Triton</span> orbiting at <span class="highlight-val">354,760 km</span>.
        </p>
        <p class="telemetry-narrative-para">
          Triton is the only large moon in Sol that orbits backwards (retrograde), confirming it was once an independent dwarf planet captured from the Kuiper Belt, hosting active liquid nitrogen geysers that erupt 8 km into thin space.
        </p>
      `
    },
    surface: {
      title: "Storms & Internal Heat",
      narrativeHtml: `
        <p class="telemetry-narrative-para">
          Neptune has a global surface area of <span class="highlight-val">7.618 Billion Square Kilometers</span>. Unlike its frigid cousin Uranus, Neptune's deep internal core radiates 2.61 times more heat than it absorbs from the distant Sun.
        </p>
        <p class="telemetry-narrative-para">
          This powerful internal heat pump fuels violent, dynamic weather systems, including the Earth-sized <span class="accent-text">Great Dark Spot</span> anticyclone and high-altitude white methane ice cirrus clouds named 'Scooter'.
        </p>
      `
    },
    atmosphere: {
      title: "Atmospheric Layers",
      narrativeHtml: `
        <p class="telemetry-narrative-para">
          Neptune's atmosphere consists of <span class="highlight-val">80% Hydrogen</span>, <span class="highlight-val">19% Helium</span>, and <span class="highlight-val">1.5% Methane</span>, producing an intense, vivid azure-cobalt blue appearance.
        </p>
        <p class="telemetry-narrative-para">
          Neptune is home to the most ferocious, supersonic winds in the entire Solar System, clocking speeds over <span class="highlight-val">2,160 km/h (1,340 mph / Mach 1.7)</span>—faster than the speed of sound on Earth.
        </p>
      `
    },
    mass: {
      title: "Mass & Gravitation",
      narrativeHtml: `
        <p class="telemetry-narrative-para">
          Neptune has a total planetary mass of <span class="highlight-val">1.024 × 10²⁶ Kilograms</span> (17.1 times Earth's mass) and an average density of <span class="highlight-val">1.638 g/cm³</span>, making it the densest of all gas and ice giants.
        </p>
        <p class="telemetry-narrative-para">
          Surface gravitational pull at the 1-bar cloud deck is <span class="highlight-val">11.15 m/s² (1.14g)</span>, only 14% stronger than Earth's gravity despite its massive planetary scale.
        </p>
      `
    },
    orbit: {
      title: "Orbital Chronometry",
      narrativeHtml: `
        <p class="telemetry-narrative-para">
          Neptune takes an astounding <span class="highlight-val">60,189 Earth Days (164.79 Earth Years)</span> to complete a single orbital voyage around the Sun at a speed of <span class="highlight-val">5.43 km/s</span>.
        </p>
        <p class="telemetry-narrative-para">
          Discovered in 1846 through mathematical calculations predicting gravitational anomalies on Uranus's orbit, Neptune's day lasts <span class="highlight-val">16 Hours, 6 Minutes, 36 Seconds</span> with an axial tilt of <span class="highlight-val">28.32°</span>, resulting in individual seasons that last over 40 Earth years.
        </p>
      `
    }
  }
};

// Multi-Moon Catalog for Data Section 3D Showcases
const allPlanetsMoonsData = {
  earth: [
    {
      name: "The Moon (Luna)",
      tag: "Earth's Natural Satellite",
      diameter: "3,474 KM",
      dist: "384,400 KM",
      period: "27.3 Days",
      desc: "Earth's sole natural companion is the fifth-largest satellite in the Solar System. Formed approximately 4.51 billion years ago from the debris of a giant impact between proto-Earth and a Mars-sized planetesimal named Theia, the Moon is locked in synchronous rotation—perpetually presenting the same cratered face toward Earth.",
      desc2: "The lunar surface is an ancient geological record, divided between dark basaltic volcanic plains (Maria) and bright, rugged anorthositic highlands heavily saturated with impact craters. Lacking a substantial atmosphere or liquid water, lunar surface temperatures range from +120°C in sunlight down to -130°C in shadow."
    }
  ],
  mars: [
    {
      name: "Phobos",
      tag: "Inner Martian Moon : Fear",
      diameter: "22.2 KM",
      dist: "9,376 KM",
      period: "7h 39m",
      desc: "Phobos is the larger and innermost of the two Martian satellites, orbiting just 6,000 km above the red sands of Mars. It speeds along faster than Mars rotates, rising in the west and setting in the east twice each Martian sol. Marked by the colossal Stickney impact crater and parallel stress grooves, Phobos is a low-density porous rubble pile.",
      desc2: "Tidal deceleration is inexorably dragging Phobos inward at about 1.8 meters per century. In 30 to 50 million years, tidal gravitational stresses will either shatter Phobos into a shimmering planetary ring around Mars or send it crashing into the Martian crust."
    },
    {
      name: "Deimos",
      tag: "Outer Martian Moon : Dread",
      diameter: "12.4 KM",
      dist: "23,463 KM",
      period: "30h 18m",
      desc: "Deimos is the smaller, outermost moon of Mars, orbiting over 23,000 km away. It takes more than 30 hours to complete each orbit, appearing from the Martian surface as a bright, star-like beacon slowly drifting across the night sky over a 2.7-day cycle.",
      desc2: "Unlike rugged Phobos, Deimos is blanketed in a thick, 100-meter-deep layer of fine impact regolith that partially fills in and softens its cratered contours, giving it a smooth, rounded appearance characteristic of an ancient captured carbonaceous C-type asteroid."
    }
  ],
  jupiter: [
    {
      name: "Io",
      tag: "Galilean Moon 01 : Volcanic Inferno",
      diameter: "3,643 KM",
      dist: "421,700 KM",
      period: "42.5 Hours",
      desc: "Io is the most volcanically active world in the entire Solar System, hosting over 400 active volcanoes, gigantic sulfur lava lakes, and volcanic plumes that blast gas and sulfur dioxide hundreds of kilometers into space. Its surface is constantly repaved in vibrant yellow, orange, and black sulfur compounds.",
      desc2: "Caught in a gravitational tug-of-war between Jupiter's immense mass and orbital resonances with Europa and Ganymede, tidal friction continuously flexes Io's solid rocky crust up and down by up to 100 meters, generating massive internal geothermal heat."
    },
    {
      name: "Europa",
      tag: "Galilean Moon 02 : Global Subsurface Ocean",
      diameter: "3,122 KM",
      dist: "670,900 KM",
      period: "3.55 Days",
      desc: "Europa's smooth, radiant white ice shell is etched with dark reddish fractures (lineae) caused by tidal stresses. Beneath its 15-to-25 km thick frozen crust lies a global liquid saltwater ocean estimated to contain more than twice the volume of all Earth's oceans combined.",
      desc2: "Warmed by tidal friction and potential hydrothermal vents on its rocky ocean floor, Europa is shielded from lethal radiation by its ice shell, making it one of humanity's foremost candidates in the search for extraterrestrial life in our Solar System."
    },
    {
      name: "Ganymede",
      tag: "Galileon Moon 03 : Solar System's Largest Moon",
      diameter: "5,268 KM",
      dist: "1,070,400 KM",
      period: "7.15 Days",
      desc: "Ganymede is the undisputed king of all natural satellites—larger than planet Mercury and dwarf planet Pluto. It is the only moon in the Solar System known to generate its own intrinsic magnetic field, produced by convective circulation in a molten iron core.",
      desc2: "Ganymede's surface is split between ancient dark cratered terrain and bright, complex grooved terrain carved by early tectonic fracturing. Deep beneath its icy crust, scientists believe Ganymede holds layered subterranean oceans stacked between dense ice phases."
    },
    {
      name: "Callisto",
      tag: "Galilean Moon 04 : Ancient Cratered Realm",
      diameter: "4,821 KM",
      dist: "1,882,700 KM",
      period: "16.69 Days",
      desc: "Callisto is the third-largest moon in Sol, roughly the size of Mercury. Its heavily cratered, dark icy-rock crust is the most ancient surface in the Solar System, bearing an untouched record of cosmic collisions dating back 4 billion years.",
      desc2: "Because it orbits beyond Jupiter's intense radiation belts and experiences minimal tidal flexing, Callisto is geologically quiet. Its most famous feature is Valhalla, a colossal multi-ring impact basin spanning 3,800 kilometers across."
    }
  ],
  saturn: [
    {
      name: "Titan",
      tag: "Saturn's Super Moon : Methane Seas",
      diameter: "5,150 KM",
      dist: "1,221,870 KM",
      period: "15.95 Days",
      desc: "Titan is the second-largest moon in the Solar System and the only celestial body other than Earth with stable surface liquids. It is enveloped in a dense, opaque orange nitrogen atmosphere 1.5 times denser than Earth's sea-level air.",
      desc2: "On Titan, a full hydrological cycle exists—not with water, but with liquid methane and ethane. Rivers, hydrocarbon lakes, and seas like Kraken Mare dot its polar regions, while vast dunes of organic soot stretch across equatorial plains."
    },
    {
      name: "Enceladus",
      tag: "Ocean Moon : Cryovolcanic Geysers",
      diameter: "504 KM",
      dist: "238,000 KM",
      period: "32.9 Hours",
      desc: "Enceladus is a dazzling, hyper-reflective icy moon with active cryovolcanic geysers erupting from 'tiger stripe' fissures at its south pole. These geysers blast water vapor, silica nanoparticles, and complex organic molecules directly into space.",
      desc2: "This eruptive material continually replenishes Saturn's expansive E-ring. The geysers provide direct proof of a warm, hydrothermal, habitable liquid saltwater ocean residing beneath Enceladus's bright icy crust."
    },
    {
      name: "Mimas",
      tag: "Saturn I : The Herschel Crater Moon",
      diameter: "396 KM",
      dist: "185,520 KM",
      period: "22.6 Hours",
      desc: "Mimas is famous for its colossal impact crater Herschel, which spans 130 kilometers across—one-third the diameter of the entire moon. The impact that formed Herschel nearly obliterated Mimas, leaving an enormous central mountain peak 6 km high.",
      desc2: "Despite its heavily cratered, frozen exterior, subtle orbital librations measured by the Cassini spacecraft suggest Mimas may conceal a stealth global liquid water ocean deep beneath its 20-to-30 km icy shell."
    },
    {
      name: "Rhea",
      tag: "Saturn V : Cratered Ice Sphere",
      diameter: "1,527 KM",
      dist: "527,108 KM",
      period: "4.52 Days",
      desc: "Rhea is Saturn's second-largest moon, consisting almost entirely of water ice with a small rocky core (about 75% ice, 25% rock). Its heavily cratered, ancient surface exhibits wispy ice fractures and brilliant impact rays.",
      desc2: "Rhea possesses a very tenuous exosphere containing oxygen and carbon dioxide, sustained as energetic ions from Saturn's magnetosphere split water ice molecules on its surface."
    },
    {
      name: "Iapetus",
      tag: "Saturn VIII : The Two-Tone Yin-Yang World",
      diameter: "1,470 KM",
      dist: "3,560,820 KM",
      period: "79.32 Days",
      desc: "Iapetus is one of the strangest worlds in the cosmos: its leading hemisphere (Cassini Regio) is as dark as coal, while its trailing hemisphere is brilliant white snow, creating a stark two-tone yin-yang contrast.",
      desc2: "Running precisely along its equator is an immense 20-kilometer-high mountain ridge spanning over 1,300 km, giving Iapetus the distinct appearance of a colossal cosmic walnut."
    }
  ],
  uranus: [
    {
      name: "Miranda",
      tag: "Uranus V : Chaotic Canyon Realm",
      diameter: "471 KM",
      dist: "129,390 KM",
      period: "1.41 Days",
      desc: "Miranda boasts the most bizarre, extreme geological topography in the Solar System. It features colossal patchwork coronae and Verona Rupes—the tallest cliff face known, dropping vertically over 20 kilometers into jagged icy canyons.",
      desc2: "Scientists hypothesize Miranda was repeatedly shattered by giant impacts during its early formation and gravitationally reassembled into a chaotic patchwork of silicate rock and water ice."
    },
    {
      name: "Ariel",
      tag: "Uranus I : Bright Rift Valleys",
      diameter: "1,158 KM",
      dist: "191,020 KM",
      period: "2.52 Days",
      desc: "Ariel is the brightest and most geologically young of Uranus's major moons, carved by vast networks of interconnected graben rift valleys and smooth volcanic ice-flows that erased ancient impact craters.",
      desc2: "Its surface is composed roughly equally of water ice, silicate rock, and frozen carbon dioxide, exhibiting extensive cryovolcanic activity driven by past orbital resonances."
    },
    {
      name: "Umbriel",
      tag: "Uranus II : Dark Cratered Enigma",
      diameter: "1,169 KM",
      dist: "266,000 KM",
      period: "4.14 Days",
      desc: "Umbriel is the darkest of Uranus's large moons, reflecting only 16% of incident sunlight. Its uniform dark surface is heavily cratered, showing few signs of recent geological or cryovolcanic modification.",
      desc2: "Its most striking feature is Wunda, an enigmatic 130 km ring of bright ice on the floor of a large impact crater near Umbriel's equator."
    },
    {
      name: "Titania",
      tag: "Uranus III : Queen of the Uranian Moons",
      diameter: "1,578 KM",
      dist: "435,910 KM",
      period: "8.71 Days",
      desc: "Titania is the largest Uranian satellite, characterized by extensive fault scarps and immense canyon systems like Messina Chasma stretching over 1,500 kilometers across its cratered, icy silicate crust.",
      desc2: "Titania consists of approximately 50% water ice, 30% silicate rock, and 20% organic compounds, potentially harboring a thin layer of liquid water at the boundary between its core and mantle."
    },
    {
      name: "Oberon",
      tag: "Uranus IV : Outer Ancient Sentinel",
      diameter: "1,523 KM",
      dist: "583,520 KM",
      period: "13.46 Days",
      desc: "Oberon is the outermost major moon of Uranus, displaying an ancient, heavily cratered surface covered with dark carbonaceous impact-melt deposits and high-relief mountains reaching over 6 kilometers.",
      desc2: "Oberon has remained geologically stable for billions of years, orbiting beyond the strong tidal heating zones that resurfaced inner moons like Ariel and Miranda."
    }
  ],
  neptune: [
    {
      name: "Triton",
      tag: "Neptune I : Retrograde Frozen Voyager",
      diameter: "2,707 KM",
      dist: "354,760 KM",
      period: "5.88 Days (Retrograde)",
      desc: "Triton is the only giant moon in Sol that orbits backwards (retrograde) relative to its planet's rotation, confirming it was a captured Kuiper Belt dwarf planet like Pluto. At a frigid -235°C, Triton features active nitrogen geysers that erupt plumes of dark dust 8 km high into its thin nitrogen sky.",
      desc2: "Triton's unique 'cantaloupe terrain' is formed by diapirism in its icy crust. Tidal deceleration is gradually drawing Triton closer to Neptune; in 3.6 billion years, it will pass the Roche limit and shatter into a colossal planetary ring system."
    },
    {
      name: "Proteus",
      tag: "Neptune VIII : Irregular Boxy Crater World",
      diameter: "420 KM",
      dist: " 117,650 KM",
      period: "26.9 Hours",
      desc: "Proteus is one of the largest non-spherical irregular moons known—about as large as a rocky-ice body can get without its gravity pulling it into a round sphere. It is scarred by the massive crater Pharos.",
      desc2: "Discovered by Voyager 2 in 1989, Proteus reflects only 6% of incoming sunlight, coated in dark, carbonaceous organic regolith."
    },
    {
      name: "Nereid",
      tag: "Neptune II : Highly Eccentric Outlier",
      diameter: "340 KM",
      dist: "5,513,400 KM",
      period: "360.1 Days",
      desc: "Nereid has the most eccentric orbit of any satellite in the Solar System (e = 0.75), swinging between 1.4 million km and 9.6 million km from Neptune.",
      desc2: "Its extreme orbit was likely caused by gravitational scattering when Neptune captured the massive retrograde dwarf planet Triton billions of years ago."
    }
  ],
  mercury: [
    {
      name: "Solar Proximity & Zero Moons",
      tag: "NATURAL SATELLITE LIMIT // 0 MOONS",
      diameter: "0 SATELLITES",
      dist: "N/A",
      period: "N/A",
      desc: "Mercury is one of only two planets in our Solar System with zero natural satellites. Orbiting just 57.9 million kilometers from the Sun, Mercury sits deep within the Sun's immense gravitational Hill sphere.",
      desc2: "Any potential moon orbiting Mercury would experience massive solar tidal forces that would destabilize its orbit, either ejecting it into heliocentric space or pulling it into a destructive collision with Mercury."
    }
  ],
  venus: [
    {
      name: "Solar Tidal Disruption & Zero Moons",
      tag: "NATURAL SATELLITE LIMIT // 0 MOONS",
      diameter: "0 SATELLITES",
      dist: "N/A",
      period: "N/A",
      desc: "Venus possesses zero moons. Like Mercury, its proximity to the Sun and strong solar gravitational tides make it nearly impossible for satellites to maintain long-term orbital stability.",
      desc2: "Additionally, Venus's slow retrograde rotation means that any moon orbiting within its sphere of influence would experience tidal deceleration, causing it to spiral inward and crash into the crushing Venusian atmosphere."
    }
  ]
};

// Open Left Detail Panel
function openDetailPanel(metricKey) {
  const planetData = allPlanetsData[currentPlanet] || allPlanetsData.earth;
  let data = planetData[metricKey];
  if (!data || !detailPanel) return;

  // Dynamic Moon Distance switch if Moon is active
  if (metricKey === "distance" && isMoonActive && planetData.moonDistance) {
    data = planetData.moonDistance;
  }

  activeMetric = metricKey;

  // Update UI classes on metric cards
  infoCards.forEach(card => {
    card.classList.toggle("active", card.dataset.metric === metricKey);
  });

  // Populate data
  if (detailTitle) detailTitle.textContent = data.title;

  const detailBodyNarrative = document.getElementById("detailBodyNarrative");
  if (detailBodyNarrative && data.narrativeHtml) {
    detailBodyNarrative.innerHTML = data.narrativeHtml;
  }

  detailPanel.classList.add("open");
  detailPanel.setAttribute("aria-hidden", "false");

  // Dispatch metric-selected event for 3D visualizations
  window.dispatchEvent(
    new CustomEvent("metric-selected", { detail: { metric: metricKey, isMoonActive, planet: currentPlanet } })
  );
}

// Close Left Detail Panel
function closeDetail() {
  activeMetric = null;
  infoCards.forEach(card => card.classList.remove("active"));
  if (detailPanel) {
    detailPanel.classList.remove("open");
    detailPanel.setAttribute("aria-hidden", "true");
  }

  // Dispatch metric-closed event
  window.dispatchEvent(new CustomEvent("metric-closed"));
}

// Setup Card Click Handlers
infoCards.forEach(card => {
  card.addEventListener("click", () => {
    const metric = card.dataset.metric;
    if (activeMetric === metric) {
      closeDetail();
    } else {
      openDetailPanel(metric);
    }
  });

  card.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      card.click();
    }
  });
});

if (closeDetailBtn) {
  closeDetailBtn.addEventListener("click", closeDetail);
}

// HUD Visibility Toggle
if (infoBtn && content) {
  infoBtn.addEventListener("click", () => {
    isHudHidden = !isHudHidden;
    content.classList.toggle("hud-collapsed", isHudHidden);

    if (infoLabel) {
      infoLabel.textContent = isHudHidden ? "Show HUD" : "Telemetry HUD";
    }

    if (isHudHidden) {
      infoBtn.classList.add("btn-active-hidden");
      closeDetail(); // Close detail panel when HUD hides
    } else {
      infoBtn.classList.remove("btn-active-hidden");
    }

    // Notify Three.js to center or offset Planet
    window.dispatchEvent(
      new CustomEvent("hud-toggle", { detail: { isHudHidden } })
    );
  });
}

// =========================================================
// CINEMATIC VERTICAL EXPLORATION SCROLL ENGINE
// =========================================================
let cinematicScrollId = null;

function cinematicScrollTo(targetY, duration = 1200) {
  if (cinematicScrollId !== null) {
    cancelAnimationFrame(cinematicScrollId);
    cinematicScrollId = null;
  }

  const startY = window.pageYOffset || window.scrollY || document.documentElement.scrollTop || 0;
  const distance = targetY - startY;
  if (Math.abs(distance) < 2) return;

  let startTime = null;

  function easeInOutQuart(t) {
    return t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2;
  }

  function step(currentTime) {
    if (startTime === null) startTime = currentTime;
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const easedProgress = easeInOutQuart(progress);

    window.scrollTo(0, startY + distance * easedProgress);

    if (progress < 1) {
      cinematicScrollId = requestAnimationFrame(step);
    } else {
      cinematicScrollId = null;
    }
  }

  cinematicScrollId = requestAnimationFrame(step);
}

// Scroll to Data Section Indicator (Cinematic Vertical Exploration)
const scrollDataBtn = document.getElementById("scrollDataBtn");
const dataSection = document.getElementById("dataSection");
if (scrollDataBtn && dataSection) {
  const triggerDataDescent = (e) => {
    if (e) e.preventDefault();
    const targetY = dataSection.getBoundingClientRect().top + (window.pageYOffset || window.scrollY || 0);
    cinematicScrollTo(targetY, 1250);
  };
  scrollDataBtn.addEventListener("click", triggerDataDescent);
  scrollDataBtn.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      triggerDataDescent(e);
    }
  });
}

// Return to 3D Orbit View Indicator (Cinematic Ascent)
const returnOrbitBtn = document.getElementById("returnOrbitBtn");
if (returnOrbitBtn) {
  const triggerOrbitAscent = (e) => {
    if (e) e.preventDefault();
    cinematicScrollTo(0, 1150);
  };
  returnOrbitBtn.addEventListener("click", triggerOrbitAscent);
  returnOrbitBtn.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      triggerOrbitAscent(e);
    }
  });
}

// Moon 3D Orbit Toggle
const moonToggleBtn = document.getElementById("moonToggleBtn");
let isMoonActive = false;
if (moonToggleBtn) {
  const distanceMetricLabel = document.getElementById("distanceMetricLabel");
  const distanceMetricValue = document.getElementById("distanceMetricValue");
  const distanceCardIcon = document.getElementById("distanceCardIcon");

  moonToggleBtn.addEventListener("click", () => {
    isMoonActive = !isMoonActive;
    moonToggleBtn.classList.toggle("active", isMoonActive);

    // Dynamically update Distance metric card
    if (distanceMetricLabel && distanceMetricValue && distanceCardIcon) {
      const moons = allPlanetsMoonsData[currentPlanet] || [];
      const primaryMoon = moons[0];

      if (isMoonActive && primaryMoon && primaryMoon.dist !== "N/A") {
        distanceMetricLabel.textContent = `Dist. from ${primaryMoon.name.split(" ")[0]}`;
        distanceMetricValue.textContent = primaryMoon.dist;
        distanceCardIcon.innerHTML = `
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
          </svg>
        `;
      } else {
        const pData = allPlanetsData[currentPlanet] || allPlanetsData.earth;
        distanceMetricLabel.textContent = currentPlanet === "sun" ? "Galactic Core Dist." : "Heliocentric Distance";
        distanceMetricValue.textContent = pData.distance.heroValue || "149.6M KM (1.0 AU)";
        distanceCardIcon.innerHTML = `
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="4"/>
            <path d="M12 2v2.5M12 19.5V22M4.22 4.22l1.77 1.77M18.01 18.01l1.77 1.77M2 12h2.5M19.5 12H22M4.22 19.78l1.77-1.77M18.01 5.99l1.77-1.77"/>
          </svg>
        `;
      }
    }

    // If detail panel is currently open on distance, refresh its narrative
    if (activeMetric === "distance") {
      openDetailPanel("distance");
    }

    // Notify Three.js engine to scale in/out the 3D Moons
    window.dispatchEvent(
      new CustomEvent("moon-toggle", { detail: { isMoonActive, planet: currentPlanet } })
    );
  });
}

// Hide Telemetry HUD & Info Button when in Data Section
window.addEventListener("scroll", () => {
  const scrollY = window.scrollY || window.pageYOffset || 0;
  const isInData = scrollY > window.innerHeight * 0.35;
  document.body.classList.toggle("in-data-section", isInData);

  if (isInData && detailPanel && detailPanel.classList.contains("open")) {
    closeDetail();
  }
}, { passive: true });

// =========================================================
// MULTI-MOON CAROUSEL CONTROLLER (DATA SECTION)
// =========================================================
let currentMoonIndex = 0;
const currentPlanetMoons = allPlanetsMoonsData[currentPlanet] || allPlanetsMoonsData.earth;

const moonSectionTitle = document.getElementById("moonSectionTitle");
const moonSectionTag = document.getElementById("moonSectionTag");
const moonSectionDesc = document.getElementById("moonSectionDesc");
const moonSectionDesc2 = document.getElementById("moonSectionDesc2");
const moonCarouselCounter = document.getElementById("moonCarouselCounter");
const prevMoonBtn = document.getElementById("prevMoonBtn");
const nextMoonBtn = document.getElementById("nextMoonBtn");

function updateMoonShowcase(index) {
  if (!currentPlanetMoons || currentPlanetMoons.length === 0) return;
  currentMoonIndex = (index + currentPlanetMoons.length) % currentPlanetMoons.length;
  const moon = currentPlanetMoons[currentMoonIndex];

  if (moonSectionTitle) moonSectionTitle.textContent = moon.name;
  if (moonSectionTag) moonSectionTag.textContent = moon.tag;
  if (moonSectionDesc) moonSectionDesc.innerHTML = moon.desc;
  if (moonSectionDesc2) moonSectionDesc2.innerHTML = moon.desc2 || "";

  if (moonCarouselCounter) {
    if (currentPlanetMoons.length > 1) {
      moonCarouselCounter.textContent = `${String(currentMoonIndex + 1).padStart(2, "0")} / ${String(currentPlanetMoons.length).padStart(2, "0")} · ${moon.name.toUpperCase()}`;
      moonCarouselCounter.style.display = "block";
    } else {
      moonCarouselCounter.style.display = "none";
    }
  }

  // Dispatch event for 3D Moon renderer to update model / texture
  window.dispatchEvent(
    new CustomEvent("moon-carousel-change", {
      detail: {
        planet: currentPlanet,
        moonIndex: currentMoonIndex,
        moonData: moon
      }
    })
  );
}

if (prevMoonBtn) {
  prevMoonBtn.addEventListener("click", () => updateMoonShowcase(currentMoonIndex - 1));
}

if (nextMoonBtn) {
  nextMoonBtn.addEventListener("click", () => updateMoonShowcase(currentMoonIndex + 1));
}

// Initial setup on load
if (currentPlanetMoons && currentPlanetMoons.length > 0) {
  updateMoonShowcase(0);
}

// =========================================================
// PLANETARY INSIGHT & MATHEMATICAL CALCULATION DATABASE
// =========================================================
const planetExplainers = {
  sun: {
    distance: {
      title: "Distance to Galactic Center: ~26,000 Light-Years",
      content: "The Sun is situated in the Milky Way's Orion-Cygnus Arm, orbiting approximately 26,000 light-years (8,000 pc) from the central supermassive black hole Sagittarius A*.",
      calcFormula: "Galactic Radius: R_gal ≈ 8.0 ± 0.5 kpc ≈ 2.47 × 10¹⁷ km ≈ 26,000 Light-Years",
      calcExplainer: "Determined by astrometric measurements of stellar orbits and radio interferometry (VLBA / GAIA) tracking the galactic center.",
      funFact: "The Sun and entire Solar System travel around the Milky Way core at 220 km/s (792,000 km/h)—taking ~230 million years to complete one galactic orbit!"
    },
    orbit: {
      title: "Galactic Year: ~230 Million Earth Years",
      content: "One Cosmic Galactic Year is the time it takes the Sun to orbit the center of the Milky Way galaxy (~230 million years).",
      calcFormula: "Galactic Period: T = 2π R_gal ÷ v_orbital ≈ (2π × 2.47×10¹⁷ km) ÷ 220 km/s ≈ 230 Million Years",
      calcExplainer: "Since the birth of the Sun 4.6 billion years ago, the Solar System has completed roughly 20 full orbits around our galaxy.",
      funFact: "Because the Sun is gaseous plasma, its equator rotates in 25.05 days while its poles take 34.4 days (Differential Rotation)!"
    },
    diameter: {
      title: "Equatorial Diameter: 1,392,700 km",
      content: "The Sun's diameter is 109.2 times that of Earth. Its volume could hold roughly 1.3 million Earths.",
      calcFormula: "D_sun = 2 × R_sun = 2 × 696,340 km = 1,392,680 km (109.2 × D_earth)",
      calcExplainer: "Measured with sub-kilometer precision using solar transit observations and satellite solar helioseismology (SOHO / SDO).",
      funFact: "The Sun is the most spherical natural object in the Solar System; its equatorial and polar diameters differ by less than 10 kilometers!"
    },
    gravity: {
      title: "Photospheric Gravity: 274.0 m/s² (27.94 g)",
      content: "Surface gravity at the solar photosphere is nearly 28 times stronger than Earth's gravity.",
      calcFormula: "g = (G × M_sun) ÷ R_sun² = (6.674×10⁻¹¹ × 1.989×10³⁰) ÷ (6.9634×10⁸)² ≈ 274.0 m/s²",
      calcExplainer: "A 70 kg human would weigh nearly 2 tons (1,955 kg) on the Sun's visible surface. Escape velocity from the Sun is a blistering 617.7 km/s.",
      funFact: "Every single second, the Sun's core fuses 600 million tons of hydrogen into helium, releasing energy equivalent to 91 billion megatons of TNT!"
    }
  },
  earth: {
    distance: {
      title: "How Far is Earth from the Sun?",
      content: "Earth orbits at an average distance of 149,597,870 kilometers (1.0 Astronomical Unit). Sunlight travels at 300,000 km/s and takes 8 minutes and 20 seconds to reach Earth.",
      calcFormula: "Radar Echo: d = (c × t) ÷ 2  |  Parallax: d = Baseline ÷ tan(θ)",
      calcExplainer: "Astronomers first calculated the Earth-Sun distance during the 1761 & 1769 Transits of Venus using trigonometry (parallax baseline across global observation stations). Modern astrophysics measures it to millisecond precision by bouncing interplanetary radar signals (c = 300,000 km/s) and timing the return echo.",
      funFact: "Because Earth's orbit is slightly elliptical, we are actually 5 million km closer to the Sun in January (Perihelion: 147.1M km) than in July (Aphelion: 152.1M km)!"
    },
    orbit: {
      title: "Orbital Year & Cosmic Velocity",
      content: "It takes Earth 365 days, 5 hours, 48 minutes, and 45 seconds (365.2422 days) to complete one lap around the Sun, moving at a blistering speed of 107,000 km/h (67,000 mph).",
      calcFormula: "Orbital Speed: v = 2πr ÷ T  |  Kepler's Law: T² ∝ a³",
      calcExplainer: "Orbital speed is calculated by dividing the orbital perimeter (2 × π × 149.6M km ≈ 940M km) by the seconds in a sidereal year (31,558,150 s), yielding v ≈ 29.78 km/s. Kepler's 3rd Law proves that orbital period squared is proportional to the semi-major axis cubed.",
      funFact: "Every 4 years, we add February 29 (Leap Day) to keep our calendar synchronized with Earth's extra ~0.25-day orbital journey!"
    },
    diameter: {
      title: "Measuring Earth's True Dimensions",
      content: "Earth's equatorial diameter is 12,742 km, while its polar diameter is 12,714 km. The centrifugal force from daily rotation causes a 43 km equatorial bulge.",
      calcFormula: "Eratosthenes Geometry: C = (360° ÷ θ) × s  |  Diameter: D = C ÷ π",
      calcExplainer: "In 240 BCE, Greek mathematician Eratosthenes calculated Earth's circumference using shadow geometry in Egypt. At solar noon on the solstice, Syene had 0° shadow while Alexandria cast a 7.2° shadow (1/50th of 360°). Multiplying the 800 km distance by 50 yielded C ≈ 40,000 km and D = C/π ≈ 12,742 km—accurate to within 1%!",
      funFact: "If you could drill a tunnel straight through Earth's center and jump in, gravity would pull you through to the other side in just 42 minutes!"
    },
    gravity: {
      title: "Surface Gravity & Gravitational Constant",
      content: "Earth's standard surface gravity is defined as 9.80665 m/s² (1.0 g). This force accelerates any falling object by ~9.8 meters per second every single second.",
      calcFormula: "Newton's Gravitation: g = (G × M) ÷ R²  |  Pendulum: g = 4π²L ÷ T²",
      calcExplainer: "Derived from Newton's Law of Universal Gravitation, where G = 6.674×10⁻¹¹ N·m²/kg², Earth mass M = 5.972×10²⁴ kg, and mean radius R = 6,371,000 m. Early scientists accurately calculated g in laboratories by measuring the swing period T of a pendulum of known length L.",
      funFact: "Gravity is slightly weaker at the equator (9.78 m/s²) than at the poles (9.83 m/s²) because you are 21 km farther from Earth's center at the equator!"
    }
  },
  mercury: {
    distance: {
      title: "Proximity to the Sun (0.387 AU)",
      content: "Mercury orbits at an average distance of 57.9 million km from the Sun, experiencing the most eccentric orbit of all major planets (0.2056 eccentricity).",
      calcFormula: "Perihelion/Aphelion: r_min = a(1 - e)  |  r_max = a(1 + e)",
      calcExplainer: "With semi-major axis a = 57.9M km and eccentricity e = 0.2056, Mercury swings from 46.0M km at perihelion to 69.8M km at aphelion. Sunlight takes only 3.2 minutes to reach Mercury.",
      funFact: "Because Mercury has no atmosphere to distribute thermal energy, surface temperatures swing by over 600°C between daytime (430°C) and night (-180°C)!"
    },
    orbit: {
      title: "The Swift 88-Day Orbit & 3:2 Spin Resonance",
      content: "Mercury circles the Sun in just 87.97 Earth days at an average orbital speed of 47.36 km/s (170,500 km/h)—the fastest orbital velocity of any planet.",
      calcFormula: "Orbital Period: T = 2π√(a³ ÷ GM_sun)  |  Resonance: 3 Rotations = 2 Orbits",
      calcExplainer: "Due to intense solar tidal forces and an eccentric orbit, Mercury is locked in a 3:2 spin-orbit resonance: it rotates exactly 3 times on its axis (58.65 days) for every 2 orbits around the Sun (87.97 days).",
      funFact: "On Mercury, the Sun appears to rise, stop, reverse direction in the sky, and then resume its path due to orbital acceleration at perihelion!"
    },
    diameter: {
      title: "Equatorial Diameter: 4,879 km",
      content: "Mercury is the smallest planet in the Solar System, barely larger than Earth's Moon (3,474 km) and smaller than moons Ganymede and Titan.",
      calcFormula: "Angular Diameter: D = 2 × d × tan(θ ÷ 2)",
      calcExplainer: "Determined telescopically during solar transits by measuring angular width θ and distance d. Spacecraft radar mapping by NASA's MESSENGER refined equatorial diameter to 4,879.4 km.",
      funFact: "Mercury contains a disproportionately colossal iron core spanning 4,100 km—making up over 85% of the planet's radius!"
    },
    gravity: {
      title: "Surface Gravity: 3.70 m/s² (0.38 g)",
      content: "Mercury's surface gravity is only 38% of Earth's. A 100 kg astronaut would weigh just 38 kg on Mercury's cratered surface.",
      calcFormula: "g = (G × M_mercury) ÷ R²  (M = 3.301×10²³ kg, R = 2,439.7 km)",
      calcExplainer: "Even though Mercury has only 5.5% of Earth's mass, its extreme density (5.427 g/cm³) and small radius produce a relatively high surface gravity of 3.70 m/s².",
      funFact: "Due to low gravity and high solar temperatures, Mercury cannot maintain a substantial atmosphere; its surface is exposed to a near-vacuum exosphere."
    }
  },
  venus: {
    distance: {
      title: "Distance to Sun: 108.2M km (0.723 AU)",
      content: "Venus orbits at a mean distance of 108.2 million km with the most circular orbit of any planet (eccentricity of only 0.0067).",
      calcFormula: "Orbital Radius: r ≈ a = 108,200,000 km  (Circularity: e = 0.0067)",
      calcExplainer: "Because Venus's orbit is nearly a perfect circle, the distance from the Sun varies by less than 1.5 million km between perihelion (107.5M km) and aphelion (108.9M km).",
      funFact: "Venus is the hottest planet in the Solar System (465°C / 870°F)—hotter than Mercury—due to a runaway supercritical CO₂ greenhouse effect!"
    },
    orbit: {
      title: "Retrograde Rotation & 224.7-Day Year",
      content: "Venus completes one orbit around the Sun in 224.70 Earth days, but rotates backwards (retrograde) once every 243.02 Earth days.",
      calcFormula: "Sidereal Day vs Year: T_rot = -243.02 d,  T_orb = 224.70 d",
      calcExplainer: "Because Venus spins clockwise (opposite to Earth and its own orbital motion), one solar day (from sunrise to sunrise) equals 116.75 Earth days. On Venus, the Sun rises in the West and sets in the East.",
      funFact: "A single sidereal day on Venus (243 Earth days) is longer than its entire orbital year (225 Earth days)!"
    },
    diameter: {
      title: "Equatorial Diameter: 12,104 km",
      content: "Venus is Earth's 'twin sister' in physical dimensions, possessing 95% of Earth's diameter and 81.5% of Earth's mass.",
      calcFormula: "Radar Altimetry: D = 2 × R_mean = 2 × 6,051.8 km = 12,103.6 km",
      calcExplainer: "Because opaque sulfuric acid clouds obscure the surface from visual telescopes, Venus's diameter was precisely calculated via radar penetration by NASA's Magellan orbiter.",
      funFact: "Venus has no liquid oceans; over 80% of its surface consists of smooth volcanic basalt plains and fractured tectonic highlands!"
    },
    gravity: {
      title: "Surface Gravity: 8.87 m/s² (0.904 g)",
      content: "Venus's surface gravity is 90.4% of Earth's. A 70 kg human would weigh 63.3 kg on Venus.",
      calcFormula: "g = (G × M_venus) ÷ R²  (M = 4.867×10²⁴ kg, R = 6,052 km)",
      calcExplainer: "With similar mass and radius to Earth, gravitational acceleration is nearly identical. However, atmospheric pressure at the surface is 92 times Earth's (equivalent to 900 m underwater).",
      funFact: "The dense atmosphere at the surface is so thick that carbon dioxide behaves as a supercritical fluid—a hybrid between liquid and gas!"
    }
  },
  mars: {
    distance: {
      title: "Orbital Distance: 227.9M km (1.524 AU)",
      content: "Mars orbits 1.524 AU from the Sun. Sunlight takes 12.6 minutes to reach the Martian surface, delivering only 43% of the solar flux Earth receives.",
      calcFormula: "Solar Flux: S_mars = S_earth ÷ (d_mars / d_earth)² ≈ 1361 ÷ (1.524)² ≈ 586 W/m²",
      calcExplainer: "Calculated using the Inverse-Square Law of Radiation. Mars receives roughly 586 W/m² of solar irradiance compared to Earth's 1,361 W/m², explaining its freezing planetary climate.",
      funFact: "Midday at the Martian equator can reach +20°C, but drops to -73°C at night and -125°C at the winter carbon dioxide ice caps!"
    },
    orbit: {
      title: "Orbital Year: 686.98 Earth Days",
      content: "Mars takes 1.88 Earth years (687 days) to orbit the Sun. A Martian solar day ('Sol') is 24 hours, 39 minutes, and 35.244 seconds.",
      calcFormula: "Kepler's Law: T = (a_mars / a_earth)^(3/2) = (1.524)^(1.5) ≈ 1.881 Years",
      calcExplainer: "Johannes Kepler formulated his famous laws of planetary motion in 1609 by mathematically analyzing Tycho Brahe's decades of precise observational data of Mars's orbit.",
      funFact: "Mars's axial tilt is 25.19° (nearly identical to Earth's 23.44°), giving Mars four distinct seasons, though each lasts twice as long as on Earth!"
    },
    diameter: {
      title: "Equatorial Diameter: 6,779 km",
      content: "Mars has about half the diameter of Earth (53%) and 28% of Earth's surface area (roughly equal to the total dry land area of Earth).",
      calcFormula: "Volumetric Equivalent: V_mars = 4/3 π R³ ≈ 0.151 V_earth",
      calcExplainer: "Determined through orbital spacecraft triangulation (Mariner 9, Viking, Mars Global Surveyor). Equatorial radius is 3,396.2 km while polar radius is 3,376.2 km.",
      funFact: "Mars hosts Olympus Mons, the largest volcano in the Solar System: 21.9 km tall (nearly 3 times Everest) and 600 km wide!"
    },
    gravity: {
      title: "Surface Gravity: 3.72 m/s² (0.379 g)",
      content: "Surface gravity on Mars is 37.9% of Earth's. A 100 kg explorer weighs only 38 kg on Mars, enabling effortless high jumping.",
      calcFormula: "g = (G × M_mars) ÷ R²  (M = 6.417×10²³ kg, R = 3,389.5 km)",
      calcExplainer: "Because Mars has only 10.7% of Earth's mass, escape velocity is just 5.03 km/s (compared to Earth's 11.19 km/s), which allowed lighter gases to escape into space over billions of years.",
      funFact: "With 0.38g gravity, an athlete could jump nearly 2.6 times higher on Mars than on Earth with the same leg exertion!"
    }
  },
  jupiter: {
    distance: {
      title: "Mean Distance: 778.5M km (5.204 AU)",
      content: "Jupiter orbits over 5 times farther from the Sun than Earth. Sunlight takes 43.2 minutes to reach Jupiter's outer cloud decks.",
      calcFormula: "AU Conversion: d = 5.2044 AU × 149,597,870 km/AU ≈ 778,570,000 km",
      calcExplainer: "Determined via celestial mechanics and radio telemetry from Pioneer, Voyager, Galileo, and Juno spacecraft.",
      funFact: "Jupiter radiates 1.6 times more internal heat into space than it receives from the Sun due to slow gravitational Kelvin-Helmholtz contraction!"
    },
    orbit: {
      title: "11.86 Earth Years to Orbit the Sun",
      content: "Jupiter takes 4,332.59 Earth days (11.86 years) to complete one solar orbit, traveling at 13.07 km/s.",
      calcFormula: "Orbital Period: T = √(5.2044³) ≈ 11.87 Years  |  Rotation: 9h 55m",
      calcExplainer: "While its year is nearly 12 Earth years long, Jupiter has the fastest rotation in the Solar System: one Jovian day takes only 9 hours, 55 minutes, and 30 seconds.",
      funFact: "Because Jupiter rotates so quickly, its equatorial diameter is 9,275 km wider than its polar diameter (extreme oblate spheroid flattening)!"
    },
    diameter: {
      title: "Equatorial Diameter: 142,984 km",
      content: "Jupiter is 11.2 times wider than Earth. Over 1,321 Earths could fit inside its vast gaseous volume.",
      calcFormula: "Volume Ratio: (R_jupiter / R_earth)³ = (71,492 / 6,371)³ ≈ 1,412 (1,321 actual volume)",
      calcExplainer: "Measured using spacecraft stellar occultation and optical imaging. Its mass (1.898×10²⁷ kg) is 2.5 times that of all other planets in the Solar System combined.",
      funFact: "The Great Red Spot is an anticyclonic storm measuring over 16,000 km across—wide enough to swallow the entire planet Earth whole!"
    },
    gravity: {
      title: "Surface Gravity: 24.79 m/s² (2.528 g)",
      content: "At the 1-bar cloud top level, gravity is 2.53 times Earth's. A 100 kg person would weigh 253 kg on Jupiter.",
      calcFormula: "g = (G × M_jupiter) ÷ R_1bar² = (6.674×10⁻¹¹ × 1.898×10²⁷) ÷ (7.149×10⁷)² ≈ 24.79 m/s²",
      calcExplainer: "Calculated at the standard 1-bar atmospheric reference pressure altitude since Jupiter has no solid surface crust.",
      funFact: "Jupiter's magnetic field is 20,000 times stronger than Earth's, powered by a churning mantle of liquid metallic hydrogen under 4 million bars of pressure!"
    }
  },
  saturn: {
    distance: {
      title: "Distance to Sun: 1.433 Billion km (9.58 AU)",
      content: "Saturn orbits nearly 10 times farther from the Sun than Earth. Sunlight takes 1 hour and 19 minutes to reach its golden rings.",
      calcFormula: "Solar Distance: d = 9.582 AU × 149.6M km/AU = 1.4335 Billion km",
      calcExplainer: "Calculated via orbital mechanics and radar ranging from the 13-year Cassini-Huygens mission.",
      funFact: "At Saturn's distance, the Sun appears 10 times smaller and 100 times dimmer than it does from Earth!"
    },
    orbit: {
      title: "Orbital Period: 29.45 Earth Years",
      content: "Saturn completes one orbit around the Sun in 10,759 Earth days (29.457 years) at an average speed of 9.69 km/s.",
      calcFormula: "Kepler's Period: T = (9.582)^(1.5) ≈ 29.66 Years",
      calcExplainer: "Saturn rotates on its axis once every 10 hours, 33 minutes, and 38 seconds, as determined by Cassini's measurement of ring wave vibrations.",
      funFact: "Saturn has an axial tilt of 26.73°, meaning each of its four seasons lasts over 7 Earth years!"
    },
    diameter: {
      title: "Equatorial Diameter: 120,536 km",
      content: "Saturn is 9.45 times wider than Earth. Its ring system spans 282,000 km across but is only 10 to 30 meters thick.",
      calcFormula: "Ring Span to Thickness Ratio: 282,000,000 m ÷ 20 m ≈ 14,000,000 : 1 (Razor-thin)",
      calcExplainer: "Determined via Cassini stellar and radio occultation. The rings are composed of 99% pure water ice particles ranging from micrometers to meters in size.",
      funFact: "Saturn has the lowest mean density of any planet at 0.687 g/cm³—less than water (1.0 g/cm³)—meaning it would float in a gigantic cosmic ocean!"
    },
    gravity: {
      title: "Surface Gravity: 10.44 m/s² (1.065 g)",
      content: "At the 1-bar cloud deck, gravity is 10.44 m/s²—only 6.5% stronger than Earth's gravity despite its colossal size.",
      calcFormula: "g = (G × M_saturn) ÷ R² = (6.674×10⁻¹¹ × 5.683×10²⁶) ÷ (6.027×10⁷)² ≈ 10.44 m/s²",
      calcExplainer: "Because Saturn's immense mass (95 Earths) is spread over such a gargantuan volume, its low density balances out, creating a cloud-level gravity remarkably close to Earth's.",
      funFact: "Saturn has 146 confirmed moons, including Titan (with liquid methane seas and thick nitrogen atmosphere) and Enceladus (with subsurface water ocean geysers)!"
    }
  },
  uranus: {
    distance: {
      title: "Distance to Sun: 2.871 Billion km (19.20 AU)",
      content: "Uranus orbits 19.2 AU from the Sun. Sunlight takes 2 hours and 40 minutes to reach its pale cyan atmosphere.",
      calcFormula: "d = 19.191 AU × 149.6M km/AU = 2.871 Billion km",
      calcExplainer: "Discovered in 1781 by William Herschel using a 6.2-inch reflector telescope—the first planet discovered with a telescope.",
      funFact: "Uranus holds the record for the coldest recorded planetary temperature in the Solar System at -224.2°C (-371.6°F)!"
    },
    orbit: {
      title: "Sideways 84-Year Orbit (97.77° Tilt)",
      content: "Uranus completes one orbit every 84.02 Earth years (30,687 days) with an extreme axial tilt of 97.77°, rolling on its side.",
      calcFormula: "Orbital Period: T = (19.191)^(1.5) ≈ 84.07 Years  |  Axial Tilt: 97.77°",
      calcExplainer: "Scientists hypothesize an ancient proto-planetary collision with an Earth-sized body knocked Uranus onto its side billions of years ago. Each pole experiences 42 years of continuous sunlight followed by 42 years of darkness.",
      funFact: "Uranus rotates retrogradely once every 17 hours, 14 minutes, and 24 seconds!"
    },
    diameter: {
      title: "Equatorial Diameter: 51,118 km",
      content: "Uranus is 4.01 times wider than Earth. Over 63 Earths could fit inside its icy volume.",
      calcFormula: "Diameter: D = 2 × 25,559 km = 51,118 km  (Mass: 14.54 M_earth)",
      calcExplainer: "Measured during NASA's Voyager 2 flyby in January 1986. Uranus is classified as an 'Ice Giant', consisting of a slushy mantle of water, ammonia, and methane ices over a small rocky core.",
      funFact: "Methane gas (2.3%) in Uranus's upper atmosphere absorbs red light, scattering blue and cyan wavelengths to give the planet its serene aqua hue!"
    },
    gravity: {
      title: "Surface Gravity: 8.87 m/s² (0.886 g)",
      content: "At the 1-bar cloud level, gravity is 8.87 m/s² (88.6% of Earth's gravity). A 100 kg person would weigh 89 kg on Uranus.",
      calcFormula: "g = (G × M_uranus) ÷ R² = (6.674×10⁻¹¹ × 8.681×10²⁵) ÷ (2.556×10⁷)² ≈ 8.87 m/s²",
      calcExplainer: "Even with 14.5 times Earth's mass, the large radius (25,559 km) keeps the surface gravity lower than Earth's.",
      funFact: "Uranus has 13 distinct, narrow dark rings and 28 known moons, all named after characters from Shakespeare and Alexander Pope!"
    }
  },
  neptune: {
    distance: {
      title: "Outermost Frontier: 4.495 Billion km (30.07 AU)",
      content: "Neptune orbits 30 times farther from the Sun than Earth. Sunlight takes 4 hours and 10 minutes to reach its deep azure atmosphere.",
      calcFormula: "d = 30.069 AU × 149.6M km/AU = 4.498 Billion km",
      calcExplainer: "Neptune was the first planet discovered through pure mathematical prediction in 1846 by Urbain Le Verrier and John Couch Adams, after observing gravitational perturbations in Uranus's orbit.",
      funFact: "At 30 AU, solar radiation is 900 times weaker than on Earth; noon on Neptune resembles dim twilight on Earth!"
    },
    orbit: {
      title: "164.79 Earth Years to Complete One Orbit",
      content: "Neptune takes 60,190 Earth days (164.79 years) to orbit the Sun, traveling at an average speed of 5.43 km/s.",
      calcFormula: "Kepler's Period: T = (30.069)^(1.5) ≈ 164.88 Years  |  Rotation: 16h 06m",
      calcExplainer: "Since its discovery in 1846, Neptune completed its very first full orbit in modern human history in 2011.",
      funFact: "Neptune experiences supersonic winds exceeding 2,160 km/h (1,340 mph)—the fastest atmospheric wind speeds measured on any planet in the Solar System!"
    },
    diameter: {
      title: "Equatorial Diameter: 49,528 km",
      content: "Neptune is 3.88 times wider than Earth. Over 57 Earths could fit inside its icy volume.",
      calcFormula: "Diameter: D = 2 × 24,764 km = 49,528 km  (Density: 1.638 g/cm³)",
      calcExplainer: "Measured by Voyager 2 in August 1989. While slightly smaller in diameter than Uranus, Neptune is denser and more massive (17.15 Earth masses).",
      funFact: "Deep interior temperatures of 5,000°C and pressures of 7 million bars may compress methane into falling showers of solid diamond crystals!"
    },
    gravity: {
      title: "Surface Gravity: 11.15 m/s² (1.137 g)",
      content: "At the 1-bar cloud deck, gravity is 11.15 m/s² (13.7% stronger than Earth). A 100 kg explorer weighs 114 kg on Neptune.",
      calcFormula: "g = (G × M_neptune) ÷ R² = (6.674×10⁻¹¹ × 1.024×10²⁶) ÷ (2.476×10⁷)² ≈ 11.15 m/s²",
      calcExplainer: "Neptune is the densest of all gas and ice giants (1.638 g/cm³), giving it the second-highest surface gravity among the non-terrestrial planets after Jupiter.",
      funFact: "Neptune's largest moon, Triton, orbits backwards (retrograde) and is a captured Kuiper Belt object with active cryovolcanoes erupting liquid nitrogen geysers!"
    }
  }
};

// =========================================================
// EXTERNAL RESEARCH ARCHIVES & REFERENCES DATABASE
// =========================================================
const allPlanetsExternalLinks = {
  earth: [
    { title: "Wikipedia: Earth", url: "https://en.wikipedia.org/wiki/Earth", source: "WIKIPEDIA", desc: "Planetary composition, geophysics, and biosphere evolution" },
    { title: "NASA Science: Earth", url: "https://science.nasa.gov/earth/", source: "NASA SCIENCE", desc: "Satellite observation missions, telemetry, and climate data" },
    { title: "Wikipedia: The Moon", url: "https://en.wikipedia.org/wiki/Moon", source: "WIKIPEDIA", desc: "Orbital mechanics, lunar geology, and Apollo exploration" }
  ],
  mercury: [
    { title: "Wikipedia: Mercury", url: "https://en.wikipedia.org/wiki/Mercury_(planet)", source: "WIKIPEDIA", desc: "Smallest planet, colossal iron core, and extreme orbital resonance" },
    { title: "NASA Science: Mercury", url: "https://science.nasa.gov/mercury/", source: "NASA SCIENCE", desc: "MESSENGER & BepiColombo mission discoveries and magnetosphere" },
    { title: "Wikipedia: Caloris Basin", url: "https://en.wikipedia.org/wiki/Caloris_Planitia", source: "WIKIPEDIA", desc: "Colossal multi-ring impact basin and antipodal weird terrain" }
  ],
  venus: [
    { title: "Wikipedia: Venus", url: "https://en.wikipedia.org/wiki/Venus", source: "WIKIPEDIA", desc: "Atmospheric greenhouse effect, volcanism, and retrograde rotation" },
    { title: "NASA Science: Venus", url: "https://science.nasa.gov/venus/", source: "NASA SCIENCE", desc: "DAVINCI & VERITAS mission targets and cloud chemistry" },
    { title: "Wikipedia: Atmosphere of Venus", url: "https://en.wikipedia.org/wiki/Atmosphere_of_Venus", source: "WIKIPEDIA", desc: "Supercritical CO₂ atmosphere and sulfuric acid cloud decks" }
  ],
  mars: [
    { title: "Wikipedia: Mars", url: "https://en.wikipedia.org/wiki/Mars", source: "WIKIPEDIA", desc: "Geological history, Olympus Mons, and robotic exploration" },
    { title: "NASA Science: Mars", url: "https://science.nasa.gov/mars/", source: "NASA SCIENCE", desc: "Perseverance & Curiosity rover discoveries and sample returns" },
    { title: "Wikipedia: Moons of Mars", url: "https://en.wikipedia.org/wiki/Moons_of_Mars", source: "WIKIPEDIA", desc: "Captured asteroids Phobos and Deimos orbit dynamics" }
  ],
  jupiter: [
    { title: "Wikipedia: Jupiter", url: "https://en.wikipedia.org/wiki/Jupiter", source: "WIKIPEDIA", desc: "Gas giant structure, Great Red Spot, and Jovian magnetosphere" },
    { title: "NASA Science: Jupiter", url: "https://science.nasa.gov/jupiter/", source: "NASA SCIENCE", desc: "Juno spacecraft telemetry and atmospheric depth profiles" },
    { title: "Wikipedia: Galilean Moons", url: "https://en.wikipedia.org/wiki/Galilean_moons", source: "WIKIPEDIA", desc: "Io, Europa, Ganymede, and Callisto ocean world exploration" }
  ],
  saturn: [
    { title: "Wikipedia: Saturn", url: "https://en.wikipedia.org/wiki/Saturn", source: "WIKIPEDIA", desc: "Ring dynamics, low density, and hexagonal polar jet stream" },
    { title: "NASA Science: Saturn", url: "https://science.nasa.gov/saturn/", source: "NASA SCIENCE", desc: "Cassini-Huygens legacy archive and future Titan missions" },
    { title: "Wikipedia: Rings of Saturn", url: "https://en.wikipedia.org/wiki/Rings_of_Saturn", source: "WIKIPEDIA", desc: "Water-ice ring system architecture and shepherd moons" }
  ],
  uranus: [
    { title: "Wikipedia: Uranus", url: "https://en.wikipedia.org/wiki/Uranus", source: "WIKIPEDIA", desc: "Sideways 98° axial tilt, ice giant mantle, and ring system" },
    { title: "NASA Science: Uranus", url: "https://science.nasa.gov/uranus/", source: "NASA SCIENCE", desc: "Atmospheric circulation and Voyager 2 flyby data" },
    { title: "Wikipedia: Moons of Uranus", url: "https://en.wikipedia.org/wiki/Moons_of_Uranus", source: "WIKIPEDIA", desc: "Shakespearean natural satellites including Miranda and Titania" }
  ],
  neptune: [
    { title: "Wikipedia: Neptune", url: "https://en.wikipedia.org/wiki/Neptune", source: "WIKIPEDIA", desc: "Supersonic winds, dynamic dark spots, and mathematical discovery" },
    { title: "NASA Science: Neptune", url: "https://science.nasa.gov/neptune/", source: "NASA SCIENCE", desc: "Deep blue atmosphere, ice giant composition, and magnetosphere" },
    { title: "Wikipedia: Triton (Moon)", url: "https://en.wikipedia.org/wiki/Triton_(moon)", source: "WIKIPEDIA", desc: "Retrograde captured Kuiper belt moon and nitrogen cryovolcanoes" }
  ]
};

// =========================================================
// DATA METRIC EXPLAINER CONTROLLER ('Planetary Insight')
// =========================================================
function initMetricExplainerController() {
  const metricBar = document.querySelector(".data-metric-bar");
  if (!metricBar) return;

  // Remove any legacy tap hints
  document.querySelectorAll(".d-metric-tap-hint").forEach(el => el.remove());

  // Find or dynamically create the explainer drawer
  let explainerDrawer = document.getElementById("metricExplainerDrawer");
  if (!explainerDrawer) {
    explainerDrawer = document.createElement("div");
    explainerDrawer.className = "metric-explainer-drawer";
    explainerDrawer.id = "metricExplainerDrawer";
    explainerDrawer.style.display = "none";
    explainerDrawer.innerHTML = `
      <div class="explainer-card">
        <div class="explainer-top">
          <div class="explainer-badge">
            <span class="explainer-icon"></span>
            <span class="explainer-tag" id="explainerTag">Planetary Insight</span>
          </div>
          <button class="explainer-close-btn" id="explainerCloseBtn" aria-label="Close Explainer">✕</button>
        </div>
        <h3 class="explainer-title" id="explainerTitle">Explore Planetary Secrets</h3>
        <p class="explainer-content" id="explainerContent"></p>
        <div class="explainer-calc-box" id="explainerCalcBox">
          <div class="calc-header">
            <span class="calc-icon"></span>
            <span class="calc-label">MATHEMATICAL DETERMINATION</span>
          </div>
          <div class="calc-formula-tag" id="explainerCalcFormula"></div>
          <p class="calc-text" id="explainerCalcText"></p>
        </div>
        <div class="explainer-funfact-box" id="explainerFunFactBox">
          <div class="funfact-header">
            <span class="funfact-icon"></span>
            <span class="funfact-label">COSMIC FUN FACT</span>
          </div>
          <p class="funfact-text" id="explainerFunFactText"></p>
        </div>
      </div>
    `;
    metricBar.parentNode.insertBefore(explainerDrawer, metricBar.nextSibling);
  }

  const explainerTag = document.getElementById("explainerTag");
  if (explainerTag) explainerTag.textContent = "Planetary Insight";

  const explainerTitle = document.getElementById("explainerTitle");
  const explainerContent = document.getElementById("explainerContent");
  const explainerCalcBox = document.getElementById("explainerCalcBox");
  const explainerCalcFormula = document.getElementById("explainerCalcFormula");
  const explainerCalcText = document.getElementById("explainerCalcText");
  const explainerFunFactText = document.getElementById("explainerFunFactText");
  const explainerCloseBtn = document.getElementById("explainerCloseBtn");

  const metricBoxes = metricBar.querySelectorAll(".data-metric-box");
  const defaultTypes = ["distance", "orbit", "diameter", "gravity"];
  let activeMetricKey = null;

  metricBoxes.forEach((box, idx) => {
    const metricType = box.dataset.metricType || defaultTypes[idx] || "distance";
    box.dataset.metricType = metricType;

    box.addEventListener("click", () => {
      const pData = planetExplainers[currentPlanet] || planetExplainers.earth;
      const metricInfo = pData[metricType];

      if (activeMetricKey === metricType && explainerDrawer.style.display !== "none") {
        // Close if clicking the same active metric
        explainerDrawer.style.display = "none";
        box.classList.remove("active");
        activeMetricKey = null;
        return;
      }

      metricBoxes.forEach(b => b.classList.remove("active"));
      box.classList.add("active");
      activeMetricKey = metricType;

      if (metricInfo) {
        if (explainerTag) explainerTag.textContent = "Planetary Insight";
        explainerTitle.textContent = metricInfo.title;
        explainerContent.textContent = metricInfo.content;

        // Mathematical Calculation Box
        if (metricInfo.calcFormula && metricInfo.calcExplainer) {
          if (explainerCalcBox) explainerCalcBox.style.display = "block";
          if (explainerCalcFormula) explainerCalcFormula.textContent = metricInfo.calcFormula;
          if (explainerCalcText) explainerCalcText.textContent = metricInfo.calcExplainer;
        } else if (explainerCalcBox) {
          explainerCalcBox.style.display = "none";
        }

        if (explainerFunFactText) explainerFunFactText.textContent = metricInfo.funFact;
        explainerDrawer.style.display = "block";

        // Smoothly bring the explainer into view
        explainerDrawer.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    });
  });

  if (explainerCloseBtn) {
    explainerCloseBtn.addEventListener("click", () => {
      explainerDrawer.style.display = "none";
      metricBoxes.forEach(b => b.classList.remove("active"));
      activeMetricKey = null;
    });
  }

  // Populate External Research Archives Grid (2-3 links)
  initExternalArchivesSection();
}

function initExternalArchivesSection() {
  const links = allPlanetsExternalLinks[currentPlanet] || allPlanetsExternalLinks.earth;
  let archivesSection = document.querySelector(".planet-external-archives");
  const narrativeContainer = document.querySelector(".dossier-narrative-container");

  if (!archivesSection && narrativeContainer) {
    archivesSection = document.createElement("section");
    archivesSection.className = "planet-external-archives";
    archivesSection.setAttribute("aria-label", "External Research Archives and References");
    archivesSection.innerHTML = `
      <div class="external-archives-header">
        <span class="archives-icon">🌐</span>
        <span class="archives-title">DEEP ARCHIVE & FURTHER READING</span>
      </div>
      <div class="external-links-grid" id="externalLinksGrid"></div>
    `;
    narrativeContainer.parentNode.insertBefore(archivesSection, narrativeContainer.nextSibling);
  }

  const linksGrid = document.getElementById("externalLinksGrid");
  if (linksGrid && links) {
    linksGrid.innerHTML = links.map(link => `
      <a href="${link.url}" target="_blank" rel="noopener noreferrer" class="external-archive-card">
        <div class="archive-card-top">
          <span class="archive-source">${link.source}</span>
          <span class="archive-arrow">↗</span>
        </div>
        <h4 class="archive-name">${link.title}</h4>
        <p class="archive-desc">${link.desc}</p>
      </a>
    `).join("");
  }
}

// Initialise metric explainer controller
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initMetricExplainerController);
} else {
  initMetricExplainerController();
}





