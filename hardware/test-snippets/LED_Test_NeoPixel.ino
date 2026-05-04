#include <Adafruit_NeoPixel.h>

#define POWER_PIN    13   
#define DATA_PIN     12  
#define NUMPIXELS    3   

Adafruit_NeoPixel pixels(NUMPIXELS, DATA_PIN, NEO_GRB + NEO_KHZ800);

// Renamed from 'index' to 'myIndex' to avoid naming conflicts
int myIndex = 0;

void setup() {
  pinMode(POWER_PIN, OUTPUT);
  digitalWrite(POWER_PIN, HIGH);
  delay(10); 
  pixels.begin();
}

void loop() {
  pixels.clear();

  // Use the new variable name
  pixels.setPixelColor(myIndex % 3,         pixels.Color(150, 0, 0)); // Red
  pixels.setPixelColor((myIndex + 1) % 3,   pixels.Color(0, 150, 0)); // Green
  pixels.setPixelColor((myIndex + 2) % 3,   pixels.Color(0, 0, 150)); // Blue

  pixels.show();
  
  myIndex++; // Increment the uniquely named variable
  
  // Keep myIndex from growing into a massive number eventually
  if (myIndex >= 3) myIndex = 0; 

  delay(200); 
}
