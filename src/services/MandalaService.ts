import type { Instrument, Point } from '../types';

export class MandalaService {
    private canvas: HTMLElement = document.getElementById('canvas')!;
    private canvasWidth = Number(this.canvas.getAttribute('width'));
    private canvasHeight = Number(this.canvas.getAttribute('height'));
    private cx = this.canvasWidth / 2;
    private cy = this.canvasHeight / 2;
    private baseRadius = 30;
    private bars = 8;

    public static instrumentStyles = {
        kick: { color: 'rgba(255, 87, 51, 0.9)', strokeWidth: 1 },
        snare: { color: 'rgba(51, 255, 87, 0.9)', strokeWidth: 1 },
        hiHat: { color: 'rgba(51, 87, 255, 0.9)', strokeWidth: 1 },
        clap: { color: 'rgba(255, 146, 51, 0.9)', strokeWidth: 1 },
        tom: { color: 'rgba(255, 51, 243, 0.9)', strokeWidth: 1 }
    };

    public generateMandala(instruments: Instrument[]): HTMLElement {
        this.canvas.innerHTML = ''; // Clear the canvas
        let radiusStep: number = 30;

        for (let i = 0; i < instruments.length; i++) {
            const instrument = instruments[i];
            const style = MandalaService.instrumentStyles[instrument.id as keyof typeof MandalaService.instrumentStyles];

            if (!style) {
                console.warn(`No style found for instrument ID: ${instrument.id}`);
                continue;
            }

            // Convert the pattern array of booleans to a binary string of "0" and "1"
            const patternBinary = this.instrumentToSeed(instrument);
            console.log(`Pattern binary for ${instrument.id}:`, patternBinary); // Debug log
            const patternDecimal = parseInt(patternBinary, 2) || 0;
            console.log(`Pattern decimal for ${instrument.id}:`, patternDecimal); // Debug log

            // Skip if pattern resolves to 0
            if (patternDecimal === 0) {
                console.log(`Skipping ${instrument.id} as pattern resolves to 0`);
                continue;
            }

            // Use the pattern decimal as a seed with a random offset
            const lineSeed = (patternDecimal % 1000) / 1000;
            console.log(`Line seed for ${instrument.id}:`, lineSeed); // Debug log
            const currentRadius = this.baseRadius + i * radiusStep;

            this.drawLines(currentRadius, lineSeed, style.color, style.strokeWidth, this.canvas);
        }

        return this.canvas;
    }

    public instrumentToSeed(instrument: Instrument): string {
        const patternBinary = instrument.pattern.map(step => step ? '1' : '0').join('');
        return patternBinary;
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

    public drawLines(radius: number, seed: number, color: string, strokeWidth: number, parent: Element): void {
        MandalaService.drawLines(parent, radius, seed, color, strokeWidth, this.cx, this.cy, this.bars);
    }

    public static getPoints(offsetDegrees: number, radius: number, cx: number, cy: number, bars: number): Point[] {
        const offset = (offsetDegrees * Math.PI) / 180;
        const points: Point[] = [];

        for (let i = 0; i < bars; i++) {
            const angle = (i * 2 * Math.PI) / bars - Math.PI / 2 + offset;
            points.push({ x: cx + radius * Math.cos(angle), y: cy + radius * Math.sin(angle) });
        }

        return points;
    }

    public static drawLines(parent: Element, radius: number, seed: number, color: string, strokeWidth: number, cx: number, cy: number, bars: number): void {
        const svgNS = "http://www.w3.org/2000/svg";
        const basePoints = MandalaService.getPoints(0, radius, cx, cy, bars);
        const mirrorPoints = MandalaService.getPoints(180 / bars, radius, cx, cy, bars);

        const angleBetweenPoints = (2 * Math.PI) / bars;

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
            const controlX = cx + (seed - 0.5) * radius * 0.5;
            const controlY = cy + (seed - 0.5) * radius * 0.5;

            const dx = controlX - cx;
            const dy = controlY - cy;

            const rotatedControlX = cx + dx * Math.cos(angle) - dy * Math.sin(angle);
            const rotatedControlY = cy + dx * Math.sin(angle) + dy * Math.cos(angle);

            const path = document.createElementNS(svgNS, "path");
            path.setAttribute("d", `M${x1},${y1} Q${rotatedControlX},${rotatedControlY} ${x2},${y2}`);
            path.setAttribute("stroke", color);
            path.setAttribute("stroke-width", strokeWidth.toString());
            path.setAttribute("fill", `transparent`);
            parent.appendChild(path);

            const lineX1 = cx;
            const lineY1 = cy;
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

                    const reversedPath = document.createElementNS(svgNS, "path");
                    reversedPath.setAttribute("d", `M${x2},${y2} Q${reflectedX},${reflectedY} ${x3},${y3}`);
                    reversedPath.setAttribute("stroke", color);
                    reversedPath.setAttribute("stroke-width", strokeWidth.toString());
                    reversedPath.setAttribute("fill", `transparent`);
                    parent.appendChild(reversedPath);
                }
            }
        }
    }
}