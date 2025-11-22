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
            name: 'Education',
            position: { x: -200, y: 0, z: -300 },
            starColor: 0x4361ee,
            planets: [
                {
                    name: 'University', orbit: 40, size: 8, color: 0x4361ee, speed: 0.0008, content: {
                        title: 'University Degree',
                        description: 'Bachelor of Science in Computer Science',
                        details: ['GPA: 3.8/4.0', 'ML & Robotics Focus', 'Graduated 2023']
                    }
                },
                {
                    name: 'Courses', orbit: 60, size: 6, color: 0x5a7fd8, speed: 0.0006, content: {
                        title: 'Online Certifications',
                        description: 'Continuous learning through specialized courses',
                        details: ['Deep Learning', 'Advanced Robotics', 'Cloud Architecture']
                    }
                }
            ]
        },
        {
            name: 'Experience',
            position: { x: 200, y: 0, z: -300 },
            starColor: 0xf77f00,
            planets: [
                {
                    name: 'Current Role', orbit: 35, size: 9, color: 0xf77f00, speed: 0.0009, content: {
                        title: 'ML Engineer',
                        description: 'Leading machine learning projects',
                        details: ['Production ML pipelines', 'Computer vision research', 'Team collaboration']
                    }
                },
                {
                    name: 'Previous', orbit: 55, size: 7, color: 0xff9e3d, speed: 0.0007, content: {
                        title: 'Robotics Intern',
                        description: 'Autonomous navigation systems',
                        details: ['ROS development', 'Path planning', 'Sensor fusion']
                    }
                },
                {
                    name: 'Research', orbit: 75, size: 6.5, color: 0xffb366, speed: 0.0005, content: {
                        title: 'Research Assistant',
                        description: 'ML research in academia',
                        details: ['Published 2 papers', 'Computer vision', 'Collaborated with professors']
                    }
                }
            ]
        },
        {
            name: 'Skills',
            position: { x: -200, y: -80, z: -500 },
            starColor: 0x06ffa5,
            planets: [
                {
                    name: 'Programming', orbit: 33, size: 8.5, color: 0x06ffa5, speed: 0.001, content: {
                        title: 'Programming Languages',
                        description: 'Proficient in multiple languages',
                        details: ['Python (Expert)', 'C++ (Advanced)', 'JavaScript']
                    }
                },
                {
                    name: 'ML Frameworks', orbit: 52, size: 7.5, color: 0x2bffc1, speed: 0.0008, content: {
                        title: 'ML Frameworks',
                        description: 'Experience with leading frameworks',
                        details: ['TensorFlow', 'PyTorch', 'Scikit-learn']
                    }
                },
                {
                    name: 'Tools', orbit: 70, size: 6.5, color: 0x50ffcd, speed: 0.0006, content: {
                        title: 'Development Tools',
                        description: 'Various dev tools and platforms',
                        details: ['Git & GitHub', 'Docker', 'AWS/GCP']
                    }
                }
            ]
        },
        {
            name: 'Projects',
            position: { x: 200, y: -80, z: -500 },
            starColor: 0x9d4edd,
            planets: [
                {
                    name: 'AI Assistant', orbit: 38, size: 8, color: 0x9d4edd, speed: 0.00095, content: {
                        title: 'AI Personal Assistant',
                        description: 'Intelligent assistant using NLP',
                        details: ['Natural language processing', 'Context-aware', 'Multi-platform']
                    }
                },
                {
                    name: 'Robot Nav', orbit: 58, size: 7, color: 0xb168e8, speed: 0.00075, content: {
                        title: 'Autonomous Navigation',
                        description: 'Navigation for mobile robots',
                        details: ['SLAM implementation', 'Obstacle avoidance', 'ROS-based']
                    }
                }
            ]
        }
    ];

    systems.forEach(systemData => {
        const system = createSystem(systemData);
        starSystems.push(system);
        scene.add(system.group);
    });
}

function createSystem(data) {
    const group = new THREE.Group();
    group.position.set(data.position.x, data.position.y, data.position.z);
    group.userData.name = data.name;

    // Create central star
    const starGeometry = new THREE.SphereGeometry(12, 32, 32);
    const starMaterial = new THREE.MeshBasicMaterial({
        color: data.starColor,
        emissive: data.starColor,
        emissiveIntensity: 1
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

        planet.position.x = Math.cos(planet.userData.angle) * planetData.orbit;
        planet.position.z = Math.sin(planet.userData.angle) * planetData.orbit;

        group.add(planet);
        systemPlanets.push(planet);
        planets.push(planet);
    });

    return {
        group: group,
        planets: systemPlanets,
        name: data.name
    };
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
            case 'w': controls.forward = true; break;
            case 's': controls.backward = true; break;
            case 'a': controls.left = true; break;
            case 'd': controls.right = true; break;
            case ' ': controls.up = true; e.preventDefault(); break;
            case 'shift': controls.down = true; break;
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

    canvas.addEventListener('wheel', (e) => {
        if (currentView === '2D') {
            e.preventDefault();
            const zoomSpeed = 0.001;
            zoomLevel += e.deltaY * -zoomSpeed;
            zoomLevel = Math.min(Math.max(0.5, zoomLevel), 3); // Clamp zoom

            const aspect = window.innerWidth / window.innerHeight;
            const frustumSize = 600 / zoomLevel;

            camera2D.left = frustumSize * aspect / -2;
            camera2D.right = frustumSize * aspect / 2;
            camera2D.top = frustumSize / 2;
            camera2D.bottom = frustumSize / -2;
            camera2D.updateProjectionMatrix();
        }
    });

    // Mouse click to select planet
    canvas.addEventListener('click', onCanvasClick);

    // Close panel
    document.getElementById('closeBtn').addEventListener('click', () => {
        document.getElementById('planetPanel').classList.remove('active');
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

    const intersects = raycaster.intersectObjects(planets, true);

    if (intersects.length > 0) {
        let selectedPlanet = intersects[0].object;
        while (selectedPlanet.parent && !selectedPlanet.userData.content) {
            selectedPlanet = selectedPlanet.parent;
        }

        if (selectedPlanet.userData.content) {
            showPlanetInfo(selectedPlanet);
        }
    }
}

function showPlanetInfo(planet) {
    const content = planet.userData.content;

    document.getElementById('planetTitle').textContent = content.title;

    const contentHTML = `
        <p>${content.description}</p>
        <h3>Details</h3>
        <ul>
            ${content.details.map(detail => `<li>${detail}</li>`).join('')}
        </ul>
    `;

    document.getElementById('planetContent').innerHTML = contentHTML;
    document.getElementById('planetPanel').classList.add('active');
}

// ========================================
// Start
// ========================================

init();
