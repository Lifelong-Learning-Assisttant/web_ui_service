# Web UI Backend

FastAPI backend для Web UI Service.

## 🎯 Назначение

Обрабатывает API запросы и WebSocket соединения для Web UI.

## 📡 API Endpoints

### Health Check
```
GET /health
```
Проверяет состояние сервиса и количество активных WebSocket соединений.

### WebSocket
```
GET /ws/{session_id}?token={ws_token}
```
Подключение к real-time событиям. Требует токен.

### Get Messages
```
GET /api/messages?session_id={session_id}
```
Получение истории сообщений сессии.

### Run Agent
```
POST /api/agent/run
{
  "question": "...",
  "session_id": "..."
}
```
Запуск агента с вопросом.

### Receive Progress
```
POST /api/agent/progress
{
  "event_id": "...",
  "session_id": "...",
  "step": "...",
  "message": "...",
  "level": "info",
  "ts": "...",
  "meta": {}
}
```
Получение progress events от AgentService.

### Cancel Session
```
POST /api/session/cancel
{
  "session_id": "..."
}
```
Отмена сессии.

## 🔧 Configuration

### Environment Variables
```bash
BACKEND_PORT=8351
AGENT_SERVICE_URL=http://agent_dev:8250
WS_TOKEN=dev_token_123
LOG_LEVEL=INFO
ALLOWED_ORIGINS=http://localhost:8350,http://web_ui_frontend:8350
```

### Settings File
```json
{
  "port": 8351,
  "agent_service_url": "http://agent_dev:8250",
  "allowed_origins": ["http://localhost:8350", "http://web_ui_frontend:8350"],
  "ws_token": "dev_token_123",
  "log_level": "INFO"
}
```

## 🛡️ Security Features

- **CORS**: Настроен для безопасных запросов
- **Rate Limiting**: 5 запросов/минуту на run, 10 на другие эндпоинты
- **WebSocket Token**: Требует токен для подключения
- **Structured Logging**: JSON логи для мониторинга

## 📊 Monitoring

### Health Check
```bash
curl http://localhost:8351/health
```

### Logs
Backend использует structured logging в JSON формате с информацией о:
- Подключениях WebSocket
- Запросах к API
- Ошибках
- Сессиях

## 🔄 Integration

Backend взаимодействует с:
- **AgentService**: Получает историю, запускает агент
- **Frontend**: Отправляет события через WebSocket
- **AgentSession**: Получает progress events

## 🚀 Запуск

### Development
```bash
cd backend
uv sync
uv run python app.py
```

### Docker
```bash
docker-compose -f docker-compose-dev.yml up --build
```

### Production
```bash
export WS_TOKEN=your_secure_token
docker-compose -f docker-compose-prod.yml up -d
```

## 📁 Source Files

- `app.py` - FastAPI сервер с lifespan и endpoints
- `pyproject.toml` - Зависимости (FastAPI, uvicorn, httpx, structlog, slowapi)
- `Dockerfile` - Docker образ
- `app_settings-dev.json` - Dev конфигурация
- `app_settings-prod.json` - Prod конфигурация
- `.env.example` - Пример переменных окружения

## 🎯 Key Features

✅ REST API для интеграции с AgentService  
✅ WebSocket сервер для real-time событий  
✅ CORS middleware  
✅ Rate limiting  
✅ Health checks  
✅ Graceful shutdown  
✅ Structured logging  
✅ Token-based authentication