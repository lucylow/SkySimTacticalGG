/**
 * WebSocket client for live replay events.
 */
export class ReplaySocket {
  constructor(url, onEvent) {
    this.url = url;
    this.onEvent = onEvent;
    this.ws = null;
    this.reconnectDelay = 1000;
    this.connect();
  }

  connect() {
    try {
      this.ws = new WebSocket(this.url);
      
      this.ws.onopen = () => {
        console.log("Replay WebSocket connected");
        this.reconnectDelay = 1000;
      };

      this.ws.onmessage = (msg) => {
        try {
          const event = JSON.parse(msg.data);
          this.onEvent(event);
        } catch (e) {
          console.error("Failed to parse event:", e);
        }
      };

      this.ws.onerror = (error) => {
        console.error("WebSocket error:", error);
      };

      this.ws.onclose = () => {
        console.log("WebSocket closed, reconnecting...");
        setTimeout(() => this.connect(), this.reconnectDelay);
        this.reconnectDelay = Math.min(this.reconnectDelay * 2, 10000);
      };
    } catch (e) {
      console.error("Failed to connect WebSocket:", e);
      setTimeout(() => this.connect(), this.reconnectDelay);
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}


