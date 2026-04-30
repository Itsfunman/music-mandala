import type { Instrument } from '../types';
import { InstrumentButton } from '../components/InstrumentButton';
import { LoopEditor } from '../components/LoopEditor';

export class DOMHelper {
  private playButton: HTMLButtonElement;
  private stopButton: HTMLButtonElement;
  private saveButton: HTMLButtonElement;
  private instrumentsContainer: HTMLElement;
  private editorLoopContainer: HTMLElement;
  private mandalaContainer: HTMLElement;
  private bpmValue: HTMLElement;
  private bpmInput: HTMLInputElement;

  constructor() {
    this.playButton = document.getElementById('play') as HTMLButtonElement;
    this.stopButton = document.getElementById('stop') as HTMLButtonElement;
    this.saveButton = document.getElementById('save') as HTMLButtonElement;
    this.stopButton = document.getElementById('stop') as HTMLButtonElement;

    this.instrumentsContainer = document.getElementById('instruments')!;
    if (!this.instrumentsContainer) {
      console.error('Instruments container not found!');
    } else {
      console.log('Instruments container found:', this.instrumentsContainer);
    }
    this.editorLoopContainer = document.getElementById('editor-loop') as HTMLElement;
    this.mandalaContainer = document.getElementById('mandala-container') as HTMLElement;
    this.bpmValue = document.getElementById('bpm-value') as HTMLElement;
    this.bpmInput = document.getElementById('bpm') as HTMLInputElement;
  }

  public renderInstrumentButtons(instruments: Instrument[], onClick: (instrument: Instrument) => void): void {
    console.log('Rendering instrument buttons:', instruments);
    this.instrumentsContainer.innerHTML = '';
    instruments.forEach(instrument => {
      const button = new InstrumentButton(instrument, onClick);
      this.instrumentsContainer.appendChild(button.render());
    });
    console.log('Instruments container after rendering:', this.instrumentsContainer.innerHTML);
  }

  public renderLoopEditor(
    pattern: boolean[],
    onPatternChange: (newPattern: boolean[]) => void,
    activeBg = '#ffffff',
    activeShadow = '#ffffff'
  ): LoopEditor {
    this.editorLoopContainer.innerHTML = '';
    this.editorLoopContainer.style.setProperty('--active-bg', activeBg);
    this.editorLoopContainer.style.setProperty('--active-shadow', activeShadow);
    const loopEditor = new LoopEditor(pattern, (newPattern) => {
      onPatternChange(newPattern);
    }, this.editorLoopContainer);
    return loopEditor;
  }

  public renderBpmControl(bpm: number, onBpmChange: (bpm: number) => void): void {
    this.bpmValue.textContent = bpm.toString();
    this.bpmInput.value = bpm.toString();
    this.bpmInput.addEventListener('input', (e) => {
      const newBpm = parseInt((e.target as HTMLInputElement).value);
      onBpmChange(newBpm);
      this.bpmValue.textContent = newBpm.toString();
    });
  }

  public getMandalaContainer(): HTMLElement {
    return this.mandalaContainer;
  }

  public onPlayClick(callback: () => void): void {
    this.playButton.addEventListener('click', callback);
  }

  public onStopClick(callback: () => void): void {
    this.stopButton.addEventListener('click', callback);
  }

  public onSaveClick(callback: () => void): void {
    this.saveButton.addEventListener('click', callback);
  }

  public highlightInstrument(instrumentId: string, isPlaying: boolean): void {
    const instrumentElement = this.instrumentsContainer.querySelector(`.instrument[data-id="${instrumentId}"]`) as HTMLElement;

    if (instrumentElement) {
      if (isPlaying) {
        instrumentElement.classList.add('instrument--playing');
      } else {
        instrumentElement.classList.remove('instrument--playing');
      }
    }
  }

  public updateBpmDisplay(bpm: number): void {
    this.bpmValue.textContent = bpm.toString();
    this.bpmInput.value = bpm.toString();
  }
}