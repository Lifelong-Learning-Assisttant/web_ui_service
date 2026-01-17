class WebSocketService {
  private socket: WebSocket | null = null;
  private sessionId: string | null = null;

  connect(sessionId: string) {
    if (this.socket) {
      this.socket.close();
    }

    this.sessionId = sessionId;
    const token = 'dev_token_123'; // Должно браться из настроек
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const host = window.location.hostname === 'localhost' ? 'localhost:8151' : window.location.host;
    
    this.socket = new WebSocket(`${protocol}://${host}/ws/${sessionId}?token=${token}`);

    this.socket.onopen = () => {
      console.log('Connected to WebSocket');
      (window as any).chatWS = this.socket;
    };

    this.socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      // Пробрасываем события терминала через кастомные события DOM
      if (data.type === 'terminal_output' || data.type === 'terminal_done') {
        window.dispatchEvent(new CustomEvent('ws-terminal-output', { detail: data }));
      }
    };

    this.socket.onclose = () => {
      console.log('Disconnected from WebSocket');
      (window as any).chatWS = null;
    };
  }

  send(data: any) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(data));
    }
  }
}

export const wsService = new WebSocketService();