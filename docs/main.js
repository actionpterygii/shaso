const canvas = document.querySelector('#window-view');
const context = canvas.getContext('2d');
const toggle = document.querySelector('#toggle');

const layers = [
    { speed: 14, baseY: 0.57, color: '#7aa0af', minWidth: 90, maxWidth: 190, minHeight: 35, maxHeight: 105, items: [] },
    { speed: 38, baseY: 0.71, color: '#4f7180', minWidth: 65, maxWidth: 135, minHeight: 60, maxHeight: 165, items: [] },
    { speed: 95, baseY: 0.91, color: '#213e4e', minWidth: 45, maxWidth: 105, minHeight: 85, maxHeight: 235, items: [] }
];

let width = 0;
let height = 0;
let previousTime = 0;
let paused = false;

function randomBetween(min, max) {
    return min + Math.random() * (max - min);
}

function addBuilding(layer, x) {
    const buildingWidth = randomBetween(layer.minWidth, layer.maxWidth);
    layer.items.push({
        x,
        width: buildingWidth,
        height: randomBetween(layer.minHeight, layer.maxHeight),
        roof: Math.random() > 0.7,
        gap: randomBetween(18, 60)
    });
}

function populateLayer(layer) {
    layer.items = [];
    let x = -30;
    while (x < width + 180) {
        addBuilding(layer, x);
        const last = layer.items.at(-1);
        x += last.width + last.gap;
    }
}

function resize() {
    const pixelRatio = Math.min(window.devicePixelRatio, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.round(width * pixelRatio);
    canvas.height = Math.round(height * pixelRatio);
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    layers.forEach(populateLayer);
}

function drawBuilding(building, layer, groundY) {
    const top = groundY - building.height;
    context.fillStyle = layer.color;
    context.fillRect(building.x, top, building.width, building.height);

    if (building.roof) {
        context.fillRect(building.x + building.width * 0.14, top - 10, building.width * 0.72, 10);
    }

    context.fillStyle = 'rgba(255, 231, 158, 0.5)';
    for (let y = top + 16; y < groundY - 10; y += 19) {
        for (let x = building.x + 12; x < building.x + building.width - 8; x += 18) {
            if ((Math.floor(x + y) % 3) !== 0) context.fillRect(x, y, 7, 7);
        }
    }
}

function drawBackground() {
    const sky = context.createLinearGradient(0, 0, 0, height);
    sky.addColorStop(0, '#83cce8');
    sky.addColorStop(0.6, '#d9edf0');
    sky.addColorStop(1, '#f3d7b0');
    context.fillStyle = sky;
    context.fillRect(0, 0, width, height);
    context.fillStyle = 'rgba(255, 250, 216, 0.72)';
    context.beginPath();
    context.arc(width * 0.76, height * 0.2, 45, 0, Math.PI * 2);
    context.fill();
}

function drawFrame() {
    context.fillStyle = 'rgba(13, 22, 29, 0.9)';
    context.fillRect(0, 0, width, 18);
    context.fillRect(0, height - 32, width, 32);
    context.fillRect(0, 0, 20, height);
    context.fillRect(width - 20, 0, 20, height);
}

function render(timestamp) {
    const delta = Math.min((timestamp - previousTime) / 1000 || 0, 0.05);
    previousTime = timestamp;
    drawBackground();

    layers.forEach((layer) => {
        const groundY = height * layer.baseY;
        layer.items.forEach((building) => {
            if (!paused) building.x -= layer.speed * delta;
            drawBuilding(building, layer, groundY);
        });

        const first = layer.items[0];
        if (first.x + first.width < 0) {
            layer.items.shift();
            const last = layer.items.at(-1);
            addBuilding(layer, last.x + last.width + last.gap);
        }
    });

    context.fillStyle = '#172d37';
    context.fillRect(0, height * 0.91, width, height * 0.09);
    drawFrame();
    requestAnimationFrame(render);
}

toggle.addEventListener('click', () => {
    paused = !paused;
    toggle.textContent = paused ? '再生する' : '一時停止';
    toggle.setAttribute('aria-pressed', String(paused));
});

window.addEventListener('resize', resize);
resize();
requestAnimationFrame(render);
