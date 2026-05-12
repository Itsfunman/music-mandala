import type { Instrument } from '../types';
import { InstrumentButton } from '../components/InstrumentButton';
import { LoopEditor } from '../components/LoopEditor';
import { MandalaService } from '@/services/MandalaService';
import { instrumentStyles } from './InstrumentStyles';

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

  public async renderInstrumentButtons(instruments: Instrument[], onClick: (instrument: Instrument) => void): Promise<void> {
    console.log('Rendering instrument buttons:', instruments);
    this.instrumentsContainer.innerHTML = '';
    const buttons = instruments.map(async instrument => {
      const button = new InstrumentButton(instrument, onClick);
      return await button.render();
    });
    const elements = await Promise.all(buttons);
    elements.forEach(el => this.instrumentsContainer.appendChild(el));
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
        const style = instrumentStyles[instrumentId as keyof typeof instrumentStyles];
        const activeBg = style?.color;
        const activeShadow = style?.color;

        instrumentElement.classList.add('instrument--playing');
        instrumentElement.style.setProperty('--active-bg', activeBg || '#ffffff');
        instrumentElement.style.setProperty('--active-shadow', activeShadow || '#ffffff');
      } else {
        instrumentElement.classList.remove('instrument--playing');
      }
    }
  }

  public hightlightStep(step: number) : void 
  {
    const steps: HTMLElement[] = Array.from(this.editorLoopContainer.querySelectorAll('div'));
    
    // get all children of loop editor
    steps.forEach((stepEl, index) => {
      if (index === step) {

        stepEl.classList.add('loop-step--playing');
        stepEl.classList.remove('loop-step');
      } else {
        stepEl.classList.add('loop-step');
        stepEl.classList.remove('loop-step--playing');
      }
    });
  }

  public highlightSelectedInstrument(instrumentId: string | null, lastSelectedId: string | null): void {
    if (!instrumentId) return;

    const instrumentElement = this.instrumentsContainer.querySelector(`.instrument[data-id="${instrumentId}"]`) as HTMLElement;

    if (!instrumentElement) {
      return;
    }

    const style = instrumentStyles[instrumentId as keyof typeof instrumentStyles];
    const activeShadow = style?.color;

    instrumentElement.classList.add('instrument--selected');
    instrumentElement.style.setProperty('--active-shadow', activeShadow || '#ffffff');

    if (lastSelectedId && lastSelectedId !== instrumentId) {
      const lastSelectedElement = this.instrumentsContainer.querySelector(`.instrument[data-id="${lastSelectedId}"]`) as HTMLElement;
      if (lastSelectedElement) {
        lastSelectedElement.classList.remove('instrument--selected');
      }
    }
  }

  public updateBpmDisplay(bpm: number): void {
    this.bpmValue.textContent = bpm.toString();
    this.bpmInput.value = bpm.toString();
  }
}