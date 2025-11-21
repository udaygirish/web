// ========================================
// HUD Updates
// ========================================

function updateHUD() {
    // Calculate actual speed from movement
    const moveSpeed = speedBoost ? baseSpeed * 2 : baseSpeed;
    let actualSpeed = 0;

    // Count how many directions we're moving
    if (moveForward || moveBackward) actualSpeed += moveSpeed;
    if (moveLeft || moveRight) actualSpeed += moveSpeed;
    if (moveUp || moveDown) actualSpeed += moveSpeed;

    // Convert to cosmic units (fraction of light speed)
    const speedC = actualSpeed * 0.01;
    document.getElementById('hud-speed').textContent = speedC.toFixed(3) + 'c';

    // Coordinates in light years (scaled down for readability)
    // 1 unit = 0.001 light years
    const lyScale = 0.001;
    document.getElementById('hud-x').textContent = (camera.position.x * lyScale).toFixed(4);
    document.getElementById('hud-y').textContent = (camera.position.y * lyScale).toFixed(4);
    document.getElementById('hud-z').textContent = (camera.position.z * lyScale).toFixed(4);

    // Target (nearest wormhole) in light years
    if (wormholes.length > 0) {
        let nearest = null;
        let minDist = Infinity;

        wormholes.forEach(w => {
            const dist = camera.position.distanceTo(w.group.position);
            if (dist < minDist) {
                minDist = dist;
                nearest = w;
            }
        });

        if (nearest) {
            const distLY = (minDist * lyScale).toFixed(3);
            document.getElementById('hud-target').textContent =
                `${nearest.type.toUpperCase()} (${distLY} LY)`;
        }
    } else {
        document.getElementById('hud-target').textContent = '---';
    }
}

// ========================================
// 3D Enhancements - Nebula Clouds
// ========================================

function createNebula() {
    const nebulaGroup = new THREE.Group();

    // Create 3 colored fog clouds (subtle background elements)
    const colors = [0x00ff88, 0x06ffa5, 0xff6b35];

    colors.forEach((color, i) => {
        const geometry = new THREE.SphereGeometry(15, 16, 16); // Smaller - was 30
        const material = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.03, // Much more transparent - was 0.1
            blending: THREE.AdditiveBlending
        });

        const nebula = new THREE.Mesh(geometry, material);
        nebula.position.set(
            (Math.random() - 0.5) * 300,
            (Math.random() - 0.5) * 150,
            -250 + Math.random() * -100 // Much farther away - was -150
        );
        nebulaGroup.add(nebula);
    });

    nebulaGroup.name = 'nebula';
    scene.add(nebulaGroup);
}
