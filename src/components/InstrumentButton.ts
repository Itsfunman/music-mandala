import type { Instrument } from '../types';

export class InstrumentButton {
  private instrument: Instrument;
  private svg: Promise<string>
  private onClick: (instrument: Instrument) => void;

  constructor(instrument: Instrument, onClick: (instrument: Instrument) => void) {
    this.instrument = instrument;
    this.svg = this.loadSvg();
    this.onClick = onClick;
  }

  public async render(): Promise<HTMLElement> {
    const button = document.createElement('div');
    const svgContent = await this.svg;
    button.innerHTML = svgContent;
    button.className = 'instrument';
    button.dataset.id = this.instrument.id;
    button.addEventListener('click', () => this.onClick(this.instrument));
    console.log(`Rendering button for ${this.instrument.name}`);
    return button;
  }

  async loadSvg(): Promise<string> {
    try {
      const response = await fetch(new URL(`../assets/${this.instrument.icon}`, import.meta.url).href);
      if (!response.ok) {
        throw new Error(`Failed to load SVG for ${this.instrument.name}: ${response.statusText}`);
      }
      return await response.text();
    } catch (error) {
      console.error(error);
      return '';
    }
  }
}