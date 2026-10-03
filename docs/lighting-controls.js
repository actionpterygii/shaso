// Temporary controls for comparing surface contrast without regenerating the city.
export function setupLightingControls({ THREE, ambientLight, sideLight, wall, facades, groundMaterial }) {
    const panel = document.querySelector('#lighting-controls');
    const originalColor = wall.color.clone();
    const initialAzimuth = THREE.MathUtils.radToDeg(Math.atan2(-60, 40));
    const initialElevation = THREE.MathUtils.radToDeg(Math.atan2(80, Math.hypot(60, 40)));
    const settings = [
        { key: 'directional', label: '斜光の強さ', min: 0, max: 8, step: 0.1, value: 0.6 },
        { key: 'ambient', label: '環境光の強さ', min: 0, max: 3, step: 0.05, value: 0.5 },
        { key: 'azimuth', label: '光の方向（度）', min: -180, max: 180, step: 0.1, value: initialAzimuth },
        { key: 'elevation', label: '光の高さ（度）', min: 0, max: 90, step: 0.1, value: initialElevation },
        { key: 'building', label: 'ビルの色の明るさ（倍）', min: 0, max: 12, step: 0.1, value: 1 },
        { key: 'ground', label: '地面の色の明るさ（倍）', min: 0, max: 12, step: 0.1, value: 1 }
    ];
    const values = Object.fromEntries(settings.map(setting => [setting.key, setting.value]));
    const controls = [];
    function apply() {
        ambientLight.intensity = values.ambient;
        sideLight.intensity = values.directional;
        const azimuth = THREE.MathUtils.degToRad(values.azimuth);
        const elevation = THREE.MathUtils.degToRad(values.elevation);
        sideLight.position.set(
            100 * Math.cos(elevation) * Math.sin(azimuth),
            100 * Math.sin(elevation),
            100 * Math.cos(elevation) * Math.cos(azimuth)
        );
        [wall, ...facades].forEach(material => material.color.copy(originalColor).multiplyScalar(values.building));
        groundMaterial.color.copy(originalColor).multiplyScalar(values.ground);
    }
    settings.forEach(setting => {
        const row = document.createElement('div');
        row.className = 'lighting-row';
        const label = document.createElement('label');
        const input = document.createElement('input');
        const output = document.createElement('output');
        input.id = `lighting-${setting.key}`;
        label.htmlFor = input.id;
        label.textContent = setting.label;
        input.type = 'range';
        input.min = setting.min;
        input.max = setting.max;
        input.step = setting.step;
        input.value = setting.value;
        output.htmlFor = input.id;
        output.id = `${input.id}-value`;
        input.setAttribute('aria-describedby', output.id);
        output.textContent = setting.value.toFixed(2);
        input.addEventListener('input', () => {
            values[setting.key] = Number(input.value);
            output.textContent = values[setting.key].toFixed(2);
            apply();
        });
        controls.push({ input, output, setting });
        row.append(label, output, input);
        panel.append(row);
    });
    document.querySelector('#lighting-reset').addEventListener('click', () => {
        controls.forEach(({ input, output, setting }) => {
            input.value = setting.value;
            values[setting.key] = setting.value;
            output.textContent = setting.value.toFixed(2);
        });
        apply();
    });
}
