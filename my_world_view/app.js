// ========================================
// Solar System 3D - Three.js Portfolio
// ========================================

let scene, camera, renderer;
let camera3D, camera2D;
let currentView = '3D'; // '3D' or '2D'
let planets = [];
let controls = {
    forward: false,
    backward: false,
    left: false,
    right: false,
    up: false,
    down: false
};

// 2D View Controls
let isDragging = false;
let previousMousePosition = { x: 0, y: 0 };
let panOffset = { x: 0, y: 0 };
let zoomLevel = 1;

const baseSpeed = 0.5;
const starSystems = [];

// Rover Mode State
let isRoverMode = false;
let isLandingAnim = false;
let roverScene = new THREE.Group(); // Holds the planet surface and rover
let rover = null;
let currentPlanetData = null;
let roverVelocity = 0;
let roverTurn = 0;
let launchPad = null;
let currentInteractiveKioskBoard = null;

// Rover mouse-look state
// Tracks angular offsets applied to the chase camera so the player can
// look around independently of the rover's heading.
let roverLookYaw   = 0;   // horizontal look offset (radians)
let roverLookPitch = 0;   // vertical look offset (radians)
const ROVER_LOOK_SENSITIVITY = 0.003;
const ROVER_PITCH_LIMIT      = Math.PI / 4; // ±45°

// Surface ambient particles (dust, fireflies, spores, snow)
let surfaceParticles = null;
let surfaceParticleTime = 0;

// WebAudio
let audioCtx = null;
let droneOsc = null;
let droneGain = null;
let droneFilter = null;

// ========================================
// Initialization
// ========================================

function init() {
    // Scene
    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000000, 0.0005);
    
    // Rover scene setup
    roverScene.visible = false;
    scene.add(roverScene);

    // 3D Camera (Perspective)
    camera3D = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        2000
    );
    camera3D.position.set(0, 50, 200);

    // 2D Camera (Orthographic - Top Down)
    const aspect = window.innerWidth / window.innerHeight;
    const frustumSize = 600;
    camera2D = new THREE.OrthographicCamera(
        frustumSize * aspect / -2,
        frustumSize * aspect / 2,
        frustumSize / 2,
        frustumSize / -2,
        1,
        1000
    );
    camera2D.position.set(0, 500, 0);
    camera2D.lookAt(0, 0, 0);
    camera2D.rotation.z = Math.PI; // Rotate to align with 3D view orientation

    // Set initial camera
    camera = camera3D;

    // Renderer
    renderer = new THREE.WebGLRenderer({
        canvas: document.getElementById('canvas3d'),
        antialias: true,
        alpha: true
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);

    // Add ambient light for better visibility
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
    scene.add(ambientLight);

    // Add directional light (like a distant sun)
    const sunLight = new THREE.DirectionalLight(0xffffff, 0.8);
    sunLight.position.set(100, 100, 100);
    scene.add(sunLight);

    // Create starfield background
    createStarfield();

    // Create solar systems
    createSolarSystems();

    // Event listeners
    setupEventListeners();

    // Start animation
    animate();
}

// ========================================
// Create Background Stars
// ========================================

function createStarfield() {
    const starsGeometry = new THREE.BufferGeometry();
    const starVertices = [];

    for (let i = 0; i < 3000; i++) {
        const x = (Math.random() - 0.5) * 2000;
        const y = (Math.random() - 0.5) * 2000;
        const z = (Math.random() - 0.5) * 2000;
        starVertices.push(x, y, z);
    }

    starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));

    const starsMaterial = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 1,
        transparent: true,
        opacity: 0.8
    });

    const stars = new THREE.Points(starsGeometry, starsMaterial);
    scene.add(stars);
}

// ========================================
// Create Solar Systems
// ========================================

function createSolarSystems() {
    const systems = [
        {
            name: 'My Journey',
            position: { x: 0, y: 0, z: 0 }, // Center system
            starColor: 0xffffff,
            hasPath: false,
            planets: [
                {
                    name: 'Experience', orbit: 120, size: 18, color: 0xf77f00, speed: 0.0012, content: {
                        title: 'Experience',
                        description: 'My Professional Journey',
                        details: ['Click to land and explore my work history.']
                    },
                    billboards: [
                        { title: 'Quantiphi', desc: 'Machine Learning Engineer (May 2019 - Feb 2021)' },
                        { title: 'New Space', desc: 'ML Engineer II (Feb 2021 - Jul 2021)' },
                        { title: 'Tiger Analytics', desc: 'Machine Learning Engineer (Jan 2022 - Jul 2023)' },
                        { title: 'WPI Perception', desc: 'Graduate Researcher (Aug 2023 - Feb 2024)' },
                        { title: 'J&J', desc: 'SDS Intern - LLMs (Jun 2024 - Sep 2024)' },
                        { title: 'WPI ELPIS', desc: 'Graduate Researcher (Jan 2024 - May 2025)' },
                        { title: 'webAI', desc: 'Senior ML Engineer (May 2025 - Dec 2025)' },
                        { title: 'Tiger Analytics', desc: 'Senior Machine Learning Engineer (Dec 2025 - Present)' }
                    ]
                },
                {
                    name: 'Skills', orbit: 220, size: 14, color: 0x06ffa5, speed: 0.0008, content: {
                        title: 'Skills',
                        description: 'The tools and technologies I master.',
                        details: ['Click to land and explore my skills.']
                    },
                    billboards: [
                        { title: 'AI & ML', desc: 'Deep Learning, CV, RL' },
                        { title: 'Programming', desc: 'Python, C++, JS' },
                        { title: 'Cloud & Ops', desc: 'AWS, GCP, Docker' }
                    ]
                },
                {
                    name: 'Projects', orbit: 320, size: 16, color: 0x9d4edd, speed: 0.0005, content: {
                        title: 'Projects',
                        description: 'Creative and technical projects.',
                        details: ['Click to land and explore my projects.']
                    },
                    billboards: [
                        { title: 'MinNav', desc: 'ICRA 2026' },
                        { title: 'Robot Grasping', desc: 'ELPIS Lab' },
                        { title: 'RIGGU V2', desc: 'Interactive Platform' },
                        { title: 'Indoor Nav', desc: 'Motion Planning' },
                        { title: '3R Manipulator', desc: 'Dynamics' },
                        { title: 'Alien Catcher', desc: 'UAV Control' }
                    ]
                },
                {
                    name: 'Education', orbit: 420, size: 15, color: 0x4361ee, speed: 0.0003, content: {
                        title: 'Education',
                        description: 'Academic background and achievements.',
                        details: ['Click to land and explore my education.']
                    },
                    billboards: [
                        { title: 'WPI', desc: 'MS Robotics Engineering' },
                        { title: 'IGNOU', desc: 'MA Philosophy' },
                        { title: 'Hyderabad Univ', desc: 'PG Diploma AI' },
                        { title: 'NIT Calicut', desc: 'B.Tech Mech Eng' }
                    ]
                }
            ]
        }
    ];

    systems.forEach(systemData => {
        const system = createSystem(systemData);
        starSystems.push(system);
        scene.add(system.group);

        // Create path if enabled
        if (systemData.hasPath) {
            createSystemPath(system);
        }
    });
}

function createSystemPath(system) {
    // Sort planets by sequence
    const sortedPlanets = system.planets
        .filter(p => p.userData.sequence)
        .sort((a, b) => a.userData.sequence - b.userData.sequence);

    if (sortedPlanets.length < 2) return;

    const points = sortedPlanets.map(p => p.position);
    const geometry = new THREE.BufferGeometry().setFromPoints(points);

    const material = new THREE.LineDashedMaterial({
        color: 0xffffff,
        dashSize: 2,
        gapSize: 1,
        opacity: 0.3,
        transparent: true
    });

    const line = new THREE.Line(geometry, material);
    line.computeLineDistances(); // Required for dashed lines

    system.group.add(line);
    system.pathLine = line;
    system.sortedPlanets = sortedPlanets;
}

function createSystem(data) {
    const group = new THREE.Group();
    group.position.set(data.position.x, data.position.y, data.position.z);
    group.userData.name = data.name;

    // Central star — MeshBasicMaterial (unlit, no emissive needed)
    const starGeometry = new THREE.SphereGeometry(12, 32, 32);
    const starMaterial = new THREE.MeshBasicMaterial({ color: data.starColor });
    const star = new THREE.Mesh(starGeometry, starMaterial);
    group.add(star);

    // Star glow halo
    const glowGeometry = new THREE.SphereGeometry(18, 32, 32);
    const glowMaterial = new THREE.MeshBasicMaterial({
        color: data.starColor,
        transparent: true,
        opacity: 0.18,
        blending: THREE.AdditiveBlending
    });
    group.add(new THREE.Mesh(glowGeometry, glowMaterial));

    // Star PointLight — illuminates planet day-sides, dims night-sides
    const starLight = new THREE.PointLight(data.starColor, 1.8, 700);
    group.add(starLight);

    // Create planets + orbit rings
    const systemPlanets = [];
    data.planets.forEach(planetData => {
        const planet = createPlanet(planetData);
        planet.userData.orbit       = planetData.orbit;
        planet.userData.speed       = planetData.speed;
        planet.userData.angle       = Math.random() * Math.PI * 2;
        planet.userData.content     = planetData.content;
        planet.userData.systemName  = data.name;
        planet.userData.sequence    = planetData.sequence;
        planet.userData.billboards  = planetData.billboards; // carry billboard data

        planet.position.x = Math.cos(planet.userData.angle) * planetData.orbit;
        planet.position.z = Math.sin(planet.userData.angle) * planetData.orbit;

        group.add(planet);
        systemPlanets.push(planet);
        planets.push(planet);

        // Orbit ring — faint dashed ellipse lying flat on Y=0
        const orbitPoints = [];
        const SEG = 128;
        for (let i = 0; i <= SEG; i++) {
            const a = (i / SEG) * Math.PI * 2;
            orbitPoints.push(new THREE.Vector3(
                Math.cos(a) * planetData.orbit,
                0,
                Math.sin(a) * planetData.orbit
            ));
        }
        const orbitGeo = new THREE.BufferGeometry().setFromPoints(orbitPoints);
        const orbitMat = new THREE.LineBasicMaterial({
            color: planetData.color,
            transparent: true,
            opacity: 0.12,
            blending: THREE.AdditiveBlending
        });
        group.add(new THREE.LineLoop(orbitGeo, orbitMat));
    });

    return {
        group: group,
        planets: systemPlanets,
        name: data.name,
        hasPath: data.hasPath
    };
}

function updateSystemPaths() {
    starSystems.forEach(system => {
        if (system.pathLine && system.sortedPlanets) {
            const points = system.sortedPlanets.map(p => p.position);
            system.pathLine.geometry.setFromPoints(points);
            system.pathLine.computeLineDistances(); // Recompute for dashed effect
            system.pathLine.geometry.attributes.position.needsUpdate = true;
        }
    });
}

function createPlanet(data) {
    const planetGroup = new THREE.Group();

    // Create procedural texture for planet surface
    const surfaceTexture = createPlanetTexture(data.color, data.size);

    // Main planet with textured surface
    const geometry = new THREE.SphereGeometry(data.size, 64, 64);

    // Use more realistic material with texture
    const material = new THREE.MeshStandardMaterial({
        map: surfaceTexture,
        roughness: 0.8,
        metalness: 0.2,
        emissive: data.color,
        emissiveIntensity: 0.1,
        bumpMap: surfaceTexture,
        bumpScale: 0.3
    });

    const planet = new THREE.Mesh(geometry, material);
    planet.rotation.x = Math.random() * Math.PI;
    planet.rotation.y = Math.random() * Math.PI;
    planetGroup.add(planet);

    // Add slowly rotating animation
    planetGroup.userData.rotationSpeed = 0.001 + Math.random() * 0.002;

    // Cloud layer for some variety
    if (Math.random() > 0.5) {
        const cloudGeometry = new THREE.SphereGeometry(data.size * 1.015, 32, 32);
        const cloudTexture = createCloudTexture(data.size);
        const cloudMaterial = new THREE.MeshStandardMaterial({
            map: cloudTexture,
            transparent: true,
            opacity: 0.4,
            roughness: 1.0,
            metalness: 0.0,
            depthWrite: false
        });
        const clouds = new THREE.Mesh(cloudGeometry, cloudMaterial);
        clouds.userData.cloudRotation = 0.0005;
        planetGroup.add(clouds);
        planetGroup.userData.clouds = clouds;
    }

    // Enhanced atmosphere with gradient
    const atmosphereGeometry = new THREE.SphereGeometry(data.size * 1.15, 32, 32);
    const atmosphereMaterial = new THREE.ShaderMaterial({
        uniforms: {
            color: { value: new THREE.Color(data.color) }
        },
        vertexShader: `
            varying vec3 vNormal;
            void main() {
                vNormal = normalize(normalMatrix * normal);
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            uniform vec3 color;
            varying vec3 vNormal;
            void main() {
                float intensity = pow(0.6 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
                gl_FragColor = vec4(color, 1.0) * intensity;
            }
        `,
        blending: THREE.AdditiveBlending,
        side: THREE.BackSide,
        transparent: true
    });
    const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
    planetGroup.add(atmosphere);

    // Directional light for better shading
    const light = new THREE.PointLight(0xffffff, 0.3, data.size * 3);
    light.position.set(data.size * 2, data.size, data.size * 2);
    planetGroup.add(light);

    planetGroup.userData.name = data.name;
    planetGroup.userData.planet = planet; // Store reference for rotation

    return planetGroup;
}

// Create procedural planet texture
function createPlanetTexture(baseColor, size) {
    const canvas = document.createElement('canvas');
    const resolution = 512;
    canvas.width = resolution;
    canvas.height = resolution;
    const ctx = canvas.getContext('2d');

    // Convert hex color to RGB
    const color = new THREE.Color(baseColor);
    const r = Math.floor(color.r * 255);
    const g = Math.floor(color.g * 255);
    const b = Math.floor(color.b * 255);

    // Create base gradient
    const gradient = ctx.createLinearGradient(0, 0, resolution, resolution);
    gradient.addColorStop(0, `rgb(${r * 0.6}, ${g * 0.6}, ${b * 0.6})`);
    gradient.addColorStop(0.5, `rgb(${r}, ${g}, ${b})`);
    gradient.addColorStop(1, `rgb(${r * 0.8}, ${g * 0.8}, ${b * 0.8})`);

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, resolution, resolution);

    // Add noise for surface detail
    const imageData = ctx.getImageData(0, 0, resolution, resolution);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
        const noise = (Math.random() - 0.5) * 40;
        data[i] += noise;     // R
        data[i + 1] += noise; // G
        data[i + 2] += noise; // B
    }

    // Add some "continents" or features
    for (let i = 0; i < 8; i++) {
        const x = Math.random() * resolution;
        const y = Math.random() * resolution;
        const radius = 30 + Math.random() * 60;

        const featureGradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
        const darken = Math.random() > 0.5 ? 0.7 : 1.3;
        featureGradient.addColorStop(0, `rgba(${r * darken}, ${g * darken}, ${b * darken}, 0.6)`);
        featureGradient.addColorStop(1, 'transparent');

        ctx.putImageData(imageData, 0, 0);
        ctx.fillStyle = featureGradient;
        ctx.fillRect(0, 0, resolution, resolution);
    }

    ctx.putImageData(imageData, 0, 0);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
}

// Create procedural cloud texture
function createCloudTexture(size) {
    const canvas = document.createElement('canvas');
    const resolution = 256;
    canvas.width = resolution;
    canvas.height = resolution;
    const ctx = canvas.getContext('2d');

    // Transparent base
    ctx.clearRect(0, 0, resolution, resolution);

    // Add white cloud patches
    for (let i = 0; i < 20; i++) {
        const x = Math.random() * resolution;
        const y = Math.random() * resolution;
        const radius = 15 + Math.random() * 30;

        const cloudGradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
        cloudGradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
        cloudGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.4)');
        cloudGradient.addColorStop(1, 'transparent');

        ctx.fillStyle = cloudGradient;
        ctx.fillRect(0, 0, resolution, resolution);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
}

// ========================================
// Animation Loop
// ========================================

// Tracks launch pad pulse animation
let launchPadPulseTime = 0;

function animate() {
    requestAnimationFrame(animate);

    if (isRoverMode) {
        updateRoverMovement();

        // Pulse the launch pad light if present
        if (launchPad && launchPad.userData.light) {
            launchPadPulseTime += 0.05;
            launchPad.userData.light.intensity = 1.5 + Math.sin(launchPadPulseTime) * 1.0;
        }

        // Animate surface ambient particles
        if (surfaceParticles) {
            surfaceParticleTime += 0.016;
            const positions = surfaceParticles.geometry.attributes.position;
            const biome = roverScene.userData.biome;

            for (let i = 0; i < positions.count; i++) {
                let py = positions.getY(i);
                const px = positions.getX(i);
                const pz = positions.getZ(i);

                if (biome === 'ice') {
                    // Snow: fall downward, wrap at ground level
                    py -= 0.08 + Math.random() * 0.05;
                    if (py < 0) py += 60;
                } else if (biome === 'desert') {
                    // Dust: drift sideways and upward slowly
                    positions.setX(i, px + Math.sin(surfaceParticleTime * 0.5 + i) * 0.04);
                    py += 0.02;
                    if (py > 40) py -= 40;
                } else if (biome === 'forest') {
                    // Fireflies: slow sine-wave float
                    positions.setY(i, py + Math.sin(surfaceParticleTime + i * 0.3) * 0.03);
                } else if (biome === 'alien') {
                    // Spores: drift upward and spiral
                    positions.setX(i, px + Math.cos(surfaceParticleTime * 0.4 + i) * 0.05);
                    py += 0.025;
                    if (py > 50) py -= 50;
                }
                positions.setY(i, py);
            }
            positions.needsUpdate = true;
        }

        // Update 2D planet labels if in 2D mode
        if (currentView === '2D') {
            update2DLabels();
        } else {
            const labelsContainer = document.getElementById('labels-2d-container');
            if (labelsContainer) labelsContainer.style.display = 'none';
        }

        renderer.render(scene, camera);
        return;
    }

    // Update camera based on controls
    updateMovement();

    // Update planet orbits and rotation
    starSystems.forEach(system => {
        system.planets.forEach(planet => {
            // Orbit rotation
            planet.userData.angle += planet.userData.speed;
            planet.position.x = Math.cos(planet.userData.angle) * planet.userData.orbit;
            planet.position.z = Math.sin(planet.userData.angle) * planet.userData.orbit;

            // Planet axis rotation
            if (planet.userData.planet) {
                planet.userData.planet.rotation.y += planet.userData.rotationSpeed || 0.002;
            }

            // Cloud rotation
            if (planet.userData.clouds) {
                planet.userData.clouds.rotation.y += planet.userData.clouds.userData.cloudRotation || 0.0005;
            }

            // Proximity approach HUD — show landing hint, never auto-land
            const worldPos = new THREE.Vector3();
            planet.getWorldPosition(worldPos);
            const dist = camera3D.position.distanceTo(worldPos);
            const approachEl = document.getElementById('planet-approach-hud');
            if (approachEl && currentView === '3D') {
                if (dist < 80 && dist > (planet.userData.size || 15) + 8) {
                    approachEl.textContent = `PLANET: ${planet.userData.name}  |  DIST: ${Math.round(dist)}u  |  CLICK TO LAND`;
                    approachEl.classList.add('visible');
                } else {
                    approachEl.classList.remove('visible');
                }
            }
        });
    });

    // Check proximity to systems
    updateSystemInfo();

    // Update sequential paths
    updateSystemPaths();

    // Update Info Card Position
    updateInfoCardPosition();

    // Update 2D Labels
    if (currentView === '2D') {
        update2DLabels();
    } else {
        const labelsContainer = document.getElementById('labels-2d-container');
        if (labelsContainer) labelsContainer.style.display = 'none';
    }

    renderer.render(scene, camera);
}

// ========================================
// Movement
// ========================================

function updateRoverMovement() {
    if (!rover || isLandingAnim) return;

    const biome = roverScene.userData.biome;
    const ground = roverScene.userData.ground;

    // Check Water Physics
    let inWater = false;
    if (biome === 'forest' && rover.position.y < 2) {
        inWater = true;
    }

    // Acceleration & Friction
    const accel = inWater ? 0.02 : 0.05; // slower in water
    const maxSpeed = inWater ? 0.5 : 2;
    const friction = inWater ? 0.8 : 0.9;

    if (controls.forward) roverVelocity += accel;
    else if (controls.backward) roverVelocity -= accel;
    else roverVelocity *= friction;

    roverVelocity = Math.max(-maxSpeed/2, Math.min(roverVelocity, maxSpeed));

    // Steering
    const steerSpeed = inWater ? 0.02 : 0.05;
    if (controls.left) rover.rotation.y += steerSpeed;
    if (controls.right) rover.rotation.y -= steerSpeed;

    // Apply Velocity horizontally
    const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(rover.quaternion);
    // Project direction onto XZ plane to drive flat
    dir.y = 0;
    dir.normalize();
    
    rover.position.addScaledVector(dir, roverVelocity);

    // Animate wheels
    if (rover.userData.wheels) {
        // Circumference = 2 * PI * r (r=1.2) => ~7.5. Rotation = Distance / Radius
        const rotationAmount = -roverVelocity / 1.2; 
        rover.userData.wheels.forEach(w => {
            w.rotation.x += rotationAmount;
        });
    }

    // Terrain Raycasting Physics
    if (ground) {
        const raycaster = new THREE.Raycaster();
        const origin = rover.position.clone();
        origin.y = 100; // Raycast from high up
        const down = new THREE.Vector3(0, -1, 0);
        raycaster.set(origin, down);

        const intersects = raycaster.intersectObject(ground);
        if (intersects.length > 0) {
            const hit = intersects[0];
            const targetY = hit.point.y;
            
            // Smoothly interpolate height
            rover.position.y += (targetY - rover.position.y) * 0.2;

            // Tilt Chassis to match terrain normal
            const normal = hit.face.normal.clone();
            // Transform normal to world space if ground is rotated
            const normalMatrix = new THREE.Matrix3().getNormalMatrix(ground.matrixWorld);
            normal.applyMatrix3(normalMatrix).normalize();

            // Calculate target quaternion to align up vector with normal
            const targetQuat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal);
            // Apply heading rotation
            const headingQuat = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), rover.rotation.y);
            targetQuat.multiply(headingQuat);

            // Smooth slerp rotation
            rover.quaternion.slerp(targetQuat, 0.1);
        }
    }

    // Boundary check: Warn and return to base if wandering too far
    const distFromBase = Math.sqrt(rover.position.x**2 + rover.position.z**2);
    const warnEl = document.getElementById('boundary-warning');
    if (distFromBase > 350 && distFromBase <= 400) {
        if (warnEl) warnEl.style.display = 'block';
    } else if (distFromBase > 400) {
        // Teleport back
        rover.position.set(0, 0, 0);
        rover.rotation.y = 0;
        roverLookYaw = 0;
        roverLookPitch = 0;
        if (warnEl) warnEl.style.display = 'none';
        
        // Brief white flash
        const overlay = document.getElementById('landing-overlay');
        overlay.style.transition = 'none';
        overlay.style.opacity = '1';
        setTimeout(() => {
            overlay.style.transition = 'opacity 1s ease';
            overlay.style.opacity = '0';
        }, 50);
    } else {
        if (warnEl) warnEl.style.display = 'none';
    }

    // Chase Camera with mouse-look yaw/pitch offset
    const baseOffset = new THREE.Vector3(0, 12, 30);
    baseOffset.applyAxisAngle(new THREE.Vector3(0, 1, 0), rover.rotation.y + roverLookYaw);
    const targetPos = rover.position.clone().add(baseOffset);
    camera3D.position.lerp(targetPos, 0.1);

    // Look-at point: rover center + pitch offset
    const lookTarget = rover.position.clone().add(new THREE.Vector3(0, 3, 0));
    // Apply vertical look by shifting target up/down
    lookTarget.y += Math.tan(roverLookPitch) * 30;
    camera3D.lookAt(lookTarget);

    // Update rover HUD speed display
    const speedEl = document.getElementById('rover-speed');
    if (speedEl) speedEl.textContent = Math.abs(roverVelocity).toFixed(2) + ' m/s';

    // Update Compass
    const compassNeedle = document.getElementById('compass-needle');
    if (compassNeedle) {
        const deg = rover.rotation.y * (180 / Math.PI);
        compassNeedle.style.transform = `rotate(${-deg}deg)`;
    }

    // Check Kiosk Proximity
    if (roverScene.userData.kiosks) {
        let nearKiosk = null;
        for (let k of roverScene.userData.kiosks) {
            if (rover.position.distanceTo(k.position) < 8) {
                nearKiosk = k;
                break;
            }
        }
        
        const hintEl = document.getElementById('interact-hint');
        if (nearKiosk) {
            currentInteractiveKioskBoard = nearKiosk.userData.board;
            if (hintEl) hintEl.style.display = 'flex';
        } else {
            currentInteractiveKioskBoard = null;
            if (hintEl) hintEl.style.display = 'none';
        }
    }

    // Animate Rocky's glowing communication orb if it exists
    if (roverScene.userData.rockyOrb) {
        roverScene.userData.rockyOrb.position.y = 4 + Math.sin(performance.now() * 0.005) * 0.5;
        // Pulse light intensity
        roverScene.userData.rockyLight.intensity = 1 + Math.sin(performance.now() * 0.01) * 0.5;
    }
}


function updateMovement() {
    if (currentView !== '3D') return;

    const speed = baseSpeed;

    if (controls.forward) {
        camera.position.z -= speed;
    }
    if (controls.backward) {
        camera.position.z += speed;
    }
    if (controls.left) {
        camera.position.x -= speed;
    }
    if (controls.right) {
        camera.position.x += speed;
    }
    if (controls.up) {
        camera.position.y += speed;
    }
    if (controls.down) {
        camera.position.y -= speed;
    }
}

let selectedObject = null;

function updateInfoCardPosition() {
    const card = document.getElementById('planetInfoCard');
    if (!selectedObject || !card.classList.contains('active')) return;

    // Project world position to 2D screen space.
    const position = new THREE.Vector3();
    selectedObject.getWorldPosition(position);
    position.project(camera);

    const rawX = (position.x *  0.5 + 0.5) * window.innerWidth;
    const rawY = (-(position.y * 0.5) + 0.5) * window.innerHeight;

    // Clamp so the card (300 × ~280 px) stays fully inside the viewport.
    // The card is offset by transform: translate(-50%, -100%), so:
    //   horizontal: half of card width (150) from each edge
    //   vertical:   card height (280) from the top, 10px from the bottom
    const CARD_HALF_W = 150;
    const CARD_H      = 280;
    const MARGIN      = 10;

    const clampedX = Math.max(CARD_HALF_W + MARGIN,
                     Math.min(rawX, window.innerWidth  - CARD_HALF_W - MARGIN));
    const clampedY = Math.max(CARD_H + MARGIN,
                     Math.min(rawY, window.innerHeight - MARGIN));

    card.style.left = `${clampedX}px`;
    card.style.top  = `${clampedY}px`;
}

function update2DLabels() {
    const container = document.getElementById('labels-2d-container');
    if (!container) return;
    
    container.style.display = 'block';
    
    // Create/update labels
    planets.forEach((planet, index) => {
        let label = document.getElementById(`label-2d-${index}`);
        if (!label) {
            label = document.createElement('div');
            label.id = `label-2d-${index}`;
            label.className = 'label-2d';
            label.textContent = planet.userData.name || 'Unknown';
            container.appendChild(label);
        }
        
        // Project position
        const pos = new THREE.Vector3();
        planet.getWorldPosition(pos);
        pos.project(camera2D);
        
        const x = (pos.x * 0.5 + 0.5) * window.innerWidth;
        const y = (-(pos.y * 0.5) + 0.5) * window.innerHeight;
        
        // Offset slightly
        label.style.left = `${x}px`;
        label.style.top = `${y - 15}px`;
    });
}

function updateSystemInfo() {
    let nearestSystem = null;
    let minDistance = Infinity;

    starSystems.forEach(system => {
        const distance = camera.position.distanceTo(system.group.position);
        if (distance < minDistance) {
            minDistance = distance;
            nearestSystem = system;
        }
    });

    if (nearestSystem && minDistance < 150) {
        document.getElementById('systemName').textContent = `Near: ${nearestSystem.name} System`;
    } else {
        document.getElementById('systemName').textContent = 'Deep Space';
    }
}

// ========================================
// Event Listeners
// ========================================

function setupEventListeners() {
    window.addEventListener('resize', onWindowResize);

    window.addEventListener('keydown', (e) => {
        switch (e.key.toLowerCase()) {
            case 'w': controls.forward  = true; break;
            case 's': controls.backward = true; break;
            case 'a': controls.left     = true; break;
            case 'd': controls.right    = true; break;
            case ' ':
                controls.up = true;
                e.preventDefault();
                break;
            case 'shift':
                controls.down = true;
                break;
            case 'e':
                // E key = Launch from planet surface
                if (isRoverMode) returnToOrbit();
                break;
            case 'f':
                // F key = Interact with Kiosk
                if (isRoverMode && currentInteractiveKioskBoard) {
                    const modal = document.getElementById('kiosk-modal');
                    if (modal.style.display === 'none') {
                        document.getElementById('kiosk-title').textContent = currentInteractiveKioskBoard.title;
                        document.getElementById('kiosk-body').innerHTML = `
                            <p>${currentInteractiveKioskBoard.desc}</p>
                            <p style="margin-top:20px; color:#888;">(Detailed content can be placed here. e.g. project links, deeper descriptions, embedded videos, or GitHub repo links.)</p>
                        `;
                        const actionBtn = document.getElementById('kiosk-action-btn');
                        actionBtn.style.display = 'inline-block';
                        actionBtn.href = '#'; // Update with actual links from config later
                        
                        modal.style.display = 'flex';
                        if (document.pointerLockElement) document.exitPointerLock();
                    } else {
                        modal.style.display = 'none';
                    }
                }
                break;
            case 'escape':
                document.getElementById('kiosk-modal').style.display = 'none';
                break;
        }
    });

    window.addEventListener('keyup', (e) => {
        switch (e.key.toLowerCase()) {
            case 'w': controls.forward = false; break;
            case 's': controls.backward = false; break;
            case 'a': controls.left = false; break;
            case 'd': controls.right = false; break;
            case ' ': controls.up = false; break;
            case 'shift': controls.down = false; break;
        }
    });

    // View Toggle
    document.getElementById('btn3D').addEventListener('click', () => switchView('3D'));
    document.getElementById('btn2D').addEventListener('click', () => switchView('2D'));

    // 2D Pan/Zoom Controls
    const canvas = document.getElementById('canvas3d');

    canvas.addEventListener('mousedown', (e) => {
        if (currentView === '2D') {
            isDragging = true;
            previousMousePosition = { x: e.clientX, y: e.clientY };
        }
    });

    canvas.addEventListener('mousemove', (e) => {
        // Rover mouse-look (right-mouse-button held or pointer locked)
        if (isRoverMode && (e.buttons === 2 || document.pointerLockElement === canvas)) {
            roverLookYaw   -= e.movementX * ROVER_LOOK_SENSITIVITY;
            roverLookPitch  = Math.max(-ROVER_PITCH_LIMIT,
                              Math.min(ROVER_PITCH_LIMIT,
                              roverLookPitch - e.movementY * ROVER_LOOK_SENSITIVITY));
            return;
        }
        // Reset look toward rover heading when no mouse button held
        if (isRoverMode && e.buttons === 0) {
            roverLookYaw   *= 0.92; // Spring back
            roverLookPitch *= 0.92;
        }

        if (currentView === '2D' && isDragging) {
            const deltaX = e.clientX - previousMousePosition.x;
            const deltaY = e.clientY - previousMousePosition.y;

            // Adjust camera position based on zoom level
            const moveSpeed = 2 / zoomLevel;
            camera2D.position.x -= deltaX * moveSpeed;
            camera2D.position.z -= deltaY * moveSpeed;

            previousMousePosition = { x: e.clientX, y: e.clientY };
        }
    });

    // Right-click on canvas in rover mode requests pointer lock for full mouse-look
    canvas.addEventListener('contextmenu', (e) => {
        if (isRoverMode) {
            e.preventDefault();
            canvas.requestPointerLock();
        }
    });
    // Release pointer lock on E (launch) or Escape
    document.addEventListener('pointerlockchange', () => {
        if (!document.pointerLockElement) {
            roverLookYaw   = 0;
            roverLookPitch = 0;
        }
    });

    canvas.addEventListener('mouseup', () => {
        isDragging = false;
    });

    // { passive: false } is required so we can call e.preventDefault() inside
    // and avoid the browser warning: "Unable to preventDefault inside passive
    // event listener invocation."
    canvas.addEventListener('wheel', (e) => {
        if (currentView === '2D') {
            e.preventDefault();
            const zoomSpeed = 0.001;
            zoomLevel += e.deltaY * -zoomSpeed;
            zoomLevel = Math.min(Math.max(0.5, zoomLevel), 3); // Clamp zoom

            const aspect = window.innerWidth / window.innerHeight;
            const frustumSize = 600 / zoomLevel;

            camera2D.left   = frustumSize * aspect / -2;
            camera2D.right  = frustumSize * aspect / 2;
            camera2D.top    = frustumSize / 2;
            camera2D.bottom = frustumSize / -2;
            camera2D.updateProjectionMatrix();
        }
    }, { passive: false });

    // Mouse click to select planet
    canvas.addEventListener('click', onCanvasClick);

    // Close card
    document.getElementById('closeCardBtn').addEventListener('click', () => {
        document.getElementById('planetInfoCard').classList.remove('active');
        selectedObject = null;
    });

    // Close kiosk modal
    document.getElementById('closeKioskBtn').addEventListener('click', () => {
        document.getElementById('kiosk-modal').style.display = 'none';
    });
}

function switchView(view) {
    currentView = view;

    // Update buttons
    document.getElementById('btn3D').classList.toggle('active', view === '3D');
    document.getElementById('btn2D').classList.toggle('active', view === '2D');

    // Switch camera
    if (view === '3D') {
        camera = camera3D;
        scene.fog.density = 0.0005; // Enable fog in 3D
        controls.forward = false; // Reset movement
    } else {
        camera = camera2D;
        scene.fog.density = 0; // Disable fog in 2D for clear view

        // Reset 2D camera position to center
        camera2D.position.set(0, 500, 0);
        zoomLevel = 1;
        const aspect = window.innerWidth / window.innerHeight;
        const frustumSize = 600;
        camera2D.left = frustumSize * aspect / -2;
        camera2D.right = frustumSize * aspect / 2;
        camera2D.top = frustumSize / 2;
        camera2D.bottom = frustumSize / -2;
        camera2D.updateProjectionMatrix();
    }
}

function onWindowResize() {
    const aspect = window.innerWidth / window.innerHeight;

    // Update 3D Camera
    camera3D.aspect = aspect;
    camera3D.updateProjectionMatrix();

    // Update 2D Camera
    const frustumSize = 600 / zoomLevel;
    camera2D.left = frustumSize * aspect / -2;
    camera2D.right = frustumSize * aspect / 2;
    camera2D.top = frustumSize / 2;
    camera2D.bottom = frustumSize / -2;
    camera2D.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
}

function onCanvasClick(event) {
    const mouse = new THREE.Vector2();
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);

    // Get all planets and stars
    const interactables = [];
    starSystems.forEach(system => {
        interactables.push(...system.planets);
        // Add the star mesh (first child of group usually)
        const star = system.group.children[0];
        if (star) {
            star.userData.isStar = true;
            star.userData.system = system;
            interactables.push(star);
        }
    });

    const intersects = raycaster.intersectObjects(interactables, true);

    if (intersects.length > 0) {
        let object = intersects[0].object;

        // Handle Star Click
        if (object.userData.isStar || (object.parent && object.parent.userData.isStar)) {
            const system = object.userData.system || object.parent.userData.system;
            selectedObject = system.group.children[0]; // Track the star mesh
            showSystemInfo(system);
            return;
        }

        // Handle Planet Click
        while (object.parent && !object.userData.content) {
            object = object.parent;
        }

        if (object.userData.content) {
            selectedObject = object; // Track the planet group
            showPlanetInfo(object);
        }
    } else {
        // Clicked empty space - close card
        document.getElementById('planetInfoCard').classList.remove('active');
        selectedObject = null;
    }
}

function showSystemInfo(system) {
    document.getElementById('cardTitle').textContent = system.name + ' System';

    let description = '';
    if (system.name === 'Experience') description = 'A journey through my professional career.';
    if (system.name === 'Skills') description = 'The tools and technologies I master.';
    if (system.name === 'Projects') description = 'Creative and technical projects.';
    if (system.name === 'Education') description = 'Academic background and achievements.';

    const contentHTML = `
        <p>${description}</p>
        <h3>Planets (In Order)</h3>
        <ul>
            ${system.planets.map(p => `<li>${p.userData.content.title}</li>`).join('')}
        </ul>
    `;

    document.getElementById('cardContent').innerHTML = contentHTML;
    document.getElementById('planetInfoCard').classList.add('active');
    
    // Hide landing button for system
    const landBtn = document.getElementById('land-btn');
    if (landBtn) landBtn.style.display = 'none';
}

function showPlanetInfo(planet) {
    const content = planet.userData.content;
    const billboards = planet.userData.billboards || [];

    document.getElementById('cardTitle').textContent = content.title;

    let billboardHTML = '';
    if (billboards.length > 0) {
        billboardHTML = '<h3>Features</h3><ul>';
        billboards.slice(0, 4).forEach(b => {
            billboardHTML += `<li><strong>${b.title}</strong>: ${b.desc}</li>`;
        });
        if (billboards.length > 4) {
            billboardHTML += `<li>...and ${billboards.length - 4} more.</li>`;
        }
        billboardHTML += '</ul>';
    }

    const contentHTML = `
        <p>${content.description}</p>
        ${billboardHTML}
        <h3>Details</h3>
        <ul>
            ${content.details.map(detail => `<li>${detail}</li>`).join('')}
        </ul>
    `;

    document.getElementById('cardContent').innerHTML = contentHTML;
    document.getElementById('planetInfoCard').classList.add('active');
    
    const landBtn = document.getElementById('land-btn');
    if (landBtn) {
        landBtn.style.display = 'block';
        landBtn.onclick = () => {
            initiateLanding(planet);
        };
    }
}

// ========================================
// Surface Environment Generation
// ========================================

function createSurfaceEnvironment(planetData) {
    const name = planetData.name;
    let skyColor, groundColor, fogDensity;
    let biome = 'desert';

    // Biome-tuned fog: thick enough that the terrain edge is NEVER visible.
    // The world wraps seamlessly under the fog cover.
    if (name === 'Experience') {
        skyColor = 0xb7410e; groundColor = 0xc1440e; fogDensity = 0.028; biome = 'desert';
    } else if (name === 'Skills') {
        skyColor = 0x2d6a2d; groundColor = 0x228b22; fogDensity = 0.018; biome = 'forest';
    } else if (name === 'Projects') {
        skyColor = 0x1a0033; groundColor = 0x4a0e4e; fogDensity = 0.022; biome = 'alien';
    } else {
        skyColor = 0xc8eaf5; groundColor = 0xddeeff; fogDensity = 0.020; biome = 'ice';
    }

    scene.background = new THREE.Color(skyColor);
    scene.fog = new THREE.FogExp2(skyColor, fogDensity);

    // 1. Terrain — smaller tile (fog hides edges), world-wrap boundary keeps it infinite-feeling
    // TERRAIN_HALF must match WRAP constant in updateRoverMovement
    const TERRAIN_SIZE = 600;
    const groundGeo = new THREE.PlaneGeometry(TERRAIN_SIZE, TERRAIN_SIZE, 80, 80);
    const pos = groundGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const y = pos.getY(i);
        const dist = Math.sqrt(x*x + y*y);
        let height = 0;
        
        // Flat path down the center Z-axis for rover
        const isPath = Math.abs(x) < 30;
        
        if (dist > 40 && !isPath) {
            if (biome === 'forest') height = Math.sin(x/30)*5 + Math.cos(y/30)*5;
            else if (biome === 'desert') height = Math.sin(x/20)*6 + Math.cos(y/20)*6 + (Math.random()-0.5)*1.5;
            else if (biome === 'alien') height = Math.abs(Math.sin(x/15)*10) + Math.cos(y/15)*5;
            else height = (Math.random() * 0.8) + Math.sin(x/40)*2; // ice
        }
        pos.setZ(i, height);
    }
    groundGeo.computeVertexNormals();

    const groundMat = new THREE.MeshStandardMaterial({
        color: groundColor,
        roughness: biome === 'ice' ? 0.1 : 0.9,
        metalness: biome === 'ice' ? 0.8 : 0.1,
        flatShading: biome === 'alien'
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    roverScene.add(ground);

    roverScene.userData.ground = ground;
    roverScene.userData.biome = biome;

    // Water for forest
    if (biome === 'forest') {
        const waterGeo = new THREE.PlaneGeometry(1000, 1000);
        const waterMat = new THREE.MeshStandardMaterial({
            color: 0x1ca3ec,
            transparent: true,
            opacity: 0.8,
            roughness: 0.1,
            metalness: 0.8
        });
        const water = new THREE.Mesh(waterGeo, waterMat);
        water.rotation.x = -Math.PI / 2;
        water.position.y = 2; // Fill valleys
        roverScene.add(water);
    }

    // Instanced Objects
    let objCount = 250;
    let objGeo, objMat;
    
    if (biome === 'forest') {
        objGeo = new THREE.ConeGeometry(3, 15, 8);
        objGeo.translate(0, 7.5, 0); 
        objMat = new THREE.MeshStandardMaterial({color: 0x004400, roughness: 1.0});
    } else if (biome === 'desert') {
        objGeo = new THREE.DodecahedronGeometry(3, 1);
        objGeo.translate(0, 1.5, 0);
        objMat = new THREE.MeshStandardMaterial({color: 0x8a3324, roughness: 1.0});
    } else if (biome === 'alien') {
        objCount = 150;
        objGeo = new THREE.CylinderGeometry(0, 2, 20, 6);
        objGeo.translate(0, 10, 0);
        objMat = new THREE.MeshStandardMaterial({color: 0x00ffcc, emissive: 0x005544});
    } else {
        objCount = 100;
        objGeo = new THREE.IcosahedronGeometry(4, 0);
        objGeo.translate(0, 2, 0);
        objMat = new THREE.MeshStandardMaterial({color: 0xaaddff, roughness: 0.1, metalness: 0.9});
    }

    const instancedMesh = new THREE.InstancedMesh(objGeo, objMat, objCount);
    const dummy = new THREE.Object3D();
    const raycaster = new THREE.Raycaster();
    const down = new THREE.Vector3(0, -1, 0);

    for (let i = 0; i < objCount; i++) {
        let x = (Math.random() - 0.5) * 800;
        let z = (Math.random() - 0.5) * 800;
        if (Math.abs(x) < 50) continue; // Keep driving path clear
        
        raycaster.set(new THREE.Vector3(x, 100, z), down);
        const intersects = raycaster.intersectObject(ground);
        if (intersects.length > 0) {
            const y = intersects[0].point.y;
            if (biome === 'forest' && y < 2) continue; // Don't spawn underwater
            
            dummy.position.set(x, y, z);
            if (biome !== 'forest' && biome !== 'alien') {
                dummy.rotation.x = Math.random() * Math.PI;
                dummy.rotation.z = Math.random() * Math.PI;
            }
            dummy.scale.setScalar(0.5 + Math.random() * 1.5);
            dummy.updateMatrix();
            instancedMesh.setMatrixAt(i, dummy.matrix);
        }
    }
    roverScene.add(instancedMesh);

    // Ambient Particles
    const particleCount = 500;
    const particleGeo = new THREE.BufferGeometry();
    const particlePos = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
        particlePos[i*3] = (Math.random() - 0.5) * 400; // x
        particlePos[i*3+1] = Math.random() * 60; // y
        particlePos[i*3+2] = (Math.random() - 0.5) * 400; // z
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePos, 3));
    
    let particleColor = 0xffffff;
    let particleSize = 1;
    if (biome === 'ice') { particleColor = 0xffffff; particleSize = 1.5; }
    else if (biome === 'desert') { particleColor = 0xdab894; particleSize = 2; }
    else if (biome === 'forest') { particleColor = 0xaaffaa; particleSize = 1.5; }
    else if (biome === 'alien') { particleColor = 0xd400ff; particleSize = 2; }
    
    const particleMat = new THREE.PointsMaterial({
        color: particleColor,
        size: particleSize,
        transparent: true,
        opacity: 0.6,
        blending: THREE.AdditiveBlending,
        depthWrite: false
    });
    
    surfaceParticles = new THREE.Points(particleGeo, particleMat);
    roverScene.add(surfaceParticles);
    surfaceParticleTime = 0;

    // 2. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    roverScene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(100, 200, 50);
    roverScene.add(dirLight);

    // 3. Rover Mesh (Upgraded Design)
    rover = new THREE.Group();
    
    // Main Chassis Body
    const chassisGeo = new THREE.BoxGeometry(4, 1.2, 7);
    const chassisMat = new THREE.MeshStandardMaterial({
        color: 0xcccccc, 
        metalness: 0.7, 
        roughness: 0.4
    });
    const chassis = new THREE.Mesh(chassisGeo, chassisMat);
    chassis.position.y = 1.8;
    rover.add(chassis);

    // Front Sloped Nose
    const noseGeo = new THREE.CylinderGeometry(2, 2, 4, 3);
    noseGeo.rotateZ(Math.PI / 2);
    noseGeo.rotateX(Math.PI / 2);
    const noseMat = new THREE.MeshStandardMaterial({color: 0xaaaaaa, metalness: 0.8, roughness: 0.3});
    const nose = new THREE.Mesh(noseGeo, noseMat);
    nose.position.set(0, 1.8, -3.5);
    rover.add(nose);

    // Cockpit Window / Sensor block
    const cockpitGeo = new THREE.BoxGeometry(2.5, 0.8, 2);
    const cockpitMat = new THREE.MeshStandardMaterial({color: 0x050505, metalness: 1.0, roughness: 0.0});
    const cockpit = new THREE.Mesh(cockpitGeo, cockpitMat);
    cockpit.position.set(0, 2.8, -1.5);
    rover.add(cockpit);

    // Rear Cargo Deck / RTG Power Source
    const rtgGeo = new THREE.CylinderGeometry(0.8, 0.8, 2, 16);
    rtgGeo.rotateZ(Math.PI / 2);
    const rtgMat = new THREE.MeshStandardMaterial({color: 0x444444, metalness: 0.9, roughness: 0.5});
    const rtg = new THREE.Mesh(rtgGeo, rtgMat);
    rtg.position.set(0, 2.8, 2);
    rover.add(rtg);
    
    // RTG Fins
    const finsGeo = new THREE.BoxGeometry(2, 2.2, 1.8);
    const finsMat = new THREE.MeshStandardMaterial({color: 0x222222, metalness: 0.5, roughness: 0.8});
    const fins = new THREE.Mesh(finsGeo, finsMat);
    fins.position.set(0, 2.8, 2);
    rover.add(fins);

    // Camera Mast
    const mastGeo = new THREE.CylinderGeometry(0.1, 0.1, 2.5);
    const mastMat = new THREE.MeshStandardMaterial({color: 0x888888});
    const mast = new THREE.Mesh(mastGeo, mastMat);
    mast.position.set(1.5, 3.5, -1.5);
    rover.add(mast);
    
    // Camera Head (Stereo Cameras)
    const headGeo = new THREE.BoxGeometry(0.8, 0.4, 0.4);
    const headMat = new THREE.MeshStandardMaterial({color: 0xeeeeee});
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.set(1.5, 4.8, -1.5);
    rover.add(head);

    const lensGeo = new THREE.CylinderGeometry(0.15, 0.15, 0.2);
    lensGeo.rotateX(Math.PI / 2);
    const lensMat = new THREE.MeshBasicMaterial({color: 0x00aaff});
    const lens1 = new THREE.Mesh(lensGeo, lensMat);
    lens1.position.set(1.2, 4.8, -1.7);
    rover.add(lens1);
    const lens2 = new THREE.Mesh(lensGeo, lensMat);
    lens2.position.set(1.8, 4.8, -1.7);
    rover.add(lens2);

    // Wheels, Hubcaps, and Suspension Arms
    const wheelGeo = new THREE.CylinderGeometry(1.2, 1.2, 1, 24);
    wheelGeo.rotateZ(Math.PI/2);
    const wheelMat = new THREE.MeshStandardMaterial({color: 0x111111, roughness: 1.0});
    
    const hubcapGeo = new THREE.CylinderGeometry(0.6, 0.6, 1.05, 12);
    hubcapGeo.rotateZ(Math.PI/2);
    const hubcapMat = new THREE.MeshStandardMaterial({color: 0xd4af37, metalness: 1.0, roughness: 0.3}); // Gold accent hubcaps
    
    const suspensionGeo = new THREE.CylinderGeometry(0.15, 0.15, 2.5);
    const suspensionMat = new THREE.MeshStandardMaterial({color: 0x333333, metalness: 0.8});

    const wheelPositions = [
        [-3.2, 1.2, 3], [3.2, 1.2, 3], [-3.2, 1.2, -3], [3.2, 1.2, -3]
    ];
    
    rover.userData.wheels = [];
    
    wheelPositions.forEach(p => {
        const wheelGroup = new THREE.Group();
        
        const w = new THREE.Mesh(wheelGeo, wheelMat);
        wheelGroup.add(w);
        
        const h = new THREE.Mesh(hubcapGeo, hubcapMat);
        wheelGroup.add(h);
        
        wheelGroup.position.set(...p);
        rover.add(wheelGroup);
        rover.userData.wheels.push(wheelGroup);

        // Suspension Arm
        const arm = new THREE.Mesh(suspensionGeo, suspensionMat);
        // Connect arm from chassis side to wheel center
        const isLeft = p[0] < 0;
        arm.position.set(isLeft ? p[0] + 0.8 : p[0] - 0.8, 1.6, p[2]);
        arm.rotation.z = isLeft ? Math.PI/4 : -Math.PI/4;
        rover.add(arm);
    });

    // Dual Headlights
    const headlightMat = new THREE.MeshBasicMaterial({color: 0xffffff});
    const lightGeo = new THREE.CircleGeometry(0.4, 16);
    
    const hl1 = new THREE.Mesh(lightGeo, headlightMat);
    hl1.position.set(-1.2, 1.5, -4.01);
    hl1.rotation.y = Math.PI;
    rover.add(hl1);
    
    const hl2 = new THREE.Mesh(lightGeo, headlightMat);
    hl2.position.set(1.2, 1.5, -4.01);
    hl2.rotation.y = Math.PI;
    rover.add(hl2);

    const headlightSpot1 = new THREE.SpotLight(0xffffff, 1.5, 200, Math.PI/5, 0.5, 1);
    headlightSpot1.position.set(-1.2, 1.5, -4);
    const target1 = new THREE.Object3D();
    target1.position.set(-1.2, 0, -20);
    rover.add(target1);
    headlightSpot1.target = target1;
    rover.add(headlightSpot1);
    
    const headlightSpot2 = new THREE.SpotLight(0xffffff, 1.5, 200, Math.PI/5, 0.5, 1);
    headlightSpot2.position.set(1.2, 1.5, -4);
    const target2 = new THREE.Object3D();
    target2.position.set(1.2, 0, -20);
    rover.add(target2);
    headlightSpot2.target = target2;
    rover.add(headlightSpot2);

    // Tail lights
    const tailMat = new THREE.MeshBasicMaterial({color: 0xff0000});
    const tl1 = new THREE.Mesh(lightGeo, tailMat);
    tl1.position.set(-1.2, 1.5, 4.01);
    rover.add(tl1);
    const tl2 = new THREE.Mesh(lightGeo, tailMat);
    tl2.position.set(1.2, 1.5, 4.01);
    rover.add(tl2);

    rover.position.set(0, 0, 0);
    roverScene.add(rover);

    // Kiosks array for interaction
    roverScene.userData.kiosks = [];

    // Central Hub Landmark
    let hubGeo, hubMat;
    if (biome === 'desert') {
        hubGeo = new THREE.TetrahedronGeometry(40, 0); // Pyramid-like
        hubMat = new THREE.MeshStandardMaterial({color: 0xffaa00, metalness: 0.5, roughness: 0.8, flatShading: true});
    } else if (biome === 'forest') {
        hubGeo = new THREE.IcosahedronGeometry(35, 2); // Dome-like
        hubMat = new THREE.MeshStandardMaterial({color: 0x11ff44, wireframe: true, emissive: 0x003300});
    } else if (biome === 'alien') {
        hubGeo = new THREE.ConeGeometry(15, 80, 4); // Spire
        hubMat = new THREE.MeshStandardMaterial({color: 0xaa00ff, metalness: 0.8, roughness: 0.1, flatShading: true});
        
        // --- Rocky from Project Hail Mary (Easter Egg) ---
        const rockyGroup = new THREE.Group();
        // Carapace (pentagonal rough dome)
        const carapaceGeo = new THREE.DodecahedronGeometry(2, 1);
        const carapaceMat = new THREE.MeshStandardMaterial({
            color: 0x554433,
            roughness: 1.0,
            bumpScale: 0.5
        });
        const carapace = new THREE.Mesh(carapaceGeo, carapaceMat);
        carapace.position.y = 2.5;
        rockyGroup.add(carapace);
        
        // 5 Legs radiating outwards
        const legGeo = new THREE.CylinderGeometry(0.3, 0.1, 3.5);
        const legMat = new THREE.MeshStandardMaterial({color: 0x443322, roughness: 0.9});
        for (let i = 0; i < 5; i++) {
            const leg = new THREE.Mesh(legGeo, legMat);
            const angle = (i / 5) * Math.PI * 2;
            leg.position.set(Math.cos(angle) * 1.5, 1.2, Math.sin(angle) * 1.5);
            // Point the leg outward and downward
            leg.lookAt(Math.cos(angle) * 4, -2, Math.sin(angle) * 4);
            leg.rotateX(Math.PI / 2);
            rockyGroup.add(leg);
        }
        
        // Eridian musical communication orb (floating glowing sphere)
        const orbGeo = new THREE.SphereGeometry(0.3, 16, 16);
        const orbMat = new THREE.MeshBasicMaterial({color: 0x00ffff});
        const orb = new THREE.Mesh(orbGeo, orbMat);
        orb.position.set(2, 4, 2);
        
        // Add a small light to the orb
        const orbLight = new THREE.PointLight(0x00ffff, 1.5, 15);
        orbLight.position.set(2, 4, 2);
        
        rockyGroup.add(orb);
        rockyGroup.add(orbLight);
        
        rockyGroup.position.set(20, 0, 50); // Near the hub
        roverScene.add(rockyGroup);
        
        // References for animation
        roverScene.userData.rockyOrb = orb;
        roverScene.userData.rockyLight = orbLight;
        // ------------------------------------------------
    } else { // ice
        hubGeo = new THREE.OctahedronGeometry(30, 0);
        hubMat = new THREE.MeshStandardMaterial({color: 0xffffff, metalness: 0.9, roughness: 0.1, transparent: true, opacity: 0.8});
    }
    const hub = new THREE.Mesh(hubGeo, hubMat);
    hub.position.set(0, 20, 60); // Placed behind the rover start position
    roverScene.add(hub);

    // 4. Billboards (Experiences) — with text wrapping for long descriptions
    if (planetData.billboards) {
        let zPos = -30;
        planetData.billboards.forEach((board, index) => {
            const canvas = document.createElement('canvas');
            canvas.width = 512;
            canvas.height = 320; // Taller for wrapped text
            const ctx = canvas.getContext('2d');

            // Background with rounded feel
            ctx.fillStyle = 'rgba(0, 10, 8, 0.92)';
            ctx.fillRect(0, 0, 512, 320);
            ctx.strokeStyle = '#00ff88';
            ctx.lineWidth = 6;
            ctx.strokeRect(3, 3, 506, 314);

            // Title
            ctx.fillStyle = '#00ff88';
            ctx.font = 'bold 36px "Orbitron", sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(board.title, 256, 80);

            // Separator line
            ctx.strokeStyle = 'rgba(0,255,136,0.3)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(40, 105); ctx.lineTo(472, 105);
            ctx.stroke();

            // Description or Data Viz
            if (planetData.name === 'Skills') {
                // Render simple Bar Chart instead of text
                ctx.fillStyle = 'rgba(255,255,255,0.88)';
                ctx.font = '20px "Inter", sans-serif';
                ctx.fillText('Proficiency Metrics', 256, 140);
                
                // Draw 3 dummy bars based on string length hash for variety
                const seed = board.desc.length;
                const colors = ['#ff0055', '#00ddff', '#ffdd00'];
                for (let b = 0; b < 3; b++) {
                    const val = 0.4 + (Math.sin(seed + b * 2) * 0.5 + 0.5) * 0.5; // 0.4 to 0.9
                    const yOff = 180 + b * 35;
                    ctx.fillStyle = 'rgba(255,255,255,0.1)';
                    ctx.fillRect(80, yOff, 350, 20);
                    ctx.fillStyle = colors[b];
                    ctx.fillRect(80, yOff, 350 * val, 20);
                }
            } else {
                // Standard text wrap
                ctx.fillStyle = 'rgba(255,255,255,0.88)';
                ctx.font = '22px "Inter", sans-serif';
                const words = board.desc.split(' ');
                let line = '';
                let lineY = 150;
                const maxWidth = 440;
                words.forEach((word, wi) => {
                    const testLine = line + (line ? ' ' : '') + word;
                    if (ctx.measureText(testLine).width > maxWidth && line) {
                        ctx.fillText(line, 256, lineY);
                        line = word;
                        lineY += 32;
                    } else {
                        line = testLine;
                    }
                    if (wi === words.length - 1) ctx.fillText(line, 256, lineY);
                });
            }

            const tex = new THREE.CanvasTexture(canvas);
            const planeGeo = new THREE.PlaneGeometry(18, 11); // Taller billboard
            const planeMat = new THREE.MeshBasicMaterial({map: tex, transparent: true, side: THREE.DoubleSide});
            const mesh = new THREE.Mesh(planeGeo, planeMat);

            const isLeft = index % 2 !== 0; // Wait, index % 2 === 0 was x=18
            const bx = isLeft ? -18 : 18;
            mesh.position.set(bx, 7, zPos);
            mesh.rotation.y = isLeft ? Math.PI/6 : -Math.PI/6;

            roverScene.add(mesh);

            // Create Kiosk for interaction
            const kioskGeo = new THREE.BoxGeometry(2, 4, 2);
            const kioskMat = new THREE.MeshStandardMaterial({color: 0x333333, metalness: 0.8});
            const kiosk = new THREE.Mesh(kioskGeo, kioskMat);
            // Emissive screen on kiosk
            const screenGeo = new THREE.PlaneGeometry(1.5, 1.2);
            const screenMat = new THREE.MeshBasicMaterial({color: 0x00ff88});
            const screen = new THREE.Mesh(screenGeo, screenMat);
            screen.position.set(0, 1, 1.01);
            kiosk.add(screen);
            
            // Place kiosk closer to the path
            const kx = isLeft ? -8 : 8;
            kiosk.position.set(kx, 2, zPos + 5);
            kiosk.rotation.y = isLeft ? Math.PI/4 : -Math.PI/4;
            kiosk.userData.board = board;
            roverScene.add(kiosk);
            roverScene.userData.kiosks.push(kiosk);

            zPos -= 55;
        });

        // 5. Base Station at the center (0, 0, 0)
        const baseGroup = new THREE.Group();
        
        // Main Platform
        const padGeo = new THREE.CylinderGeometry(15, 18, 2, 8);
        const padMat = new THREE.MeshStandardMaterial({
            color: 0x444444,
            metalness: 0.8,
            roughness: 0.5
        });
        const platform = new THREE.Mesh(padGeo, padMat);
        platform.position.set(0, 0.5, 0);
        baseGroup.add(platform);

        // Landing Ring Glow
        const ringGeo = new THREE.RingGeometry(8, 9, 32);
        const ringMat = new THREE.MeshBasicMaterial({color: 0x00ff88, side: THREE.DoubleSide, transparent: true, opacity: 0.8});
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = -Math.PI/2;
        ring.position.set(0, 1.6, 0);
        baseGroup.add(ring);

        // Support Struts
        const strutGeo = new THREE.CylinderGeometry(0.5, 0.5, 10, 4);
        const strutMat = new THREE.MeshStandardMaterial({color: 0x222222, metalness: 0.9});
        for (let i = 0; i < 4; i++) {
            const strut = new THREE.Mesh(strutGeo, strutMat);
            const angle = (i / 4) * Math.PI * 2 + Math.PI/4;
            strut.position.set(Math.cos(angle) * 12, 5, Math.sin(angle) * 12);
            strut.lookAt(0, 10, 0);
            baseGroup.add(strut);
        }

        // Pulsing point light above pad
        const padLight = new THREE.PointLight(0x00ff88, 2.5, 60);
        padLight.position.set(0, 20, 0);
        baseGroup.userData.light = padLight;
        baseGroup.add(padLight);

        // LAUNCH label above pad
        const labelCanvas = document.createElement('canvas');
        labelCanvas.width = 256; labelCanvas.height = 128;
        const lctx = labelCanvas.getContext('2d');
        lctx.fillStyle = '#00ff88';
        lctx.font = 'bold 48px "Orbitron", sans-serif';
        lctx.textAlign = 'center';
        lctx.textBaseline = 'middle';
        lctx.fillText('[ BASE STATION ]', 128, 64);
        const labelTex = new THREE.CanvasTexture(labelCanvas);
        const labelMesh = new THREE.Mesh(
            new THREE.PlaneGeometry(24, 12),
            new THREE.MeshBasicMaterial({map: labelTex, transparent: true, side: THREE.DoubleSide, depthTest: false})
        );
        labelMesh.position.set(0, 28, 0);
        baseGroup.add(labelMesh);

        launchPad = baseGroup;
        roverScene.add(launchPad);
    }
}

// ========================================
// Rover and Landing Mechanics
// ========================================

function initiateLanding(planet) {
    if (isRoverMode) return;
    isRoverMode = true;
    currentPlanetData = planet.userData;

    // Stop spaceship movement
    controls.forward = false;
    controls.backward = false;
    document.getElementById('planetInfoCard').classList.remove('active');

    // --- Cinematic Descent ---
    // Phase 1 (0-1.5s): Camera zooms toward planet surface
    const targetPos = new THREE.Vector3();
    planet.getWorldPosition(targetPos);
    const descentStart = camera3D.position.clone();
    // Aim slightly above the planet surface
    const descentEnd = targetPos.clone().add(new THREE.Vector3(0, (planet.userData.size || 15) * 2.5, 0));
    const descentDuration = 1500;
    const descentStartTime = performance.now();

    function descentStep(now) {
        const t = Math.min(1, (now - descentStartTime) / descentDuration);
        const ease = t < 0.5 ? 2*t*t : -1+(4-2*t)*t; // ease-in-out
        camera3D.position.lerpVectors(descentStart, descentEnd, ease);
        camera3D.lookAt(targetPos);
        renderer.render(scene, camera3D);
        if (t < 1) {
            requestAnimationFrame(descentStep);
        } else {
            // Phase 2 (1.5-2.5s): Atmosphere flash to white
            const overlay = document.getElementById('landing-overlay');
            overlay.style.transition = 'opacity 1s ease';
            overlay.style.opacity = '1';
            setTimeout(showSurface, 1000);
        }
    }
    requestAnimationFrame(descentStep);

    function showSurface() {
        // Hide solar system, show rover scene
        starSystems.forEach(system => system.group.visible = false);
        roverScene.visible = true;
        createSurfaceEnvironment(currentPlanetData);

        // Reset rover starting position, rotation, velocity and mouse-look state
        if (rover) { 
            rover.position.set(0, 0, 0); 
            rover.rotation.y = 0;
        }
        roverVelocity = 0;
        roverLookYaw = 0;
        roverLookPitch = 0;

        // Show rover HUD
        document.querySelector('.view-toggle').style.display = 'none';
        const roverHud = document.getElementById('rover-hud');
        if (roverHud) {
            roverHud.style.display = 'flex';
            const biomeEl = document.getElementById('rover-biome');
            if (biomeEl) biomeEl.textContent = roverScene.userData.biome?.toUpperCase() || '---';
        }

        // Web Audio Ambient Drone
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (audioCtx.state === 'suspended') audioCtx.resume();
        
        if (droneOsc) droneOsc.stop();
        droneOsc = audioCtx.createOscillator();
        droneGain = audioCtx.createGain();
        droneFilter = audioCtx.createBiquadFilter();

        droneOsc.connect(droneFilter);
        droneFilter.connect(droneGain);
        droneGain.connect(audioCtx.destination);

        const biome = roverScene.userData.biome;
        if (biome === 'desert') {
            droneOsc.type = 'triangle'; droneOsc.frequency.value = 60;
            droneFilter.type = 'lowpass'; droneFilter.frequency.value = 200;
        } else if (biome === 'ice') {
            droneOsc.type = 'sine'; droneOsc.frequency.value = 300;
            droneFilter.type = 'bandpass'; droneFilter.frequency.value = 800;
        } else if (biome === 'forest') {
            droneOsc.type = 'sine'; droneOsc.frequency.value = 150;
            droneFilter.type = 'lowpass'; droneFilter.frequency.value = 400;
        } else if (biome === 'alien') {
            droneOsc.type = 'sawtooth'; droneOsc.frequency.value = 80;
            droneFilter.type = 'lowpass'; droneFilter.frequency.value = 300;
        }

        droneGain.gain.setValueAtTime(0, audioCtx.currentTime);
        droneGain.gain.linearRampToValueAtTime(0.15, audioCtx.currentTime + 2);
        droneOsc.start();

        // Phase 3: Dropship Cinematic Landing
        isLandingAnim = true;
        
        // Hide rover initially
        rover.visible = false;
        document.getElementById('rover-hud').style.display = 'none'; // hide HUD during anim

        // Create Dropship
        const dropshipGroup = new THREE.Group();
        const hullGeo = new THREE.CylinderGeometry(2.5, 4, 10, 8);
        const hullMat = new THREE.MeshStandardMaterial({color: 0x999999, metalness: 0.9, roughness: 0.3});
        const hull = new THREE.Mesh(hullGeo, hullMat);
        dropshipGroup.add(hull);

        // Retro Thruster Flame
        const flameGeo = new THREE.ConeGeometry(2, 6, 8);
        const flameMat = new THREE.MeshBasicMaterial({color: 0xffaa00, transparent: true, opacity: 0.8});
        const flame = new THREE.Mesh(flameGeo, flameMat);
        flame.position.y = -7;
        flame.rotation.x = Math.PI;
        dropshipGroup.add(flame);

        dropshipGroup.position.set(0, 150, 0); // Start high
        roverScene.add(dropshipGroup);

        // Start fading from white immediately
        const overlay = document.getElementById('landing-overlay');
        overlay.style.transition = 'opacity 0.5s ease';
        overlay.style.opacity = '0';

        const dropStart = performance.now();
        const dropDuration = 2500; // 2.5 seconds to land

        function dropStep(now) {
            const t = Math.min(1, (now - dropStart) / dropDuration);
            const ease = 1 - Math.pow(1 - t, 3); // ease-out cubic
            
            // Move dropship down
            dropshipGroup.position.y = 150 - (148 * ease);
            
            // Flicker flame
            flame.scale.setScalar(0.8 + Math.random() * 0.4);
            
            // Camera follows dropship down, looking slightly up at it
            camera3D.position.set(20, dropshipGroup.position.y + 10, 30);
            camera3D.lookAt(dropshipGroup.position);

            renderer.render(scene, camera3D);

            if (t < 1) {
                requestAnimationFrame(dropStep);
            } else {
                // Landed! Screen shake
                let shake = 10;
                flame.visible = false; // cut engines
                
                function shakeStep() {
                    if (shake > 0) {
                        camera3D.position.x = 20 + (Math.random() - 0.5) * shake;
                        camera3D.position.y = 12 + (Math.random() - 0.5) * shake;
                        camera3D.position.z = 30 + (Math.random() - 0.5) * shake;
                        shake -= 1;
                        renderer.render(scene, camera3D);
                        requestAnimationFrame(shakeStep);
                    } else {
                        // Reveal rover, hide dropship (could animate doors but simple fade is robust)
                        roverScene.remove(dropshipGroup);
                        rover.visible = true;
                        document.getElementById('rover-hud').style.display = 'flex';
                        isLandingAnim = false; // Unlock controls!
                    }
                }
                shakeStep();
            }
        }
        
        // Slight delay before drop to let white screen clear
        setTimeout(() => requestAnimationFrame(dropStep), 500);
    }
}

// Guard to prevent double-launch
let isLaunching = false;

function returnToOrbit() {
    if (!isRoverMode || isLaunching) return;
    isLaunching = true;

    // Fade out drone
    if (droneGain && audioCtx) {
        droneGain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 1);
        setTimeout(() => { if (droneOsc) { droneOsc.stop(); droneOsc = null; } }, 1500);
    }

    // --- Cinematic Launch Sequence ---
    // Phase 1 (0-1.2s): Camera tilts upward dramatically
    const launchStartQuat = camera3D.quaternion.clone();
    const lookUpVec = new THREE.Vector3(0, 1, -0.3).normalize();
    const launchEndQuat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, -1), lookUpVec);
    const tiltDuration = 1200;
    const tiltStartTime = performance.now();

    function tiltStep(now) {
        const t = Math.min(1, (now - tiltStartTime) / tiltDuration);
        const ease = t * t; // ease-in
        camera3D.quaternion.slerpQuaternions(launchStartQuat, launchEndQuat, ease);
        // Drift camera upward slightly
        camera3D.position.y += 0.3 * ease;
        renderer.render(scene, camera3D);
        if (t < 1) {
            requestAnimationFrame(tiltStep);
        } else {
            // Phase 2 (1.2-2.2s): Fog ramps to white-out
            atmosphericWhiteout();
        }
    }
    requestAnimationFrame(tiltStep);

    function atmosphericWhiteout() {
        const overlay = document.getElementById('landing-overlay');
        overlay.style.transition = 'opacity 1s ease';
        overlay.style.opacity = '1';
        setTimeout(showOrbit, 1000);
    }

    function showOrbit() {
        isRoverMode = false;
        isLaunching = false;
        roverScene.visible = false;

        // Restore space environment
        scene.background = null;
        scene.fog = new THREE.FogExp2(0x000000, 0.0005);

        // Show solar system
        starSystems.forEach(system => system.group.visible = true);

        // Position camera back at a safe distance from where we landed
        if (currentPlanetData) {
            // Find the planet group still in the scene
            let planetGroup = null;
            starSystems.forEach(sys => {
                sys.planets.forEach(p => {
                    if (p.userData.name === currentPlanetData.name) planetGroup = p;
                });
            });
            if (planetGroup) {
                const worldPos = new THREE.Vector3();
                planetGroup.getWorldPosition(worldPos);
                const dir = worldPos.clone().normalize().negate();
                camera3D.position.copy(worldPos).add(dir.multiplyScalar(60));
                camera3D.lookAt(0, 0, 0);
            }
        }

        // Hide rover HUD, show view toggle
        document.querySelector('.view-toggle').style.display = 'flex';
        const roverHud = document.getElementById('rover-hud');
        if (roverHud) roverHud.style.display = 'none';
        const approachEl = document.getElementById('planet-approach-hud');
        if (approachEl) approachEl.classList.remove('visible');

        // Clear surface to free memory
        while (roverScene.children.length > 0) {
            roverScene.remove(roverScene.children[0]);
        }
        rover = null;
        launchPad = null;
        launchPadPulseTime = 0;

        // Phase 3 (pull back from planet over 1s while fading in)
        const overlay = document.getElementById('landing-overlay');
        overlay.style.transition = 'opacity 1.2s ease';
        overlay.style.opacity = '0';
    }
}

// ========================================
// Start
// ========================================

init();
