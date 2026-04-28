/*
 * ESP32 WebSocket Client for Music Mandala
 * 
 * Connections:
 * - Button: GPIO 4 (connected to GND when pressed)
 * - Potentiometer: GPIO 34 (analog input)
 * 
 * Upload this code using Arduino IDE or PlatformIO
 */

#include <WiFi.h>
#include <WebSocket.h>

// WiFi credentials - UPDATE THESE
const char* ssid = "routy";
const char* password = "routytoor";

// WebSocket server - UPDATE WITH YOUR COMPUTER'S IP
const char* wsServer = "192.168.1.219"; // Your computer's IP address
const int wsPort = 8080;

// Pin definitions
const int BUTTON_PIN = 4;
const int POT_PIN = 34;

// WebSocket client
WebSocketClient webSocketClient;

// State
bool lastButtonState = false;
int lastPotValue = 0;

void setup() {
  Serial.begin(115200);
  delay(1000);

  // Configure pins
  pinMode(BUTTON_PIN, INPUT_PULLUP);
  pinMode(POT_PIN, INPUT);

  // Connect to WiFi
  Serial.print("Connecting to WiFi...");
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi connected!");
  Serial.print("IP address: ");
  Serial.println(WiFi.localIP());

  // Connect to WebSocket server
  webSocketClient.onEvent(onWebSocketEvent);
  webSocketClient.begin(wsServer, wsPort, "/");
}

void loop() {
  webSocketClient.loop();

  // Read button state
  bool buttonState = digitalRead(BUTTON_PIN) == LOW; // Active LOW

  // Read potentiometer value (0-4095)
  int potValue = analogRead(POT_PIN);

  // Send button state if changed
  if (buttonState != lastButtonState) {
    lastButtonState = buttonState;
    String json = "{\"button\":" + String(buttonState ? "true" : "false") + "}";
    webSocketClient.sendTXT(json);
    Serial.println("Sent button state: " + json);
  }

  // Send potentiometer value if changed significantly (threshold of 50)
  if (abs(potValue - lastPotValue) > 50) {
    lastPotValue = potValue;
    String json = "{\"potentiometer\":" + String(potValue) + "}";
    webSocketClient.sendTXT(json);
    Serial.println("Sent pot value: " + json);
  }

  delay(50); // Small delay to debounce
}

void onWebSocketEvent(WStype_t type, uint8_t* payload, size_t length) {
  switch (type) {
    case WStype_DISCONNECTED:
      Serial.println("WebSocket disconnected!");
      break;
    case WStype_CONNECTED:
      Serial.println("WebSocket connected!");
      break;
    case WStype_TEXT:
      Serial.printf("Message from server: %s\n", payload);
      break;
    case WStype_ERROR:
      Serial.println("WebSocket error!");
      break;
    default:
      break;
  }
}