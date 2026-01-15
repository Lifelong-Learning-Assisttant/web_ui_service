# Web UI Frontend

NiceGUI frontend для Web UI Service.

## 🎯 Назначение

Отображает чат с агентом и получает real-time события от Backend.

## 🎨 Features

- **Real-time Updates**: WebSocket подписка на progress events
- **Session Management**: Поддержка множества сессий
- **History Recovery**: Загрузка истории при старте
- **Progress Rendering**: Визуализация шагов выполнения
- **MathJax Support**: Рендеринг формул
- **Responsive UI**: Адаптивный интерфейс

## 🔧 Configuration

### Environment Variables
```bash
FRONTEND_PORT=8350
BACKEND_URL=http://web_ui_backend:8351
WS_TOKEN=dev_token_123
LOG_LEVEL=INFO
```

### Settings File
```json
{
  "port": 8350,
  "backend_url": "http://web_ui_backend:8351",
  "ws_token": "dev_token_123",
  "log_level": "INFO"
}
```

## 📱 UI Components

### Session Panel
- **Input**: Ввод session_id
- **Button "Установить"**: Загрузка истории
- **Button "Подключиться/Отключиться"**: WebSocket управление
- **Status**: Отображение состояния

### Chat Area
- **User** (справа, синие): Сообщения пользователя
- **Agent** (слева, фиолетовые): Ответы агента
- **Progress** (зеленые, курсив): События прогресса
- **System** (оранжевые): Системные сообщения
- **Error** (красные, жирные): Ошибки

### Input Panel
- **Message Input**: Поле ввода сообщения
- **Send Button**: Отправить запрос
- **Load History**: Загрузить историю
- **Clear Button**: Очистить экран

## 🔄 Integration

Frontend взаимодействует с:
- **Backend API**: REST запросы
- **Backend WebSocket**: Real-time events
- **AgentService**: Через Backend

## 📊 Message Types

### Progress Events
```json
{
  "type": "progress",
  "step": "intent_determined",
  "details": "Классификация запроса",
  "session_id": "test_session"
}
```

### Final Answer
```json
{
  "type": "final",
  "answer": "Ответ агента..."
}
```

### Errors
```json
{
  "type": "error",
  "message": "Ошибка выполнения"
}
```

## 🎯 Usage Workflow

### 1. Start Services
```bash
docker-compose -f docker-compose-dev.yml up
```

### 2. Open Browser
```
http://localhost:8350
```

### 3. Configure Session
- Enter `session_id` (e.g., `test_session`)
- Click "Установить" → загрузит историю
- Click "Подключиться" → WebSocket connection

### 4. Send Message
- Type question
- Click "Отправить"
- Watch progress events in real-time

### 5. View Results
- Final answer appears as Agent message
- All events logged in UI
- History saved for next load

## 🚀 Запуск

### Development
```bash
cd frontend
uv sync
uv run python web_ui.py --settings app_settings-dev.json
```

### Docker
```bash
docker-compose -f docker-compose-dev.yml up --build
```

### Production
```bash
docker-compose -f docker-compose-prod.yml up -d
```

## 📁 Source Files

- `web_ui.py` - NiceGUI приложение
- `pyproject.toml` - Зависимости (nicegui, httpx, websockets, markdown, mathjax)
- `Dockerfile` - Docker образ
- `app_settings-dev.json` - Dev конфигурация
- `app_settings-prod.json` - Prod конфигурация
- `.env.example` - Пример переменных окружения

## 🎯 Key Features

✅ Session management  
✅ WebSocket subscription  
✅ Progress rendering  
✅ History recovery  
✅ MathJax support  
✅ Responsive UI  
✅ Error handling  
✅ Status indicators  

## 🔒 Security

- WebSocket токен в URL
- CORS настроен на Backend
- Rate limiting на Backend