import { useAppStore } from './appStore';

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
        return;
      }

      // Обработка событий прогресса и новых сообщений
      if (data.step || data.type === 'final_answer') {
        const store = useAppStore.getState();
        
        // Если это финальный ответ или важное событие, обновляем историю
        if (data.step === 'final_answer' || data.type === 'final_answer') {
          store.setSessionId(sessionId, true);
        } else {
          // Для промежуточных шагов добавляем системное сообщение
          store.addMessage({
            role: 'assistant',
            content: data.message || `Выполняю: ${data.step}`,
            isSystem: true,
            type: data.type,
            meta: data.meta
          });
        }
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