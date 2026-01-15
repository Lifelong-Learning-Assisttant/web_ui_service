# 📚 API Documentation

Это руководство описывает API endpoints для Web UI Service.

## 🔗 Base URL

```
Dev:  http://localhost:8350
Prod: http://localhost:8150
```

---

## 📡 Endpoints

### 1. WebSocket Connection

**Method:** WebSocket  
**Path:** `/ws`  
**Purpose:** Real-time events (progress, messages, errors)

**Subscribe:**
```json
{"cmd": "subscribe", "session_id": "demo_quiz_1"}
```

**Events:**
```json
{"type": "progress", "step": "intent_determined", "details": "...", "session_id": "..."}
{"type": "error", "message": "...", "session_id": "..."}
{"type": "final", "answer": "...", "session_id": "..."}
```

---

### 2. Send Message to Agent

**Method:** POST  
**Path:** `/api/agent/run`  
**Purpose:** Send user question to agent

**Request:**
```json
{
  "question": "Сгенерируй квиз по Python",
  "session_id": "demo_quiz_1"
}
```

**Response:** Async processing, events via WebSocket

---

### 3. Get Message History

**Method:** GET  
**Path:** `/api/messages`  
**Purpose:** Retrieve conversation history

**Parameters:**
- `session_id` (required): Session identifier

**Response:**
```json
{
  "messages": [
    {"type": "user", "content": "Привет"},
    {"type": "agent", "content": "Привет! Чем помочь?"},
    {"type": "progress", "step": "intent_determined", "details": "..."}
  ]
}
```

---

### 4. Health Check

**Method:** GET  
**Path:** `/health`  
**Purpose:** Check service status

**Response:**
```json
{"status": "ok", "version": "dev"}
```

---

## 📖 Usage Examples

### Example 1: Full Flow with WebSocket

```python
import asyncio
import httpx
import websockets

async def full_flow():
    session_id = "demo_quiz_1"
    
    # 1. Connect WebSocket
    async with websockets.connect("ws://localhost:8250/ws") as ws:
        # Subscribe
        await ws.send(json.dumps({
            "cmd": "subscribe",
            "session_id": session_id
        }))
        
        # 2. Send message via HTTP
        async with httpx.AsyncClient() as client:
            await client.post(
                "http://localhost:8250/api/agent/run",
                json={"question": "Сгенерируй квиз", "session_id": session_id}
            )
        
        # 3. Receive events
        while True:
            event = await ws.recv()
            print(f"Event: {event}")

asyncio.run(full_flow())
```

### Example 2: Get History

```python
import httpx

async def get_history():
    async with httpx.AsyncClient() as client:
        response = await client.get(
            "http://localhost:8250/api/messages",
            params={"session_id": "demo_quiz_1"}
        )
        print(response.json())

asyncio.run(get_history())
```

---

## 🔗 Integration with AgentService

Web UI communicates with **AgentService**:

- **Dev:** `http://agent_dev:8250`
- **Prod:** `http://agent_service:8250`

**AgentService Endpoints Used:**
1. `/ws` — Real-time events
2. `/api/agent/run` — Run agent
3. `/api/messages` — Get history
4. `/api/agent/progress` — Progress updates (internal)

---

## ⚠️ Error Handling

### WebSocket Errors
- **Connection failed:** Check if AgentService is running
- **No events:** Verify `session_id` and subscription

### HTTP Errors
- **404:** Wrong endpoint or service not running
- **500:** AgentService error, check logs

---

## ⚙️ Configuration

**File:** `app_settings-dev.json`
```json
{
  "web_ui_port": 8350,
  "agent_service_url": "http://agent_dev:8250",
  "is_dev_version": true
}
```

---

## 📦 Dependencies

- [`nicegui`](https://nicegui.io/) — UI framework
- [`httpx`](https://www.python-httpx.org/) — HTTP client
- [`websockets`](https://websockets.readthedocs.io/) — WebSocket client

---

## 📚 Related Documents

- [Web UI Architecture](web-ui.md)
- [Docker Deployment](docker_deployment.md)
- [Formula Input Guide](formula_input_guide.md)
- [Testing Guide](testing_guide.md)