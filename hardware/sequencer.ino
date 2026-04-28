#include <WiFi.h>
#include <WebSocketsClient.h>
#include <ArduinoJson.h>

// Button Setup
const int BUTTON_PIN = 27; 
const int POTTY_PIN = 34;

int lastPotValue = 0;
const int threshold = 256;
int lastButtonState = HIGH;
unsigned long lastDebounceTime = 0;
unsigned long debounceDelay = 50;

WebSocketsClient webSocket;


void sendSensorData(String type, int value) {
  StaticJsonDocument<200> doc;
  
  doc["type"] = type;
  doc["value"] = value;

  String output;
  serializeJson(doc, output);
  webSocket.sendTXT(output);
}

void setup() {
  Serial.begin(115200);

  pinMode(BUTTON_PIN, INPUT_PULLUP);

  WiFi.begin("routy", "routytoor");
  webSocket.begin("192.168.1.191", 8080, "/");
}

void loop() {
  webSocket.loop();
  
  //Button
  int currentButtonState = digitalRead(BUTTON_PIN);

  if (digitalRead(27) == LOW) {
    Serial.println("Button pressed!");
    sendSensorData("button1", 1);
    delay(100); 
  }

  //Potty
  int currentPotValue = analogRead(POTTY_PIN);
  if (abs(currentPotValue - lastPotValue) > threshold) {
    if (webSocket.isConnected()) {
      // Map the 0-4095 value to a useful BPM range (e.g., 60 to 200)
      int bpm = map(currentPotValue, 0, 4095, 60, 180);

      sendSensorData("bpm", bpm);
      Serial.println("Sent BPM: " + String(bpm));
    }
    lastPotValue = currentPotValue;
  }
}