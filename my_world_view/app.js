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
let roverScene = new THREE.Group(); // Holds the planet surface and rover
let rover = null;
let currentPlanetData = null;
let roverVelocity = 0;
let roverTurn = 0;
let launchPad = null;

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

    // Create central star.
    // MeshBasicMaterial is unlit and ignores emissive/emissiveIntensity;
    // those fields are removed to avoid misleading dead properties.
    const starGeometry = new THREE.SphereGeometry(12, 32, 32);
    const starMaterial = new THREE.MeshBasicMaterial({
        color: data.starColor
    });
    const star = new THREE.Mesh(starGeometry, starMaterial);
    group.add(star);

    // Add star glow
    const glowGeometry = new THREE.SphereGeometry(15, 32, 32);
    const glowMaterial = new THREE.MeshBasicMaterial({
        color: data.starColor,
        transparent: true,
        opacity: 0.2,
        blending: THREE.AdditiveBlending
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    group.add(glow);

    // Create planets
    const systemPlanets = [];
    data.planets.forEach(planetData => {
        const planet = createPlanet(planetData);
        planet.userData.orbit = planetData.orbit;
        planet.userData.speed = planetData.speed;
        planet.userData.angle = Math.random() * Math.PI * 2;
        planet.userData.content = planetData.content;
        planet.userData.systemName = data.name;
        planet.userData.sequence = planetData.sequence; // Store sequence for path

        planet.position.x = Math.cos(planet.userData.angle) * planetData.orbit;
        planet.position.z = Math.sin(planet.userData.angle) * planetData.orbit;

        group.add(planet);
        systemPlanets.push(planet);
        planets.push(planet);
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

function animate() {
    requestAnimationFrame(animate);

    if (isRoverMode) {
        updateRoverMovement();
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
            
            // Proximity Check for Landing
            const worldPos = new THREE.Vector3();
            planet.getWorldPosition(worldPos);
            if (camera3D.position.distanceTo(worldPos) < planet.userData.size + 15) {
                initiateLanding(planet);
            }
        });
    });

    // Check proximity to systems
    updateSystemInfo();

    // Update sequential paths
    updateSystemPaths();

    // Update Info Card Position
    updateInfoCardPosition();

    renderer.render(scene, camera);
}

// ========================================
// Movement
// ========================================

function updateRoverMovement() {
    if (!rover) return;

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

    // Chase Camera
    const offset = new THREE.Vector3(0, 12, 30); // Slightly higher and further back
    offset.applyAxisAngle(new THREE.Vector3(0,1,0), rover.rotation.y);
    const targetPos = rover.position.clone().add(offset);
    camera3D.position.lerp(targetPos, 0.1);
    camera3D.lookAt(rover.position.clone().add(new THREE.Vector3(0, 3, 0)));
    
    // Check Launch Pad collision
    if (launchPad) {
        if (rover.position.distanceTo(launchPad.position) < 15) {
            returnToOrbit();
        }
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

    // Helper: show the construction warning on first movement key press.
    function triggerConstructionWarning() {
        if (window.hasShownWarning) return;
        const warning = document.getElementById('constructionWarning');
        if (!warning) return;
        warning.classList.add('visible');
        window.hasShownWarning = true;
        setTimeout(() => warning.classList.remove('visible'), 3000);
    }

    window.addEventListener('keydown', (e) => {
        switch (e.key.toLowerCase()) {
            case 'w': controls.forward  = true; triggerConstructionWarning(); break;
            case 's': controls.backward = true; triggerConstructionWarning(); break;
            case 'a': controls.left     = true; triggerConstructionWarning(); break;
            case 'd': controls.right    = true; triggerConstructionWarning(); break;
            case ' ':
                controls.up = true;
                e.preventDefault();
                triggerConstructionWarning();
                break;
            case 'shift':
                controls.down = true;
                triggerConstructionWarning();
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
}

function showPlanetInfo(planet) {
    const content = planet.userData.content;

    document.getElementById('cardTitle').textContent = content.title;

    const contentHTML = `
        <p>${content.description}</p>
        <h3>Details</h3>
        <ul>
            ${content.details.map(detail => `<li>${detail}</li>`).join('')}
        </ul>
        <button id="land-btn" class="btn btn-primary" style="margin-top: 15px; width: 100%;">Initiate Landing</button>
    `;

    document.getElementById('cardContent').innerHTML = contentHTML;
    document.getElementById('planetInfoCard').classList.add('active');
    
    document.getElementById('land-btn').onclick = () => {
        initiateLanding(planet);
    };
}

// ========================================
// Surface Environment Generation
// ========================================

function createSurfaceEnvironment(planetData) {
    const name = planetData.name;
    let skyColor, groundColor, fogDensity;
    let biome = 'desert';

    if (name === 'Experience') {
        skyColor = 0xb7410e; groundColor = 0xc1440e; fogDensity = 0.015; biome = 'desert';
    } else if (name === 'Skills') {
        skyColor = 0x87CEEB; groundColor = 0x228b22; fogDensity = 0.005; biome = 'forest';
    } else if (name === 'Projects') {
        skyColor = 0x2e004f; groundColor = 0x4a0e4e; fogDensity = 0.015; biome = 'alien';
    } else {
        skyColor = 0xd4f1f9; groundColor = 0xffffff; fogDensity = 0.008; biome = 'ice';
    }

    // Remove scene.background so the starry sky is visible!
    scene.background = null; 
    scene.fog = new THREE.FogExp2(skyColor, fogDensity);

    // 1. Terrain
    const groundGeo = new THREE.PlaneGeometry(1000, 1000, 100, 100);
    const pos = groundGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const y = pos.getY(i);
        const dist = Math.sqrt(x*x + y*y);
        let height = 0;
        
        // Create a clear, flat driving path down the center z-axis
        const isPath = Math.abs(x) < 30; 
        
        if (dist > 50 && !isPath) {
            // Mildly bumpy terrain
            if (biome === 'forest') height = Math.sin(x/30)*5 + Math.cos(y/30)*5;
            else if (biome === 'desert') height = Math.sin(x/20)*6 + Math.cos(y/20)*6 + Math.random()*1;
            else if (biome === 'alien') height = Math.abs(Math.sin(x/15)*10) + Math.cos(y/15)*5;
            else height = (Math.random() * 1) + Math.sin(x/40)*2; // ice
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
    
    // Store ground for raycasting physics later
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

    // 2. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    roverScene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(100, 200, 50);
    roverScene.add(dirLight);

    // 3. Rover Mesh
    rover = new THREE.Group();
    
    // Main Chassis
    const chassisGeo = new THREE.BoxGeometry(4, 1.5, 8);
    const chassisMat = new THREE.MeshStandardMaterial({color: 0xdddddd, metalness: 0.8, roughness: 0.2});
    const chassis = new THREE.Mesh(chassisGeo, chassisMat);
    chassis.position.y = 1.5;
    rover.add(chassis);

    // Cockpit Window
    const cockpitGeo = new THREE.BoxGeometry(3, 1.2, 3);
    const cockpitMat = new THREE.MeshStandardMaterial({color: 0x111111, metalness: 0.9, roughness: 0.1});
    const cockpit = new THREE.Mesh(cockpitGeo, cockpitMat);
    cockpit.position.set(0, 2.5, -1);
    rover.add(cockpit);

    // Solar Panel / Roof Rack
    const panelGeo = new THREE.PlaneGeometry(3.5, 4);
    const panelMat = new THREE.MeshStandardMaterial({color: 0x003366, metalness: 1.0, roughness: 0.2, side: THREE.DoubleSide});
    const panel = new THREE.Mesh(panelGeo, panelMat);
    panel.rotation.x = -Math.PI / 2;
    panel.position.set(0, 2.3, 2);
    rover.add(panel);

    // Antenna
    const antennaGeo = new THREE.CylinderGeometry(0.05, 0.05, 3);
    const antennaMat = new THREE.MeshStandardMaterial({color: 0x555555});
    const antenna = new THREE.Mesh(antennaGeo, antennaMat);
    antenna.position.set(1.5, 3.5, 3);
    rover.add(antenna);
    
    const bulbGeo = new THREE.SphereGeometry(0.2);
    const bulbMat = new THREE.MeshBasicMaterial({color: 0xff0000});
    const bulb = new THREE.Mesh(bulbGeo, bulbMat);
    bulb.position.set(1.5, 5, 3);
    rover.add(bulb);
    
    // Wheels with Hubcaps
    const wheelGeo = new THREE.CylinderGeometry(1.2, 1.2, 1, 24);
    wheelGeo.rotateZ(Math.PI/2);
    const wheelMat = new THREE.MeshStandardMaterial({color: 0x222222, roughness: 0.9});
    const hubcapGeo = new THREE.CylinderGeometry(0.6, 0.6, 1.05, 12);
    hubcapGeo.rotateZ(Math.PI/2);
    const hubcapMat = new THREE.MeshStandardMaterial({color: 0xaaaaaa, metalness: 0.9});
    
    const wheelPositions = [
        [-2.5, 1.2, 3], [2.5, 1.2, 3], [-2.5, 1.2, -3], [2.5, 1.2, -3]
    ];
    
    // To allow rotation animation, we can store wheels in an array
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

    // 4. Billboards (Experiences)
    if (planetData.billboards) {
        let zPos = -30;
        planetData.billboards.forEach((board, index) => {
            const canvas = document.createElement('canvas');
            canvas.width = 512;
            canvas.height = 256;
            const ctx = canvas.getContext('2d');
            
            // Draw background
            ctx.fillStyle = 'rgba(0, 20, 15, 0.8)';
            ctx.fillRect(0, 0, 512, 256);
            ctx.strokeStyle = '#00ff88';
            ctx.lineWidth = 10;
            ctx.strokeRect(0, 0, 512, 256);
            
            // Draw text
            ctx.fillStyle = '#00ff88';
            ctx.font = 'bold 40px "Orbitron", sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(board.title, 256, 100);
            
            ctx.fillStyle = '#ffffff';
            ctx.font = '24px "Inter", sans-serif';
            ctx.fillText(board.desc, 256, 160);

            const tex = new THREE.CanvasTexture(canvas);
            const planeGeo = new THREE.PlaneGeometry(16, 8);
            const planeMat = new THREE.MeshBasicMaterial({map: tex, transparent: true, side: THREE.DoubleSide});
            const mesh = new THREE.Mesh(planeGeo, planeMat);
            
            mesh.position.set((index % 2 === 0 ? 15 : -15), 5, zPos);
            // Angle slightly towards the path
            mesh.rotation.y = (index % 2 === 0 ? -Math.PI/6 : Math.PI/6);
            
            roverScene.add(mesh);
            zPos -= 50; // Space them out along the path
        });

        // 5. Launch Pad at the end of the path
        const padGeo = new THREE.CylinderGeometry(10, 10, 1, 32);
        const padMat = new THREE.MeshStandardMaterial({color: 0x00ff88, emissive: 0x005522});
        launchPad = new THREE.Mesh(padGeo, padMat);
        launchPad.position.set(0, 0.5, zPos);
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
    
    // Trigger White-out
    const overlay = document.getElementById('landing-overlay');
    overlay.style.opacity = '1';
    
    setTimeout(() => {
        // Hide solar system
        starSystems.forEach(system => system.group.visible = false);
        
        // Show rover scene
        roverScene.visible = true;
        
        // Generate surface
        createSurfaceEnvironment(currentPlanetData);
        
        // Hide UI elements
        document.getElementById('planetInfoCard').classList.remove('active');
        document.querySelector('.view-toggle').style.display = 'none';
        
        // Add Return Button dynamically
        let btn = document.getElementById('return-orbit-btn');
        if (!btn) {
            btn = document.createElement('button');
            btn.id = 'return-orbit-btn';
            btn.className = 'btn btn-primary';
            btn.style.position = 'fixed';
            btn.style.bottom = '20px';
            btn.style.left = '50%';
            btn.style.transform = 'translateX(-50%)';
            btn.style.zIndex = '1000';
            btn.textContent = 'Return to Orbit';
            btn.onclick = returnToOrbit;
            document.body.appendChild(btn);
        }
        btn.style.display = 'block';

        // Add Driving Instructions dynamically
        let instructions = document.getElementById('rover-instructions');
        if (!instructions) {
            instructions = document.createElement('div');
            instructions.id = 'rover-instructions';
            instructions.style.position = 'fixed';
            instructions.style.bottom = '80px';
            instructions.style.left = '50%';
            instructions.style.transform = 'translateX(-50%)';
            instructions.style.zIndex = '1000';
            instructions.style.color = '#00ff88';
            instructions.style.fontFamily = '"Orbitron", sans-serif';
            instructions.style.fontSize = '1.2rem';
            instructions.style.textShadow = '0 0 10px rgba(0, 255, 136, 0.8)';
            instructions.style.pointerEvents = 'none';
            instructions.innerHTML = 'W: Accelerate | S: Brake/Reverse | A/D: Steer';
            document.body.appendChild(instructions);
        }
        instructions.style.display = 'block';
        
        // Fade back in
        overlay.style.opacity = '0';
    }, 2000); // 2 second white-out
}

function returnToOrbit() {
    if (!isRoverMode) return;
    
    // Trigger White-out
    const overlay = document.getElementById('landing-overlay');
    overlay.style.opacity = '1';
    
    setTimeout(() => {
        isRoverMode = false;
        roverScene.visible = false;
        
        // Reset environment
        scene.background = null;
        scene.fog = new THREE.FogExp2(0x000000, 0.0005);
        
        // Show solar system
        starSystems.forEach(system => system.group.visible = true);
        
        // Reset camera position slightly back from the planet to avoid re-triggering
        if (currentPlanetData && currentPlanetData.planet) {
            const worldPos = new THREE.Vector3();
            currentPlanetData.planet.getWorldPosition(worldPos);
            // Move camera away from the planet towards the center
            const dir = worldPos.clone().normalize().negate();
            camera3D.position.copy(worldPos).add(dir.multiplyScalar(40));
            camera3D.lookAt(0,0,0);
        }
        
        // Show UI elements
        document.querySelector('.view-toggle').style.display = 'flex';
        const btn = document.getElementById('return-orbit-btn');
        if (btn) btn.style.display = 'none';
        
        const instructions = document.getElementById('rover-instructions');
        if (instructions) instructions.style.display = 'none';
        
        // Clear old surface to save memory
        while(roverScene.children.length > 0){ 
            roverScene.remove(roverScene.children[0]); 
        }
        rover = null;
        launchPad = null;
        
        // Fade back in
        overlay.style.opacity = '0';
    }, 2000);
}

// ========================================
// Start
// ========================================

init();
