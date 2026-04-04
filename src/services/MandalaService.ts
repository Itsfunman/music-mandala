import type { Instrument, Point } from '../types';

export class MandalaService {
    private canvas: HTMLElement = document.getElementById('canvas')!;
    private canvasWidth = Number(this.canvas.getAttribute('width'));
    private canvasHeight = Number(this.canvas.getAttribute('height'));
    private cx = this.canvasWidth / 2;
    private cy = this.canvasHeight / 2;
    private baseRadius = 30;
    private bars = 8;

    public generateMandala(instruments: Instrument[]): HTMLElement {
    this.canvas.innerHTML = ''; // Clear the canvas
    let radiusStep: number = 30;

    const instrumentStyles = {
        kick: { color: 'rgba(255, 87, 51, 0.9)', strokeWidth: 1 },
        snare: { color: 'rgba(51, 255, 87, 0.9)', strokeWidth: 1 },
        hiHat: { color: 'rgba(51, 87, 255, 0.9)', strokeWidth: 1 },
        clap: { color: 'rgba(255, 146, 51, 0.9)', strokeWidth: 1 },
        tom: { color: 'rgba(255, 51, 243, 0.9)', strokeWidth: 1 }
    };

    for (let i = 0; i < instruments.length; i++) {
        const instrument = instruments[i];
        const style = instrumentStyles[instrument.id as keyof typeof instrumentStyles];

        if (!style) {
            console.warn(`No style found for instrument ID: ${instrument.id}`);
            continue;
        }

        // Convert the pattern array of booleans to a binary string of "0" and "1"
        const patternBinary = instrument.pattern.map(val => val ? '1' : '0').join('');
        console.log(`Pattern binary for ${instrument.id}:`, patternBinary); // Debug log
        const patternDecimal = parseInt(patternBinary, 2) || 0;

        // Skip if pattern resolves to 0
        if (patternDecimal === 0) {
            console.log(`Skipping ${instrument.id} as pattern resolves to 0`);
            continue;
        }

        // Use the pattern decimal as a seed with a random offset
        const lineSeed = (patternDecimal % 1000) / 1000;
        const currentRadius = this.baseRadius + i * radiusStep;

        this.drawLines(currentRadius, lineSeed, style.color, style.strokeWidth);
    }

    return this.canvas;
}

    public getPoints(offsetDegrees = 0, radius = this.baseRadius): Point[] {
        const offset = (offsetDegrees * Math.PI) / 180;

        const points: Point[] = [];

        for (let i = 0; i < this.bars; i++) {
            const angle = (i * 2 * Math.PI) / this.bars - Math.PI / 2 + offset;
            const coX = this.cx + radius * Math.cos(angle);
            const coY = this.cy + radius * Math.sin(angle);

            points.push({ x: coX, y: coY });
        }

        return points;
    }

    public drawLines(radius: number, seed: number, color: string, strokeWidth: number): void {
        const svgNS = "http://www.w3.org/2000/svg";
        const basePoints = this.getPoints(0, radius);
        const mirrorPoints = this.getPoints(180 / this.bars, radius);

        const angleBetweenPoints = (2 * Math.PI) / this.bars;

        for (let i = 0; i < basePoints.length; i++) {
            const basePointA = basePoints[i];
            const mirrorPoint = mirrorPoints[i];
            const basePointB = basePoints[(i + 1) % basePoints.length];

            const x1 = basePointA.x;
            const y1 = basePointA.y;
            const x2 = mirrorPoint.x;
            const y2 = mirrorPoint.y;
            const x3 = basePointB.x;
            const y3 = basePointB.y;

            const angle = i * angleBetweenPoints;
            const controlX = this.cx + (seed - 0.5) * radius * 0.5;
            const controlY = this.cy + (seed - 0.5) * radius * 0.5;

            const dx = controlX - this.cx;
            const dy = controlY - this.cy;

            const rotatedControlX = this.cx + dx * Math.cos(angle) - dy * Math.sin(angle);
            const rotatedControlY = this.cy + dx * Math.sin(angle) + dy * Math.cos(angle);

            // Draw the original curve (A to MA)
            const path = document.createElementNS(svgNS, "path");
            path.setAttribute("d", `M${x1},${y1} Q${rotatedControlX},${rotatedControlY} ${x2},${y2}`);
            path.setAttribute("stroke", color);
            path.setAttribute("stroke-width", strokeWidth.toString());
            path.setAttribute("fill", "none");
            this.canvas.appendChild(path);

            // Calculate the reflection of the control point across the line from center to mirror point
            const lineX1 = this.cx;
            const lineY1 = this.cy;
            const lineX2 = x2;
            const lineY2 = y2;

            if (lineX2 !== lineX1 || lineY2 !== lineY1) {
                const a = lineY2 - lineY1;
                const b = lineX1 - lineX2;
                const c = (lineY1 - lineY2) * lineX1 + (lineX2 - lineX1) * lineY1;

                const pointX = rotatedControlX;
                const pointY = rotatedControlY;

                const denominator = a * a + b * b;
                if (denominator !== 0) {
                    const reflectedX = pointX - (2 * a * (a * pointX + b * pointY + c)) / denominator;
                    const reflectedY = pointY - (2 * b * (a * pointX + b * pointY + c)) / denominator;

                    // Draw the reversed curve (MA to B)
                    const reversedPath = document.createElementNS(svgNS, "path");
                    reversedPath.setAttribute("d", `M${x2},${y2} Q${reflectedX},${reflectedY} ${x3},${y3}`);
                    reversedPath.setAttribute("stroke", color);
                    reversedPath.setAttribute("stroke-width", strokeWidth.toString());
                    reversedPath.setAttribute("fill", "none");
                    this.canvas.appendChild(reversedPath);
                }
            }
        }
    }
}