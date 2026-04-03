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