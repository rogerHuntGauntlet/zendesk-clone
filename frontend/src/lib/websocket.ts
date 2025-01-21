import { toast } from "@/components/ui/use-toast";

type WebSocketEvent = {
  type: 
    | 'TICKET_UPDATE' 
    | 'QUEUE_UPDATE' 
    | 'ALERT' 
    | 'CHAT_MESSAGE' 
    | 'BREAK_SUGGESTION' 
    | 'SLA_WARNING'
    | 'QUEUE_BOTTLENECK'
    | 'WORKLOAD_ALERT'
    | 'FOCUS_MODE_UPDATE'
    | 'BREAK_TIME_UPDATE'
    | 'TEAM_PRESENCE'
    | 'SCREEN_SHARE_REQUEST'
    | 'HUDDLE_INVITATION'
    | 'TEMPLATE_UPDATE'
    | 'BULK_OPERATION_STATUS'
    | 'COLUMN_CONFIG_UPDATE';
  payload: any;
};

type WebSocketSubscriber = (event: WebSocketEvent) => void;

class WebSocketService {
  private socket: WebSocket | null = null;
  private subscribers: WebSocketSubscriber[] = [];
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private isConnecting = false;

  connect() {
    if (this.isConnecting) return;
    this.isConnecting = true;

    try {
      this.socket = new WebSocket('ws://localhost:3001');

      this.socket.onopen = () => {
        console.log('WebSocket connected');
        this.reconnectAttempts = 0;
        this.isConnecting = false;
      };

      this.socket.onmessage = (event) => {
        try {
          const wsEvent: WebSocketEvent = JSON.parse(event.data);
          this.notifySubscribers(wsEvent);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.socket.onclose = () => {
        console.log('WebSocket disconnected');
        this.isConnecting = false;
        this.handleReconnect();
      };

      this.socket.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.isConnecting = false;
        // Don't show error toast on initial connection attempts
        if (this.reconnectAttempts > 0) {
          toast({
            title: "Connection Error",
            description: "Having trouble connecting to the server. Will retry automatically.",
            variant: "destructive",
          });
        }
      };
    } catch (error) {
      console.error('Failed to connect to WebSocket:', error);
      this.isConnecting = false;
      this.handleReconnect();
    }
  }

  private handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000); // Exponential backoff, max 30s
      console.log(`Attempting to reconnect in ${delay/1000}s (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      setTimeout(() => {
        this.connect();
      }, delay);
    } else {
      toast({
        title: "Connection Error",
        description: "Unable to establish real-time connection. Some features may be limited.",
        variant: "destructive",
      });
    }
  }

  subscribe(callback: WebSocketSubscriber) {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter(sub => sub !== callback);
    };
  }

  private notifySubscribers(event: WebSocketEvent) {
    this.subscribers.forEach(subscriber => {
      try {
        subscriber(event);
      } catch (error) {
        console.error('Error in subscriber callback:', error);
      }
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.reconnectAttempts = 0;
    this.isConnecting = false;
  }

  send(event: WebSocketEvent) {
    if (this.socket?.readyState === WebSocket.OPEN) {
      try {
        this.socket.send(JSON.stringify(event));
      } catch (error) {
        console.error('Error sending WebSocket message:', error);
        toast({
          title: "Error",
          description: "Failed to send message. Please try again.",
          variant: "destructive",
        });
      }
    } else {
      console.warn('WebSocket is not connected. Message not sent.');
    }
  }
}

export const wsService = new WebSocketService(); 