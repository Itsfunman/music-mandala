import { MandalaService } from '../services/MandalaService';
import type { Instrument } from '../types';

export class MandalaComponent {
    private mandalaService: MandalaService;
    private container: HTMLElement;

    constructor(container: HTMLElement) {
        this.mandalaService = new MandalaService();
        this.container = container;
    }

    public render(instruments: Instrument[]): void {
        this.container.innerHTML = '';
        const mandalaCanvas = this.mandalaService.generateMandala(instruments);
        this.container.appendChild(mandalaCanvas);
        mandalaCanvas.classList.add('mandala-rotate');
    }

    public pulse(): void {
        const mandalaCanvas = this.container.querySelector('svg');
        if (mandalaCanvas) {
            mandalaCanvas.classList.add('mandala--pulse');
            setTimeout(() => {
                if (mandalaCanvas) {
                    mandalaCanvas.classList.remove('mandala--pulse');
                }
            }, 200);
        }
    }
}