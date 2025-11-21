// ========================================
// Global Variables & Setup  
// ========================================

let scene, camera, renderer;
let stars;
let wormholes = [];
let currentScene = 'loading';
let isTransitioning = false;

// Flight controls
let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;
let moveUp = false;
let moveDown = false;
let velocity = new THREE.Vector3();
let baseSpeed = 0.3;
let speedBoost = false;
let barrelRoll = 0;

// Mouse look
let mouseX = 0;
let mouseY = 0;
let targetRotationY = 0;
let targetRotationX = 0;

const SCENES = {
    LOADING: 'loading',
    COCKPIT: 'cockpit',
    OPEN_SPACE: 'openSpace',
    WORMHOLE_TRAVEL: 'wormholeTravel'
};

// Placeholder for WORMHOLE_CONFIG, assuming it's defined elsewhere or will be added.
// For the purpose of this edit, we'll assume it's available.
// Example structure:
// const WORMHOLE_CONFIG = [
//     { id: 'site1', position: { x: 100, y: 0, z: -200 }, color: 0xff00ff },
//     { id: 'site2', position: { x: -150, y: 50, z: -300 }, color: 0x00ffff }
// ];


// ========================================
// Initialization
// ========================================

function initScene() {
    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000000, 0.001);

    camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );
    camera.position.set(0, 0, 5);

    renderer = new THREE.WebGLRenderer({
        canvas: document.getElementById('canvas'),
        antialias: true,
        alpha: true
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);

    setupEventListeners();
}

function init() {
    initScene();
    createStarfield();

    // Check if returning from a site
    const urlParams = new URLSearchParams(window.location.search);
    const returningFrom = urlParams.get('from');

    if (returningFrom) {
        // Skip loading and cockpit - go straight to reverse tunnel
        handleReturnFromSite(returningFrom);
    } else {
        // Normal loading sequence
        simulateLoading();
    }

    animate();
}

function handleReturnFromSite(siteId) {
    // Find the wormhole config
    const wormholeConfig = WORMHOLE_CONFIG.find(w => w.id === siteId);
    if (!wormholeConfig) return;

    // Hide loading screen
    document.getElementById('loading-screen').classList.add('hidden');
    document.getElementById('hud').classList.remove('hidden');

    // Set scene to wormhole travel (reverse)
    currentScene = SCENES.WORMHOLE_TRAVEL;

    // Position camera at tunnel center
    camera.position.set(0, 0, 0);
    camera.rotation.set(0, 0, 0);

    // Create reverse tunnel
    createReverseWormholeTunnel(wormholeConfig.color, wormholeConfig);

    // After reverse tunnel animation, return to open space
    setTimeout(() => {
        exitToOpenSpace(wormholeConfig);
    }, 3500);
}

function createReverseWormholeTunnel(color, wormholeConfig) {
    // Clear any existing tunnel segments
    scene.children.filter(child => child.name === 'tunnelSegment' || child.name === 'tunnelParticle').forEach(child => {
        scene.remove(child);
    });

    // Create large tunnel rings starting close
    const segmentCount = 50;
    for (let i = 0; i < segmentCount; i++) {
        const geometry = new THREE.RingGeometry(15, 16, 32);
        const material = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.7,
            side: THREE.DoubleSide
        });

        const ring = new THREE.Mesh(geometry, material);
        ring.position.z = -i * 3 - 10; // Start ahead of camera
        ring.name = 'tunnelSegment';
        scene.add(ring);
    }

    // Add particle streaks
    const particleCount = 200;
    const particlesGeometry = new THREE.BufferGeometry();
    const positions = [];

    for (let i = 0; i < particleCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const radius = 17 + Math.random() * 30;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        const z = Math.random() * -150;
        positions.push(x, y, z);
    }

    particlesGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    const particlesMaterial = new THREE.PointsMaterial({
        color: color,
        size: 0.5,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending
    });

    const particleSystem = new THREE.Points(particlesGeometry, particlesMaterial);
    particleSystem.name = 'tunnelParticle';
    scene.add(particleSystem);

    // Mark as reverse travel
    scene.userData.exitWormhole = wormholeConfig;
}

function animateReverseWormholeTravel() {
    const tunnelSegments = scene.children.filter(child => child.name === 'tunnelSegment');
    const particles = scene.children.filter(child => child.name === 'tunnelParticle');

    // Rings move away from camera (reverse)
    tunnelSegments.forEach((segment) => {
        segment.position.z -= 1.2; // Move backward

        if (segment.position.z < -160) {
            segment.position.z += 156;
        }

        const distance = Math.abs(segment.position.z - camera.position.z);
        segment.material.opacity = Math.max(0.2, 1 - distance / 80);
    });

    // Particles move backward
    particles.forEach((particleSystem) => {
        const positions = particleSystem.geometry.attributes.position.array;
        for (let i = 0; i < positions.length; i += 3) {
            positions[i + 2] -= 2; // Move backward faster

            if (positions[i + 2] < -170) {
                positions[i + 2] += 170;
            }
        }
        particleSystem.geometry.attributes.position.needsUpdate = true;
    });

    // Reverse barrel roll
    camera.rotation.z -= 0.02;

    // Stars spin
    if (stars) {
        stars.rotation.y += 0.01;
    }
}

function exitToOpenSpace(wormholeConfig) {
    // Clean up tunnel
    scene.children.filter(child => child.name === 'tunnelSegment' || child.name === 'tunnelParticle').forEach(child => {
        scene.remove(child);
    });

    // Clear reverse travel marker
    delete scene.userData.exitWormhole;

    // Reset camera rotation
    camera.rotation.set(0, 0, 0);

    // Position camera at the wormhole location
    camera.position.set(
        wormholeConfig.position.x,
        wormholeConfig.position.y,
        wormholeConfig.position.z + 20 // Slightly in front of wormhole
    );

    // Set to open space
    currentScene = SCENES.OPEN_SPACE;

    // Create all wormholes and nebula
    createWormholes();
    createNebula();

    isTransitioning = false;

    // Clear URL parameter so reload shows full loading sequence
    if (window.history.replaceState) {
        window.history.replaceState({}, document.title, window.location.pathname);
    }
}

// ========================================
// Loading Simulation - Fullscreen Terminal
// ========================================

const PHYSICS_EQUATIONS = [
    // Quantum Mechanics
    'iℏ∂ψ/∂t = Ĥψ',
    'ΔxΔp ≥ ℏ/2',
    '[x̂, p̂] = iℏ',
    'Ĥψ = Eψ',
    '⟨ψ|ψ⟩ = 1',
    'ψ(x,t) = Σ cₙφₙ(x)e^(-iEₙt/ℏ)',

    // Relativity
    'E = mc²',
    'E² = (pc)² + (mc²)²',
    'ds² = -c²dt² + dx² + dy² + dz²',
    'Rμν - ½Rgμν + Λgμν = 8πGTμν',
    't\' = γ(t - vx/c²)',
    'L = L₀√(1 - v²/c²)',

    // Electromagnetism
    '∇ × E = -∂B/∂t',
    '∇ · B = 0',
    '∇ × B = μ₀J + μ₀ε₀∂E/∂t',
    '∇ · E = ρ/ε₀',
    'F = q(E + v × B)',

    // Classical Mechanics  
    'F = ma',
    'L = T - V',
    'd/dt(∂L/∂q̇) - ∂L/∂q = 0',
    'H = Σpᵢq̇ᵢ - L',
    'τ = r × F',

    // Rocket/Propulsion
    'Δv = vₑ ln(m₀/mf)',
    'F = ṁvₑ + (pₑ - p₀)Aₑ',
    'Isp = F/(ṁg₀)',
    'a = F/m - g',

    // Thermodynamics
    'dU = δQ - δW',
    'dS ≥ δQ/T',
    'PV = nRT',
    'G = H - TS',

    // Gravity
    'F = Gm₁m₂/r²',
    'g = GM/r²',
    'v = √(GM/r)',
    'T² = (4π²/GM)a³',

    // Wave Mechanics
    'v = fλ',
    '∇²ψ - (1/c²)∂²ψ/∂t² = 0',
    'ω = 2πf',

    // Conservation Laws
    'p = mv',
    'L = r × p',
    'E = K + U',

    // Quantum Field Theory
    'S = ∫d⁴x ℒ',
    '⟨0|φ(x)φ(y)|0⟩ = D(x-y)'
];

function simulateLoading() {
    const terminalOutput = document.getElementById('terminal-output');
    const loadingScreen = document.getElementById('loading-screen');

    // Start Matrix rain
    startMatrixRain();

    let step = 0;

    // Step 1: Show blinking cursor with Matrix rain
    function showCursor() {
        const cursorLine = document.createElement('div');
        cursorLine.className = 'terminal-line prompt';
        cursorLine.innerHTML = '<span class="cursor-block"></span>';
        terminalOutput.appendChild(cursorLine);

        setTimeout(executeScript, 2000); // Let Matrix rain for 2 seconds
    }

    // Step 2: Execute create_world.sh
    function executeScript() {
        terminalOutput.innerHTML = '';

        const promptLine = document.createElement('div');
        promptLine.className = 'terminal-line prompt';
        promptLine.textContent = '$ ./create_world.sh';
        terminalOutput.appendChild(promptLine);

        // Random glitch on command
        if (Math.random() > 0.7) {
            promptLine.classList.add('glitch');
        }

        setTimeout(showEquations, 300);
    }

    // Step 3: Display random physics equations with world creation stages
    function showEquations() {
        const startTime = Date.now();
        const duration = 5000; // 5 seconds

        const stages = [
            { time: 0, message: '> Creating gravitational field...' },
            { time: 1000, message: '> Initializing quantum fields...' },
            { time: 2000, message: '> Modelling uncertainty principles...' },
            { time: 3000, message: '> Generating spacetime manifold...' },
            { time: 4000, message: '> Coupling fundamental forces...' }
        ];

        let currentStage = 0;

        function addRandomEquation() {
            const elapsed = Date.now() - startTime;

            if (elapsed >= duration) {
                completeLoading();
                return;
            }

            // Check if we should display a stage message
            if (currentStage < stages.length && elapsed >= stages[currentStage].time) {
                const stageLine = document.createElement('div');
                stageLine.className = 'terminal-line command';
                stageLine.textContent = stages[currentStage].message;
                terminalOutput.appendChild(stageLine);
                terminalOutput.scrollTop = terminalOutput.scrollHeight;
                currentStage++;
            }

            // Pick random equation
            const equation = PHYSICS_EQUATIONS[Math.floor(Math.random() * PHYSICS_EQUATIONS.length)];

            const eqLine = document.createElement('div');
            eqLine.className = 'terminal-line equation';
            eqLine.textContent = equation;

            // Random glitch effect on some lines
            if (Math.random() > 0.85) {
                eqLine.classList.add('glitch');
                setTimeout(() => eqLine.classList.remove('glitch'), 300);
            }

            terminalOutput.appendChild(eqLine);

            // Auto-scroll
            terminalOutput.scrollTop = terminalOutput.scrollHeight;

            // Random delay between equations (50-150ms for faster scroll)
            const delay = 50 + Math.random() * 100;
            setTimeout(addRandomEquation, delay);
        }

        addRandomEquation();
    }

    // Step 4: Complete and launch
    function completeLoading() {
        const completeLine = document.createElement('div');
        completeLine.className = 'terminal-line command';
        completeLine.textContent = '\n[WORLD INITIALIZED]\n';
        terminalOutput.appendChild(completeLine);

        setTimeout(() => {
            stopMatrixRain();
            loadingScreen.classList.add('hidden');
            showScene(SCENES.COCKPIT);
        }, 500);
    }

    // Start sequence
    showCursor();
}

// ========================================
// Scene Creation Functions
// ========================================

function createStarfield() {
    const starsGeometry = new THREE.BufferGeometry();
    const starsMaterial = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.2,
        transparent: true,
        opacity: 0.8
    });

    const starsVertices = [];
    for (let i = 0; i < 5000; i++) {
        const x = (Math.random() - 0.5) * 400;
        const y = (Math.random() - 0.5) * 400;
        const z = (Math.random() - 0.5) * 400;
        starsVertices.push(x, y, z);
    }

    starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starsVertices, 3));
    stars = new THREE.Points(starsGeometry, starsMaterial);
    stars.name = 'starfield';
    scene.add(stars);
}

function createWormholes() {
    wormholes.forEach(w => scene.remove(w.group));
    wormholes = [];

    // Create wormholes from config
    WORMHOLE_CONFIG.forEach(config => {
        const group = createWormholeGroup(config.color, config.label);
        group.position.set(config.position.x, config.position.y, config.position.z);
        group.name = `${config.id}Wormhole`;
        scene.add(group);

        wormholes.push({
            group: group,
            type: config.id,
            color: config.color,
            destination: config.destination
        });
    });
}

function createWormholeGroup(color, label) {
    const group = new THREE.Group();

    // Main ring
    const ringGeo = new THREE.TorusGeometry(8, 0.8, 16, 100);
    const ringMat = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.7
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.name = 'ring';
    group.add(ring);

    // Glow
    const glowGeo = new THREE.TorusGeometry(8, 1.5, 16, 100);
    const glowMat = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.25,
        blending: THREE.AdditiveBlending
    });
    const glow = new THREE.Mesh(glowGeo, glowMat);
    glow.name = 'glow';
    group.add(glow);

    // Center
    const centerGeo = new THREE.CircleGeometry(7.5, 64);
    const centerMat = new THREE.MeshBasicMaterial({
        color: 0x000000,
        transparent: true,
        opacity: 0.95
    });
    const center = new THREE.Mesh(centerGeo, centerMat);
    center.name = 'center';
    group.add(center);

    // Label
    const labelSprite = createTextLabel(label, color);
    labelSprite.position.y = 12;
    group.add(labelSprite);

    return group;
}

function createTextLabel(text, color) {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = 512;
    canvas.height = 128;

    context.fillStyle = `#${color.toString(16).padStart(6, '0')}`;
    context.font = 'bold 64px Orbitron, sans-serif';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(text, 256, 64);

    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        opacity: 0.9
    });
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(15, 3.5, 1);
    sprite.name = 'label';

    return sprite;
}

function createWormholeTunnel(color) {
    scene.children.filter(child => child.name === 'tunnelSegment' || child.name === 'tunnelParticle').forEach(child => {
        scene.remove(child);
    });

    // Create large tunnel rings (camera will be INSIDE)
    const segmentCount = 50;
    for (let i = 0; i < segmentCount; i++) {
        const geometry = new THREE.RingGeometry(15, 16, 32); // Much larger rings
        const material = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.7,
            side: THREE.DoubleSide
        });

        const ring = new THREE.Mesh(geometry, material);
        ring.position.z = camera.position.z - i * 3 - 10;
        ring.name = 'tunnelSegment';
        scene.add(ring);
    }

    // Add particle streaks outside the tunnel (green lines in space)
    const particleCount = 200;
    const particlesGeometry = new THREE.BufferGeometry();
    const positions = [];

    for (let i = 0; i < particleCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const radius = 17 + Math.random() * 30; // Outside the tunnel
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        const z = Math.random() * -150;
        positions.push(x, y, z);
    }

    particlesGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    const particlesMaterial = new THREE.PointsMaterial({
        color: color,
        size: 0.5,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending
    });

    const particleSystem = new THREE.Points(particlesGeometry, particlesMaterial);
    particleSystem.name = 'tunnelParticle';
    scene.add(particleSystem);
}

// ========================================
// Animation Loop
// ========================================

function animate() {
    requestAnimationFrame(animate);

    if (currentScene === SCENES.OPEN_SPACE) {
        updateFlightControls();
        checkWormholeProximity();
        animateWormholes();
    } else if (currentScene === SCENES.WORMHOLE_TRAVEL) {
        // Check if this is a reverse travel (returning)
        if (scene.userData.exitWormhole) {
            animateReverseWormholeTravel();
        } else {
            animateWormholeTravel();
        }
    }

    renderer.render(scene, camera);
}

function updateFlightControls() {
    // Apply rotation from mouse
    camera.rotation.y = targetRotationY;
    camera.rotation.x = targetRotationX;

    // Apply barrel roll
    if (barrelRoll !== 0) {
        camera.rotation.z += barrelRoll * 0.05;
        barrelRoll *= 0.95;
        if (Math.abs(barrelRoll) < 0.01) barrelRoll = 0;
    }

    // Calculate speed
    const moveSpeed = speedBoost ? baseSpeed * 2 : baseSpeed;

    // Movement
    velocity.set(0, 0, 0);

    if (moveForward) velocity.z -= moveSpeed;
    if (moveBackward) velocity.z += moveSpeed;
    if (moveLeft) velocity.x -= moveSpeed;
    if (moveRight) velocity.x += moveSpeed;
    if (moveUp) velocity.y += moveSpeed;
    if (moveDown) velocity.y -= moveSpeed;

    // Apply movement in camera's local space
    camera.translateX(velocity.x);
    camera.translateY(velocity.y);
    camera.translateZ(velocity.z);

    // Update HUD
    updateHUD();
}

function checkWormholeProximity() {
    wormholes.forEach(wormhole => {
        const distance = camera.position.distanceTo(wormhole.group.position);

        // Check if close enough and moving forward
        if (distance < 25 && moveForward) {
            enterWormhole(wormhole);
        }
    });
}

function animateWormholes() {
    wormholes.forEach((wormhole, index) => {
        wormhole.group.rotation.z += 0.005;

        const scale = 1 + Math.sin(Date.now() * 0.001 + index * Math.PI) * 0.05;
        wormhole.group.scale.set(scale, scale, scale);
    });

    if (stars) {
        stars.rotation.y += 0.0003;
    }
}

function animateWormholeTravel() {
    const tunnelSegments = scene.children.filter(child => child.name === 'tunnelSegment');
    const particles = scene.children.filter(child => child.name === 'tunnelParticle');

    // Animate tunnel rings
    tunnelSegments.forEach((segment) => {
        segment.position.z += 1.2; // Faster movement

        if (segment.position.z > camera.position.z + 15) {
            segment.position.z -= 156;
        }

        const distance = Math.abs(segment.position.z - camera.position.z);
        segment.material.opacity = Math.max(0.2, 1 - distance / 60);
    });

    // Animate particles (green streaks)
    particles.forEach((particleSystem) => {
        const positions = particleSystem.geometry.attributes.position.array;
        for (let i = 0; i < positions.length; i += 3) {
            positions[i + 2] += 2; // Z movement (faster than rings)

            if (positions[i + 2] > camera.position.z + 20) {
                positions[i + 2] -= 170;
            }
        }
        particleSystem.geometry.attributes.position.needsUpdate = true;
    });

    // Barrel roll effect
    camera.rotation.z += 0.02;

    // Stars spin for wormhole effect
    if (stars) {
        stars.rotation.y += 0.01;
    }
}

// ========================================
// Scene Transitions
// ========================================

function showScene(sceneName) {
    currentScene = sceneName;

    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });

    if (sceneName === SCENES.COCKPIT) {
        document.getElementById('entry-screen').classList.add('active');
        document.getElementById('hud').classList.remove('hidden');
    }
}

function startFlight() {
    if (isTransitioning || currentScene !== SCENES.COCKPIT) return;
    isTransitioning = true;
    currentScene = SCENES.OPEN_SPACE;

    document.getElementById('entry-screen').classList.remove('active');

    // Create wormholes in the distance
    setTimeout(() => {
        createWormholes();
        createNebula();
        isTransitioning = false;
    }, 1000);
}

function enterWormhole(wormhole) {
    if (isTransitioning) return;
    isTransitioning = true;
    currentScene = SCENES.WORMHOLE_TRAVEL;

    // Stop all movement
    moveForward = false;
    moveBackward = false;
    moveLeft = false;
    moveRight = false;
    moveUp = false;
    moveDown = false;

    // Remove wormholes
    wormholes.forEach(w => scene.remove(w.group));
    const destination = wormhole.destination;
    const color = wormhole.color;
    wormholes = [];

    // CENTER camera inside tunnel (rings are at origin)
    camera.position.x = 0;
    camera.position.y = 0;
    // Keep current Z position

    // Align camera to look straight ahead down the tunnel
    camera.rotation.set(0, 0, 0);

    // Create tunnel
    createWormholeTunnel(color);

    // Navigate after tunnel
    setTimeout(() => {
        window.location.href = destination;
    }, 3500);
}

// ========================================
// Event Listeners
// ========================================

function setupEventListeners() {
    window.addEventListener('resize', onWindowResize);
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    document.addEventListener('mousemove', onMouseMove);

    // Initialize mobile controls if on mobile device
    if (typeof initMobileControls === 'function') {
        initMobileControls();
    }
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function onMouseMove(event) {
    mouseX = (event.clientX / window.innerWidth) * 2 - 1;
    mouseY = -(event.clientY / window.innerHeight) * 2 + 1;

    // Update rotation targets
    targetRotationY = mouseX * Math.PI * 0.3;
    targetRotationX = mouseY * Math.PI * 0.15;
}

function onKeyDown(event) {
    const key = event.key.toLowerCase();

    // Start flight from cockpit
    if ((key === 'w' || key === 'arrowup') && currentScene === SCENES.COCKPIT) {
        startFlight();
        return;
    }

    // Flight controls
    if (currentScene === SCENES.OPEN_SPACE) {
        switch (key) {
            case 'w':
            case 'arrowup':
                moveForward = true;
                break;
            case 's':
            case 'arrowdown':
                moveBackward = true;
                break;
            case 'a':
            case 'arrowleft':
                moveLeft = true;
                break;
            case 'd':
            case 'arrowright':
                moveRight = true;
                break;
            case ' ':
                event.preventDefault();
                moveUp = true;
                break;
            case 'q':
                barrelRoll = -5; // Roll left
                break;
            case 'e':
                barrelRoll = 5; // Roll right
                break;
        }

        // Shift for speed boost
        if (event.shiftKey) {
            speedBoost = true;
            moveDown = true;
        }
    }
}

function onKeyUp(event) {
    const key = event.key.toLowerCase();

    switch (key) {
        case 'w':
        case 'arrowup':
            moveForward = false;
            break;
        case 's':
        case 'arrowdown':
            moveBackward = false;
            break;
        case 'a':
        case 'arrowleft':
            moveLeft = false;
            break;
        case 'd':
        case 'arrowright':
            moveRight = false;
            break;
        case ' ':
            moveUp = false;
            break;
    }

    // Reset speed boost and down when Shift is released
    if (!event.shiftKey) {
        speedBoost = false;
        moveDown = false;
    }
}

// ========================================
// Initialize on Load
// ========================================

window.addEventListener('DOMContentLoaded', init);
