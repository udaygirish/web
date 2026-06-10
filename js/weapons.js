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

