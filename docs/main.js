import * as THREE from './vendor/three/three.module.js';

const app = document.querySelector('#app');
const status = document.querySelector('#status');

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x101319);
scene.fog = new THREE.Fog(0x101319, 12, 42);

const camera = new THREE.PerspectiveCamera(62, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 2.2, 6);
camera.lookAt(0, 1, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
app.appendChild(renderer.domElement);

const ambient = new THREE.HemisphereLight(0xbfd9ff, 0x20242d, 2.4);
scene.add(ambient);

const sun = new THREE.DirectionalLight(0xffffff, 2.8);
sun.position.set(4, 6, 5);
scene.add(sun);

const cube = new THREE.Mesh(
    new THREE.BoxGeometry(1.4, 1.4, 1.4),
    new THREE.MeshStandardMaterial({
        color: 0x4fd8ff,
        roughness: 0.42,
        metalness: 0.18
    })
);
cube.position.y = 1.45;
scene.add(cube);

const railMaterial = new THREE.MeshStandardMaterial({ color: 0xdfe6f2, roughness: 0.58 });
const sleeperMaterial = new THREE.MeshStandardMaterial({ color: 0x46505d, roughness: 0.8 });
const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x1b2330, roughness: 1 });

const ground = new THREE.Mesh(new THREE.PlaneGeometry(26, 80), groundMaterial);
ground.rotation.x = -Math.PI / 2;
ground.position.z = -15;
scene.add(ground);

for (const x of [-1.15, 1.15]) {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.08, 80), railMaterial);
    rail.position.set(x, 0.08, -15);
    scene.add(rail);
}

const sleepers = [];
for (let i = 0; i < 34; i += 1) {
    const sleeper = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.08, 0.18), sleeperMaterial);
    sleeper.position.set(0, 0.04, 8 - i * 1.6);
    sleepers.push(sleeper);
    scene.add(sleeper);
}

const clock = new THREE.Clock();
const speed = 9;

function animate() {
    const delta = clock.getDelta();
    const elapsed = clock.elapsedTime;

    cube.rotation.x = elapsed * 0.7;
    cube.rotation.y = elapsed * 1.05;

    for (const sleeper of sleepers) {
        sleeper.position.z += speed * delta;
        if (sleeper.position.z > 9) {
            sleeper.position.z -= sleepers.length * 1.6;
        }
    }

    renderer.render(scene, camera);
    requestAnimationFrame(animate);
}

function resize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

window.addEventListener('resize', resize);
status.textContent = `three.js loaded: ${THREE.REVISION}`;
animate();
