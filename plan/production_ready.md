# План Реализации Production-Ready Web UI Service

**Статус:** 🚀 В работе  
**Дата:** 2025-12-26  
**Задача:** Улучшение Web UI Service после Task G

---

## 📋 Overview

После реализации Task G (Backend + Frontend архитектура) необходимо внедрить критические улучшения для production-ready системы.

---

## ✅ Что Уже Сделано

- ✅ Разделение на Backend (FastAPI) + Frontend (NiceGUI)
- ✅ WebSocket для real-time events
- ✅ Session management
- ✅ Progress rendering
- ✅ History recovery
- ✅ Docker Compose с двумя сервисами
- ✅ Базовая документация

---

## 🎯 Приоритет 1: Критические Улучшения

### 1.1 Разделение зависимостей

**Проблема:** Все зависимости в одном `pyproject.toml`

**Решение:** Создать отдельные конфиги

**Файлы:**
- `backend/pyproject.toml` - только FastAPI + uvicorn
- `frontend/pyproject.toml` - только NiceGUI + websockets

**Benefits:**
- Меньший размер контейнеров (~30% reduction)
- Четкое разделение ответственности
- Быстрее сборка
- Можно деплоить отдельно

---

### 1.2 Разделение конфигурации

**Текущая проблема:** `app_settings-dev.json` смешивает настройки

**Решение:** Разделить конфиги

**Файлы:**
- `backend/app_settings.json` - настройки backend
- `frontend/app_settings.json` - настройки frontend

**Структура:**

**backend/app_settings.json:**
```json
{
  "port": 8351,
  "agent_service_url": "http://agent_dev:8250",
  "allowed_origins": ["http://localhost:8350", "http://web_ui_frontend:8350"],
  "ws_token": "dev_token_123"
}
```

**frontend/app_settings.json:**
```json
{
  "port": 8350,
  "backend_url": "http://backend:8351",
  "ws_token": "dev_token_123"
}
```

---

### 1.3 CORS Middleware

**Проблема:** Браузер блокирует запросы между доменами

**Решение:** Добавить CORS в backend

**Файл:** `backend/app.py`

**Код:**
```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:8350",
        "http://web_ui_frontend:8350"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

### 1.4 WebSocket Security

**Проблема:** WebSocket без аутентификации

**Решение:** Добавить токен в URL

**Изменения:**

**backend/app.py:**
```python
@app.websocket("/ws/{session_id}")
async def websocket_endpoint(websocket: WebSocket, session_id: str, token: str):
    if token != settings.ws_token:
        await websocket.close(code=1008, reason="Invalid token")
        return
    # ... остальной код
```

**frontend/web_ui.py:**
```python
ws_url = f"ws://{BACKEND_URL.replace('http://', '').replace('https://', '')}/ws/{session_id}?token={WS_TOKEN}"
```

---

### 1.5 Health Checks

**Решение:** Добавить health check endpoints

**backend/app.py:**
```python
@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "service": "web-ui-backend",
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
```

**docker-compose.yml:**
```yaml
services:
  web_ui_backend:
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8351/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 10s
```

---

### 1.6 Environment Variables

**Решение:** Использовать `.env` вместо JSON

**backend/.env:**
```bash
BACKEND_PORT=8351
AGENT_SERVICE_URL=http://agent_dev:8250
WS_TOKEN=dev_token_123
LOG_LEVEL=INFO
```

**frontend/.env:**
```bash
FRONTEND_PORT=8350
BACKEND_URL=http://web_ui_backend:8351
WS_TOKEN=dev_token_123
LOG_LEVEL=INFO
```

**Загрузка в коде:**
```python
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    backend_port: int = 8351
    agent_service_url: str = "http://agent_dev:8250"
    ws_token: str = "dev_token_123"
    
    class Config:
        env_file = ".env"
```

---

### 1.7 Structured Logging

**Решение:** Структурированные логи

**backend/logger.py:**
```python
import structlog
import logging

def setup_logging():
    structlog.configure(
        processors=[
            structlog.stdlib.filter_by_level,
            structlog.stdlib.add_logger_name,
            structlog.stdlib.add_log_level,
            structlog.stdlib.PositionalArgumentsFormatter(),
            structlog.processors.TimeStamper(fmt="iso"),
            structlog.processors.StackInfoRenderer(),
            structlog.processors.format_exc_info,
            structlog.processors.UnicodeDecoder(),
            structlog.processors.JSONRenderer()
        ],
        context_class=dict,
        logger_factory=structlog.stdlib.LoggerFactory(),
        wrapper_class=structlog.stdlib.BoundLogger,
        cache_logger_on_first_use=True,
    )
```

**Использование:**
```python
logger = structlog.get_logger()
logger.info("websocket_connected", session_id=session_id, ip=client_ip)
logger.warning("invalid_token", ip=client_ip)
logger.error("connection_failed", error=str(e))
```

---

### 1.8 Graceful Shutdown

**Решение:** Корректная обработка сигналов

**backend/app.py:**
```python
import signal
import sys

def shutdown_handler(signum, frame):
    logger.info("shutdown_signal_received", signal=signum)
    # Закрыть все WebSocket соединения
    for session_id, ws in list(ws_connections.items()):
        try:
            await ws.close(code=1001, reason="Server shutting down")
        except:
            pass
    sys.exit(0)

signal.signal(signal.SIGTERM, shutdown_handler)
signal.signal(signal.SIGINT, shutdown_handler)
```

---

### 1.9 Rate Limiting

**Решение:** Защита от спама

**backend/app.py:**
```python
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

limiter = Limiter(key_func=get_remote_address)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

@app.post("/api/agent/run")
@limiter.limit("5/minute")
async def run_agent(request: Request, body: AgentRunRequest):
    # ...
```

---

### 1.10 Dockerfile Optimization

**Решение:** Отдельные Dockerfile для каждого сервиса

**backend/Dockerfile:**
```dockerfile
FROM python:3.13-slim

WORKDIR /app

# Копируем конфиг
COPY pyproject.toml ./
COPY .env ./

# Устанавливаем uv и зависимости
RUN pip install uv && uv sync --no-dev

EXPOSE 8351

CMD ["uv", "run", "python", "app.py"]
```

**frontend/Dockerfile:**
```dockerfile
FROM python:3.13-slim

WORKDIR /app

# Копируем конфиг
COPY pyproject.toml ./
COPY .env ./

# Устанавливаем uv и зависимости
RUN pip install uv && uv sync --no-dev

EXPOSE 8350

CMD ["uv", "run", "python", "web_ui.py"]
```

---

## 📊 Реализация

### Шаг 1: Создание структуры

```bash
cd web_ui_service
mkdir -p backend frontend
```

### Шаг 2: Перемещение файлов

**Backend:**
```bash
mv backend.py backend/app.py
mv app_settings-dev.json backend/app_settings.json
mv app_settings-prod.json backend/
# Создать backend/pyproject.toml
# Создать backend/Dockerfile
# Создать backend/.env
```

**Frontend:**
```bash
mv web_ui.py frontend/web_ui.py
mv app_settings-dev.json frontend/app_settings.json
mv app_settings-prod.json frontend/
# Создать frontend/pyproject.toml
# Создать frontend/Dockerfile
# Создать frontend/.env
```

### Шаг 3: Обновление docker-compose

```yaml
version: '3.8'

services:
  web_ui_backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "8351:8351"
    volumes:
      - ./backend:/app
    networks:
      - web_ui_network_dev
      - rag_network
      - test_generator_network
    env_file:
      - backend/.env
    command: uv run python app.py
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8351/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  web_ui_frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "8350:8350"
    volumes:
      - ./frontend:/app
    networks:
      - web_ui_network_dev
    env_file:
      - frontend/.env
    command: uv run python web_ui.py
    depends_on:
      web_ui_backend:
        condition: service_healthy

networks:
  web_ui_network_dev:
    driver: bridge
    name: web_ui_network_dev
  rag_network:
    external: true
    name: rag_rag_network
  test_generator_network:
    external: true
    name: llm_tester_default
```

---

## 📝 Чек-лист

- [ ] Создать `backend/` и `frontend/` директории
- [ ] Создать `backend/pyproject.toml`
- [ ] Создать `frontend/pyproject.toml`
- [ ] Создать `backend/Dockerfile`
- [ ] Создать `frontend/Dockerfile`
- [ ] Создать `backend/.env`
- [ ] Создать `frontend/.env`
- [ ] Переместить `backend.py` → `backend/app.py`
- [ ] Переместить `web_ui.py` → `frontend/web_ui.py`
- [ ] Обновить `backend/app.py` (CORS, health, logging, security)
- [ ] Обновить `frontend/web_ui.py` (token, backend_url)
- [ ] Обновить `agent_service/agent_session.py` (backend_url)
- [ ] Обновить `docker-compose-dev.yml`
- [ ] Обновить `docker-compose-prod.yml`
- [ ] Обновить документацию
- [ ] Протестировать полный поток

---

## 🎯 Результат

**После внедрения:**

✅ **Безопасность:**
- CORS настроен
- WebSocket с токеном
- Rate limiting

✅ **Надежность:**
- Health checks
- Graceful shutdown
- Структурированные логи

✅ **Производительность:**
- Разделенные зависимости
- Оптимизированные Dockerfile
- Быстрая сборка

✅ **Поддерживаемость:**
- Четкая структура
- Environment variables
- Стандартизированный код

---

## 📞 Следующие Шаги

1. **Создать директории и файлы**
2. **Переместить код**
3. **Обновить конфиги**
4. **Протестировать**
5. **Задеплоить**

**Время реализации:** ~2-3 часа

---

## 🔗 Связанные Файлы

- `backend/app.py` - FastAPI сервер
- `frontend/web_ui.py` - NiceGUI frontend
- `agent_service/agent_session.py` - отправка на backend
- `docker-compose-dev.yml` - оркестрация

---

**Статус:** 📝 Готов к реализации  
**Приоритет:** 🔴 Критический  
**Сложность:** 🔷 Средняя