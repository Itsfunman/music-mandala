import { AudioService } from './services/AudioService';
import { MandalaComponent } from './components/MandalaComponent';
import { DOMHelper } from './utils/DOMHelper';
import type { Instrument } from './types';

// WebSocket connection
let ws: WebSocket | null = null;

function initWebSocket(): void {
  ws = new WebSocket('ws://localhost:8080');

  ws.onopen = () => {
    console.log('Connected to WebSocket server');
  };

  ws.onmessage = (event) => {
    console.log('Message from ESP32:', event.data);
    try {
      const data = JSON.parse(event.data);
      // Handle incoming data from ESP32
      handleESP32Message(data);
    } catch (e) {
      console.log('Received non-JSON message:', event.data);
    }
  };

  ws.onclose = () => {
    console.log('Disconnected from WebSocket server');
    // Reconnect after 3 seconds
    setTimeout(initWebSocket, 3000);
  };

  ws.onerror = (error) => {
    console.error('WebSocket error:', error);
  };
}

function sendToESP32(data: object): void {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(data));
  }
}

function handleESP32Message(data: { button?: boolean; potentiometer?: number }): void {
  // Handle data received from ESP32
  // For example: trigger sounds based on ESP32 input
  console.log('ESP32 Data - Button:', data.button, 'Potentiometer:', data.potentiometer);
}

// Services
const audioService = new AudioService();
const domHelper = new DOMHelper();
let mandalaComponent: MandalaComponent;

// State
let instruments: Instrument[] = [];
let currentInstrument: Instrument | null = null;
let isPlaying = false;
let bpm = 120;
let intervalId: number | null = null;

async function init(): Promise<void> {
  initWebSocket(); // Start WebSocket connection
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

  domHelper.onSaveClick(() => {
    saveMandala();
    console.log('Mandala saved!');
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