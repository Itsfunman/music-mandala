#include <WiFi.h>
#include <WebSocketsClient.h>
#include <ArduinoJson.h>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <Adafruit_NeoPixel.h>

// --- Hardware Pins ---
const int POTTY_PIN = 32;       
const int BUTTON_INST = 25;     
const int BUTTON_SAVE = 26;     
const int NEOPIXEL_PIN = 12;    
const int NUM_PIXELS = 16;      

// --- Objects ---
#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, -1);
Adafruit_NeoPixel pixels(NUM_PIXELS, NEOPIXEL_PIN, NEO_GRB + NEO_KHZ800);
WebSocketsClient webSocket;

// --- State Variables ---
int lastPotValue = 0;
const int potThreshold = 50; 
int lastInstState = HIGH;
int lastSaveState = HIGH;
String currentInstrumentName = "Ready";

// --- WebSocket Inbound Handler ---
void webSocketEvent(WStype_t type, uint8_t * payload, size_t length) {
  if (type == WStype_TEXT) {
    StaticJsonDocument<256> doc;
    DeserializationError error = deserializeJson(doc, payload);
    if (error) return;

    String msgType = doc["type"];

    // Update Display Name when Frontend switches instruments
    if (msgType == "display") {
      currentInstrumentName = doc["instrument"].as<String>();
      updateDisplay(lastPotValue);
    }
  }
}

// Helper to refresh OLED
void updateDisplay(int potVal) {
  int bpm = map(potVal, 0, 4095, 60, 180);
  display.clearDisplay();
  display.setTextColor(WHITE);
  display.setCursor(0, 0);
  
  display.setTextSize(1);
  display.println("INSTRUMENT:");
  display.setTextSize(2);
  display.println(currentInstrumentName);
  
  display.setCursor(0, 40);
  display.setTextSize(1);
  display.println("TEMPO:");
  display.setTextSize(2);
  display.print(bpm);
  display.println(" BPM");
  
  display.display();
}

void setup() {
  Serial.begin(115200);

  // 1. Initialize NeoPixels to Always White
  pixels.begin();
  pixels.setBrightness(30); // Keep brightness low for testing
  for(int i=0; i<NUM_PIXELS; i++) {
    pixels.setPixelColor(i, pixels.Color(255, 255, 255)); // White
  }
  pixels.show();

  // 2. Initialize OLED
  if(!display.begin(SSD1306_SWITCHCAPVCC, 0x3C)) {
    Serial.println(F("OLED failed"));
  }
  updateDisplay(analogRead(POTTY_PIN));

  // 3. Initialize Buttons
  pinMode(BUTTON_INST, INPUT_PULLUP);
  pinMode(BUTTON_SAVE, INPUT_PULLUP);

  // 4. Connectivity
  WiFi.begin("routy", "routytoor");
  webSocket.begin("192.168.1.191", 8080, "/");
  webSocket.onEvent(webSocketEvent);
}

void loop() {
  webSocket.loop();

  // --- Instrument Switch Button ---
  int currentInstState = digitalRead(BUTTON_INST);
  if (currentInstState == LOW && lastInstState == HIGH) {
    StaticJsonDocument<100> doc;
    doc["type"] = "instrument_switch";
    String out;
    serializeJson(doc, out);
    webSocket.sendTXT(out);
    delay(50); 
  }
  lastInstState = currentInstState;

  // --- Save Button ---
  int currentSaveState = digitalRead(BUTTON_SAVE);
  if (currentSaveState == LOW && lastSaveState == HIGH) {
    StaticJsonDocument<100> doc;
    doc["type"] = "save_reset";
    String out;
    serializeJson(doc, out);
    webSocket.sendTXT(out);
    delay(50);
  }
  lastSaveState = currentSaveState;

  // --- Potentiometer (BPM) ---
  int currentPotValue = analogRead(POTTY_PIN);
  if (abs(currentPotValue - lastPotValue) > potThreshold) {
    int bpm = map(currentPotValue, 0, 4095, 60, 180);
    StaticJsonDocument<100> doc;
    doc["type"] = "bpm";
    doc["value"] = bpm;
    String out;
    serializeJson(doc, out);
    webSocket.sendTXT(out);
    
    updateDisplay(currentPotValue);
    lastPotValue = currentPotValue;
  }
}