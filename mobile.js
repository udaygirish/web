// ========================================
// Mobile Touch Controls
// ========================================

let isMobile = false;
let joystickActive = false;
let joystickStartPos = { x: 0, y: 0 };
let joystickCurrentPos = { x: 0, y: 0 };
let touchRotateStartX = 0;
let touchRotateStartY = 0;

// Detect mobile device
function detectMobile() {
    isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
        || window.innerWidth <= 1024;
    return isMobile;
}

// Initialize mobile controls
function initMobileControls() {
    if (!detectMobile()) return;

    const joystickContainer = document.getElementById('joystick-container');
    const joystickStick = document.getElementById('joystick-stick');
    const forwardBtn = document.getElementById('mobile-forward');
    const boostBtn = document.getElementById('mobile-boost');

    // Virtual Joystick
    joystickContainer.addEventListener('touchstart', handleJoystickStart, { passive: false });
    joystickContainer.addEventListener('touchmove', handleJoystickMove, { passive: false });
    joystickContainer.addEventListener('touchend', handleJoystickEnd, { passive: false });

    // Forward button
    forwardBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        moveForward = true;
    });
    forwardBtn.addEventListener('touchend', (e) => {
        e.preventDefault();
        moveForward = false;
    });

    // Boost button
    boostBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        speedBoost = true;
    });
    boostBtn.addEventListener('touchend', (e) => {
        e.preventDefault();
        speedBoost = false;
    });

    // Touch rotation (anywhere on screen except controls)
    const canvas = document.getElementById('canvas');
    let touchId = null;

    canvas.addEventListener('touchstart', (e) => {
        if (e.touches.length === 1 && currentScene === SCENES.OPEN_SPACE) {
            touchId = e.touches[0].identifier;
            touchRotateStartX = e.touches[0].clientX;
            touchRotateStartY = e.touches[0].clientY;
        }
    }, { passive: true });

    canvas.addEventListener('touchmove', (e) => {
        if (touchId !== null && currentScene === SCENES.OPEN_SPACE) {
            const touch = Array.from(e.touches).find(t => t.identifier === touchId);
            if (touch) {
                const deltaX = touch.clientX - touchRotateStartX;
                const deltaY = touch.clientY - touchRotateStartY;

                targetRotationY -= deltaX * 0.003;
                targetRotationX -= deltaY * 0.003;
                targetRotationX = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, targetRotationX));

                touchRotateStartX = touch.clientX;
                touchRotateStartY = touch.clientY;
            }
        }
    }, { passive: true });

    canvas.addEventListener('touchend', (e) => {
        const remainingTouches = Array.from(e.touches);
        if (!remainingTouches.find(t => t.identifier === touchId)) {
            touchId = null;
        }
    }, { passive: true });
}

function handleJoystickStart(e) {
    e.preventDefault();
    joystickActive = true;
    const touch = e.touches[0];
    const rect = e.target.getBoundingClientRect();
    joystickStartPos.x = rect.left + rect.width / 2;
    joystickStartPos.y = rect.top + rect.height / 2;
}

function handleJoystickMove(e) {
    if (!joystickActive) return;
    e.preventDefault();

    const touch = e.touches[0];
    const stick = document.getElementById('joystick-stick');

    // Calculate offset from center
    let offsetX = touch.clientX - joystickStartPos.x;
    let offsetY = touch.clientY - joystickStartPos.y;

    // Limit to base radius (60px max)
    const maxRadius = 35;
    const distance = Math.sqrt(offsetX * offsetX + offsetY * offsetY);

    if (distance > maxRadius) {
        offsetX = (offsetX / distance) * maxRadius;
        offsetY = (offsetY / distance) * maxRadius;
    }

    // Update stick position
    stick.style.transform = `translate(calc(-50% + ${offsetX}px), calc(-50% + ${offsetY}px))`;

    // Map to movement (threshold of 10px)
    moveForward = offsetY < -10;
    moveBackward = offsetY > 10;
    moveLeft = offsetX < -10;
    moveRight = offsetX > 10;
    moveUp = false;
    moveDown = false;
}

function handleJoystickEnd(e) {
    e.preventDefault();
    joystickActive = false;

    // Reset stick position
    const stick = document.getElementById('joystick-stick');
    stick.style.transform = 'translate(-50%, -50%)';

    // Stop all movement
    moveForward = false;
    moveBackward = false;
    moveLeft = false;
    moveRight = false;
}
