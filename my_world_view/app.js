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

// ========================================
// Initialization
// ========================================

function init() {
    // Scene
    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000000, 0.0005);

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
            name: 'Experience',
            position: { x: 0, y: 0, z: 0 }, // Center system
            starColor: 0xf77f00,
            hasPath: true, // Enable sequential path for this system
            planets: [
                {
                    name: 'Quantiphi', orbit: 30, size: 6, color: 0xff9e3d, speed: 0.0012, sequence: 1, content: {
                        title: 'Machine Learning Engineer',
                        description: 'Quantiphi (May 2019 - Feb 2021)',
                        details: ['CV solutions for safety monitoring', 'Document classification with Transformers', 'Federated Learning exploration']
                    }
                },
                {
                    name: 'New Space', orbit: 45, size: 6.5, color: 0xffb366, speed: 0.0010, sequence: 2, content: {
                        title: 'ML Engineer II',
                        description: 'New Space Research (Feb 2021 - Jul 2021)',
                        details: ['Deep learning for autonomous navigation', 'Jetson NX optimization', 'TensorRT & Deepstream']
                    }
                },
                {
                    name: 'Tiger Analytics', orbit: 60, size: 7, color: 0xf77f00, speed: 0.0009, sequence: 3, content: {
                        title: 'Machine Learning Engineer',
                        description: 'Tiger Analytics (Jan 2022 - Jul 2023)',
                        details: ['Scalable MLOps on AWS/GCP', 'Unified data science platforms', '75% reduction in deployment time']
                    }
                },
                {
                    name: 'WPI Perception', orbit: 75, size: 6, color: 0xffcc80, speed: 0.0008, sequence: 4, content: {
                        title: 'Graduate Researcher',
                        description: 'WPI Perception Group (Aug 2023 - Feb 2024)',
                        details: ['Optical flow for quadrotors', 'Real-time CV algorithms', 'Autonomous navigation']
                    }
                },
                {
                    name: 'J&J', orbit: 90, size: 7.5, color: 0xff6b6b, speed: 0.0007, sequence: 5, content: {
                        title: 'SDS Intern - LLMs',
                        description: 'Johnson & Johnson (Jun 2024 - Sep 2024)',
                        details: ['LLM pipelines for clinical data', 'Scalable NLP solutions', 'Healthcare data compliance']
                    }
                },
                {
                    name: 'WPI ELPIS', orbit: 105, size: 6.5, color: 0xffab91, speed: 0.0006, sequence: 6, content: {
                        title: 'Graduate Researcher',
                        description: 'ELPIS Lab (Jan 2024 - May 2025)',
                        details: ['Robot grasping & manipulation', 'Reinforcement Learning', 'End-to-end robotics algorithms']
                    }
                },
                {
                    name: 'webAI', orbit: 120, size: 9, color: 0xff5722, speed: 0.0005, sequence: 7, content: {
                        title: 'Senior ML Engineer',
                        description: 'webAI (May 2025 - Dec 2025)',
                        details: ['Production ML pipelines', 'Scaling intelligent applications', 'Computer Vision research']
                    }
                },
                {
                    name: 'Tiger Analytics (Sr. MLE)', orbit: 135, size: 9.5, color: 0xe65100, speed: 0.0004, sequence: 8, content: {
                        title: 'Senior Machine Learning Engineer',
                        description: 'Tiger Analytics (Dec 2025 - Present)',
                        details: ['Leading ML engineering & MLOps development', 'Building LLM Agents, RAGs, and Digital Twins', 'Scaling production ML solutions']
                    }
                }
            ]
        },
        {
            name: 'Skills',
            position: { x: -250, y: 50, z: -200 },
            starColor: 0x06ffa5,
            planets: [
                {
                    name: 'AI & ML', orbit: 40, size: 8.5, color: 0x06ffa5, speed: 0.001, content: {
                        title: 'AI & Machine Learning',
                        description: 'Core expertise',
                        details: ['Deep Learning', 'Computer Vision', 'TensorFlow & PyTorch', 'Reinforcement Learning']
                    }
                },
                {
                    name: 'Programming', orbit: 60, size: 7.5, color: 0x2bffc1, speed: 0.0008, content: {
                        title: 'Programming',
                        description: 'Languages & Logic',
                        details: ['Python (Expert)', 'C++ (Advanced)', 'JavaScript', 'SQL']
                    }
                },
                {
                    name: 'Cloud & Ops', orbit: 80, size: 6.5, color: 0x50ffcd, speed: 0.0006, content: {
                        title: 'Cloud & MLOps',
                        description: 'Infrastructure & Deployment',
                        details: ['AWS & GCP', 'Docker & Kubernetes', 'Edge Computing (Jetson)', 'CI/CD']
                    }
                }
            ]
        },
        {
            name: 'Projects',
            position: { x: 250, y: -50, z: -200 },
            starColor: 0x9d4edd,
            planets: [
                {
                    name: 'MinNav', orbit: 35, size: 7.5, color: 0x9d4edd, speed: 0.0010, content: {
                        title: 'MinNav',
                        description: 'Accepted ICRA 2026 / Submitted IEEE RAL',
                        details: ['Optical flow navigation for tiny drones', 'Complex cluttered indoor navigation', 'Integrated on low-power edge platforms']
                    }
                },
                {
                    name: 'Robot Grasping', orbit: 50, size: 8, color: 0xae70ed, speed: 0.0008, content: {
                        title: 'Robot Grasping & Manipulation',
                        description: 'ELPIS Lab Research (WPI)',
                        details: ['End-to-end reinforcement learning', 'UR10 pick-and-place', 'Language-grounded vision models']
                    }
                },
                {
                    name: 'RIGGU V2', orbit: 65, size: 7, color: 0xbe82f0, speed: 0.0007, content: {
                        title: 'RIGGU V2 Semi-Humanoid',
                        description: 'Interactive Robotics Platform',
                        details: ['ROS & SLAM navigation framework', 'AI and Natural Language Processing integration', 'Mechanical fabrication and hardware tuning']
                    }
                },
                {
                    name: 'Indoor Nav', orbit: 80, size: 6.5, color: 0xce95f2, speed: 0.0006, content: {
                        title: 'Indoor Robot Navigation',
                        description: 'Embodied Agent Motion Planning',
                        details: ['A* & RRT traditional planners comparison', 'End-to-end Reinforcement Learning approaches', 'Embodied navigation in simulated environments']
                    }
                },
                {
                    name: '3R Manipulator', orbit: 95, size: 6, color: 0xdea8f5, speed: 0.0005, content: {
                        title: '3R Link Manipulator Dynamics',
                        description: 'Robot Kinematics & Manipulation',
                        details: ['Kinematic and dynamic modeling', 'Workspace trajectory control', 'MATLAB/Python numerical simulations']
                    }
                },
                {
                    name: 'Alien Catcher', orbit: 110, size: 6, color: 0xeebbf7, speed: 0.0004, content: {
                        title: 'Alien Catcher UAV Control',
                        description: 'LQR Quadrotor Guidance',
                        details: ['Linear Quadratic Regulator control strategy', 'Autonomous UAV intercept & capture', 'Dynamic simulation in 3D physics engine']
                    }
                }
            ]
        },
        {
            name: 'Education',
            position: { x: 0, y: -150, z: -400 },
            starColor: 0x4361ee,
            planets: [
                {
                    name: 'WPI', orbit: 40, size: 8, color: 0x4361ee, speed: 0.0010, content: {
                        title: 'Worcester Polytechnic Institute (WPI)',
                        description: 'MS in Robotics Engineering (Aug 2023 - May 2025)',
                        details: ['GPA: 4.0/4.0', 'Focus: Robot Control, Dynamics, Motion Planning, Swarm Robotics', 'Thesis: MonoEye (Monocular Visual Odometry on Edge)']
                    }
                },
                {
                    name: 'IGNOU', orbit: 60, size: 7, color: 0x5371f0, speed: 0.0008, content: {
                        title: 'Indira Gandhi National Open University (IGNOU)',
                        description: 'Master of Arts in Philosophy (Oct 2020 - Dec 2022)',
                        details: ['Part-time distance Master\'s degree', 'Focus: Epistemology, Logic, Ethics, Philosophy of Mind', 'Enhanced critical thinking and analytical modeling skills']
                    }
                },
                {
                    name: 'Hyderabad University', orbit: 80, size: 7, color: 0x6381f2, speed: 0.0006, content: {
                        title: 'Central University of Hyderabad',
                        description: 'Post Graduate Diploma in AI (Feb 2021 - Mar 2022)',
                        details: ['Online diploma in collaboration with Applied Roots', 'Focus: Machine Learning, Deep Learning, CV, NLP', 'Minor Thesis: Multi-class classification on Cdiscount dataset']
                    }
                },
                {
                    name: 'Undergrad (NIT Calicut)', orbit: 100, size: 6.5, color: 0x7391f5, speed: 0.0004, content: {
                        title: 'NIT Calicut',
                        description: 'B.Tech in Mechanical Engineering (Jun 2015 - May 2019)',
                        details: ['Core: Dynamics, Robotics, Control Systems, Thermal/Fluid Dynamics', 'Robotics Interest Group Club Lead', 'Honors / Best Project Award']
                    }
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
    `;

    document.getElementById('cardContent').innerHTML = contentHTML;
    document.getElementById('planetInfoCard').classList.add('active');
}

// ========================================
// Start
// ========================================

init();
