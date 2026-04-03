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
    button.className = 'instrument';
    button.textContent = this.instrument.name;
    button.dataset.id = this.instrument.id;
    button.addEventListener('click', () => this.onClick(this.instrument));
    console.log(`Rendering button for ${this.instrument.name}`);
    return button;
  }
}