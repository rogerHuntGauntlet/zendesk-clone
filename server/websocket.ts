import { WebSocketServer, WebSocket } from 'ws';
import { IncomingMessage } from 'http';

interface WebSocketClient extends WebSocket {
  id: string;
  employeeId?: string;
}

class TicketWebSocketServer {
  private wss: WebSocketServer;
  private clients: Map<string, WebSocketClient> = new Map();

  constructor(port: number) {
    this.wss = new WebSocketServer({ port });
    this.setupWebSocketServer();
  }

  private setupWebSocketServer() {
    this.wss.on('connection', (ws: WebSocketClient, request: IncomingMessage) => {
      const clientId = Math.random().toString(36).substring(7);
      ws.id = clientId;
      this.clients.set(clientId, ws);

      console.log(`Client connected: ${clientId}`);

      // Handle incoming messages
      ws.on('message', (message: string) => {
        try {
          const data = JSON.parse(message.toString());
          this.handleMessage(ws, data);
        } catch (error) {
          console.error('Error handling message:', error);
        }
      });

      // Handle client disconnection
      ws.on('close', () => {
        console.log(`Client disconnected: ${clientId}`);
        this.clients.delete(clientId);
      });

      // Send initial queue health
      this.sendQueueHealth(ws);

      // Start monitoring for SLA breaches
      this.startSLAMonitoring(ws);
    });
  }

  private handleMessage(client: WebSocketClient, data: any) {
    switch (data.type) {
      case 'TICKET_UPDATE':
        // Broadcast ticket updates to all connected clients
        this.broadcast({
          type: 'TICKET_UPDATE',
          payload: data.payload
        });
        break;

      case 'BREAK_SUGGESTION':
        // Send break suggestion to specific client
        this.sendToClient(client, {
          type: 'BREAK_SUGGESTION',
          payload: data.payload
        });
        break;

      default:
        console.log('Unknown message type:', data.type);
    }
  }

  private broadcast(message: any) {
    const messageStr = JSON.stringify(message);
    this.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(messageStr);
      }
    });
  }

  private sendToClient(client: WebSocketClient, message: any) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  }

  private sendQueueHealth(client: WebSocketClient) {
    // Mock queue health calculation
    setInterval(() => {
      const healthScore = Math.floor(Math.random() * 30) + 70; // Random score between 70-100
      this.sendToClient(client, {
        type: 'QUEUE_UPDATE',
        payload: {
          healthScore
        }
      });
    }, 30000); // Update every 30 seconds
  }

  private startSLAMonitoring(client: WebSocketClient) {
    // Mock SLA monitoring
    setInterval(() => {
      if (Math.random() > 0.8) { // 20% chance of SLA warning
        this.sendToClient(client, {
          type: 'SLA_WARNING',
          payload: {
            message: 'Warning: Ticket response time approaching SLA threshold'
          }
        });
      }
    }, 60000); // Check every minute
  }
}

// Create and export the WebSocket server instance
export const wsServer = new TicketWebSocketServer(3001); 