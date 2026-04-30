import type { Instrument } from '../types';

export class InstrumentButton {
  private instrument: Instrument;
  private onClick: (instrument: Instrument) => void;

  constructor(instrument: Instrument, onClick: (instrument: Instrument) => void) {
    this.instrument = instrument;
    this.onClick = onClick;
  }

  public render(): HTMLElement {
    const button = document.createElement('div');
    const icon = document.createElement('img');
    icon.src = new URL(`../assets/${this.instrument.icon}`, import.meta.url).href;
    icon.alt = this.instrument.name;
    button.className = 'instrument';
    button.dataset.id = this.instrument.id;
    button.appendChild(icon);
    button.addEventListener('click', () => this.onClick(this.instrument));
    console.log(`Rendering button for ${this.instrument.name}`);
    return button;
  }
}