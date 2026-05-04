import { AudioService } from './services/AudioService';
import { MandalaComponent } from './components/MandalaComponent';
import { LoopEditor } from './components/LoopEditor';
import { DOMHelper } from './utils/DOMHelper';
import { MandalaService } from './services/MandalaService';
import { WebSocketService } from './services/WebSocketService';
import type { Instrument } from './types';

// Services
const audioService = new AudioService();
const domHelper = new DOMHelper();
const wsService = new WebSocketService('ws://localhost:8080');
let mandalaComponent: MandalaComponent;

// State
let instruments: Instrument[] = [];
let currentInstrument: Instrument | null = null;
let currentLoopEditor: LoopEditor | null = null;
let isPlaying = false;
let bpm = 120;
let intervalId: number | null = null;
let currentStep = -1;

// Idle timeout management
let idleTimeoutId: number | null = null;
const IDLE_TIMEOUT = 30; // seconds

function getNextInstrument(): Instrument | null {
  if (instruments.length === 0) {
    return null;
  }

  const activeInstrument = currentInstrument;
  const currentIndex = activeInstrument
    ? instruments.findIndex(instrument => instrument.id === activeInstrument.id)
    : -1;
  const nextIndex = (currentIndex + 1) % instruments.length;
  return instruments[nextIndex] ?? null;
}

function switchCurrentInstrument(): void {
  const nextInstrument = getNextInstrument();

  if (!nextInstrument) {
    return;
  }

  openEditor(nextInstrument);
  if (wsService.isConnected()) {
    wsService.sendDisplayUpdate(nextInstrument.name);
  }
  console.log('Instrument switched to:', nextInstrument.name);
}

function syncLedState(step: number = -1): void {
  if (!currentInstrument || !wsService.isConnected()) {
    return;
  }

  const activeStep = isPlaying ? step : -1;
  wsService.sendLEDState(activeStep, isPlaying, currentInstrument.id, currentInstrument.pattern);
}

async function init(): Promise<void> {
  // Connect WebSocket and set up handlers
  wsService.connect().catch(console.error);
  
  wsService.onBPMChange((message) => {
    bpm = message.value;
    domHelper.updateBpmDisplay(bpm);
    console.log('BPM changed to:', bpm);
    // If music is playing, restart playLoop with new BPM
    if (isPlaying && intervalId) {
      clearInterval(intervalId);
      playLoop();
    }
  });

  wsService.onStepButton((message) => {
    console.log(`Step ${message.step} button ${message.pressed ? 'pressed' : 'released'}`);
    if (message.pressed && currentInstrument) {
      const nextPattern = [...currentInstrument.pattern];
      nextPattern[message.step] = !nextPattern[message.step];
      currentInstrument.pattern = nextPattern;
      renderMandala();
      syncLedState(currentStep);

      if (currentLoopEditor) {
        currentLoopEditor.updatePattern(nextPattern);
      }

      if (isPlaying) {
        resetIdleTimer();
      }
    }
  });

  wsService.onInstrumentSwitch(() => {
    switchCurrentInstrument();
    resetIdleTimer();

    if (!isPlaying) {
      playLoop();
    }
  });

  wsService.onStatusChange((connected) => {
    console.log(connected ? '✓ Connected to ESP32' : '✗ Disconnected from ESP32');

    if (connected) {
      syncLedState(currentStep);
      if (currentInstrument) {
        wsService.sendDisplayUpdate(currentInstrument.name);
      }
    }
  });

  await createInstrumentButtons();

  currentInstrument = instruments.length > 0 ? instruments[0] : null;
  openEditor(currentInstrument!);

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
        { id: 'kick', name: 'Kick', sound: () => audioService.createKick(), pattern: Array(16).fill(false), icon: 'kick.svg' },
        { id: 'snare', name: 'Snare', sound: () => audioService.createSnare(), pattern: Array(16).fill(false), icon: 'snare.svg' },
        { id: 'hiHat', name: 'Hi-Hat', sound: () => audioService.createHiHat(), pattern: Array(16).fill(false), icon: 'hihat.svg' },
        { id: 'clap', name: 'Clap', sound: () => audioService.createClap(), pattern: Array(16).fill(false), icon: 'clap.svg' },
        { id: 'tom', name: 'Tom', sound: () => audioService.createTom(), pattern: Array(16).fill(false), icon: 'tom.svg' }
    ];

    domHelper.renderInstrumentButtons(instruments, openEditor);
}

function openEditor(instrument: Instrument): void {
  domHelper.highlightSelectedInstrument(instrument.id, currentInstrument?.id || null);

  currentInstrument = instrument;
  const style = MandalaService.instrumentStyles[instrument.id as keyof typeof MandalaService.instrumentStyles];
  const activeBg = style?.color;
  const activeShadow = style?.color;

  const loopEditor = domHelper.renderLoopEditor(
    instrument.pattern,
    (newPattern) => {
      instrument.pattern = newPattern;
      console.log(`Pattern updated for ${instrument.id}:`, newPattern);
      renderMandala();
      syncLedState(currentStep);
      loopEditor.updatePattern(newPattern);
    },
    activeBg,
    activeShadow
  );

  currentLoopEditor = loopEditor;

  syncLedState(currentStep);
}

function saveMandala(): void {
  const seed = instruments.map(inst => inst.pattern.map(b => (b ? '1' : '0')).join('')).join('|');
  const history: string[] = JSON.parse(localStorage.getItem('mandala-history') ?? '[]');

  // Avoid saving duplicates consecutively
  if (history[history.length - 1] === seed) return;

  history.push(seed);

  // Keep max count entries
  if (history.length > 10) history.shift();
  localStorage.setItem('mandala-history', JSON.stringify(history));
}

function renderMandala(): void {
  if (mandalaComponent) {
    mandalaComponent.render(instruments);
  }
}

function playLoop(): void {
  if (intervalId) clearInterval(intervalId);
  isPlaying = true;
  const stepDuration = (60000 / bpm) / 4;
  let index = 0;
  currentStep = index;

  domHelper.hightlightStep(currentStep);

  renderMandala();
  resetIdleTimer();
  syncLedState(currentStep);

  intervalId = window.setInterval(() => {
    currentStep = index;
    syncLedState(currentStep);
    domHelper.hightlightStep(currentStep);

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

function resetInstrumentPatterns(): void {
  instruments.forEach(instrument => {
    instrument.pattern = Array(16).fill(false);
  });
  renderMandala();
  syncLedState(currentStep);
}

function clearIdleTimer(): void {
  if (idleTimeoutId !== null) {
    clearTimeout(idleTimeoutId);
    idleTimeoutId = null;
  }
}

function resetIdleTimer(): void {
  if (!isPlaying) return;
  clearIdleTimer();
  idleTimeoutId = window.setTimeout(() => {
    if (isPlaying && intervalId) {
      clearInterval(intervalId);
      intervalId = null;
      isPlaying = false;
      currentStep = -1;
      syncLedState(currentStep);
      console.log(`Stopped playback after ${IDLE_TIMEOUT} seconds of no input.`);
    }
    idleTimeoutId = null;
  }, IDLE_TIMEOUT * 1000);
}

function setupEventListeners(): void {
  domHelper.onPlayClick(() => {
    if (!isPlaying) {
      playLoop();
    }
  });

  domHelper.onStopClick(() => {
    if (isPlaying && intervalId) {
      clearInterval(intervalId);
      intervalId = null;
      isPlaying = false;
      currentStep = -1;
      syncLedState(currentStep);
      clearIdleTimer();
    }
  });

  domHelper.onSaveClick(() => {
    saveMandala();
    resetInstrumentPatterns();
    console.log('Mandala saved!');
  });

  domHelper.renderBpmControl(bpm, (newBpm) => {
    bpm = newBpm;
    if (isPlaying) {
      clearInterval(intervalId!);
      playLoop();
    }
  });

  // Toggle controls with 'c' key
  document.addEventListener('keydown', (event) => {
    if (event.key.toLowerCase() === 'c') {
      const controlsDiv = document.querySelector('.controls') as HTMLElement;
      if (controlsDiv) {
        controlsDiv.classList.toggle('controls--disabled');
      }
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM fully loaded and parsed');
  init();
});