import { MandalaService } from '../services/MandalaService';
import type { Instrument } from '../types';

export class MandalaComponent {
  private mandalaService: MandalaService;
  private container: HTMLElement;
  private svgElement: SVGElement | null = null;

  constructor(container: HTMLElement) {
    this.mandalaService = new MandalaService();
    this.container = container;
  }

  public render(instruments: Instrument[]): void {
    if (this.svgElement) {
      this.container.removeChild(this.svgElement);
    }

    this.svgElement = this.mandalaService.generateMandala(instruments);
    this.container.appendChild(this.svgElement);
  }

  public pulse(): void {
    if (this.svgElement) {
      this.svgElement.classList.add('mandala--pulse');
      setTimeout(() => {
        if (this.svgElement) {
          this.svgElement.classList.remove('mandala--pulse');
        }
      }, 200);
    }
  }
}