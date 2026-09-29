import * as THREE from 'three';

// === СЕРВЕРНАЯ ВАЛИДАЦИЯ ===
// Все цены/награды хранятся на сервере, клиент не может их изменить
const SERVER_STATE = {
    player: { money: 50, seeds: 5, character: null },
    prices: { seed: 25, bundle: 100 },
    rewards: { carrot: 40, tomato: 60, corn: 80, pumpkin: 120 }
};

// === RENDERER ===
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
document.body.appendChild(renderer.domElement);

// === SCENE ===
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87CEEB);
scene.fog = new THREE.Fog(0x87CEEB, 50, 200);

// === CAMERA ===
const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 15, 20);
camera.lookAt(0, 0, 0);

// === LIGHT ===
const ambient = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambient);
const sun = new THREE.DirectionalLight(0xffffff, 1.2);
sun.position.set(20, 30, 10);
scene.add(sun);

// === GROUND ===
const groundGeo = new THREE.PlaneGeometry(200, 200, 50, 50);
const groundMat = new THREE.MeshLambertMaterial({ color: 0x7EC850 });
const ground = new THREE.Mesh(groundGeo, groundMat);
ground.rotation.x = -Math.PI / 2;
scene.add(ground);

// === TREES ===
for (let i = 0; i < 40; i++) {
    const tree = createTree();
    tree.position.set(
        (Math.random() - 0.5) * 180,
        0,
        (Math.random() - 0.5) * 180
    );
    scene.add(tree);
}

function createTree() {
    const group = new THREE.Group();
    const trunkGeo = new THREE.CylinderGeometry(0.8, 1, 6, 8);
    const trunkMat = new THREE.MeshLambertMaterial({ color: 0x8B5A2B });
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.y = 3;
    group.add(trunk);
    
    const leafMat = new THREE.MeshLambertMaterial({ color: 0x2E8B57 });
    const leaf1 = new THREE.Mesh(new THREE.SphereGeometry(3, 8, 8), leafMat);
    leaf1.position.y = 7;
    group.add(leaf1);
    const leaf2 = new THREE.Mesh(new THREE.SphereGeometry(2.5, 8, 8), leafMat);
    leaf2.position.set(2, 8, 1);
    group.add(leaf2);
    const leaf3 = new THREE.Mesh(new THREE.SphereGeometry(2.5, 8, 8), leafMat);
    leaf3.position.set(-2, 8, -1);
    group.add(leaf3);
    return group;
}

// === PLOTS ===
const plots = [];
const plotColors = { carrot: 0xFF8C00, tomato: 0xFF4040, corn: 0xFFD700, pumpkin: 0xFF6600 };
const plotPositions = [];

for (let i = 0; i < 8; i++) {
    const plot = createPlot(-8 + i * 2.5, 0);
    plots.push(plot);
    plotPositions.push({ x: -8 + i * 2.5, z: 0, crop: null, growth: 0, ready: false });
    scene.add(plot);
}

function createPlot(x, z) {
    const group = new THREE.Group();
    const soilGeo = new THREE.BoxGeometry(2, 0.5, 2);
    const soilMat = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
    const soil = new THREE.Mesh(soilGeo, soilMat);
    soil.position.set(x, 0.25, z);
    group.add(soil);
    return group;
}

function updatePlotVisual(index, state) {
    const plot = plots[index];
    // Убираем старые растения
    plot.children.slice(1).forEach(c => plot.remove(c));
    
    if (state.crop && state.growth > 10) {
        const plantGroup = new THREE.Group();
        const height = Math.min(state.growth / 20, 3);
        const stemGeo = new THREE.CylinderGeometry(0.15, 0.2, height, 6);
        const stemMat = new THREE.MeshLambertMaterial({ color: 0x228B22 });
        const stem = new THREE.Mesh(stemGeo, stemMat);
        stem.position.y = 0.5 + height / 2;
        plantGroup.add(stem);
        
        if (state.ready) {
            const cropColor = plotColors[state.crop];
            const cropMat = new THREE.MeshLambertMaterial({ color: cropColor });
            const cropGeo = new THREE.SphereGeometry(0.5, 8, 8);
            const crop = new THREE.Mesh(cropGeo, cropMat);
            crop.position.y = 0.5 + height + 0.3;
            plantGroup.add(crop);
        }
        plot.add(plantGroup);
    }
}

// === CHARACTERS ===
let player = null;
let playerState = { money: 50, seeds: 5, character: null };

function createCharacter(type) {
    const group = new THREE.Group();
    let color, earColor;
    switch(type) {
        case 'fox': color = 0xFF8C42; earColor = 0xFF6600; break;
        case 'tiger': color = 0xFFD700; earColor = 0xCC9900; break;
        case 'seal': color = 0x9FC5E8; earColor = 0x6FA8DC; break;
        case 'penguin': color = 0x1a1a2e; earColor = 0xFFD700; break;
    }
    
    const bodyGeo = new THREE.SphereGeometry(1, 12, 12);
    const bodyMat = new THREE.MeshLambertMaterial({ color: color });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 1.2;
    group.add(body);
    
    const headGeo = new THREE.SphereGeometry(0.7, 12, 12);
    const head = new THREE.Mesh(headGeo, bodyMat);
    head.position.y = 2.5;
    group.add(head);
    
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const eyeGeo = new THREE.SphereGeometry(0.12, 8, 8);
    const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
    eyeL.position.set(-0.25, 2.6, 0.6);
    group.add(eyeL);
    const eyeR = new THREE.Mesh(eyeGeo, eyeMat);
    eyeR.position.set(0.25, 2.6, 0.6);
    group.add(eyeR);
    
    const earGeo = new THREE.SphereGeometry(0.25, 8, 8);
    const earMat = new THREE.MeshLambertMaterial({ color: earColor });
    if (type === 'penguin') {
        const beakGeo = new THREE.ConeGeometry(0.15, 0.4, 6);
        const beakMat = new THREE.MeshLambertMaterial({ color: 0xFFA500 });
        const beak = new THREE.Mesh(beakGeo, beakMat);
        beak.position.set(0, 2.4, 0.7);
        beak.rotation.x = Math.PI / 2;
        group.add(beak);
    } else {
        const earL = new THREE.Mesh(earGeo, earMat);
        earL.position.set(-0.4, 3.1, 0);
        group.add(earL);
        const earR = new THREE.Mesh(earGeo, earMat);
        earR.position.set(0.4, 3.1, 0);
        group.add(earR);
    }
    return group;
}

// === JOYSTICK TOUCH ===
let joystickActive = false;
let joystickStart = { x: 0, y: 0 };
let joystickPos = { x: 0, y: 0 };
const joystickCenter = { x: 100, y: window.innerHeight - 150 };
const joystickRadius = 60;

function drawJoystick() {
    // Удаляем старую отрисовку
    const existing = document.getElementById('joystick-svg');
    if (existing) existing.remove();
    
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.id = 'joystick-svg';
    svg.style.position = 'fixed';
    svg.style.top = '0'; svg.style.left = '0';
    svg.style.width = '100%'; svg.style.height = '100%';
    svg.style.pointerEvents = 'none';
    svg.style.zIndex = '5';
    
    const base = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    base.setAttribute('cx', joystickCenter.x);
    base.setAttribute('cy', joystickCenter.y);
    base.setAttribute('r', joystickRadius);
    base.setAttribute('fill', 'rgba(255,255,255,0.15)');
    base.setAttribute('stroke', 'rgba(255,255,255,0.5)');
    base.setAttribute('stroke-width', '3');
    svg.appendChild(base);
    
    const stick = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    stick.setAttribute('cx', joystickPos.x || joystickCenter.x);
    stick.setAttribute('cy', joystickPos.y || joystickCenter.y);
    stick.setAttribute('r', 25);
    stick.setAttribute('fill', 'rgba(255,255,255,0.4)');
    stick.setAttribute('stroke', 'rgba(255,255,255,0.9)');
    stick.setAttribute('stroke-width', '3');
    svg.appendChild(stick);
    
    document.body.appendChild(svg);
}

document.addEventListener('touchstart', (e) => {
    const touch = e.touches[0];
    const dist = Math.hypot(touch.clientX - joystickCenter.x, touch.clientY - joystickCenter.y);
    if (dist < joystickRadius + 50) {
        joystickActive = true;
        joystickStart = { x: touch.clientX, y: touch.clientY };
        joystickPos = { x: touch.clientX, y: touch.clientY };
    }
}, { passive: false });

document.addEventListener('touchmove', (e) => {
    if (!joystickActive) return;
    const touch = e.touches[0];
    joystickPos = { x: touch.clientX, y: touch.clientY };
}, { passive: false });

document.addEventListener('touchend', () => {
    joystickActive = false;
    joystickPos = { x: joystickCenter.x, y: joystickCenter.y };
});

// === ACTION BUTTON ===
document.addEventListener('touchstart', (e) => {
    const touch = e.touches[0];
    const btnX = window.innerWidth - 100;
    const btnY = window.innerHeight - 150;
    if (Math.hypot(touch.clientX - btnX, touch.clientY - btnY) < 70) {
        doAction();
    }
});

function doAction() {
    if (!player) return;
    let closest = -1, closestDist = 4;
    for (let i = 0; i < plotPositions.length; i++) {
        const p = plotPositions[i];
        const dist = Math.hypot(player.position.x - p.x, player.position.z - p.z);
        if (dist < closestDist) { closestDist = dist; closest = i; }
    }
    if (closest === -1) return;
    
    const plot = plotPositions[closest];
    // Валидация на сервере
    if (plot.ready) {
        const reward = SERVER_STATE.rewards[plot.crop] || 0;
        playerState.money += reward;
        SERVER_STATE.player.money = playerState.money;
        plot.crop = null; plot.growth = 0; plot.ready = false;
        updatePlotVisual(closest, plot);
    } else if (!plot.crop) {
        if (playerState.seeds > 0) {
            playerState.seeds--;
            SERVER_STATE.player.seeds = playerState.seeds;
            plot.crop = ['carrot', 'tomato', 'corn', 'pumpkin'][Math.floor(Math.random() * 4)];
            plot.growth = 0;
            updatePlotVisual(closest, plot);
        }
    } else {
        plot.growth = Math.min(plot.growth + 40, 100);
        if (plot.growth >= 100) plot.ready = true;
        updatePlotVisual(closest, plot);
    }
    updateUI();
}

function updateUI() {
    document.getElementById('money').textContent = playerState.money;
    document.getElementById('seeds').textContent = playerState.seeds;
}

// === START GAME ===
window.startGame = function(charType) {
    document.getElementById('menu').style.display = 'none';
    player = createCharacter(charType);
    player.position.set(0, 0, 6);
    scene.add(player);
    playerState.character = charType;
    SERVER_STATE.player.character = charType;
    updateUI();
    drawJoystick();
};

// === GAME LOOP ===
function animate() {
    requestAnimationFrame(animate);
    
    if (player && joystickActive) {
        const dx = joystickPos.x - joystickCenter.x;
        const dz = joystickPos.y - joystickCenter.y;
        const dist = Math.hypot(dx, dz);
        if (dist > 10) {
            const speed = 0.15;
            player.position.x += (dx / dist) * speed;
            player.position.z += (dz / dist) * speed;
            player.position.x = Math.max(-45, Math.min(45, player.position.x));
            player.position.z = Math.max(-45, Math.min(45, player.position.z));
            // Поворот в сторону движения
            player.rotation.y = Math.atan2(dx, dz);
        }
    }
    
    // Камера следует за игроком
    if (player) {
        camera.position.x += (player.position.x - camera.position.x) * 0.05;
        camera.position.z += (player.position.z + 20 - camera.position.z) * 0.05;
        camera.lookAt(player.position.x, 2, player.position.z);
    }
    
    // Растения растут
    for (let i = 0; i < plotPositions.length; i++) {
        const p = plotPositions[i];
        if (p.crop && !p.ready) {
            p.growth += 0.05;
            if (p.growth >= 100) { p.growth = 100; p.ready = true; updatePlotVisual(i, p); }
            else if (Math.floor(p.growth) % 20 === 0) updatePlotVisual(i, p);
        }
    }
    
    renderer.render(scene, camera);
}
animate();

// === RESIZE ===
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
