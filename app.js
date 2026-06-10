// ========================================
// Global Variables & Setup  
// ========================================

let scene, camera, renderer, composer;
let starLayers = { near: null, mid: null, far: null };
let wormholes = [];
let lastWormholeUpdateTime = Date.now() * 0.001;
let currentScene = 'loading';
let isTransitioning = false;
let lastWormholeExitTime = 0;
let cockpitVisible = true;

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

// Mouse look and steering
let mouseX = 0;
let mouseY = 0;
let targetRotationY = 0;
let targetRotationX = 0;
let steeringMode = 'cone'; // 'free' (360° virtual joystick steer) or 'cone' (original direct clamped look-around)

// Autopilot state
let autopilotActive = false;
let autopilotTarget = null;

// Space Environment & Console state
let spaceCrystals = [];
let warpLinesGroup = null;
let warpActive = false;
let warpSpeedFactor = 0;
let isConsoleTyping = false;
let shieldEnergy = 100.0;
let cameraShakeAmount = 0.0;

// Sound Synthesizer & Co-Pilot voice state
let audioCtx = null;
let soundEnabled = false;
let engineOsc = null;
let engineFilter = null;
let engineGain = null;
let warpOsc = null;
let warpNoiseNode = null;
let warpGainNode = null;
let warpNoiseGain = null;
let lastIsWarping = false;

// Upgraded Flight Systems state
let powerMode = 'systems'; // 'systems', 'engines', 'shields'
let hudReticle = null; // 3D target locking ring
let crystalDebris = []; // particle shards from shatters
let energyMatrixes = []; // harvestable energy cores
let supernovaActive = false; // solar flare trigger state
let supernovaTime = 0; // solar flare timer

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
    camera.rotation.order = 'YXZ';
    scene.add(camera);

    renderer = new THREE.WebGLRenderer({
        canvas: document.getElementById('canvas'),
        antialias: true,
        alpha: true
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);

    // Setup post-processing with bloom
    composer = new THREE.EffectComposer(renderer);
    const renderPass = new THREE.RenderPass(scene, camera);
    composer.addPass(renderPass);

    // Bloom pass for glowing wormholes and particles
    const bloomPass = new THREE.UnrealBloomPass(
        new THREE.Vector2(window.innerWidth, window.innerHeight),
        1.5,  // strength - intensity of glow
        0.4,  // radius - how far glow spreads
        0.85  // threshold - only bright objects glow
    );
    composer.addPass(bloomPass);

    // Build 3D target lock-on reticle ring
    const reticleGeo = new THREE.RingGeometry(8, 8.8, 32);
    const reticleMat = new THREE.MeshBasicMaterial({
        color: 0xffaa00,
        transparent: true,
        opacity: 0,
        depthTest: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide
    });
    hudReticle = new THREE.Mesh(reticleGeo, reticleMat);
    hudReticle.visible = false;
    scene.add(hudReticle);

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
    targetRotationY = 0;
    targetRotationX = 0;

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

    // Parallax stars spin at different speeds
    if (starLayers.near) starLayers.near.rotation.y += 0.001;
    if (starLayers.mid) starLayers.mid.rotation.y += 0.0005;
    if (starLayers.far) starLayers.far.rotation.y += 0.0002;
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
    targetRotationY = 0;
    targetRotationX = 0;

    // Position camera at the wormhole location
    camera.position.set(
        wormholeConfig.position.x,
        wormholeConfig.position.y,
        wormholeConfig.position.z + 20 // Slightly in front of wormhole
    );

    // Set to open space
    currentScene = SCENES.OPEN_SPACE;
    lastWormholeExitTime = Date.now();

    // Create all space objects
    createWormholes();
    createNebula();
    createSpaceCrystals();
    createWarpLines();

    isTransitioning = false;
    showCockpitBezel();

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

        // Create a circular progress indicator in bottom right
        const progressContainer = document.createElement('div');
        progressContainer.style.position = 'fixed';
        progressContainer.style.bottom = '30px';
        progressContainer.style.right = '30px';
        progressContainer.style.width = '80px';
        progressContainer.style.height = '80px';
        progressContainer.style.zIndex = '100';
        progressContainer.style.display = 'flex';
        progressContainer.style.alignItems = 'center';
        progressContainer.style.justifyContent = 'center';

        // SVG Circle for progress
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', '80');
        svg.setAttribute('height', '80');
        svg.style.transform = 'rotate(-90deg)'; // Start from top

        const circleBg = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circleBg.setAttribute('cx', '40');
        circleBg.setAttribute('cy', '40');
        circleBg.setAttribute('r', '36');
        circleBg.setAttribute('stroke', '#003300');
        circleBg.setAttribute('stroke-width', '4');
        circleBg.setAttribute('fill', 'none');

        const circleProgress = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circleProgress.setAttribute('cx', '40');
        circleProgress.setAttribute('cy', '40');
        circleProgress.setAttribute('r', '36');
        circleProgress.setAttribute('stroke', '#00ff00');
        circleProgress.setAttribute('stroke-width', '4');
        circleProgress.setAttribute('fill', 'none');
        circleProgress.setAttribute('stroke-dasharray', '226'); // 2 * pi * 36
        circleProgress.setAttribute('stroke-dashoffset', '226');
        circleProgress.style.transition = 'stroke-dashoffset 0.1s linear';

        svg.appendChild(circleBg);
        svg.appendChild(circleProgress);

        // Text for percentage
        const text = document.createElement('div');
        text.style.position = 'absolute';
        text.style.color = '#00ff00';
        text.style.fontFamily = "'Courier New', monospace";
        text.style.fontWeight = 'bold';
        text.style.fontSize = '16px';
        text.textContent = '0%';

        progressContainer.appendChild(svg);
        progressContainer.appendChild(text);
        terminalOutput.appendChild(progressContainer);

        function updateProgress(percent) {
            // Update circle
            const circumference = 226;
            const offset = circumference - (percent / 100) * circumference;
            circleProgress.setAttribute('stroke-dashoffset', offset);

            // Update text
            text.textContent = `${percent}%`;
        }

        function addRandomEquation() {
            const elapsed = Date.now() - startTime;
            const percent = Math.min(100, Math.floor((elapsed / duration) * 100));

            updateProgress(percent);

            if (elapsed >= duration) {
                progressContainer.remove(); // Remove progress circle when done
                completeLoading();
                return;
            }

            // Check if we should display a stage message
            if (currentStage < stages.length && elapsed >= stages[currentStage].time) {
                const stageLine = document.createElement('div');
                stageLine.className = 'terminal-line command';
                stageLine.textContent = stages[currentStage].message;
                // Insert before progress container (though it's fixed, so order in DOM matters less for visual, but good for structure)
                terminalOutput.appendChild(stageLine);
                terminalOutput.scrollTop = terminalOutput.scrollHeight;
                currentStage++;
            }

            // Randomly show system messages (errors, warnings, successes)
            if (Math.random() > 0.92) {
                const systemMessages = [
                    { type: 'error', text: '[ERROR] Wormhole instability detected - stabilizing...' },
                    { type: 'warning', text: '[WARNING] Anomaly detected in sector 7' },
                    { type: 'success', text: '[OK] Quantum entanglement stable' },
                    { type: 'error', text: '[FAIL] Timeline convergence error - retrying...' },
                    { type: 'warning', text: '[WARNING] Dark matter fluctuation: 12.4%' },
                    { type: 'success', text: '[OK] Gravitational waves normalized' },
                    { type: 'error', text: '[EXCEPTION] Paradox detected - resolving...' },
                    { type: 'warning', text: '[WARNING] Temporal drift: +0.003s' },
                    { type: 'success', text: '[OK] Spacetime fabric integrity: 99.7%' },
                    { type: 'error', text: '[ERROR] Reality.matrix overflow - handled' },
                    { type: 'warning', text: '[WARNING] Unknown signal from deep space' },
                    { type: 'success', text: '[OK] Dimensional barriers stable' }
                ];

                const msg = systemMessages[Math.floor(Math.random() * systemMessages.length)];
                const msgLine = document.createElement('div');
                msgLine.className = `terminal-line ${msg.type}`;
                msgLine.textContent = msg.text;
                terminalOutput.appendChild(msgLine);
                terminalOutput.scrollTop = terminalOutput.scrollHeight;
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
    // Create three layers of stars for parallax depth effect

    // Near layer - large, blue-tinted, fast-moving
    const nearGeometry = new THREE.BufferGeometry();
    const nearVertices = [];
    for (let i = 0; i < 1000; i++) {
        const x = (Math.random() - 0.5) * 400;
        const y = (Math.random() - 0.5) * 400;
        const z = (Math.random() - 0.5) * 200;
        nearVertices.push(x, y, z);
    }
    nearGeometry.setAttribute('position', new THREE.Float32BufferAttribute(nearVertices, 3));
    const nearMaterial = new THREE.PointsMaterial({
        color: 0xadd8ff, // Slight blue tint
        size: 0.4,
        transparent: true,
        opacity: 0.9
    });
    starLayers.near = new THREE.Points(nearGeometry, nearMaterial);
    starLayers.near.name = 'starfield-near';
    scene.add(starLayers.near);

    // Mid layer - medium, white, moderate speed
    const midGeometry = new THREE.BufferGeometry();
    const midVertices = [];
    for (let i = 0; i < 2000; i++) {
        const x = (Math.random() - 0.5) * 600;
        const y = (Math.random() - 0.5) * 600;
        const z = (Math.random() - 0.5) * 400;
        midVertices.push(x, y, z);
    }
    midGeometry.setAttribute('position', new THREE.Float32BufferAttribute(midVertices, 3));
    const midMaterial = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.25,
        transparent: true,
        opacity: 0.85
    });
    starLayers.mid = new THREE.Points(midGeometry, midMaterial);
    starLayers.mid.name = 'starfield-mid';
    scene.add(starLayers.mid);

    // Far layer - small, red-tinted, slow-moving
    const farGeometry = new THREE.BufferGeometry();
    const farVertices = [];
    for (let i = 0; i < 2000; i++) {
        const x = (Math.random() - 0.5) * 800;
        const y = (Math.random() - 0.5) * 800;
        const z = (Math.random() - 0.5) * 600;
        farVertices.push(x, y, z);
    }
    farGeometry.setAttribute('position', new THREE.Float32BufferAttribute(farVertices, 3));
    const farMaterial = new THREE.PointsMaterial({
        color: 0xffd4aa, // Slight red tint
        size: 0.15,
        transparent: true,
        opacity: 0.7
    });
    starLayers.far = new THREE.Points(farGeometry, farMaterial);
    starLayers.far.name = 'starfield-far';
    scene.add(starLayers.far);
}

function createSpaceCrystals() {
    // Colors matching the wormholes
    const colors = [0x00ff88, 0x06ffa5, 0xff6b35, 0x4cc9f0, 0x9d4edd];
    const numCrystals = 45;
    
    for (let i = 0; i < numCrystals; i++) {
        const size = Math.random() * 2 + 1; // 1 to 3 units
        const color = colors[i % colors.length];
        
        // Low poly dodecahedron
        const geometry = new THREE.DodecahedronGeometry(size, 0);
        
        // Deform vertices slightly to make organic crystals
        const posAttr = geometry.attributes.position;
        for (let j = 0; j < posAttr.count; j++) {
            const x = posAttr.getX(j);
            const y = posAttr.getY(j);
            const z = posAttr.getZ(j);
            const factor = 0.82 + Math.random() * 0.36; // 82% to 118% size
            posAttr.setXYZ(j, x * factor, y * factor, z * factor);
        }
        geometry.computeVertexNormals();
        
        const material = new THREE.MeshStandardMaterial({
            color: color,
            roughness: 0.15,
            metalness: 0.85,
            flatShading: true,
            transparent: true,
            opacity: 0.65,
            emissive: color,
            emissiveIntensity: 0.22,
            blending: THREE.AdditiveBlending
        });
        
        const crystal = new THREE.Mesh(geometry, material);
        
        // Scatter around flight corridor
        crystal.position.set(
            (Math.random() - 0.5) * 360,
            (Math.random() - 0.5) * 220,
            -Math.random() * 320 + 20
        );
        
        // Spin speed & drift speed
        crystal.userData = {
            rotX: (Math.random() - 0.5) * 0.016,
            rotY: (Math.random() - 0.5) * 0.016,
            rotZ: (Math.random() - 0.5) * 0.016,
            drift: new THREE.Vector3(
                (Math.random() - 0.5) * 0.04,
                (Math.random() - 0.5) * 0.04,
                (Math.random() - 0.5) * 0.04
            ),
            originalColor: color,
            size: size
        };
        
        scene.add(crystal);
        spaceCrystals.push(crystal);
    }
}

function animateSpaceCrystals() {
    spaceCrystals.forEach(crystal => {
        crystal.rotation.x += crystal.userData.rotX;
        crystal.rotation.y += crystal.userData.rotY;
        crystal.rotation.z += crystal.userData.rotZ;
        
        crystal.position.add(crystal.userData.drift);
        
        // Keep them bounded
        if (Math.abs(crystal.position.x) > 180) crystal.userData.drift.x *= -1;
        if (Math.abs(crystal.position.y) > 110) crystal.userData.drift.y *= -1;
        if (crystal.position.z < -340 || crystal.position.z > 40) crystal.userData.drift.z *= -1;

        // Proximity Collision check
        if (!crystal.userData.collided && currentScene === SCENES.OPEN_SPACE) {
            const distance = camera.position.distanceTo(crystal.position);
            // Threshold based on crystal size plus approximate ship size (3.5)
            const threshold = (crystal.userData.size || 2) + 3.5;
            if (distance < threshold) {
                triggerCrystalCollision(crystal);
            }
        }
    });
}

function updateShieldUI() {
    const shieldValEl = document.getElementById('cp-shield-val');
    const shieldBarEl = document.getElementById('cp-shield-bar');
    if (shieldValEl) {
        shieldValEl.textContent = `${Math.round(shieldEnergy)}%`;
        shieldValEl.className = 'pv';
        if (shieldEnergy > 50) {
            shieldValEl.classList.add('ok');
        } else if (shieldEnergy > 20) {
            shieldValEl.classList.add('warn');
        } else {
            shieldValEl.classList.add('alert');
        }
    }
    if (shieldBarEl) {
        shieldBarEl.style.width = `${shieldEnergy}%`;
        if (shieldEnergy > 50) {
            shieldBarEl.style.backgroundColor = '#00ff88';
            shieldBarEl.style.boxShadow = '0 0 6px rgba(0, 255, 136, 0.7)';
        } else if (shieldEnergy > 20) {
            shieldBarEl.style.backgroundColor = '#ffaa00';
            shieldBarEl.style.boxShadow = '0 0 6px rgba(255, 170, 0, 0.7)';
        } else {
            shieldBarEl.style.backgroundColor = '#ff3333';
            shieldBarEl.style.boxShadow = '0 0 6px rgba(255, 51, 51, 0.7)';
        }
    }
}

function triggerCrystalCollision(crystal) {
    crystal.userData.collided = true;
    setTimeout(() => {
        crystal.userData.collided = false;
    }, 5000);

    // Play synthesized collision impact sound
    playExplosionSound();

    // Trigger Camera Shake Amount
    cameraShakeAmount = 0.45;

    // Apply shield damage (15% to 30% random)
    const damage = 15 + Math.random() * 15;
    shieldEnergy = Math.max(0, shieldEnergy - damage);
    updateShieldUI();

    // Alert via HUD warning
    showNavAlert("WARNING: COLLISION DETECTED", "SHIELD ENVELOPE DAMPENING IMPACT", 3000);
    
    // Vocal warning announcements
    speakCoPilot(`Alert! Crystal collision detected. Shields reduced to ${Math.round(shieldEnergy)} percent.`);

    // System diagnostic write to Console
    const cpX = camera.position.x.toFixed(2);
    const cpY = camera.position.y.toFixed(2);
    const cpZ = camera.position.z.toFixed(2);
    writeToConsole(`[WARNING] METEOR COLLISION AT SECTOR (${cpX}, ${cpY}, ${cpZ})`);
    writeToConsole(`SHIELD ENERGY ATTENUATED: ${shieldEnergy.toFixed(1)}%`);

    // Temporary emissive intensity increase and flash red
    if (crystal.material) {
        const originalIntensity = crystal.material.emissiveIntensity || 0.22;
        const originalColor = crystal.userData.originalColor || 0x00ff88;
        
        crystal.material.emissiveIntensity = 2.5;
        crystal.material.color.setHex(0xff3333); // flash red
        
        setTimeout(() => {
            if (crystal.material) {
                crystal.material.emissiveIntensity = originalIntensity;
                crystal.material.color.setHex(originalColor);
            }
        }, 400);
    }
}

function createWarpLines() {
    warpLinesGroup = new THREE.Group();
    warpLinesGroup.name = 'warp-lines';
    
    const colors = [0x00ff88, 0x00d9ff, 0x9d4edd];
    const numLines = 250;
    
    for (let i = 0; i < numLines; i++) {
        const length = Math.random() * 25 + 15;
        const color = colors[i % colors.length];
        
        const geometry = new THREE.BufferGeometry();
        const vertices = new Float32Array([
            0, 0, 0,
            0, 0, -length
        ]);
        geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
        
        const material = new THREE.LineBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0, // start invisible, will slerp in when warp active
            blending: THREE.AdditiveBlending
        });
        
        const line = new THREE.Line(geometry, material);
        
        // Scatter lines throughout space
        line.position.set(
            (Math.random() - 0.5) * 400,
            (Math.random() - 0.5) * 400,
            (Math.random() - 0.5) * 400
        );
        
        warpLinesGroup.add(line);
    }
    
    camera.add(warpLinesGroup);
}

function animateWarpLines() {
    if (!warpLinesGroup) return;
    
    // Check warp state
    // Autopilot or shiftKey forces warp drive active
    const isWarping = warpActive || (currentScene === SCENES.OPEN_SPACE && autopilotActive) || (currentScene === SCENES.OPEN_SPACE && speedBoost);
    
    const targetWarpOpacity = isWarping ? 0.75 : 0;
    const targetStarOpacity = isWarping ? 0.05 : 0.85;
    
    // Fade stars in/out
    if (starLayers.near) starLayers.near.material.opacity = THREE.MathUtils.lerp(starLayers.near.material.opacity, targetStarOpacity, 0.06);
    if (starLayers.mid) starLayers.mid.material.opacity = THREE.MathUtils.lerp(starLayers.mid.material.opacity, targetStarOpacity, 0.06);
    if (starLayers.far) starLayers.far.material.opacity = THREE.MathUtils.lerp(starLayers.far.material.opacity, targetStarOpacity, 0.06);
    
    // Accelerate/Decelerate warp line velocity
    const targetWarpSpeed = isWarping ? 20 : 0;
    warpSpeedFactor = THREE.MathUtils.lerp(warpSpeedFactor, targetWarpSpeed, 0.05);
    
    // Trigger warp sound transitions and TTS announcements
    if (isWarping !== lastIsWarping) {
        playWarpSpoolSound(isWarping);
        if (isWarping) {
            speakCoPilot("Hyperdrive engaged. Entering warp speeds.");
        } else {
            speakCoPilot("Hyperdrive disengaged.");
        }
        lastIsWarping = isWarping;
    }
    
    // Align warp lines group rotation with travel direction
    let travelSpeed = 0;
    const targetLookAt = new THREE.Vector3(0, 0, 1);
    if (autopilotActive && autopilotTarget) {
        travelSpeed = baseSpeed * 1.5;
        targetLookAt.set(0, 0, 1);
    } else {
        const velSpeedSq = velocity.lengthSq();
        if (velSpeedSq > 0.0001) {
            travelSpeed = velocity.length();
            targetLookAt.copy(velocity).multiplyScalar(-1).normalize();
        }
    }
    
    const targetQuat = new THREE.Quaternion();
    targetQuat.setFromUnitVectors(new THREE.Vector3(0, 0, 1), targetLookAt);
    warpLinesGroup.quaternion.slerp(targetQuat, 0.1);
    
    warpLinesGroup.children.forEach(line => {
        line.material.opacity = THREE.MathUtils.lerp(line.material.opacity, targetWarpOpacity, 0.06);
        
        // Fly forward along Z local
        line.position.z += (warpSpeedFactor + travelSpeed);
        
        // Wrap back around if passing cockpit view
        if (line.position.z > 40) {
            line.position.z = -360;
            line.position.x = (Math.random() - 0.5) * 400;
            line.position.y = (Math.random() - 0.5) * 400;
        }
    });
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
            destination: config.destination,
            config: config,
            particleTime: 0.0
        });
    });
}

// ========================================
// Helper Functions for Enhanced Wormhole
// ========================================

function createSpacetimeGrid(color) {
    const gridGroup = new THREE.Group();

    // Create circular concentric rings that fade out radially
    const numRings = 25;
    const maxRadius = 50;

    for (let i = 0; i < numRings; i++) {
        const radius = (i / numRings) * maxRadius;
        const ringGeometry = new THREE.RingGeometry(radius, radius + 0.3, 64);

        // Calculate opacity - stronger at center, fades to edges
        const normalizedDistance = i / numRings;
        const opacity = 0.15 * Math.pow(1 - normalizedDistance, 2); // Quadratic fade

        const ringMaterial = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: Math.max(0.01, opacity), // Minimum 0.01 for visibility
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending
        });

        // Create top ring
        const topRing = new THREE.Mesh(ringGeometry, ringMaterial.clone());
        topRing.rotation.x = Math.PI / 2;
        topRing.position.y = 5; // Slightly above center
        gridGroup.add(topRing);

        // Create bottom ring
        const bottomRing = new THREE.Mesh(ringGeometry, ringMaterial.clone());
        bottomRing.rotation.x = -Math.PI / 2;
        bottomRing.position.y = -5; // Slightly below center
        gridGroup.add(bottomRing);
    }

    gridGroup.name = 'spacetimeGrid';
    return gridGroup;
}

function createEnergyRings(color) {
    const ringsGroup = new THREE.Group();
    const numRings = 5;

    for (let i = 0; i < numRings; i++) {
        const radius = 6 + i * 2.5;
        const thickness = 0.3 - i * 0.03;
        const opacity = 0.9 - i * 0.15;

        const ringGeometry = new THREE.TorusGeometry(radius, thickness, 16, 100);
        const ringMaterial = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: opacity,
            blending: THREE.AdditiveBlending
        });

        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.name = `energyRing_${i}`;
        ring.userData.rotationSpeed = 0.01 - i * 0.002; // Slower for outer rings
        ringsGroup.add(ring);
    }

    ringsGroup.name = 'energyRings';
    return ringsGroup;
}

function createWormholeThroat(color) {
    // Create hourglass/funnel shape using LatheGeometry
    const points = [];
    const segments = 25;

    for (let i = 0; i < segments; i++) {
        const t = i / (segments - 1);
        const angle = t * Math.PI;

        // Hourglass curve: wide at ends, narrow in middle
        const radius = 4 + Math.sin(angle) * 6;
        const y = (t - 0.5) * 35;

        points.push(new THREE.Vector2(radius, y));
    }

    const throatGeometry = new THREE.LatheGeometry(points, 32);
    const throatMaterial = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.15,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending
    });

    const throat = new THREE.Mesh(throatGeometry, throatMaterial);
    throat.rotation.x = Math.PI / 2;
    throat.name = 'throat';

    return throat;
}

function createEventHorizon() {
    // Black sphere at center
    const horizonGeometry = new THREE.SphereGeometry(3.5, 32, 32);
    const horizonMaterial = new THREE.MeshBasicMaterial({
        color: 0x000000,
        transparent: true,
        opacity: 0.98
    });

    const horizon = new THREE.Mesh(horizonGeometry, horizonMaterial);
    horizon.name = 'eventHorizon';

    return horizon;
}

function createLightRays(color) {
    const raysGroup = new THREE.Group();
    const numRays = 16;

    for (let i = 0; i < numRays; i++) {
        const angle = (i / numRays) * Math.PI * 2;

        // Create cone for light ray
        const rayGeometry = new THREE.ConeGeometry(0.3, 25, 4);
        const rayMaterial = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.08,
            blending: THREE.AdditiveBlending
        });

        const ray = new THREE.Mesh(rayGeometry, rayMaterial);
        ray.rotation.x = Math.PI / 2;
        ray.rotation.z = angle;
        ray.position.x = Math.cos(angle) * 10;
        ray.position.y = Math.sin(angle) * 10;
        ray.name = `lightRay_${i}`;

        raysGroup.add(ray);
    }

    raysGroup.name = 'lightRays';
    return raysGroup;
}

function createAccretionParticles(color) {
    const particlesGroup = new THREE.Group();
    const numParticles = 500;
    const maxRadius = 35;

    // Per-particle immutable attributes stored on GPU buffers.
    // The vertex shader reads these along with a time uniform to compute
    // the animated position, eliminating per-frame CPU trig work.
    const initialAngles  = new Float32Array(numParticles);
    const initialRadii   = new Float32Array(numParticles);
    const heights        = new Float32Array(numParticles);
    const sizes          = new Float32Array(numParticles);
    const baseOpacities  = new Float32Array(numParticles);
    // orbitSpeeds encodes a per-particle random speed variation (GPU-side).
    const orbitSpeeds    = new Float32Array(numParticles);

    for (let i = 0; i < numParticles; i++) {
        const angle  = Math.random() * Math.PI * 2;
        const radius = Math.sqrt(Math.random()) * maxRadius;
        const heightFactor = 1 - (radius / maxRadius) * 0.5;
        const height = (Math.random() - 0.5) * 10 * heightFactor;
        const distanceFromCenter = radius / maxRadius;
        const falloff = Math.pow(1 - distanceFromCenter, 2);

        initialAngles[i]  = angle;
        initialRadii[i]   = radius;
        heights[i]        = height;
        sizes[i]          = (1 - distanceFromCenter * 0.5) * (Math.random() * 1.5 + 0.5);
        baseOpacities[i]  = falloff * (0.7 + Math.random() * 0.3);
        // Outer particles orbit slightly slower (realistic accretion dynamics).
        orbitSpeeds[i]    = 1.0 + (1.0 - distanceFromCenter) * 0.5;
    }

    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute('initialAngle',  new THREE.BufferAttribute(initialAngles, 1));
    particleGeometry.setAttribute('initialRadius', new THREE.BufferAttribute(initialRadii,  1));
    particleGeometry.setAttribute('height',        new THREE.BufferAttribute(heights,       1));
    particleGeometry.setAttribute('size',          new THREE.BufferAttribute(sizes,         1));
    particleGeometry.setAttribute('baseOpacity',   new THREE.BufferAttribute(baseOpacities, 1));
    particleGeometry.setAttribute('orbitSpeed',    new THREE.BufferAttribute(orbitSpeeds,   1));

    const particleMaterial = new THREE.ShaderMaterial({
        uniforms: {
            color:     { value: new THREE.Color(color) },
            time:      { value: 0.0 },
            maxRadius: { value: maxRadius }
        },
        vertexShader: `
            attribute float initialAngle;
            attribute float initialRadius;
            attribute float height;
            attribute float size;
            attribute float baseOpacity;
            attribute float orbitSpeed;

            uniform float time;
            uniform float maxRadius;

            varying float vOpacity;

            void main() {
                // Particles slowly spiral inward; when too close they reset to outer edge.
                // All arithmetic runs in parallel on the GPU.
                float angle  = initialAngle + time * 0.5 * orbitSpeed;
                float radius = initialRadius;

                // Compute animated XY position in the disk plane.
                float x = cos(angle) * radius;
                float y = sin(angle) * radius;

                // Opacity fades smoothly from center to edge.
                float distNorm = radius / maxRadius;
                float falloff  = pow(1.0 - distNorm, 2.0);
                vOpacity = falloff * baseOpacity;

                vec4 mvPosition = modelViewMatrix * vec4(x, y, height, 1.0);
                gl_PointSize = size * (300.0 / -mvPosition.z);
                gl_Position  = projectionMatrix * mvPosition;
            }
        `,
        fragmentShader: `
            uniform vec3 color;
            varying float vOpacity;

            void main() {
                // Circular soft-edged particle.
                vec2  center = gl_PointCoord - vec2(0.5);
                float dist   = length(center);
                if (dist > 0.5) discard;
                float alpha = (1.0 - dist * 2.0) * vOpacity;
                gl_FragColor = vec4(color, alpha);
            }
        `,
        transparent: true,
        blending:    THREE.AdditiveBlending,
        depthWrite:  false
    });

    const particles = new THREE.Points(particleGeometry, particleMaterial);
    particles.name = 'accretionParticles';
    particlesGroup.add(particles);

    particlesGroup.name = 'particles';
    return particlesGroup;
}

function createLensFlare(color) {
    // Create 8-pointed star-burst lens flare
    const flareGroup = new THREE.Group();
    const numSpikes = 8;

    for (let i = 0; i < numSpikes; i++) {
        const angle = (i / numSpikes) * Math.PI * 2;

        // Create elongated rectangular plane for each spike
        const spikeGeometry = new THREE.PlaneGeometry(0.5, 25);
        const spikeMaterial = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.15,
            blending: THREE.AdditiveBlending,
            side: THREE.DoubleSide,
            depthWrite: false
        });

        const spike = new THREE.Mesh(spikeGeometry, spikeMaterial);
        spike.rotation.z = angle;
        flareGroup.add(spike);
    }

    flareGroup.name = 'lensFlare';
    return flareGroup;
}


function createLightningGroup(color) {
    const group = new THREE.Group();
    group.name = 'lightning';

    const numLines = 3;
    const pointsPerLine = 10;

    for (let i = 0; i < numLines; i++) {
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(pointsPerLine * 3);
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        const material = new THREE.LineBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.0,
            blending: THREE.AdditiveBlending,
            linewidth: 2
        });

        const line = new THREE.Line(geometry, material);
        line.name = `bolt_${i}`;
        line.userData = {
            active: false,
            opacity: 0.0
        };
        group.add(line);
    }

    return group;
}

function createWormholeGroup(color, label) {
    const group = new THREE.Group();

    // 1. Spacetime grid showing gravitational warping
    const grid = createSpacetimeGrid(color);
    group.add(grid);

    // 2. Concentric energy rings
    const rings = createEnergyRings(color);
    group.add(rings);

    // 3. Funnel/throat geometry
    const throat = createWormholeThroat(color);
    group.add(throat);

    // 4. Event horizon (black hole center)
    const eventHorizon = createEventHorizon();
    group.add(eventHorizon);

    // 5. Light rays emanating from center
    const lightRays = createLightRays(color);
    group.add(lightRays);

    // 6. Accretion disk particles
    const particles = createAccretionParticles(color);
    group.add(particles);

    // 7. Lens flare (cinematic star-burst effect)
    const lensFlare = createLensFlare(color);
    group.add(lensFlare);

    // 8. Space Lightning (electro-magnetic arcs)
    const lightning = createLightningGroup(color);
    group.add(lightning);

    // 9. Label
    const labelSprite = createTextLabel(label, color);
    labelSprite.position.y = 18;
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

    if (currentScene === SCENES.OPEN_SPACE || currentScene === SCENES.COCKPIT) {
        if (currentScene === SCENES.OPEN_SPACE) {
            updateFlightControls();
            checkWormholeProximity();
        }
        animateWormholes();
        animateSpaceCrystals();
        animateWarpLines();
        
        // Cockpit shield regeneration (dependent on powerMode shunts)
        if (shieldEnergy < 100) {
            let regenRate = 0.05; // systems balanced
            if (powerMode === 'shields') {
                regenRate = 0.20; // 4x fast regen
            } else if (powerMode === 'engines') {
                regenRate = 0.0; // offline!
            }
            if (regenRate > 0) {
                shieldEnergy = Math.min(100, shieldEnergy + regenRate);
                updateShieldUI();
            }
        }
        
        // Update 3D target lock reticle ring
        if (hudReticle) {
            let nearest = null;
            let minDist = Infinity;
            wormholes.forEach(w => {
                const dist = camera.position.distanceTo(w.group.position);
                if (dist < minDist) {
                    minDist = dist;
                    nearest = w;
                }
            });
            
            if (nearest && minDist < 250) {
                hudReticle.visible = true;
                hudReticle.position.copy(nearest.group.position);
                hudReticle.lookAt(camera.position);
                
                // Pulsing animation
                const pulse = 1.0 + Math.sin(Date.now() * 0.005) * 0.08;
                
                if (minDist > 85) {
                    hudReticle.scale.set(pulse * 1.5, pulse * 1.5, 1);
                    hudReticle.material.color.setHex(0xffaa00); // orange scan
                    hudReticle.material.opacity = 0.5;
                    hudReticle.rotation.z += 0.01;
                    nearest.group.userData.lockAnnounced = false; // reset flag
                } else if (minDist > 30) {
                    const progress = (minDist - 30) / 55;
                    const scaleFactor = 0.8 + progress * 0.7;
                    hudReticle.scale.set(pulse * scaleFactor, pulse * scaleFactor, 1);
                    hudReticle.material.color.setHex(0xffaa00);
                    hudReticle.material.opacity = 0.75;
                    hudReticle.rotation.z += 0.035;
                } else {
                    hudReticle.scale.set(pulse * 0.75, pulse * 0.75, 1);
                    hudReticle.material.color.setHex(0x00ff88); // green lock-on!
                    hudReticle.material.opacity = 0.95;
                    hudReticle.rotation.z += 0.08;
                    
                    if (!nearest.group.userData.lockAnnounced && currentScene === SCENES.OPEN_SPACE) {
                        nearest.group.userData.lockAnnounced = true;
                        playLockChirp();
                        speakCoPilot(`Course locked on target ${nearest.config.label.toUpperCase()}`);
                    }
                }
            } else {
                hudReticle.visible = false;
            }
        }
        
        // Update physics of crystal debris particles
        for (let i = crystalDebris.length - 1; i >= 0; i--) {
            const debris = crystalDebris[i];
            debris.position.add(debris.userData.velocity);
            debris.scale.multiplyScalar(debris.userData.scaleDecay);
            debris.material.opacity = debris.scale.x;
            if (debris.scale.x < 0.05) {
                scene.remove(debris);
                crystalDebris.splice(i, 1);
            }
        }
        
        // Update physics of energy matrixes (tractor beam pull)
        for (let i = energyMatrixes.length - 1; i >= 0; i--) {
            const em = energyMatrixes[i];
            em.rotation.x += 0.02;
            em.rotation.y += 0.02;
            
            // Lerp towards camera position
            em.position.lerp(camera.position, 0.035);
            
            const dist = em.position.distanceTo(camera.position);
            if (dist < 6.0) {
                scene.remove(em);
                energyMatrixes.splice(i, 1);
                
                // Recover shield
                shieldEnergy = Math.min(100, shieldEnergy + 12.0);
                updateShieldUI();
                playPickupSound();
                writeToConsole("[INFO] ENERGY HARVESTED. SHIELDS INCREASED +12.0%.");
                speakCoPilot("Energy matrix harvested. Shields restored.");
            }
        }
        
        // Rare Solar Supernova Event triggers (1/8000 chance per frame)
        if (!supernovaActive && Math.random() < 0.00012) {
            supernovaActive = true;
            supernovaTime = 100; // lasts 100 frames
            playRumbleSound();
            
            // Flash scene white
            scene.fog.color.setHex(0xffffff);
            scene.fog.density = 0.025;
            
            writeToConsole("[WARNING] SOLAR CORONAL MASS EJECTION DETECTED. ELECTROMAGNETIC FLUX WARNING.");
            speakCoPilot("Caution! Solar radiation flare detected. Cockpit shields dampening interference.");
        }
        
        // Decaying solar flare fog and HUD flicker effect
        if (supernovaActive) {
            supernovaTime--;
            
            const uiEl = document.getElementById('ui-container');
            if (supernovaTime > 0) {
                // Glitchy HUD opacity flickers
                if (uiEl) {
                    uiEl.style.opacity = Math.random() > 0.35 ? '0.9' : '0.2';
                }
                // Fog decay slerp
                scene.fog.density = THREE.MathUtils.lerp(scene.fog.density, 0.001, 0.02);
                scene.fog.color.lerp(new THREE.Color(0x000000), 0.02);
            } else {
                supernovaActive = false;
                if (uiEl) uiEl.style.opacity = '1.0';
                scene.fog.color.setHex(0x000000);
                scene.fog.density = 0.001;
            }
        }
        
        // Dynamic engine hum frequency and volume scaling
        if (soundEnabled && audioCtx && engineOsc && engineGain) {
            let speedC = 0;
            if (autopilotActive) {
                speedC = baseSpeed * 1.5 * 0.01;
            } else {
                speedC = velocity.length() * 0.01;
            }
            const targetFreq = 45 + speedC * 2000;
            engineOsc.frequency.setTargetAtTime(targetFreq, audioCtx.currentTime, 0.15);
            
            const targetVolume = 0.12 + speedC * 1.5;
            engineGain.gain.setTargetAtTime(targetVolume, audioCtx.currentTime, 0.1);
        }
        
        // Apply camera shake if active
        if (cameraShakeAmount > 0.005) {
            const shakeX = (Math.random() - 0.5) * cameraShakeAmount;
            const shakeY = (Math.random() - 0.5) * cameraShakeAmount;
            const shakeZ = (Math.random() - 0.5) * cameraShakeAmount;
            
            // Ensure Euler rotation is synchronized with the quaternion (essential for autopilot slerp)
            camera.rotation.setFromQuaternion(camera.quaternion);
            
            camera.rotation.x += shakeX;
            camera.rotation.y += shakeY;
            camera.rotation.z += shakeZ;
            
            cameraShakeAmount *= 0.88;
        } else {
            cameraShakeAmount = 0;
        }
        
        if (typeof updateRadar === 'function') {
            updateRadar();
        }
    } else if (currentScene === SCENES.WORMHOLE_TRAVEL) {
        // Check if this is a reverse travel (returning)
        if (scene.userData.exitWormhole) {
            animateReverseWormholeTravel();
        } else {
            animateWormholeTravel();
        }
    }

    composer.render();
}

function updateFlightControls() {
    // Autopilot check override
    if (autopilotActive && autopilotTarget) {
        if (moveForward || moveBackward || moveLeft || moveRight || moveUp || moveDown || barrelRoll !== 0) {
            disableAutopilot();
            showNavAlert('AUTOPILOT CANCELLED', 'MANUAL OVERRIDE DETECTED');
        }
    }

    if (autopilotActive && autopilotTarget) {
        // Lock onto target smoothly
        const targetPos = autopilotTarget.group.position;
        const targetQuaternion = new THREE.Quaternion().setFromRotationMatrix(
            new THREE.Matrix4().lookAt(camera.position, targetPos, new THREE.Vector3(0, 1, 0))
        );
        camera.quaternion.slerp(targetQuaternion, 0.04); // Smooth transition
        
        // Synchronize targetRotation values to match the current camera quaternion
        const euler = new THREE.Euler().setFromQuaternion(camera.quaternion, 'YXZ');
        targetRotationY = euler.y;
        targetRotationX = euler.x;
        mouseX = targetRotationY / (Math.PI * 0.3);
        mouseY = targetRotationX / (Math.PI * 0.15);
        
        // Apply autopilot forward cruise speed
        const apSpeed = baseSpeed * 1.2;
        camera.translateZ(-apSpeed);
        
        // Proximity entry trigger
        const distance = camera.position.distanceTo(targetPos);
        if (distance < 25 && (Date.now() - lastWormholeExitTime > 3000)) {
            const targetWH = autopilotTarget;
            disableAutopilot();
            enterWormhole(targetWH);
        }
    } else {
        // Manual flight controls
        if (steeringMode === 'free') {
            // Steering is only active when mouse is within the central viewport (outside the cockpit panels)
            const insideControlsZone = Math.abs(mouseX) < 0.72 && mouseY > -0.62;
            
            if (insideControlsZone) {
                // Apply a small deadzone to prevent drift when centering mouse
                const deadzone = 0.08;
                let inputYaw = 0;
                let inputPitch = 0;

                if (Math.abs(mouseX) > deadzone) {
                    inputYaw = (mouseX - Math.sign(mouseX) * deadzone) / (1 - deadzone);
                }
                if (Math.abs(mouseY) > deadzone) {
                    inputPitch = (mouseY - Math.sign(mouseY) * deadzone) / (1 - deadzone);
                }

                const yawSpeed = 0.025;
                const pitchSpeed = 0.018;

                targetRotationY -= inputYaw * yawSpeed;
                targetRotationX += inputPitch * pitchSpeed;

                const maxPitch = Math.PI * 0.45;
                targetRotationX = Math.max(-maxPitch, Math.min(maxPitch, targetRotationX));
            }
        } else {
            // Direct clamped look mode
            targetRotationY = mouseX * Math.PI * 0.3;
            targetRotationX = mouseY * Math.PI * 0.15;
        }

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
    }

    // Explicitly update camera matrix so other computations use the current position/quaternion immediately
    camera.updateMatrixWorld();

    // Update HUD
    updateHUD();
}

function checkWormholeProximity() {
    if (Date.now() - lastWormholeExitTime < 3000) return; // 3-second cooldown after exiting!
    
    wormholes.forEach(wormhole => {
        const distance = camera.position.distanceTo(wormhole.group.position);

        // Check if close enough and moving forward
        if (distance < 25 && moveForward) {
            enterWormhole(wormhole);
        }
    });
}

function animateWormholes() {
    const time = Date.now() * 0.001;
    let dt = time - lastWormholeUpdateTime;
    if (dt > 0.1) dt = 0.1;
    lastWormholeUpdateTime = time;

    wormholes.forEach((wormhole, wormholeIndex) => {
        // Position and distance used for multiple visual effects
        const wormholeWorldPos = new THREE.Vector3();
        wormhole.group.getWorldPosition(wormholeWorldPos);
        const distance = camera.position.distanceTo(wormholeWorldPos);

        // Overall gentle rotation
        wormhole.group.rotation.z += 0.002;

        // Gentle breathing scale
        const baseScale = 1 + Math.sin(time * 0.5 + wormholeIndex * Math.PI) * 0.03;
        wormhole.group.scale.set(baseScale, baseScale, baseScale);

        // 1. Pulsating Event Horizon Core
        const eventHorizon = wormhole.group.getObjectByName('eventHorizon');
        if (eventHorizon) {
            const pulse = 1.0 + Math.sin(time * 3 + wormholeIndex * Math.PI) * 0.05;
            eventHorizon.scale.set(pulse, pulse, pulse);
        }

        // Animate energy rings - rotate at different speeds
        const energyRings = wormhole.group.getObjectByName('energyRings');
        if (energyRings) {
            energyRings.children.forEach((ring, ringIndex) => {
                // Each ring rotates at its own speed (stored in userData)
                if (ring.userData.rotationSpeed) {
                    ring.rotation.z += ring.userData.rotationSpeed;
                }

                // Subtle pulsing opacity
                const pulseFactor = Math.sin(time * 2 + ringIndex * 0.5) * 0.1;
                if (ring.material) {
                    const baseOpacity = 0.9 - ringIndex * 0.15;
                    ring.material.opacity = baseOpacity + pulseFactor;
                }
            });
        }

        // Animate light rays - slow rotation
        const lightRays = wormhole.group.getObjectByName('lightRays');
        if (lightRays) {
            lightRays.rotation.z += 0.005;

            // Pulse light ray opacity
            lightRays.children.forEach((ray, rayIndex) => {
                if (ray.material) {
                    const pulse = Math.sin(time * 3 + rayIndex * 0.2) * 0.03;
                    ray.material.opacity = 0.08 + pulse;
                }
            });
        }

        // 2. Turbulent Proximity Swirl
        // Map distance: under 150 units, speed increases from 1x up to 4.0x at 25 units.
        let speedMultiplier = 1.0;
        if (distance < 150) {
            const normDist = Math.max(0, Math.min(1, (150 - distance) / (150 - 25)));
            speedMultiplier = 1.0 + normDist * 3.0; // 1.0x to 4.0x
        }

        if (wormhole.particleTime === undefined) {
            wormhole.particleTime = time;
        }
        wormhole.particleTime += dt * speedMultiplier;

        const particlesGroup = wormhole.group.getObjectByName('particles');
        if (particlesGroup) {
            const particles = particlesGroup.getObjectByName('accretionParticles');
            if (particles && particles.material && particles.material.uniforms) {
                particles.material.uniforms.time.value = wormhole.particleTime;
            }
        }

        // 3. Dynamic Electro-Magnetic Arcs (Space Lightning)
        const lightningGroup = wormhole.group.getObjectByName('lightning');
        if (lightningGroup) {
            const pointsPerLine = 10;
            lightningGroup.children.forEach(line => {
                if (line.userData.active) {
                    // Decay opacity
                    line.userData.opacity -= 0.08;
                    if (line.userData.opacity <= 0) {
                        line.userData.opacity = 0;
                        line.userData.active = false;
                    }
                    if (line.material) {
                        line.material.opacity = line.userData.opacity;
                    }
                } else {
                    // Randomly trigger a bolt
                    if (Math.random() < 0.015) {
                        line.userData.active = true;
                        line.userData.opacity = 0.8 + Math.random() * 0.2;
                        
                        // Determine start point on event horizon (radius 3.5)
                        const startAngle = Math.random() * Math.PI * 2;
                        const startX = Math.cos(startAngle) * 3.5;
                        const startY = Math.sin(startAngle) * 3.5;
                        const startZ = 0;

                        // Determine end point on outer rings (radius 7 to 12)
                        const endAngle = Math.random() * Math.PI * 2;
                        const outerRadius = 7 + Math.random() * 5;
                        const endX = Math.cos(endAngle) * outerRadius;
                        const endY = Math.sin(endAngle) * outerRadius;
                        const endZ = (Math.random() - 0.5) * 2;

                        const posAttr = line.geometry.getAttribute('position');
                        const positions = posAttr.array;

                        for (let j = 0; j < pointsPerLine; j++) {
                            const t = j / (pointsPerLine - 1);
                            const baseX = startX + (endX - startX) * t;
                            const baseY = startY + (endY - startY) * t;
                            const baseZ = startZ + (endZ - startZ) * t;

                            let dx = 0, dy = 0, dz = 0;
                            if (j > 0 && j < pointsPerLine - 1) {
                                const factor = Math.sin(t * Math.PI) * 1.5;
                                dx = (Math.random() - 0.5) * factor;
                                dy = (Math.random() - 0.5) * factor;
                                dz = (Math.random() - 0.5) * factor;
                            }

                            positions[j * 3]     = baseX + dx;
                            positions[j * 3 + 1] = baseY + dy;
                            positions[j * 3 + 2] = baseZ + dz;
                        }
                        posAttr.needsUpdate = true;
                        if (line.material) {
                            line.material.opacity = line.userData.opacity;
                        }
                    } else {
                        if (line.material) {
                            line.material.opacity = 0;
                        }
                    }
                }
            });
        }

        // Animate spacetime grid - fixed opacity to prevent blinking
        const grid = wormhole.group.getObjectByName('spacetimeGrid');
        if (grid) {
            // Grid no longer pulses to prevent blinking effect
            // Opacity remains constant at 0.04
        }

        // Animate throat - gentle rotation
        const throat = wormhole.group.getObjectByName('throat');
        if (throat) {
            throat.rotation.z += 0.003;
        }

        // Animate lens flare - dynamic based on viewing angle
        const lensFlare = wormhole.group.getObjectByName('lensFlare');
        if (lensFlare) {
            // Slow rotation for dynamic effect
            lensFlare.rotation.z += 0.002;

            // Calculate angle between camera and wormhole
            const directionToWormhole = new THREE.Vector3();
            directionToWormhole.subVectors(wormholeWorldPos, camera.position).normalize();

            const cameraDirection = new THREE.Vector3();
            camera.getWorldDirection(cameraDirection);

            // Dot product gives us angle alignment (-1 to 1)
            const alignment = cameraDirection.dot(directionToWormhole);

            // Distance-based scaling
            const distanceFactor = Math.max(0, 1 - distance / 150);

            // Adjust opacity based on viewing angle and distance
            // Brightest when looking directly at it
            const targetOpacity = Math.max(0, alignment) * 0.3 * distanceFactor;

            lensFlare.children.forEach(spike => {
                if (spike.material) {
                    spike.material.opacity = targetOpacity;
                }
            });

            // Scale with distance (larger when closer)
            const scale = 1 + distanceFactor * 0.5;
            lensFlare.scale.set(scale, scale, scale);
        }
    });

    // Parallax starfield rotation
    if (starLayers.near) starLayers.near.rotation.y += 0.0005;
    if (starLayers.mid) starLayers.mid.rotation.y += 0.0003;
    if (starLayers.far) starLayers.far.rotation.y += 0.0001;
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

    // Parallax stars spin for wormhole effect
    if (starLayers.near) starLayers.near.rotation.y += 0.01;
    if (starLayers.mid) starLayers.mid.rotation.y += 0.008;
    if (starLayers.far) starLayers.far.rotation.y += 0.005;
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
    
    // Remove the UI class that disables key events
    document.body.classList.remove('cockpit-view');

    createWormholes();
    createNebula();
    createSpaceCrystals();
    createWarpLines();
    isTransitioning = false;
    showCockpitBezel();
}

function enterWormhole(wormhole) {
    if (isTransitioning) return;
    isTransitioning = true;
    currentScene = SCENES.WORMHOLE_TRAVEL;
    hideCockpitBezel();
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
    targetRotationY = 0;
    targetRotationX = 0;

    // Create tunnel
    createWormholeTunnel(color);

    // Navigate after tunnel
    setTimeout(() => {
        window.location.href = destination;
    }, 3500);
}

// ========================================
// Autopilot Navigation System
// ========================================

function initAutopilotUI() {
    const select = document.getElementById('ap-dest-select');
    if (!select) return;
    
    // Clear current options beyond the first placeholder
    select.innerHTML = '<option value="">SELECT DEST</option>';
    
    WORMHOLE_CONFIG.forEach(config => {
        const opt = document.createElement('option');
        opt.value = config.id;
        opt.textContent = config.label.toUpperCase();
        select.appendChild(opt);
    });
    
    const toggleBtn = document.getElementById('ap-toggle-btn');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', toggleAutopilot);
    }
    
    select.addEventListener('change', (e) => {
        const destId = e.target.value;
        if (destId) {
            const targetWH = wormholes.find(w => w.type === destId);
            if (targetWH) {
                setAutopilotTarget(targetWH);
                if (!autopilotActive) {
                    enableAutopilot();
                    showNavAlert('AUTOPILOT ENGAGED', `NAVIGATING TO ${targetWH.config.label.toUpperCase()}`);
                } else {
                    showNavAlert('NAV COORDINATES UPDATED', `NEW TARGET: ${targetWH.config.label.toUpperCase()}`);
                }
            }
        } else {
            autopilotTarget = null;
            disableAutopilot();
            showNavAlert('AUTOPILOT DISENGAGED', 'MANUAL FLIGHT ACTIVE');
        }
    });
}

function setAutopilotTarget(wormhole) {
    autopilotTarget = wormhole;
    // Sync the select dropdown visual value
    const select = document.getElementById('ap-dest-select');
    if (select && select.value !== wormhole.type) {
        select.value = wormhole.type;
    }
}

function toggleAutopilot() {
    if (!autopilotTarget) {
        // Find closest wormhole if none selected, excluding the one we just exited (within 35 units)
        if (wormholes.length > 0) {
            let closest = null;
            let minDist = Infinity;
            wormholes.forEach(w => {
                const dist = camera.position.distanceTo(w.group.position);
                if (dist > 35 && dist < minDist) {
                    minDist = dist;
                    closest = w;
                }
            });

            // Fallback if all are within 35 units (unlikely)
            if (!closest) {
                closest = wormholes[0];
                let d = camera.position.distanceTo(closest.group.position);
                for (let i = 1; i < wormholes.length; i++) {
                    const dist = camera.position.distanceTo(wormholes[i].group.position);
                    if (dist < d) {
                        d = dist;
                        closest = wormholes[i];
                    }
                }
            }
            setAutopilotTarget(closest);
        } else {
            showNavAlert('NO TARGET FOUND', 'WORMHOLES OFFLINE');
            return;
        }
    }
    
    if (autopilotActive) {
        disableAutopilot();
        showNavAlert('AUTOPILOT DISENGAGED', 'MANUAL FLIGHT ACTIVE');
    } else {
        enableAutopilot();
        showNavAlert('AUTOPILOT ENGAGED', `NAVIGATING TO ${autopilotTarget.config.label.toUpperCase()}`);
    }
}

function enableAutopilot() {
    autopilotActive = true;
    
    // Reset manual flight input flags to prevent immediate auto-disengage
    moveForward = false;
    moveBackward = false;
    moveLeft = false;
    moveRight = false;
    moveUp = false;
    moveDown = false;
    barrelRoll = 0;

    // Clear cockpit dashboard keys from staying lit up
    if (typeof COCKPIT_KEY_MAP !== 'undefined') {
        Object.values(COCKPIT_KEY_MAP).forEach(id => {
            const el = document.getElementById(id);
            if (el) el.classList.remove('pressed');
        });
    }

    const toggleBtn = document.getElementById('ap-toggle-btn');
    const statusText = document.getElementById('ap-status');
    if (toggleBtn) {
        toggleBtn.textContent = 'DISENGAGE AP';
        toggleBtn.classList.add('active');
    }
    if (statusText) {
        statusText.textContent = 'ENGAGED';
        statusText.classList.add('ap-active');
    }
    
    // Vocal announcement
    speakCoPilot("Autopilot engaged. Course locked.");
}

function disableAutopilot() {
    autopilotActive = false;
    const toggleBtn = document.getElementById('ap-toggle-btn');
    const statusText = document.getElementById('ap-status');
    const select = document.getElementById('ap-dest-select');
    if (toggleBtn) {
        toggleBtn.textContent = 'ENGAGE AP';
        toggleBtn.classList.remove('active');
    }
    if (statusText) {
        statusText.textContent = 'OFFLINE';
        statusText.classList.remove('ap-active');
    }
    if (select) {
        select.value = autopilotTarget ? autopilotTarget.type : '';
    }
    
    // Vocal announcement
    speakCoPilot("Manual control override.");
}

function showNavAlert(title, subtitle, duration = 3000) {
    const el = document.getElementById('deep-space-warning');
    if (!el) return;
    
    const originalText = "WARNING: DEEP SPACE DETECTED";
    const originalSub = "Return to navigation zone";
    
    const textEl = el.querySelector('.warning-text');
    const subEl = el.querySelector('.warning-subtext');
    const iconEl = el.querySelector('.warning-icon');
    
    if (textEl) textEl.textContent = title;
    if (subEl) subEl.textContent = subtitle;
    if (iconEl) iconEl.textContent = "⚙️";
    
    el.classList.remove('hidden');
    
    // Clear deep space mode class to keep the screen warning looking clean
    const hud = document.getElementById('hud');
    if (hud) hud.classList.remove('deep-space-mode');
    
    if (window.navAlertTimeout) clearTimeout(window.navAlertTimeout);
    
    window.navAlertTimeout = setTimeout(() => {
        el.classList.add('hidden');
        if (textEl) textEl.textContent = originalText;
        if (subEl) subEl.textContent = originalSub;
        if (iconEl) iconEl.textContent = "⚠️";
    }, duration);
}

// ========================================
// AI Interactive Console Logic
// ========================================

function initConsole() {
    const inputLeft = document.getElementById('ap-console-input');
    const inputBottom = document.getElementById('ap-console-input-bottom');
    const output = document.getElementById('ap-console-out');
    if (!output) return;
    
    // Left input setup
    if (inputLeft) {
        inputLeft.addEventListener('focus', () => {
            isConsoleTyping = true;
        });
        inputLeft.addEventListener('blur', () => {
            isConsoleTyping = false;
        });
        inputLeft.addEventListener('keydown', () => {
            playClickSound();
        });
        inputLeft.addEventListener('keyup', (event) => {
            if (event.key === 'Enter') {
                const rawVal = inputLeft.value;
                const cleanVal = rawVal.trim().toLowerCase();
                inputLeft.value = '';
                if (inputBottom) inputBottom.value = '';
                
                if (cleanVal.length === 0) return;
                
                writeToConsole(`> ${rawVal}`);
                executeConsoleCommand(cleanVal);
            }
        });
    }

    // Bottom input setup
    if (inputBottom) {
        inputBottom.addEventListener('focus', () => {
            isConsoleTyping = true;
        });
        inputBottom.addEventListener('blur', () => {
            isConsoleTyping = false;
        });
        inputBottom.addEventListener('keydown', () => {
            playClickSound();
        });
        inputBottom.addEventListener('keyup', (event) => {
            if (event.key === 'Enter') {
                const rawVal = inputBottom.value;
                const cleanVal = rawVal.trim().toLowerCase();
                inputBottom.value = '';
                if (inputLeft) inputLeft.value = '';
                
                if (cleanVal.length === 0) return;
                
                writeToConsole(`> ${rawVal}`);
                executeConsoleCommand(cleanVal);
            }
        });
    }
}

function writeToConsole(text) {
    const output = document.getElementById('ap-console-out');
    if (!output) return;
    
    const div = document.createElement('div');
    div.style.marginBottom = '6px';
    div.style.fontFamily = "'Courier New', Courier, monospace";
    output.appendChild(div);
    
    let charIdx = 0;
    function typeChar() {
        if (charIdx < text.length) {
            div.textContent += text.charAt(charIdx);
            charIdx++;
            output.scrollTop = output.scrollHeight;
            playClickSound();
            setTimeout(typeChar, 10);
        }
    }
    
    typeChar();
}

function executeConsoleCommand(command) {
    const parts = command.split(' ');
    const cmd = parts[0];
    const arg = parts.slice(1).join(' ');
    
    switch (cmd) {
        case 'help':
            writeToConsole("COMMANDS LOG:\n- help: show options\n- scan: range to targets\n- systems: diagnostic checks\n- ap [dest]: engage autopilot\n- ap off: disengage autopilot\n- warp: toggle speed streaks\n- sound: toggle audio feedback\n- steer: toggle steering mode (FREE / CONE)\n- shunt [engines|shields|systems]: route power\n- vent: flush coolant systems");
            break;
            
        case 'scan':
            if (wormholes.length > 0) {
                let nearest = null;
                let minDist = Infinity;
                wormholes.forEach(w => {
                    const d = camera.position.distanceTo(w.group.position);
                    if (d < minDist) { minDist = d; nearest = w; }
                });
                if (nearest) {
                    writeToConsole(`LOCK TARGET: ${nearest.config.label.toUpperCase()}\nDISTANCE: ${(minDist * 0.001).toFixed(4)} LY`);
                }
            } else {
                writeToConsole("SCAN FAILED: OBJECTS OFFLINE.");
            }
            break;
            
        case 'systems':
            writeToConsole("SHIP SYSTEMS REPORT:\n- HULL HULL CAP: NOMINAL\n- SENSORS SCAN: ONLINE\n- THRUST ENGINES: READY\n- HYPERDRIVE FLUID: ONLINE\n- COMP NAV: OPERATIONAL");
            break;
            
        case 'ap':
        case 'autopilot':
            if (arg === 'off' || arg === 'cancel') {
                if (autopilotActive) {
                    disableAutopilot();
                    writeToConsole("AUTOPILOT TERMINATED. MANUAL LOCK ACTIVE.");
                } else {
                    writeToConsole("AUTOPILOT MODULE IS ALREADY OFFLINE.");
                }
            } else if (arg) {
                const targetWH = wormholes.find(w => w.type === arg || w.config.label.toLowerCase().includes(arg));
                if (targetWH) {
                    setAutopilotTarget(targetWH);
                    enableAutopilot();
                    writeToConsole(`COURSE COMPUTED. LOCK TARGET: ${targetWH.config.label.toUpperCase()}.\nTHRUST ENGAGED.`);
                    showNavAlert('AUTOPILOT ACTIVE', `NAVIGATING TO ${targetWH.config.label.toUpperCase()}`);
                } else {
                    writeToConsole(`TARGET NOT RESOLVED: "${arg}"`);
                }
            } else {
                writeToConsole("ERROR: TARGET REQUIRED (e.g. ap work)");
            }
            break;
            
        case 'warp':
            warpActive = !warpActive;
            writeToConsole(warpActive ? "HYPERDRIVE ACTIVE. STREAKS INITIALIZED." : "WARP DEACTIVATED. RETURN TO COGNITIVE SPACE.");
            break;

        case 'sound':
        case 'audio':
            toggleSound();
            break;
            
        case 'steer':
        case 'steering':
            toggleSteeringMode();
            break;
            
        case 'shunt':
            if (arg === 'engines' || arg === 'engine') {
                shuntPower('engines');
            } else if (arg === 'shields' || arg === 'shield') {
                shuntPower('shields');
            } else if (arg === 'systems' || arg === 'system' || arg === 'normal') {
                shuntPower('systems');
            } else {
                writeToConsole("ERROR: SHUNT TARGET REQUIRED (e.g. shunt engines, shunt shields, shunt systems)");
            }
            break;

        case 'vent':
        case 'purge':
            const coolantEl = document.getElementById('cp-coolant-val');
            if (coolantEl && (coolantEl.textContent === 'HIGH TEMP' || coolantEl.textContent === 'LEAK DETECTED' || supernovaActive)) {
                coolantEl.textContent = 'NOMINAL';
                coolantEl.className = 'pv ok';
                writeToConsole("SYSTEM DIAGNOSTIC: AUXILIARY COOLANT FLUSHED. RE-ESTABLISHING THERMAL STEADY STATE.");
                speakCoPilot("Coolant systems flushed. Thermal loop stable.");
                if (supernovaActive) {
                    supernovaTime = 0; // stop flare early on vent
                }
            } else {
                writeToConsole("SYSTEM REPORT: COOLANT SYSTEMS ALREADY STABILIZED.");
            }
            break;
            
        default:
            writeToConsole(`UNKNOWN COMMAND: "${cmd}". TYPE "help" FOR LIST.`);
            break;
    }
}

// ========================================
// Tactical Navigation Radar Drawing
// ========================================

function updateRadar() {
    const canvas = document.getElementById('radar-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    const cx = w / 2;
    const cy = h / 2;
    
    ctx.clearRect(0, 0, w, h);
    
    // Draw radar circles
    ctx.strokeStyle = 'rgba(0, 255, 136, 0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cx, cy, cx * 0.4, 0, Math.PI * 2);
    ctx.arc(cx, cy, cx * 0.8, 0, Math.PI * 2);
    ctx.stroke();
    
    // Draw axis lines
    ctx.beginPath();
    ctx.moveTo(0, cy); ctx.lineTo(w, cy);
    ctx.moveTo(cx, 0); ctx.lineTo(cx, h);
    ctx.stroke();
    
    // Draw sweep lines
    const sweepAngle = (Date.now() * 0.0022) % (Math.PI * 2);
    ctx.strokeStyle = 'rgba(0, 255, 136, 0.26)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(sweepAngle) * cx, cy + Math.sin(sweepAngle) * cy);
    ctx.stroke();
    
    // Sweep glow background
    ctx.fillStyle = 'rgba(0, 255, 136, 0.02)';
    ctx.beginPath();
    ctx.arc(cx, cy, cx, 0, Math.PI * 2);
    ctx.fill();
    
    // Central ship blip
    ctx.fillStyle = (Date.now() % 1000 > 500) ? '#ffffff' : '#00ff88';
    ctx.beginPath();
    ctx.arc(cx, cy, 2.5, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw coordinate target blips
    const maxRange = 300;
    wormholes.forEach(wh => {
        const localPos = new THREE.Vector3().subVectors(wh.group.position, camera.position);
        localPos.applyQuaternion(camera.quaternion.clone().invert());
        
        const dist = localPos.length();
        if (dist < maxRange) {
            // Project X -> X and Z -> Y (since -Z is forward in WebGL space)
            const bx = cx + (localPos.x / maxRange) * (cx * 0.85);
            const by = cy + (localPos.z / maxRange) * (cy * 0.85);
            
            const colorHex = wh.color;
            const colorStr = '#' + colorHex.toString(16).padStart(6, '0');
            
            ctx.shadowColor = colorStr;
            ctx.shadowBlur = 5;
            ctx.fillStyle = colorStr;
            ctx.beginPath();
            ctx.arc(bx, by, 3.2, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0; // reset
            
            // Draw Target text tag
            ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
            ctx.font = '5px Orbitron, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(wh.config.label.toUpperCase().substring(0, 4), bx, by - 5);
        }
    });
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

    // Initialize autopilot UI controls
    initAutopilotUI();

    // Initialize interactive console controls
    initConsole();

    // Initialize cockpit view toggle button
    initCockpitToggle();

    // Initialize interactive sound toggle listener
    const soundToggle = document.getElementById('cp-sound-val');
    if (soundToggle) {
        soundToggle.addEventListener('click', () => {
            toggleSound();
        });
    }

    // Initialize interactive steering mode toggle listener
    const steerToggle = document.getElementById('cp-steer-val');
    if (steerToggle) {
        steerToggle.addEventListener('click', () => {
            toggleSteeringMode();
        });
    }

    // Click on canvas or background viewport to fire mining laser
    window.addEventListener('click', (event) => {
        if (currentScene !== SCENES.OPEN_SPACE || isConsoleTyping) return;
        
        // Block firing when clicking on interactive cockpit buttons/inputs/panels
        const target = event.target;
        if (target.closest('.cockpit-panel') || target.closest('.cockpit-bottom') || target.closest('.hud-toggle-btn') || target.tagName === 'INPUT' || target.tagName === 'SELECT' || target.tagName === 'BUTTON') {
            return;
        }
        
        fireMiningLaser();
    });
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);
}

function onMouseMove(event) {
    mouseX = (event.clientX / window.innerWidth) * 2 - 1;
    mouseY = -(event.clientY / window.innerHeight) * 2 + 1;

    // Update rotation targets only if in direct cone mode
    if (steeringMode === 'cone') {
        targetRotationY = mouseX * Math.PI * 0.3;
        targetRotationX = mouseY * Math.PI * 0.15;
    }
}

function onKeyDown(event) {
    if (isConsoleTyping) return;
    const key = event.key.toLowerCase();

    // Toggle Cockpit View
    if (key === 'c' && currentScene === SCENES.OPEN_SPACE) {
        toggleCockpitView();
        return;
    }

    // Toggle Steering Mode
    if (key === 'm' && currentScene === SCENES.OPEN_SPACE) {
        toggleSteeringMode();
        return;
    }

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

        // Light up the matching cockpit key indicator
        setCockpitKey(key, true);
        if (event.shiftKey) setCockpitKey('shift', true);
    }
}

function onKeyUp(event) {
    if (isConsoleTyping) return;
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

    // Extinguish the cockpit key indicator
    setCockpitKey(key, false);
    if (!event.shiftKey) setCockpitKey('shift', false);
}

// ========================================
// Cockpit Bezel — Show / Hide / Key Sync
// ========================================

// Maps a lowercased event.key to the corresponding cockpit indicator element ID.
const COCKPIT_KEY_MAP = {
    'w':         'ck-w',     'arrowup':    'ck-w',
    's':         'ck-s',     'arrowdown':  'ck-s',
    'a':         'ck-a',     'arrowleft':  'ck-a',
    'd':         'ck-d',     'arrowright': 'ck-d',
    ' ':         'ck-space',
    'q':         'ck-q',
    'e':         'ck-e',
    'shift':     'ck-shift'
};

/**
 * Toggles the `.pressed` state on a cockpit key cap.
 * @param {string} key - event.key.toLowerCase()
 * @param {boolean} active - true = light up, false = dim
 */
function setCockpitKey(key, active) {
    const id = COCKPIT_KEY_MAP[key];
    if (!id) return;
    const el = document.getElementById(id);
    if (el) el.classList.toggle('pressed', active);
}

function showCockpitBezel() {
    if (!cockpitVisible) return;
    const bezel = document.getElementById('cockpit-bezel');
    if (bezel) bezel.classList.remove('hidden');
    document.body.classList.add('cockpit-bezel-active');
}

function hideCockpitBezel() {
    const bezel = document.getElementById('cockpit-bezel');
    if (bezel) bezel.classList.add('hidden');
    document.body.classList.remove('cockpit-bezel-active');
    // Clear all pressed key states so nothing gets stuck highlighted
    Object.values(COCKPIT_KEY_MAP).forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.remove('pressed');
    });
}

function initCockpitToggle() {
    const btn = document.getElementById('cockpit-toggle-btn');
    if (btn) {
        btn.addEventListener('click', () => {
            toggleCockpitView();
        });
    }
}

function toggleCockpitView() {
    cockpitVisible = !cockpitVisible;
    const bezel = document.getElementById('cockpit-bezel');
    const btn = document.getElementById('cockpit-toggle-btn');
    
    if (cockpitVisible) {
        if (bezel) {
            bezel.classList.remove('hidden');
            document.body.classList.add('cockpit-bezel-active');
        }
        if (btn) {
            btn.classList.remove('minimized');
            const txt = btn.querySelector('.toggle-text');
            if (txt) txt.textContent = "COCKPIT VIEW";
        }
        writeToConsole("SYSTEM STATUS: COCKPIT VIEW ENGAGED.");
    } else {
        if (bezel) {
            bezel.classList.add('hidden');
            document.body.classList.remove('cockpit-bezel-active');
        }
        if (btn) {
            btn.classList.add('minimized');
            const txt = btn.querySelector('.toggle-text');
            if (txt) txt.textContent = "NIGHT SKY VIEW";
        }
        writeToConsole("SYSTEM STATUS: WIDE ANGLE SKY VIEW ENGAGED.");
    }
    speakCoPilot("View mode updated.");
}

// ========================================
// Web Audio Synthesizer & AI Co-Pilot
// ========================================

function initAudioSynth() {
    if (audioCtx) return;
    try {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        audioCtx = new AudioContextClass();
        
        // --- 1. Engine Hum Synth ---
        engineOsc = audioCtx.createOscillator();
        engineFilter = audioCtx.createBiquadFilter();
        engineGain = audioCtx.createGain();
        
        engineOsc.type = 'sawtooth';
        engineOsc.frequency.setValueAtTime(45, audioCtx.currentTime); // low sub frequency
        
        engineFilter.type = 'lowpass';
        engineFilter.frequency.setValueAtTime(120, audioCtx.currentTime); // cut harsh harmonics
        
        engineGain.gain.setValueAtTime(0, audioCtx.currentTime); // start silent
        
        engineOsc.connect(engineFilter);
        engineFilter.connect(engineGain);
        engineGain.connect(audioCtx.destination);
        engineOsc.start();
        
        // --- 2. Warp Spool-up & Flight Noise ---
        warpOsc = audioCtx.createOscillator();
        warpOsc.type = 'triangle';
        warpOsc.frequency.setValueAtTime(80, audioCtx.currentTime);
        
        warpGainNode = audioCtx.createGain();
        warpGainNode.gain.setValueAtTime(0, audioCtx.currentTime);
        
        // White noise generator for warp wind slipstream
        const bufferSize = audioCtx.sampleRate * 2; // 2 seconds
        const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
        }
        
        warpNoiseNode = audioCtx.createBufferSource();
        warpNoiseNode.buffer = noiseBuffer;
        warpNoiseNode.loop = true;
        
        const noiseFilter = audioCtx.createBiquadFilter();
        noiseFilter.type = 'bandpass';
        noiseFilter.frequency.setValueAtTime(350, audioCtx.currentTime);
        noiseFilter.Q.setValueAtTime(3.0, audioCtx.currentTime);
        
        warpNoiseGain = audioCtx.createGain();
        warpNoiseGain.gain.setValueAtTime(0, audioCtx.currentTime); // start silent
        
        warpOsc.connect(warpGainNode);
        warpNoiseNode.connect(noiseFilter);
        noiseFilter.connect(warpNoiseGain);
        
        warpGainNode.connect(audioCtx.destination);
        warpNoiseGain.connect(audioCtx.destination);
        
        warpOsc.start();
        warpNoiseNode.start();
    } catch (e) {
        console.error("Failed to initialize AudioContext:", e);
    }
}

function toggleSound(forcedState) {
    soundEnabled = forcedState !== undefined ? forcedState : !soundEnabled;
    const soundToggle = document.getElementById('cp-sound-val');
    
    if (soundEnabled) {
        // Initialize if not already initialized
        if (!audioCtx) {
            initAudioSynth();
        }
        if (audioCtx && audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
        
        if (soundToggle) {
            soundToggle.textContent = 'ON';
            soundToggle.className = 'pv ok';
        }
        
        // Start engine hum at low base volume
        if (engineGain) {
            engineGain.gain.setTargetAtTime(0.12, audioCtx.currentTime, 0.1);
        }
        
        writeToConsole("AUDIO SUBSYSTEMS: INITIALIZED & ONLINE.");
        speakCoPilot("Audio systems online. Co-pilot initialized.");
    } else {
        if (soundToggle) {
            soundToggle.textContent = 'OFF';
            soundToggle.className = 'pv alert';
        }
        // Fade out engine hum
        if (engineGain) {
            engineGain.gain.setTargetAtTime(0, audioCtx.currentTime, 0.1);
        }
        // Fade out warp sound
        if (warpGainNode) {
            warpGainNode.gain.setTargetAtTime(0, audioCtx.currentTime, 0.1);
        }
        if (warpNoiseGain) {
            warpNoiseGain.gain.setTargetAtTime(0, audioCtx.currentTime, 0.1);
        }
        writeToConsole("AUDIO SUBSYSTEMS: OFFLINE.");
        
        // Cancel speech synthesis
        window.speechSynthesis.cancel();
    }
}

function toggleSteeringMode(forcedState) {
    if (forcedState !== undefined) {
        steeringMode = forcedState;
    } else {
        steeringMode = steeringMode === 'free' ? 'cone' : 'free';
    }
    
    // Play tactical sound confirmation
    playLockChirp();
    
    const steerToggle = document.getElementById('cp-steer-val');
    
    if (steeringMode === 'free') {
        if (steerToggle) {
            steerToggle.textContent = 'FREE';
            steerToggle.className = 'pv ok';
        }
        writeToConsole("STEERING INTERFACE: FREE-FLIGHT MODE (360° MOTION).");
        speakCoPilot("Free flight steering online. 360-degree control active.");
    } else {
        if (steerToggle) {
            steerToggle.textContent = 'CONE';
            steerToggle.className = 'pv alert';
        }
        
        // Clamp current camera orientation to direct cone limits
        const maxY = Math.PI * 0.3;
        const maxX = Math.PI * 0.15;
        targetRotationY = Math.max(-maxY, Math.min(maxY, targetRotationY));
        targetRotationX = Math.max(-maxX, Math.min(maxX, targetRotationX));
        camera.rotation.y = targetRotationY;
        camera.rotation.x = targetRotationX;
        
        writeToConsole("STEERING INTERFACE: CLAMPED DIRECT-VIEW CONE.");
        speakCoPilot("Direct view steering online. Clamped cone limit active.");
    }
}

function speakCoPilot(text) {
    if (!soundEnabled) return;
    try {
        // Cancel currently speaking messages to prevent queue overlap
        window.speechSynthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.08; // slightly faster
        utterance.pitch = 0.95; // slightly deeper / robotic
        
        // Find a suitable voice if available (optional, defaults to browser default)
        const voices = window.speechSynthesis.getVoices();
        const roboticVoice = voices.find(v => v.lang.includes('en') && (v.name.includes('Google') || v.name.includes('Robotic') || v.name.includes('Zira')));
        if (roboticVoice) {
            utterance.voice = roboticVoice;
        }
        
        window.speechSynthesis.speak(utterance);
    } catch (e) {
        console.error("Co-pilot voice error:", e);
    }
}

function playClickSound() {
    if (!soundEnabled || !audioCtx) return;
    try {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1400, audioCtx.currentTime); // high pitch tick
        
        gain.gain.setValueAtTime(0.008, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.025); // very short tick
        
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        
        osc.start();
        osc.stop(audioCtx.currentTime + 0.03);
    } catch (e) {}
}

function playExplosionSound() {
    if (!soundEnabled || !audioCtx) return;
    try {
        // Low pitch blast sweep
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(100, audioCtx.currentTime);
        osc.frequency.linearRampToValueAtTime(30, audioCtx.currentTime + 0.6);
        
        gain.gain.setValueAtTime(0.25, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.6);
        
        // White noise explosion blast
        const noise = audioCtx.createBufferSource();
        const noiseFilter = audioCtx.createBiquadFilter();
        const noiseGain = audioCtx.createGain();
        
        const bufferSize = audioCtx.sampleRate * 0.7; // 0.7 second blast
        const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
        const data = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        
        noise.buffer = noiseBuffer;
        noiseFilter.type = 'lowpass';
        noiseFilter.frequency.setValueAtTime(250, audioCtx.currentTime);
        noiseFilter.frequency.exponentialRampToValueAtTime(50, audioCtx.currentTime + 0.5);
        
        noiseGain.gain.setValueAtTime(0.2, audioCtx.currentTime);
        noiseGain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.65);
        
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        
        noise.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(audioCtx.destination);
        
        osc.start();
        osc.stop(audioCtx.currentTime + 0.65);
        noise.start();
        noise.stop(audioCtx.currentTime + 0.7);
    } catch (e) {}
}

function playWarpSpoolSound(isActive) {
    if (!soundEnabled || !audioCtx) return;
    try {
        if (isActive) {
            // Sweep frequency up
            if (warpGainNode) {
                warpGainNode.gain.cancelScheduledValues(audioCtx.currentTime);
                warpGainNode.gain.setValueAtTime(warpGainNode.gain.value, audioCtx.currentTime);
                warpGainNode.gain.linearRampToValueAtTime(0.15, audioCtx.currentTime + 1.5);
            }
            if (warpOsc) {
                warpOsc.frequency.cancelScheduledValues(audioCtx.currentTime);
                warpOsc.frequency.setValueAtTime(80, audioCtx.currentTime);
                warpOsc.frequency.exponentialRampToValueAtTime(950, audioCtx.currentTime + 2.2);
            }
            if (warpNoiseGain) {
                warpNoiseGain.gain.cancelScheduledValues(audioCtx.currentTime);
                warpNoiseGain.gain.setValueAtTime(warpNoiseGain.gain.value, audioCtx.currentTime);
                warpNoiseGain.gain.linearRampToValueAtTime(0.04, audioCtx.currentTime + 1.5);
            }
        } else {
            // Fade warp sound down
            if (warpGainNode) {
                warpGainNode.gain.cancelScheduledValues(audioCtx.currentTime);
                warpGainNode.gain.setValueAtTime(warpGainNode.gain.value, audioCtx.currentTime);
                warpGainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.6);
            }
            if (warpNoiseGain) {
                warpNoiseGain.gain.cancelScheduledValues(audioCtx.currentTime);
                warpNoiseGain.gain.setValueAtTime(warpNoiseGain.gain.value, audioCtx.currentTime);
                warpNoiseGain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.6);
            }
        }
    } catch (e) {}
}

// --- Interactive Shunting Logic ---
function shuntPower(mode) {
    powerMode = mode;
    const reactorVal = document.getElementById('cp-reactor-val');
    const reactorBar = document.getElementById('cp-reactor-bar');
    const coolantVal = document.getElementById('cp-coolant-val');
    
    if (mode === 'engines') {
        baseSpeed = 0.6; // double speed
        
        if (reactorVal) {
            reactorVal.textContent = '125.0%';
            reactorVal.className = 'pv warn';
        }
        if (reactorBar) {
            reactorBar.style.width = '100%';
            reactorBar.style.backgroundColor = '#ffaa00';
            reactorBar.style.boxShadow = '0 0 6px rgba(255, 170, 0, 0.7)';
        }
        if (coolantVal) {
            coolantVal.textContent = 'HIGH TEMP';
            coolantVal.className = 'pv warn';
        }
        
        writeToConsole("REACTOR PATHWAY: DIVERTER SHUNTED TO PROPULSION VECTOR. REACTOR OVERLOAD DETECTED.");
        speakCoPilot("Engines shunted. Shield grid offline. Coolant temperature rising.");
    } else if (mode === 'shields') {
        baseSpeed = 0.15; // half speed
        
        if (reactorVal) {
            reactorVal.textContent = '85.0%';
            reactorVal.className = 'pv ok';
        }
        if (reactorBar) {
            reactorBar.style.width = '85%';
            reactorBar.style.backgroundColor = '#00ff88';
            reactorBar.style.boxShadow = '0 0 6px rgba(0, 255, 136, 0.7)';
        }
        if (coolantVal) {
            coolantVal.textContent = 'NOMINAL';
            coolantVal.className = 'pv ok';
        }
        
        writeToConsole("REACTOR PATHWAY: DIVERTER SHUNTED TO SHIELD AMPLIFIERS. PROPULSION OUTPUT THROTTLED.");
        speakCoPilot("Deflector grid shunted. Engines output restricted.");
    } else { // balanced 'systems'
        baseSpeed = 0.3; // standard speed
        
        if (reactorVal) {
            reactorVal.textContent = '98.4%';
            reactorVal.className = 'pv ok';
        }
        if (reactorBar) {
            reactorBar.style.width = '98.4%';
            reactorBar.style.backgroundColor = '#00ff88';
            reactorBar.style.boxShadow = '0 0 6px rgba(0, 255, 136, 0.7)';
        }
        if (coolantVal) {
            coolantVal.textContent = 'NOMINAL';
            coolantVal.className = 'pv ok';
        }
        
        writeToConsole("REACTOR PATHWAY: CONDUIT DIVERTERS BALANCED. ALL SYSTEMS INTEGRATED.");
        speakCoPilot("Grid power levels balanced.");
    }
}

// --- Active Defence Weapon System (Laser) ---
function fireMiningLaser() {
    // Play laser sound
    playLaserSound();
    
    // Laser start point (ship nose in camera space)
    const start = new THREE.Vector3(0, -0.8, -1.5).applyMatrix4(camera.matrixWorld);
    
    // Raycaster to check intersection with space crystals
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
    const intersects = raycaster.intersectObjects(spaceCrystals);
    
    let end = new THREE.Vector3();
    let hitCrystal = null;
    
    if (intersects.length > 0 && intersects[0].distance < 160) {
        end.copy(intersects[0].point);
        hitCrystal = intersects[0].object;
    } else {
        // endpoint is 160 units forward
        end.set(0, 0, -160).applyMatrix4(camera.matrixWorld);
    }
    
    // Draw 3D laser cylinder
    const distance = start.distanceTo(end);
    const laserGeo = new THREE.CylinderGeometry(0.12, 0.12, 1, 8);
    laserGeo.rotateX(Math.PI / 2); // align along Z
    
    const laserMat = new THREE.MeshBasicMaterial({
        color: 0x00ffff,
        transparent: true,
        opacity: 0.95,
        blending: THREE.AdditiveBlending
    });
    const laserMesh = new THREE.Mesh(laserGeo, laserMat);
    laserMesh.scale.set(1, 1, distance);
    laserMesh.position.copy(start).add(end).multiplyScalar(0.5);
    laserMesh.lookAt(end);
    
    scene.add(laserMesh);
    
    setTimeout(() => {
        scene.remove(laserMesh);
    }, 100);
    
    // If we hit a crystal, shatter it!
    if (hitCrystal) {
        shatterCrystal(hitCrystal, end);
    }
}

function shatterCrystal(crystal, point) {
    // Play explosion sound
    playExplosionSound();
    
    const debrisColor = crystal.userData.originalColor || 0x00ff88;
    
    // 1. Spawn debris shards
    const debrisGeo = new THREE.DodecahedronGeometry(0.2, 0);
    const numDebris = 12;
    for (let i = 0; i < numDebris; i++) {
        const debrisMat = new THREE.MeshBasicMaterial({
            color: debrisColor,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending
        });
        const debris = new THREE.Mesh(debrisGeo, debrisMat);
        debris.position.copy(point);
        
        debris.userData = {
            velocity: new THREE.Vector3(
                (Math.random() - 0.5) * 1.5,
                (Math.random() - 0.5) * 1.5,
                (Math.random() - 0.5) * 1.5
            ),
            scaleDecay: 0.94 + Math.random() * 0.03
        };
        scene.add(debris);
        crystalDebris.push(debris);
    }
    
    // 2. Spawn harvestable energy matrix octahedron
    const matrixGeo = new THREE.OctahedronGeometry(0.5, 0);
    const matrixMat = new THREE.MeshStandardMaterial({
        color: 0xffff00,
        emissive: 0xffff00,
        emissiveIntensity: 1.5,
        transparent: true,
        opacity: 0.9,
        flatShading: true
    });
    const matrixMesh = new THREE.Mesh(matrixGeo, matrixMat);
    matrixMesh.position.copy(crystal.position);
    scene.add(matrixMesh);
    energyMatrixes.push(matrixMesh);
    
    // 3. Object Pool Respawn: Move crystal way in front so corridor stays populated
    crystal.position.set(
        (Math.random() - 0.5) * 360,
        (Math.random() - 0.5) * 220,
        camera.position.z - 300 - Math.random() * 100
    );
    crystal.userData.collided = false; // reset collision flag
}

// --- Dynamic Audio Beeps ---
function playLaserSound() {
    if (!soundEnabled || !audioCtx) return;
    try {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(150, audioCtx.currentTime + 0.15);
        
        gain.gain.setValueAtTime(0.03, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.18);
        
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.2);
    } catch(e){}
}

function playPickupSound() {
    if (!soundEnabled || !audioCtx) return;
    try {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, audioCtx.currentTime);
        osc.frequency.setValueAtTime(900, audioCtx.currentTime + 0.08);
        
        gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.22);
        
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.25);
    } catch(e){}
}

function playLockChirp() {
    if (!soundEnabled || !audioCtx) return;
    try {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, audioCtx.currentTime);
        osc.frequency.setValueAtTime(1200, audioCtx.currentTime + 0.05);
        
        gain.gain.setValueAtTime(0.012, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.12);
        
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.15);
    } catch(e){}
}

function playRumbleSound() {
    if (!soundEnabled || !audioCtx) return;
    try {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(65, audioCtx.currentTime);
        osc.frequency.linearRampToValueAtTime(15, audioCtx.currentTime + 1.2);
        
        gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 1.2);
        
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 1.25);
    } catch(e){}
}

// ========================================
// Initialize on Load
// ========================================

window.addEventListener('DOMContentLoaded', init);
