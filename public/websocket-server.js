import { WebSocketServer } from 'ws';

const wss = new WebSocketServer({ port: 8080 });

console.log('WebSocket server running on ws://localhost:8080');

wss.on('connection', (ws) => {
  console.log('Client connected');

  ws.on('message', (message) => {
    const data = message.toString();
    console.log('Received:', data);

    // Try to parse as JSON
    try {
      const json = JSON.parse(data);
      console.log('JSON data:', json);

      // Broadcast to all clients (including ESP32 if connected)
      broadcast(json);
    } catch (e) {
      // Not JSON, broadcast as-is
      broadcast(data);
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

function broadcast(data) {
  wss.clients.forEach((client) => {
    if (client.readyState === 1) { // WebSocket.OPEN
      client.send(typeof data === 'string' ? data : JSON.stringify(data));
    }
  });
}