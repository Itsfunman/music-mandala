import type { ESPSensorMessage, ESPCommandMessage, BPMMessage, StepButtonMessage, InstrumentSwitchMessage } from '../types';

type BPMMessageHandler = (message: BPMMessage) => void;
type StepButtonHandler = (message: StepButtonMessage) => void;
type InstrumentSwitchHandler = (message: InstrumentSwitchMessage) => void;
type ConnectionStatusHandler = (connected: boolean) => void;

export class WebSocketService {
  private ws: WebSocket | null = null;
  private url: string;
  private bpmHandlers: BPMMessageHandler[] = [];
  private stepButtonHandlers: StepButtonHandler[] = [];
  private instrumentSwitchHandlers: InstrumentSwitchHandler[] = [];
  private statusHandlers: ConnectionStatusHandler[] = [];
  private reconnectInterval: number = 3000;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;

  constructor(url: string = 'ws://localhost:8080') {
    this.url = url;
  }

  /**
   * Initialize the WebSocket connection
   */
  public connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
          console.log('✓ Connected to WebSocket server');
          this.reconnectAttempts = 0;
          this.notifyStatusHandlers(true);
          resolve();
        };

        this.ws.onmessage = (event) => {
          console.log('📨 Message from ESP32:', event.data);
          try {
            const data = JSON.parse(event.data) as ESPSensorMessage;
            this.routeMessage(data);
          } catch (e) {
            console.log('Received non-JSON message:', event.data);
          }
        };

        this.ws.onclose = () => {
          console.log('✗ Disconnected from WebSocket server');
          this.notifyStatusHandlers(false);
          this.attemptReconnect();
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          reject(error);
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Send data to the ESP32
   */
  public send(data: ESPCommandMessage | object): boolean {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
      return true;
    }
    console.warn('WebSocket not connected, message not sent');
    return false;
  }

  /**
   * Send the full LED state to the ESP32 (active instrument pattern + playhead)
   */
  public sendLEDState(step: number, playing: boolean, instrumentId: string, pattern: boolean[]): boolean {
    if (pattern.length !== 16) {
      console.warn(`Invalid pattern length: ${pattern.length}. Must be 16`);
      return false;
    }

    if (step < -1 || step > 15) {
      console.warn(`Invalid step number: ${step}. Must be -1 or 0-15`);
      return false;
    }

    return this.send({
      type: 'led_state',
      step,
      playing,
      instrumentId,
      pattern,
    });
  }

  /**
   * Send display update to ESP32 (show current instrument name)
   */
  public sendDisplayUpdate(instrumentName: string): boolean {
    return this.send({ type: 'display', instrument: instrumentName });
  }

  /**
   * Register a handler for BPM messages
   */
  public onBPMChange(handler: BPMMessageHandler): () => void {
    this.bpmHandlers.push(handler);
    return () => {
      this.bpmHandlers = this.bpmHandlers.filter(h => h !== handler);
    };
  }

  /**
   * Register a handler for step button messages
   */
  public onStepButton(handler: StepButtonHandler): () => void {
    this.stepButtonHandlers.push(handler);
    return () => {
      this.stepButtonHandlers = this.stepButtonHandlers.filter(h => h !== handler);
    };
  }

  /**
   * Register a handler for instrument switch messages
   */
  public onInstrumentSwitch(handler: InstrumentSwitchHandler): () => void {
    this.instrumentSwitchHandlers.push(handler);
    return () => {
      this.instrumentSwitchHandlers = this.instrumentSwitchHandlers.filter(h => h !== handler);
    };
  }

  /**
   * Register a handler for connection status changes
   */
  public onStatusChange(handler: ConnectionStatusHandler): () => void {
    this.statusHandlers.push(handler);
    return () => {
      this.statusHandlers = this.statusHandlers.filter(h => h !== handler);
    };
  }

  /**
   * Check if WebSocket is connected
   */
  public isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  /**
   * Disconnect the WebSocket
   */
  public disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  /**
   * Route incoming messages to appropriate handlers based on type
   */
  private routeMessage(data: ESPSensorMessage): void {
    switch (data.type) {
      case 'bpm':
        this.notifyBPMHandlers(data);
        break;
      case 'step_button':
        this.notifyStepButtonHandlers(data);
        break;
      case 'instrument_switch':
        this.notifyInstrumentSwitchHandlers(data);
        break;
      default:
        const _exhaustive: never = data;
        return _exhaustive;
    }
  }

  /**
   * Attempt to reconnect with exponential backoff
   */
  private attemptReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectInterval * this.reconnectAttempts;
      console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      setTimeout(() => this.connect().catch(console.error), delay);
    } else {
      console.error('Max reconnection attempts reached');
    }
  }

  /**
   * Notify all BPM handlers
   */
  private notifyBPMHandlers(data: BPMMessage): void {
    this.bpmHandlers.forEach(handler => {
      try {
        handler(data);
      } catch (error) {
        console.error('Error in BPM handler:', error);
      }
    });
  }

  /**
   * Notify all step button handlers
   */
  private notifyStepButtonHandlers(data: StepButtonMessage): void {
    this.stepButtonHandlers.forEach(handler => {
      try {
        handler(data);
      } catch (error) {
        console.error('Error in step button handler:', error);
      }
    });
  }

  /**
   * Notify all instrument switch handlers
   */
  private notifyInstrumentSwitchHandlers(data: InstrumentSwitchMessage): void {
    this.instrumentSwitchHandlers.forEach(handler => {
      try {
        handler(data);
      } catch (error) {
        console.error('Error in instrument switch handler:', error);
      }
    });
  }

  /**
   * Notify all status handlers
   */
  private notifyStatusHandlers(connected: boolean): void {
    this.statusHandlers.forEach(handler => {
      try {
        handler(connected);
      } catch (error) {
        console.error('Error in status handler:', error);
      }
    });
  }

}
