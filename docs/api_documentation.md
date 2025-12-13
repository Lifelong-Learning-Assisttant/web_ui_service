# Документация API для чата с агентом ЛЛМ

## Обзор

Этот документ описывает API для взаимодействия с чатом агента ЛЛМ. API предоставляет endpoint'ы для отправки и получения сообщений, а также WebSocket для обмена сообщениями в реальном времени.

## Базовый URL

```
http://localhost:8150
```

## Endpoint'ы

### 1. Отправка сообщения

**Метод:** POST
**Путь:** `/api/messages`
**Описание:** Отправляет сообщение от пользователя агенту.

**Параметры:**
- `text` (строка, обязательно): Текст сообщения.

**Пример запроса:**
```bash
curl -X POST "http://localhost:8150/api/messages" \
-H "Content-Type: application/json" \
-d '{"text": "Привет, агент!"}'
```

**Пример ответа:**
```json
{
  "status": "success",
  "message": "Message received"
}
```

### 2. Получение сообщений

**Метод:** GET
**Путь:** `/api/messages`
**Описание:** Возвращает список сообщений.

**Пример запроса:**
```bash
curl -X GET "http://localhost:8150/api/messages"
```

**Пример ответа:**
```json
{
  "messages": [
    ["User", "Привет, агент!"],
    ["Agent", "Сообщение получено"]
  ]
}
```

### 3. WebSocket соединение

**Метод:** WebSocket
**Путь:** `/ws`
**Описание:** Устанавливает WebSocket соединение для обмена сообщениями в реальном времени.

**Пример использования:**
```javascript
const socket = new WebSocket('ws://localhost:8150/ws');

socket.onopen = function(e) {
  console.log("Соединение установлено");
  socket.send("Привет, агент!");
};

socket.onmessage = function(event) {
  console.log("Получено сообщение:", event.data);
};

socket.onclose = function(event) {
  if (event.wasClean) {
    console.log("Соединение закрыто");
  } else {
    console.log("Соединение прервано");
  }
};

socket.onerror = function(error) {
  console.log("Ошибка:", error.message);
};
```

## Примеры использования

### Отправка сообщения с формулами

Для отправки сообщения с формулами используйте двойные знаки доллара для обозначения формул:

```bash
curl -X POST "http://localhost:8150/api/messages" \
-H "Content-Type: application/json" \
-d '{"text": "Решим уравнение $$x^2 = 4$$ → $$x = \\pm 2$$"}'
```

### Получение сообщений с формулами

При получении сообщений формулы будут отображаться в формате MathJax.

## Запуск приложения

### Запуск веб-интерфейса

```bash
uv run python web_ui.py
```

### Запуск API endpoint'ов

```bash
uv run python api_endpoints.py
```

## Зависимости

- `nicegui>=1.0.0`
- `fastapi>=0.68.0`
- `uvicorn>=0.15.0`
- `python-multipart>=0.0.5`
- `markdown>=3.3.4`
- `mathjax>=0.1.2`
- `httpx>=0.23.0`

## Лицензия

Этот проект лицензирован под лицензией MIT. Подробности см. в файле LICENSE.