import * as THREE from './vendor/three/three.module.js';

const canvas = document.querySelector('#window-view');
const toggle = document.querySelector('#toggle');
const scene = new THREE.Scene();
scene.background = new THREE.Color('#03050c');
const camera = new THREE.PerspectiveCamera(48, 1, 0.1, 400);
// A level camera keeps vertical walls vertical; only the city translates.
camera.position.set(0, 14, 65);
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const box = new THREE.BoxGeometry(1, 1, 1);
const wall = new THREE.MeshStandardMaterial({
    color: '#151b28', roughness: 0.92, metalness: 0
});

// Reuse a small set of emission maps rather than creating one light per window.
const facades = Array.from({ length: 8 }, () => {
    const textureCanvas = document.createElement('canvas');
    textureCanvas.width = 128;
    textureCanvas.height = 256;
    const ctx = textureCanvas.getContext('2d');
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, 128, 256);
    for (let row = 0; row < 10; row += 1) {
        for (let column = 0; column < 5; column += 1) {
            // The lowest central window also anchors the nearby light source.
            const lit = (row === 9 && column === 2) || Math.random() > 0.45;
            if (!lit) continue;
            const value = Math.floor(100 + Math.random() * 155);
            ctx.fillStyle = `rgb(${value}, ${value}, ${value})`;
            ctx.fillRect(8 + column * 24, 10 + row * 24, 16, 14);
        }
    }
    const emission = new THREE.CanvasTexture(textureCanvas);
    emission.colorSpace = THREE.SRGBColorSpace;
    return new THREE.MeshStandardMaterial({
        color: '#151b28', roughness: 0.92, metalness: 0,
        emissive: '#ffce88', emissiveIntensity: 2.4, emissiveMap: emission
    });
});

const ground = new THREE.Mesh(new THREE.PlaneGeometry(2400, 600), wall);
ground.rotation.x = -Math.PI / 2;
ground.position.z = -140;
ground.receiveShadow = true;
scene.add(ground);

const CLUSTER_WIDTH = 90;
const BUILDING_GAP = 0.25;

const layers = Array.from({ length: 5 }, (_, index) => ({
    z: -index * 32, items: [], halfSpan: 0, clusterRemaining: 0, buildingWidth: 0
}));
let paused = false;
let previousTime = null;

function nextBuildingLayout(layer) {
    if (layer.clusterRemaining === 0) {
        const count = 1 + Math.floor(Math.random() * 10);
        layer.clusterRemaining = count;
        // Include all internal gaps in the fixed outer width of each cluster.
        layer.buildingWidth = (CLUSTER_WIDTH - BUILDING_GAP * (count - 1)) / count;
    }
    layer.clusterRemaining -= 1;
    return {
        width: layer.buildingWidth,
        gap: layer.clusterRemaining > 0 ? BUILDING_GAP : 22 + Math.random() * 18
    };
}

function addBuilding(layer, leftEdge) {
    const { width, gap } = nextBuildingLayout(layer);
    const height = 12 + Math.random() * 25;
    const depth = 7 + Math.random() * 6;
    const facade = facades[Math.floor(Math.random() * facades.length)];
    const group = new THREE.Group();
    const body = new THREE.Mesh(box, [facade, facade, wall, wall, facade, facade]);
    body.scale.set(width, height, depth);
    body.position.y = height / 2;
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);
    if (Math.random() > 0.6) {
        const roof = new THREE.Mesh(box, wall);
        roof.scale.set(width * 0.6, 1.5, depth * 0.65);
        roof.position.y = height + 0.75;
        roof.castShadow = true;
        roof.receiveShadow = true;
        group.add(roof);
    }
    group.position.set(leftEdge + width / 2, 0, layer.z);
    scene.add(group);
    const building = { group, width, height, depth, gap };
    layer.items.push(building);
    return building;
}

function extendLayer(layer) {
    let last = layer.items.at(-1);
    while (!last || last.group.position.x - last.width / 2 < layer.halfSpan) {
        const x = last ? last.group.position.x + last.width / 2 + last.gap : -layer.halfSpan;
        last = addBuilding(layer, x);
    }
}

// Only window lights illuminate surfaces. No sun, ambient light or environment map.
// Limit shadow-casting lights to three nearby windows to keep rendering affordable.
const windowLights = Array.from({ length: 3 }, () => {
    const light = new THREE.SpotLight('#ffce88', 100, 35, Math.PI / 3, 0.8, 2);
    light.castShadow = true;
    light.shadow.mapSize.set(512, 512);
    light.shadow.bias = -0.001;
    light.shadow.normalBias = 0.04;
    scene.add(light, light.target);
    return light;
});

function updateWindowLights() {
    const nearest = [...layers[0].items].sort((a, b) =>
        Math.abs(a.group.position.x) - Math.abs(b.group.position.x));
    windowLights.forEach((light, index) => {
        const building = nearest[index];
        light.visible = Boolean(building);
        if (!building) return;
        const x = building.group.position.x;
        const z = building.group.position.z + building.depth / 2;
        const y = building.height * (1 - 233 / 256);
        light.position.set(x, y, z + 0.25);
        light.target.position.set(x, 0, z + 4);
    });
}

function resize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    layers.forEach((layer) => {
        const halfSpan = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) *
            (camera.position.z - layer.z + 7) * camera.aspect + 30;
        // Rebuild only when the viewport changes, disposing no shared resources.
        layer.items.forEach(({ group }) => scene.remove(group));
        layer.items = [];
        layer.clusterRemaining = 0;
        layer.halfSpan = halfSpan;
        extendLayer(layer);
    });
    updateWindowLights();
}

function render(timestamp) {
    const delta = previousTime === null ? 0 : Math.min((timestamp - previousTime) / 1000, 0.05);
    previousTime = timestamp;
    if (!paused) {
        layers.forEach((layer) => {
            layer.items.forEach(({ group }) => { group.position.x -= 8 * delta; });
            while (layer.items.length && layer.items[0].group.position.x + layer.items[0].width / 2 < -layer.halfSpan) {
                scene.remove(layer.items.shift().group);
            }
            // Continue the cluster at the right edge using shared geometry/materials.
            extendLayer(layer);
        });
    }
    updateWindowLights();
    renderer.render(scene, camera);
}

toggle.addEventListener('click', () => {
    paused = !paused;
    toggle.textContent = paused ? '再生する' : '一時停止';
    toggle.setAttribute('aria-pressed', String(paused));
});
window.addEventListener('resize', resize);
resize();
renderer.setAnimationLoop(render);
