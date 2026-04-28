import { MandalaService } from './services/MandalaService';

const container = document.getElementById('history-container') as HTMLDivElement;
const historySeeds: string[] = JSON.parse(localStorage.getItem('mandala-history') || '[]');

// --- CONFIGURATION ---
const MANDALA_SIZE_PERCENT = 0.3;
const MANDALA_LINE_THICKNESS = 2.0;
const BORDER_SIZE_PERCENT = 0.0;

// NEW: Control the movement and rotation speeds
const FLIGHT_SPEED = 1.0;    // Multiplier for movement speed (e.g., 2.0 is twice as fast)
const ROTATION_SPEED = 1.0;  // Base rotation speed in degrees per frame
// ---------------------

const instrumentStyles = Object.values(MandalaService.instrumentStyles).map(style => ({
    ...style,
    strokeWidth: MANDALA_LINE_THICKNESS
}));

function renderMandalaFromSeed(svg: SVGSVGElement, seed: string) {
    const cx = 200, cy = 200, baseRadius = 30, bars = 8, radiusStep = 30;

    createVinylBackground(svg, cx, cy, 190);

    const parts = seed.split('|');

    parts.forEach((patternBinary, i) => {
        const style = instrumentStyles[i];
        const patternDecimal = parseInt(patternBinary, 2) || 0;

        if (patternDecimal === 0) return;

        const lineSeed = (patternDecimal % 1000) / 1000;
        const currentRadius = baseRadius + i * radiusStep;

        MandalaService.drawLines(svg, currentRadius, lineSeed, style.color, style.strokeWidth, cx, cy, bars);
    });
}

function createVinylBackground(svg: SVGSVGElement, cx: number, cy: number, radius: number, grooveCount: number = 25) {
    const svgNS = "http://www.w3.org/2000/svg";

    // Unique ID to avoid collisions across multiple SVGs
    const uid = `vinyl-${Math.random().toString(36).slice(2)}`;

    // defs for gradient
    const defs = document.createElementNS(svgNS, "defs");

    // gradient
    const gradient = document.createElementNS(svgNS, "radialGradient");
    gradient.setAttribute("id", `${uid}-gradient`);

    const stop1 = document.createElementNS(svgNS, "stop");
    stop1.setAttribute("offset", "0%");
    stop1.setAttribute("stop-color", "#222");

    const stop2 = document.createElementNS(svgNS, "stop");
    stop2.setAttribute("offset", "100%");
    stop2.setAttribute("stop-color", "black");

    gradient.appendChild(stop1);
    gradient.appendChild(stop2);

    defs.appendChild(gradient);
    svg.appendChild(defs);

    // disc
    const disc = document.createElementNS(svgNS, "circle");
    disc.setAttribute("cx", cx.toString());
    disc.setAttribute("cy", cy.toString());
    disc.setAttribute("r", radius.toString());
    disc.setAttribute("fill", `url(#${uid}-gradient)`);
    svg.appendChild(disc);

    // grooves
    const grooveSpacing = radius / grooveCount;

    for (let i = 1; i < grooveCount; i++) {
        const grooveCircle = document.createElementNS(svgNS, "circle");

        grooveCircle.setAttribute("cx", cx.toString());
        grooveCircle.setAttribute("cy", cy.toString());
        grooveCircle.setAttribute("r", (radius - i * grooveSpacing).toString());

        grooveCircle.setAttribute("fill", "none");
        grooveCircle.setAttribute("stroke", "rgba(255,255,255,0.08)");
        grooveCircle.setAttribute("stroke-width", "1.2");

        svg.appendChild(grooveCircle);
    }

    // label spacing
    const labelSpacing = document.createElementNS(svgNS, "circle");
    labelSpacing.setAttribute("cx", cx.toString());
    labelSpacing.setAttribute("cy", cy.toString());
    labelSpacing.setAttribute("r", (radius * 0.25).toString());
    labelSpacing.setAttribute("fill", "#121212");
    svg.appendChild(labelSpacing);

    // label
    const label = document.createElementNS(svgNS, "circle");
    label.setAttribute("cx", cx.toString());
    label.setAttribute("cy", cy.toString());
    label.setAttribute("r", (radius * 0.2).toString());
    label.setAttribute("fill", "white");
    svg.appendChild(label);

    // hole
    const hole = document.createElementNS(svgNS, "circle");
    hole.setAttribute("cx", cx.toString());
    hole.setAttribute("cy", cy.toString());
    hole.setAttribute("r", (radius * 0.03).toString());
    hole.setAttribute("fill", "black");
    svg.appendChild(hole);
}

historySeeds.forEach((seed) => {
    addMandala(seed);
});

function addMandala(seed: string) {
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

    // Apply FLIGHT_SPEED to initial velocities
    let vx = (Math.random() > 0.5 ? 1 : -1) * (1 + Math.random() * 2) * FLIGHT_SPEED;
    let vy = (Math.random() > 0.5 ? 1 : -1) * (1 + Math.random() * 2) * FLIGHT_SPEED;

    let x = window.innerWidth / 2;
    let y = window.innerHeight / 2;

    // Set up initial rotation state and add slight variance to rotation speed per mandala
    let rotation = Math.random() * 360;
    let vRot = (Math.random() > 0.5 ? 1 : -1) * ROTATION_SPEED * (0.8 + Math.random() * 0.4);

    let lastTime = performance.now();

    function animate(currentTime: number) {
        const deltaTime = (currentTime - lastTime) / 1000; // Convert to seconds
        lastTime = currentTime;

        const minDim = Math.min(window.innerWidth, window.innerHeight);
        const mandalaSize = minDim * MANDALA_SIZE_PERCENT;

        wrapper.style.width = `${mandalaSize}px`;
        wrapper.style.height = `${mandalaSize}px`;

        const boundaryWidth = window.innerWidth * (1 - BORDER_SIZE_PERCENT);
        const boundaryHeight = window.innerHeight * (1 - BORDER_SIZE_PERCENT);

        const offsetX = (window.innerWidth - boundaryWidth) / 2;
        const offsetY = (window.innerHeight - boundaryHeight) / 2;

        x += vx * deltaTime * 60;
        y += vy * deltaTime * 60;

        // Increment rotation
        rotation += vRot * deltaTime * 60;

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

        // Apply translation AND rotation together
        wrapper.style.transform = `translate(${x}px, ${y}px) rotate(${rotation}deg)`;
        requestAnimationFrame(animate);
    }

    requestAnimationFrame(animate);
}

const initialCount = historySeeds.length;
let lastKnownCount = initialCount;

setInterval(() => {
    const currentHistory: string[] = JSON.parse(localStorage.getItem('mandala-history') || '[]');
    if (currentHistory.length > lastKnownCount) {
        // Add new mandalas that were saved since last check
        for (let i = lastKnownCount; i < currentHistory.length; i++) {
            addMandala(currentHistory[i]);
        }
        lastKnownCount = currentHistory.length;
    }
}, 1000);
