#!/usr/bin/env python3
"""
API endpoint'ы для взаимодействия с агентом.
"""

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
import httpx
import os

# Получение URL агента из переменной окружения
AGENT_SERVICE_URL = os.getenv("AGENT_SERVICE_URL", "http://localhost:8250")

# Создание приложения FastAPI
app = FastAPI()

# Настройка CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Модель для сообщения
class Message(BaseModel):
    text: str

# Список сообщений
messages_list = []

# WebSocket соединения
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def send_personal_message(self, message: str, websocket: WebSocket):
        await websocket.send_text(message)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            await connection.send_text(message)

manager = ConnectionManager()

# WebSocket endpoint
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            messages_list.append(("User", data))
            await manager.broadcast(f"User: {data}")
            
            # Отправка сообщения агенту
            try:
                response = httpx.post(
                    f"{AGENT_SERVICE_URL}/api/agent/run",
                    json={"question": data, "session_id": "default"}
                )
                if response.status_code == 200:
                    agent_response = response.json()["answer"]
                    messages_list.append(("Agent", agent_response))
                    await manager.broadcast(f"Agent: {agent_response}")
                else:
                    messages_list.append(("Agent", "Ошибка при обработке сообщения."))
                    await manager.broadcast("Agent: Ошибка при обработке сообщения.")
            except Exception as e:
                messages_list.append(("Agent", f"Ошибка соединения с агентом: {str(e)}"))
                await manager.broadcast(f"Agent: Ошибка соединения с агентом: {str(e)}")
    except WebSocketDisconnect:
        manager.disconnect(websocket)
        await manager.broadcast(f"Client disconnected")

# Endpoint для отправки сообщений
@app.post("/api/messages")
async def send_message(message: Message):
    messages_list.append(("User", message.text))
    
    # Отправка сообщения агенту
    try:
        response = httpx.post(
            f"{AGENT_SERVICE_URL}/api/agent/run",
            json={"question": message.text, "session_id": "default"}
        )
        if response.status_code == 200:
            agent_response = response.json()["answer"]
            messages_list.append(("Agent", agent_response))
            return {"status": "success", "message": "Message received", "agent_response": agent_response}
        else:
            return {"status": "error", "message": "Error processing message"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Endpoint для получения сообщений
@app.get("/api/messages")
async def get_messages():
    return {"messages": messages_list}

# Запуск приложения
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8150)