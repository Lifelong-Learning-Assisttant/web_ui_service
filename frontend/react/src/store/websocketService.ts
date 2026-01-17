import { useAppStore } from './appStore';

class WebSocketService {
  private ws: WebSocket | null = null;
  private sessionId: string | null = null;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 10;
  private reconnectInterval: number = 3000;
  private token: string = 'dev_token_123';
  private reconnectTimeout: any = null;

  connect(sessionId: string) {
    // Если уже подключены к этой сессии, ничего не делаем
    if (this.ws && this.sessionId === sessionId && this.ws.readyState === WebSocket.OPEN) {
      console.log(`WebSocket already connected to session ${sessionId}`);
      return;
    }

    // Очищаем таймер переподключения, если он был
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.ws) {
      // Убираем обработчик onclose у старого сокета, чтобы он не триггерил переподключение
      this.ws.onclose = null;
      this.ws.close(1000);
    }

    this.sessionId = sessionId;
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host; 
    // В режиме разработки Vite проксирует запросы. Мы добавим прокси для /ws в vite.config.ts
    const wsUrl = `${protocol}//${host}/ws/${sessionId}?token=${this.token}`;

    console.log(`Connecting to WebSocket: ${wsUrl}`);
    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.handleMessage(data);
      } catch (e) {
        console.error('Error parsing WebSocket message:', e);
      }
    };

    this.ws.onclose = (event) => {
      if (event.code !== 1000 && this.sessionId) {
        console.log('WebSocket disconnected, attempting reconnect...');
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectTimeout = setTimeout(() => {
            this.reconnectAttempts++;
            if (this.sessionId) this.connect(this.sessionId);
          }, this.reconnectInterval);
        }
      }
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }

  private handleMessage(data: any) {
    const store = useAppStore.getState();
    
    console.log('WS Message received:', data);

    // Игнорируем технические сообщения
    if (data.type === 'subscribed' || data.type === 'pong') {
      return;
    }

    if (data.step === 'final_answer' || data.step === 'cancelled' || data.step === 'tool_error') {
      // При получении финального ответа или ошибки обновляем историю сообщений
      // Это гарантирует, что мы получим полный и корректно отформатированный ответ
      setTimeout(() => {
        store.setSessionId(data.session_id);
      }, 500);
    } else {
      // Добавляем сообщение о прогрессе или вопрос квиза
      store.addMessage({
        role: 'assistant',
        content: data.message || `Выполнение: ${data.step}`,
        isSystem: data.step !== 'quizz_question',
        type: data.step,
        meta: data.meta
      });
    }
  }

  disconnect() {
    this.sessionId = null;
    if (this.ws) {
      this.ws.close(1000, 'Normal closure');
      this.ws = null;
    }
  }
}

export const wsService = new WebSocketService();