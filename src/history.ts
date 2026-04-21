const container = document.getElementById('history-container') as HTMLDivElement;
const historySeeds: string[] = JSON.parse(localStorage.getItem('mandala-history') || '[]');

const instrumentStyles = [
    { color: 'rgba(255, 87, 51, 0.9)', strokeWidth: 1 },  // kick
    { color: 'rgba(51, 255, 87, 0.9)', strokeWidth: 1 },  // snare
    { color: 'rgba(51, 87, 255, 0.9)', strokeWidth: 1 },  // hiHat
    { color: 'rgba(255, 146, 51, 0.9)', strokeWidth: 1 }, // clap
    { color: 'rgba(255, 51, 243, 0.9)', strokeWidth: 1 }  // tom
];

// Helper to calculate the star/bar points
function getPoints(offsetDegrees: number, radius: number, cx: number, cy: number, bars: number) {
    const offset = (offsetDegrees * Math.PI) / 180;
    const points = [];
    for (let i = 0; i < bars; i++) {
        const angle = (i * 2 * Math.PI) / bars - Math.PI / 2 + offset;
        points.push({ x: cx + radius * Math.cos(angle), y: cy + radius * Math.sin(angle) });
    }
    return points;
}

// Standalone renderer that directly parses the "0100|1000..." seed
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

            // Draw Original Curve
            const path = document.createElementNS(svgNS, "path");
            path.setAttribute("d", `M${basePointA.x},${basePointA.y} Q${rotatedControlX},${rotatedControlY} ${mirrorPoint.x},${mirrorPoint.y}`);
            path.setAttribute("stroke", style.color);
            path.setAttribute("stroke-width", style.strokeWidth.toString());
            path.setAttribute("fill", `transparent`);
            svg.appendChild(path);

            // Calculate Reflection
            const a = mirrorPoint.y - cy;
            const b = cx - mirrorPoint.x;
            const c = (cy - mirrorPoint.y) * cx + (mirrorPoint.x - cx) * cy;
            const denominator = a * a + b * b;

            if (denominator !== 0) {
                const reflectedX = rotatedControlX - (2 * a * (a * rotatedControlX + b * rotatedControlY + c)) / denominator;
                const reflectedY = rotatedControlY - (2 * b * (a * rotatedControlX + b * rotatedControlY + c)) / denominator;

                // Draw Reversed Curve
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

// Generate the floating mandalas
historySeeds.forEach((seed) => {
    const wrapper = document.createElement('div');
    wrapper.className = 'mandala-wrapper';

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 400 400');
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');

    // Call our clean, standalone renderer
    renderMandalaFromSeed(svg, seed);

    wrapper.appendChild(svg);
    container.appendChild(wrapper);

    // Animation logic
    let x = Math.random() * (window.innerWidth - 200);
    let y = Math.random() * (window.innerHeight - 200);
    let vx = (Math.random() - 0.5) * 3;
    let vy = (Math.random() - 0.5) * 3;

    function animate() {
        x += vx;
        y += vy;

        if (x <= 0 || x >= window.innerWidth - 200) vx *= -1;
        if (y <= 0 || y >= window.innerHeight - 200) vy *= -1;

        wrapper.style.transform = `translate(${x}px, ${y}px)`;
        requestAnimationFrame(animate);
    }

    animate();
});