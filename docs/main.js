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

const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x1b2330, roughness: 1 });

const ground = new THREE.Mesh(new THREE.PlaneGeometry(26, 80), groundMaterial);
ground.rotation.x = -Math.PI / 2;
ground.position.z = -15;
scene.add(ground);

const clock = new THREE.Clock();

function animate() {
    clock.getDelta();
    const elapsed = clock.elapsedTime;

    cube.rotation.x = elapsed * 0.7;
    cube.rotation.y = elapsed * 1.05;

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
