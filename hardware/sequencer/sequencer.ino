#include <WiFi.h>
#include <WebSocketsClient.h>
#include <ArduinoJson.h>

// Button Setup
const int BUTTON_PIN = 27;
const int POTTY_PIN = 34;

struct ButtonConfig
{
  int pin;
  const char *label;
  const char *type;
  int value;
};

ButtonConfig buttons[] = {
    {BUTTON_PIN, "Instrument Switch", "instrument_switch", 1},
    
    // Add the remaining sequencer and control buttons here.
};

const int buttonCount = sizeof(buttons) / sizeof(buttons[0]);

int lastPotValue = 0;
const int threshold = 256;
int lastButtonReadings[buttonCount];
int buttonStates[buttonCount];
unsigned long lastDebounceTimes[buttonCount];
unsigned long debounceDelay = 50;

WebSocketsClient webSocket;

void sendSensorData(String type, int value)
{
  StaticJsonDocument<200> doc;

  doc["type"] = type;
  doc["value"] = value;

  String output;
  serializeJson(doc, output);
  webSocket.sendTXT(output);
}

void setup()
{
  Serial.begin(115200);

  for (int i = 0; i < buttonCount; i++)
  {
    pinMode(buttons[i].pin, INPUT_PULLUP);
    lastButtonReadings[i] = HIGH;
    buttonStates[i] = HIGH;
    lastDebounceTimes[i] = 0;
  }

  WiFi.begin("routy", "routytoor");
  webSocket.begin("192.168.1.191", 8080, "/");
}

void loop()
{
  webSocket.loop();

  for (int i = 0; i < buttonCount; i++)
  {
    int currentButtonState = digitalRead(buttons[i].pin);

    if (currentButtonState != lastButtonReadings[i])
    {
      lastDebounceTimes[i] = millis();
    }

    if ((millis() - lastDebounceTimes[i]) > debounceDelay)
    {
      if (currentButtonState != buttonStates[i])
      {
        buttonStates[i] = currentButtonState;

        if (buttonStates[i] == LOW)
        {
          Serial.println(String(buttons[i].label) + " pressed!");
          sendSensorData(buttons[i].type, buttons[i].value);
        }
      }
    }

    lastButtonReadings[i] = currentButtonState;
  }

  // Potty
  int currentPotValue = analogRead(POTTY_PIN);
  if (abs(currentPotValue - lastPotValue) > threshold)
  {
    if (webSocket.isConnected())
    {
      // Map the 0-4095 value to a useful BPM range (e.g., 60 to 200)
      int bpm = map(currentPotValue, 0, 4095, 60, 180);

      sendSensorData("bpm", bpm);
      Serial.println("Sent BPM: " + String(bpm));
    }
    lastPotValue = currentPotValue;
  }
}