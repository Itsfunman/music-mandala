import { AudioService } from './services/AudioService';
import { MandalaService } from './services/MandalaService';
import { SongService } from './services/SongService';
import { MandalaComponent } from './components/MandalaComponent';
import { DOMHelper } from './utils/DOMHelper';
import type { Instrument } from './types';

// Services
const audioService = new AudioService();
const mandalaService = new MandalaService();
const songService = new SongService();
const domHelper = new DOMHelper();
let mandalaComponent: MandalaComponent;

// State
let instruments: Instrument[] = [];
let currentInstrument: Instrument | null = null;
let isPlaying = false;
let bpm = 120;
let intervalId: number | null = null;

async function init(): Promise<void> {
  createInstrumentButtons();
  mandalaComponent = new MandalaComponent(domHelper.getMandalaContainer());
  renderMandala();
  setupEventListeners();
}

document.addEventListener('click', async () => {
  if (!audioService['isAudioStarted']) {
    await audioService.startAudio();
    console.log('Audio started after user interaction');
  }
}, { once: true });

function createInstrumentButtons(): void {
    instruments = [
        { id: 'kick', name: 'Kick', sound: () => audioService.createKick(), pattern: Array(16).fill(false) },
        { id: 'snare', name: 'Snare', sound: () => audioService.createSnare(), pattern: Array(16).fill(false) },
        { id: 'hiHat', name: 'Hi-Hat', sound: () => audioService.createHiHat(), pattern: Array(16).fill(false) },
        { id: 'clap', name: 'Clap', sound: () => audioService.createClap(), pattern: Array(16).fill(false) },
        { id: 'tom', name: 'Tom', sound: () => audioService.createTom(), pattern: Array(16).fill(false) }
    ];

    domHelper.renderInstrumentButtons(instruments, openEditor);
}

function openEditor(instrument: Instrument): void {
  currentInstrument = instrument;
  domHelper.openEditor(`Edit ${instrument.name}`);
  const loopEditor = domHelper.renderLoopEditor(instrument.pattern, (newPattern) => {
    instrument.pattern = newPattern;
    console.log(`Pattern updated for ${instrument.id}:`, newPattern);
    renderMandala();
    loopEditor.updatePattern(newPattern);
  });
}

function renderMandala(): void {
  if (mandalaComponent) {
    mandalaComponent.render(instruments);
  }
}

function playLoop(): void {
  if (intervalId) clearInterval(intervalId);
  const stepDuration = (60000 / bpm) / 4;
  let index = 0;

  renderMandala();

  intervalId = window.setInterval(() => {
    instruments.forEach(instrument => {
      if (instrument.pattern[index]) {
        instrument.sound();
        domHelper.highlightInstrument(instrument.id, true);
        setTimeout(() => {
          domHelper.highlightInstrument(instrument.id, false);
        }, 100);
      }
    });

    if (mandalaComponent) {
      mandalaComponent.pulse();
    }

    index = (index + 1) % 16;
  }, stepDuration);
}

function setupEventListeners(): void {
  domHelper.onPlayClick(() => {
    if (!isPlaying) {
      playLoop();
      isPlaying = true;
    }
  });

  domHelper.onStopClick(() => {
    if (isPlaying && intervalId) {
      clearInterval(intervalId);
      isPlaying = false;
    }
  });

  domHelper.onCloseEditorClick(() => {
    domHelper.closeEditor();
  });

  domHelper.renderBpmControl(bpm, (newBpm) => {
    bpm = newBpm;
    if (isPlaying) {
      clearInterval(intervalId!);
      playLoop();
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM fully loaded and parsed');
  init();
});