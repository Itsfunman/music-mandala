#include <WiFi.h>
#include <WebSocketsClient.h>
#include <ArduinoJson.h>

const char* WIFI_SSID = "raspy";
// const char* WIFI_PASSWORD = "raspytoor";
const char* WS_HOST = "10.42.0.1";
const uint16_t WS_PORT = 8080;

const int BUTTON_PINS[16] = {
  4, 5, 13, 14,
  16, 17, 18, 19, 
  21, 22, 23,
  25, 26, 27,
  32, 33
};


const unsigned long DEBOUNCE_DELAY_MS = 40;

WebSocketsClient webSocket;
bool lastReading[16];
bool stableState[16];
unsigned long lastChangeAt[16];

void sendStepButton(int stepIndex) {
  StaticJsonDocument<128> doc;
  doc["type"] = "step_button";
  doc["step"] = stepIndex;
  doc["pressed"] = true;

  String payload;
  serializeJson(doc, payload);
  webSocket.sendTXT(payload);
}

void onWebSocketEvent(WStype_t type, uint8_t* payload, size_t length) {
  switch (type) {
    case WStype_CONNECTED:
      Serial.println("WebSocket connected");
      break;
    case WStype_DISCONNECTED:
      Serial.println("WebSocket disconnected");
      break;
    default:
      break;
  }
}

void setup() {
  Serial.begin(115200);

  for (int i = 0; i < 16; i++) {
    pinMode(BUTTON_PINS[i], INPUT_PULLUP);
    bool pressed = digitalRead(BUTTON_PINS[i]) == LOW;
    lastReading[i] = pressed;
    stableState[i] = pressed;
    lastChangeAt[i] = 0;
  }

  WiFi.begin(WIFI_SSID);//, WIFI_PASSWORD);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
  }
  Serial.println("WiFi connected");

  webSocket.begin(WS_HOST, WS_PORT, "/");
  webSocket.onEvent(onWebSocketEvent);
  webSocket.setReconnectInterval(3000);
}

void loop() {
  webSocket.loop();

  unsigned long now = millis();

  for (int i = 0; i < 16; i++) {
    bool currentReading = digitalRead(BUTTON_PINS[i]) == LOW;

    if (currentReading != lastReading[i]) {
      lastReading[i] = currentReading;
      lastChangeAt[i] = now;
    }

    if ((now - lastChangeAt[i]) > DEBOUNCE_DELAY_MS && currentReading != stableState[i]) {
      stableState[i] = currentReading;

      if (stableState[i]) {
        sendStepButton(i);
      }
    }
  }
}