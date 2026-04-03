import type { Instrument } from '../types';

export class MandalaService {
  private angleStep: number = Math.PI / 8;

  public generateMandala(instruments: Instrument[]): SVGElement {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", "500");
    svg.setAttribute("height", "500");
    svg.setAttribute("viewBox", "0 0 500 500");
    svg.style.marginTop = '20px';
    svg.style.border = '1px solid #ddd';
    svg.style.borderRadius = '5px';
    svg.style.backgroundColor = 'white';

    const centerX = 250;
    const centerY = 250;
    const maxRadius = 200;

    const instrumentStyles = {
      'kick': { color: 'rgba(255, 87, 51, 0.9)', strokeWidth: 2.5, radiusOffset: 0.1 },
      'snare': { color: 'rgba(51, 255, 87, 0.9)', strokeWidth: 2, radiusOffset: 0.2 },
      'hi-hat': { color: 'rgba(51, 87, 255, 0.9)', strokeWidth: 1.5, radiusOffset: 0.3 },
      'clap': { color: 'rgba(243, 255, 51, 0.9)', strokeWidth: 1, radiusOffset: 0.4 },
      'tom': { color: 'rgba(255, 51, 243, 0.9)', strokeWidth: 1.8, radiusOffset: 0.5 }
    };

    // Always draw all instruments, even if they have no active steps
    instruments.forEach((instrument, instIndex) => {
      const style = instrumentStyles[instrument.id as keyof typeof instrumentStyles];
      const radius = maxRadius * (0.2 + instIndex * 0.15);
      const beats = [
        instrument.pattern.slice(0, 4),
        instrument.pattern.slice(4, 8),
        instrument.pattern.slice(8, 12),
        instrument.pattern.slice(12, 16)
      ];
      beats.forEach((beat, beatIndex) => {
        const angle = beatIndex * Math.PI / 2;
        this.drawBeatAndMirror(svg, centerX, centerY, radius, beat, angle, style);
      });
    });

    return svg;
  }

  private drawBeatAndMirror(
    svg: SVGElement,
    cx: number,
    cy: number,
    radius: number,
    beat: boolean[],
    startAngle: number,
    style: { color: string; strokeWidth: number; radiusOffset: number }
  ): void {
    const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
    const innerRadius = radius * 0.7;
    const outerRadius = radius;

    this.drawBeatCurve(group, cx, cy, innerRadius, outerRadius, startAngle, beat, style);
    this.drawBeatCurve(group, cx, cy, innerRadius, outerRadius, startAngle + Math.PI, beat, style);

    svg.appendChild(group);
  }

  private drawBeatCurve(
    group: SVGGElement,
    cx: number,
    cy: number,
    innerRadius: number,
    outerRadius: number,
    startAngle: number,
    beat: boolean[],
    style: { color: string; strokeWidth: number; radiusOffset: number }
  ): void {
    let pathData = '';
    let firstPoint = true;

    beat.forEach((isActive, stepIndex) => {
      if (isActive) {
        const angle = startAngle + stepIndex * this.angleStep;
        const nextAngle = startAngle + (stepIndex + 1) * this.angleStep;

        const startX = cx + Math.cos(angle) * innerRadius;
        const startY = cy + Math.sin(angle) * innerRadius;
        const endX = cx + Math.cos(nextAngle) * outerRadius;
        const endY = cy + Math.sin(nextAngle) * outerRadius;

        const midRadius = (innerRadius + outerRadius) / 2;
        const cp1X = cx + Math.cos(angle + Math.PI/4) * midRadius;
        const cp1Y = cy + Math.sin(angle + Math.PI/4) * midRadius;
        const cp2X = cx + Math.cos(nextAngle - Math.PI/4) * midRadius;
        const cp2Y = cy + Math.sin(nextAngle - Math.PI/4) * midRadius;

        if (firstPoint) {
          pathData += `M ${startX} ${startY}`;
          firstPoint = false;
        }
        pathData += ` C ${cp1X} ${cp1Y}, ${cp2X} ${cp2Y}, ${endX} ${endY}`;
      }
    });

    if (pathData) {
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute('d', pathData);
      path.setAttribute('stroke', style.color);
      path.setAttribute('stroke-width', style.strokeWidth.toString());
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke-linecap', 'round');
      group.appendChild(path);
    }
  }
}