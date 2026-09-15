const canvas = document.querySelector('#window-view');
const context = canvas.getContext('2d');
const toggle = document.querySelector('#toggle');

const layers = Array.from({ length: 20 }, (_, index) => {
    const progress = index / 19;
    const hue = 198 + progress * 2;
    const lightness = 58 - progress * 38;

    return {
        speed: 9 + progress * 86,
        baseY: 0.46 + progress * 0.45,
        color: `hsl(${hue} 27% ${lightness}%)`,
        sideColor: `hsl(${hue} 31% ${lightness - 13}%)`,
        roofColor: `hsl(${hue} 25% ${lightness + 10}%)`,
        depth: 6 + progress * 18,
        minWidth: 78 - progress * 33,
        maxWidth: 158 - progress * 53,
        minHeight: 18 + progress * 67,
        maxHeight: 68 + progress * 167,
        items: []
    };
});

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
        lightSeed: Math.floor(Math.random() * 1000),
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
    const center = building.x + building.width / 2;
    const viewOffset = (center / width - 0.5) * 2;
    const depth = layer.depth * Math.min(Math.abs(viewOffset), 1);
    const sideDirection = viewOffset < 0 ? 1 : -1;
    const sideX = sideDirection > 0 ? building.x + building.width : building.x;
    const perspectiveY = depth * 0.55;

    context.fillStyle = layer.sideColor;
    context.beginPath();
    context.moveTo(sideX, top);
    context.lineTo(sideX + sideDirection * depth, top - perspectiveY);
    context.lineTo(sideX + sideDirection * depth, groundY - perspectiveY);
    context.lineTo(sideX, groundY);
    context.closePath();
    context.fill();

    context.fillStyle = layer.roofColor;
    context.beginPath();
    context.moveTo(building.x, top);
    context.lineTo(building.x + sideDirection * depth, top - perspectiveY);
    context.lineTo(building.x + building.width + sideDirection * depth, top - perspectiveY);
    context.lineTo(building.x + building.width, top);
    context.closePath();
    context.fill();

    context.fillStyle = layer.color;
    context.fillRect(building.x, top, building.width, building.height);

    if (building.roof) {
        context.fillRect(building.x + building.width * 0.14, top - 10, building.width * 0.72, 10);
    }

    const lightLevels = [0, 0.18, 0.36, 0.58, 0.82];
    let row = 0;
    for (let y = top + 16; y < groundY - 10; y += 19) {
        let column = 0;
        for (let x = building.x + 12; x < building.x + building.width - 8; x += 18) {
            const level = (building.lightSeed + row * 7 + column * 11) % lightLevels.length;
            context.fillStyle = `rgba(255, 231, 158, ${lightLevels[level]})`;
            context.fillRect(x, y, 7, 7);
            column += 1;
        }
        row += 1;
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
