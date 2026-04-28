export type Instrument = {
  id: string;
  name: string;
  sound: () => void;
  pattern: boolean[];
};

export type Song = {
  id: string;
  name: string;
  instruments: Instrument[];
  bpm: number;
};

export type Point = {
    x: number;
    y: number;
};

// WebSocket Message Types
export type ESPSensorMessage =
  | BPMMessage
  | StepButtonMessage
  | InstrumentSwitchMessage;

export type BPMMessage = {
  type: 'bpm';
  value: number;
};

export type StepButtonMessage = {
  type: 'step_button';
  step: number; // 0-15
  pressed: boolean;
};

export type InstrumentSwitchMessage = {
  type: 'instrument_switch';
};

// Frontend to ESP32 Messages
export type ESPCommandMessage =
  | LEDControlMessage
  | DisplayUpdateMessage;

export type LEDControlMessage = {
  type: 'led';
  step: number; // 0-15
  active: boolean;
};

export type DisplayUpdateMessage = {
  type: 'display';
  instrument: string; // instrument name to display
};