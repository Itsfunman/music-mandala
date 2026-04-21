const container = document.getElementById('history-container') as HTMLDivElement;
const historySeeds: string[] = JSON.parse(localStorage.getItem('mandala-history') || '[]');

// --- CONFIGURATION ---
const MANDALA_SIZE_PERCENT = 0.2;
const MANDALA_LINE_THICKNESS = 2.0;
const BORDER_SIZE_PERCENT = 0.0;

const instrumentStyles = [
    { color: 'rgba(255, 87, 51, 0.9)', strokeWidth: MANDALA_LINE_THICKNESS },  // kick
    { color: 'rgba(51, 255, 87, 0.9)', strokeWidth: MANDALA_LINE_THICKNESS },  // snare
    { color: 'rgba(51, 87, 255, 0.9)', strokeWidth: MANDALA_LINE_THICKNESS },  // hiHat
    { color: 'rgba(255, 146, 51, 0.9)', strokeWidth: MANDALA_LINE_THICKNESS }, // clap
    { color: 'rgba(255, 51, 243, 0.9)', strokeWidth: MANDALA_LINE_THICKNESS }  // tom
];

function getPoints(offsetDegrees: number, radius: number, cx: number, cy: number, bars: number) {
    const offset = (offsetDegrees * Math.PI) / 180;
    const points = [];
    for (let i = 0; i < bars; i++) {
        const angle = (i * 2 * Math.PI) / bars - Math.PI / 2 + offset;
        points.push({ x: cx + radius * Math.cos(angle), y: cy + radius * Math.sin(angle) });
    }
    return points;
}

function renderMandalaFromSeed(svg: SVGSVGElement, seed: string) {
    const cx = 200, cy = 200, baseRadius = 30, bars = 8, radiusStep = 30;
    const svgNS = "http://www.w3.org/2000/svg";
    const parts = seed.split('|');

    parts.forEach((patternBinary, i) => {
        if (i >= instrumentStyles.length) return;
        const style = instrumentStyles[i];
        const patternDecimal = parseInt(patternBinary, 2) || 0;

        if (patternDecimal === 0) return;

        const lineSeed = (patternDecimal % 1000) / 1000;
        const currentRadius = baseRadius + i * radiusStep;

        const basePoints = getPoints(0, currentRadius, cx, cy, bars);
        const mirrorPoints = getPoints(180 / bars, currentRadius, cx, cy, bars);
        const angleBetweenPoints = (2 * Math.PI) / bars;

        for (let j = 0; j < basePoints.length; j++) {
            const basePointA = basePoints[j];
            const mirrorPoint = mirrorPoints[j];
            const basePointB = basePoints[(j + 1) % basePoints.length];

            const angle = j * angleBetweenPoints;
            const controlX = cx + (lineSeed - 0.5) * currentRadius * 0.5;
            const controlY = cy + (lineSeed - 0.5) * currentRadius * 0.5;

            const dx = controlX - cx;
            const dy = controlY - cy;

            const rotatedControlX = cx + dx * Math.cos(angle) - dy * Math.sin(angle);
            const rotatedControlY = cy + dx * Math.sin(angle) + dy * Math.cos(angle);

            const path = document.createElementNS(svgNS, "path");
            path.setAttribute("d", `M${basePointA.x},${basePointA.y} Q${rotatedControlX},${rotatedControlY} ${mirrorPoint.x},${mirrorPoint.y}`);
            path.setAttribute("stroke", style.color);
            path.setAttribute("stroke-width", style.strokeWidth.toString());
            path.setAttribute("fill", `transparent`);
            svg.appendChild(path);

            const a = mirrorPoint.y - cy;
            const b = cx - mirrorPoint.x;
            const c = (cy - mirrorPoint.y) * cx + (mirrorPoint.x - cx) * cy;
            const denominator = a * a + b * b;

            if (denominator !== 0) {
                const reflectedX = rotatedControlX - (2 * a * (a * rotatedControlX + b * rotatedControlY + c)) / denominator;
                const reflectedY = rotatedControlY - (2 * b * (a * rotatedControlX + b * rotatedControlY + c)) / denominator;

                const reversedPath = document.createElementNS(svgNS, "path");
                reversedPath.setAttribute("d", `M${mirrorPoint.x},${mirrorPoint.y} Q${reflectedX},${reflectedY} ${basePointB.x},${basePointB.y}`);
                reversedPath.setAttribute("stroke", style.color);
                reversedPath.setAttribute("stroke-width", style.strokeWidth.toString());
                reversedPath.setAttribute("fill", `transparent`);
                svg.appendChild(reversedPath);
            }
        }
    });
}

historySeeds.forEach((seed) => {
    const wrapper = document.createElement('div');
    wrapper.className = 'mandala-wrapper';
    wrapper.style.position = 'absolute';

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 400 400');
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');

    renderMandalaFromSeed(svg, seed);

    wrapper.appendChild(svg);
    container.appendChild(wrapper);

    let vx = (Math.random() > 0.5 ? 1 : -1) * (1 + Math.random() * 2);
    let vy = (Math.random() > 0.5 ? 1 : -1) * (1 + Math.random() * 2);

    let x = window.innerWidth / 2;
    let y = window.innerHeight / 2;

    function animate() {
        // 1. Calculate the exact mandala size (visual == hitbox)
        const minDim = Math.min(window.innerWidth, window.innerHeight);
        const mandalaSize = minDim * MANDALA_SIZE_PERCENT;

        wrapper.style.width = `${mandalaSize}px`;
        wrapper.style.height = `${mandalaSize}px`;

        // 2. Calculate the boundaries of the virtual border they bounce in
        const boundaryWidth = window.innerWidth * (1 - BORDER_SIZE_PERCENT);
        const boundaryHeight = window.innerHeight * (1 - BORDER_SIZE_PERCENT);

        // Center the bouncing boundary perfectly on the screen
        const offsetX = (window.innerWidth - boundaryWidth) / 2;
        const offsetY = (window.innerHeight - boundaryHeight) / 2;

        x += vx;
        y += vy;

        // 3. Bouncing collision: Check exactly against the mandala size
        if (x <= offsetX) {
            x = offsetX;
            vx = Math.abs(vx); // Force right
        } else if (x >= offsetX + boundaryWidth - mandalaSize) {
            x = offsetX + boundaryWidth - mandalaSize;
            vx = -Math.abs(vx); // Force left
        }

        if (y <= offsetY) {
            y = offsetY;
            vy = Math.abs(vy); // Force down
        } else if (y >= offsetY + boundaryHeight - mandalaSize) {
            y = offsetY + boundaryHeight - mandalaSize;
            vy = -Math.abs(vy); // Force up
        }

        wrapper.style.transform = `translate(${x}px, ${y}px)`;
        requestAnimationFrame(animate);
    }

    animate();
});