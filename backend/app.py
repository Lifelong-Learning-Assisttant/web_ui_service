#!/usr/bin/env python3
"""
Web UI Backend (FastAPI)
Обрабатывает API запросы и WebSocket соединения для Web UI.
"""

import asyncio
import json
import signal
import sys
from datetime import datetime, timezone
from typing import Dict, Optional, Any, List
from contextlib import asynccontextmanager

import httpx
import structlog
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

# ===== Settings =====
class Settings:
    """Настройки из JSON файла"""
    def __init__(self, settings_path: str = "app_settings.json"):
        try:
            with open(settings_path, "r") as f:
                data = json.load(f)
            self.port = data.get("port", 8351)
            self.agent_service_url = data.get("agent_service_url", "http://agent_dev:8250")
            self.user_service_url = data.get("user_service_url", "http://user_service:8000")
            self.allowed_origins = data.get("allowed_origins", ["http://localhost:8350"])
            self.ws_token = data.get("ws_token", "dev_token_123")
            self.log_level = data.get("log_level", "INFO")
        except FileNotFoundError:
            import os
            self.port = int(os.getenv("BACKEND_PORT", "8351"))
            self.agent_service_url = os.getenv("AGENT_SERVICE_URL", "http://agent_dev:8250")
            self.user_service_url = os.getenv("USER_SERVICE_URL", "http://user_service:8000")
            self.allowed_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:8350").split(",")
            self.ws_token = os.getenv("WS_TOKEN", "dev_token_123")
            self.log_level = os.getenv("LOG_LEVEL", "INFO")

# Определение файла настроек на основе переменной окружения
import os
settings_file = os.getenv("SETTINGS_FILE", "app_settings-dev.json")
settings = Settings(settings_file)

# ===== Logging =====
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

logger = structlog.get_logger()

# ===== Rate Limiter =====
limiter = Limiter(key_func=get_remote_address)

# ===== Lifespan =====
ws_connections: Dict[str, List[WebSocket]] = {}

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Управление жизненным циклом приложения"""
    logger.info("backend_startup")
    
    # Graceful shutdown handlers
    def shutdown_handler(signum, frame):
        logger.info("shutdown_signal_received", signal=signum)
        asyncio.create_task(close_all_connections())
    
    signal.signal(signal.SIGTERM, shutdown_handler)
    signal.signal(signal.SIGINT, shutdown_handler)
    
    yield
    
    # Cleanup
    logger.info("backend_shutdown")
    await close_all_connections()

async def close_all_connections():
    """Закрыть все WebSocket соединения"""
    for session_id, sockets in list(ws_connections.items()):
        for ws in sockets:
            try:
                await ws.close(code=1001, reason="Server shutting down")
            except:
                pass
    ws_connections.clear()

# ===== FastAPI App =====
app = FastAPI(
    title="Web UI Backend",
    description="Backend API for Web UI with WebSocket support",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Rate Limiting
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# ===== Models =====
class AgentRunRequest(BaseModel):
    question: str
    session_id: str

class SessionRequest(BaseModel):
    session_id: str

class ProgressEvent(BaseModel):
    event_id: str
    session_id: str
    step: str
    tool: Optional[str] = None
    message: str
    level: str
    ts: str
    meta: Optional[Dict[str, Any]] = None

class SubscribeMessage(BaseModel):
    cmd: str
    session_id: str
    token: Optional[str] = None

# ===== WebSocket Endpoint =====
@app.websocket("/ws/{session_id}")
async def websocket_endpoint(websocket: WebSocket, session_id: str, token: str = ""):
    """WebSocket endpoint for real-time events"""
    
    # Security check
    if token != settings.ws_token:
        logger.warning("invalid_ws_token", session_id=session_id, ip=websocket.client.host)
        await websocket.close(code=1008, reason="Invalid token")
        return
    
    await websocket.accept()
    if session_id not in ws_connections:
        ws_connections[session_id] = []
    ws_connections[session_id].append(websocket)
    
    logger.info("websocket_connected", session_id=session_id, ip=websocket.client.host, total_for_session=len(ws_connections[session_id]))
    
    # Отправляем подтверждение подписки
    await websocket.send_json({
        "type": "subscribed",
        "session_id": session_id,
        "message": f"Subscribed to session {session_id}"
    })
    
    try:
        while True:
            # Keep connection alive and handle messages
            data = await websocket.receive_text()
            try:
                msg = json.loads(data)
                if msg.get("cmd") == "ping":
                    await websocket.send_json({"type": "pong"})
            except:
                pass
                
    except WebSocketDisconnect:
        logger.info("websocket_disconnected", session_id=session_id)
    except Exception as e:
        logger.error("websocket_error", session_id=session_id, error=str(e))
    finally:
        if session_id in ws_connections:
            if websocket in ws_connections[session_id]:
                ws_connections[session_id].remove(websocket)
            if not ws_connections[session_id]:
                del ws_connections[session_id]

async def broadcast_to_session(session_id: str, message: dict):
    """Отправить сообщение всем подписчикам сессии"""
    if session_id in ws_connections:
        disconnected = []
        for ws in ws_connections[session_id]:
            try:
                await ws.send_json(message)
                logger.debug("message_broadcasted", session_id=session_id, step=message.get("step"))
            except Exception as e:
                logger.warning("broadcast_failed", session_id=session_id, error=str(e))
                disconnected.append(ws)
        
        # Очистка мертвых соединений
        for ws in disconnected:
            if ws in ws_connections[session_id]:
                ws_connections[session_id].remove(ws)
        if session_id in ws_connections and not ws_connections[session_id]:
            del ws_connections[session_id]

# ===== API Endpoints =====
@app.get("/health")
async def health():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "web-ui-backend",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "connections": len(ws_connections)
    }

@app.get("/api/messages")
async def get_messages(request: Request, session_id: str = "default"):
    """Get message history for session"""
    try:
        async with httpx.AsyncClient() as client:
            # Агент использует /api/messages
            response = await client.get(
                f"{settings.agent_service_url}/api/messages",
                params={"session_id": session_id},
                timeout=5.0
            )
            
            if response.status_code == 200:
                data = response.json()
                messages = data.get("messages", [])
                logger.info("history_loaded", session_id=session_id, count=len(messages))
                return {"messages": messages}
            else:
                logger.warning("history_not_found", session_id=session_id, status=response.status_code)
                return {"messages": []}
                
    except Exception as e:
        logger.error("history_error", session_id=session_id, error=str(e))
        return {"messages": []}

@app.post("/api/agent/run")
async def run_agent(request: Request, body: AgentRunRequest):
    """Run agent with question"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{settings.agent_service_url}/api/agent/run",
                json={
                    "question": body.question,
                    "session_id": body.session_id
                },
                timeout=300.0
            )
            
            if response.status_code == 200:
                logger.info("agent_started", session_id=body.session_id)
                return {"status": "started", "session_id": body.session_id}
            else:
                try:
                    error_detail = response.json()
                except:
                    error_detail = response.text
                logger.error("agent_failed", session_id=body.session_id, status=response.status_code, detail=error_detail)
                raise HTTPException(status_code=response.status_code, detail=f"Agent service error: {error_detail}")
                
    except Exception as e:
        logger.error("agent_error", session_id=body.session_id, error=str(e))
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/agent/progress")
async def receive_progress(event: ProgressEvent):
    """Receive progress events from AgentService"""
    logger.info(
        "progress_received",
        session_id=event.session_id,
        step=event.step,
        level=event.level
    )
    
    # Broadcast to WebSocket subscribers
    await broadcast_to_session(event.session_id, event.dict())
    
    return {"status": "received"}

@app.post("/api/session/cancel")
async def cancel_session(request: Request, body: SessionRequest):
    """Cancel session"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{settings.agent_service_url}/api/session/cancel",
                json={"session_id": body.session_id},
                timeout=5.0
            )
            
            logger.info("session_cancelled", session_id=body.session_id)
            return {"status": "cancelled"}
            
    except Exception as e:
        logger.error("cancel_error", session_id=body.session_id, error=str(e))
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/session/clear")
async def clear_session(request: Request, body: SessionRequest):
    """Clear session history"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{settings.agent_service_url}/api/agent/clear_session",
                json={"session_id": body.session_id},
                timeout=5.0
            )
            
            logger.info("session_cleared", session_id=body.session_id)
            return {"status": "success", "message": "Session history cleared"}
            
    except Exception as e:
        logger.error("clear_session_error", session_id=body.session_id, error=str(e))
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/session/end")
async def end_session(request: Request, body: SessionRequest):
    """End session and delete all history"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{settings.agent_service_url}/api/agent/end_session",
                json={"session_id": body.session_id},
                timeout=5.0
            )
            
            logger.info("session_ended", session_id=body.session_id)
            return {"status": "success", "message": "Session ended and history deleted"}
            
    except Exception as e:
        logger.error("end_session_error", session_id=body.session_id, error=str(e))
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/auth/login")
async def login(request: Request):
    """Proxy login request to User Service"""
    try:
        body = await request.form()
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{settings.user_service_url}/auth/login",
                data=body,
                timeout=10.0
            )
            return JSONResponse(
                status_code=response.status_code,
                content=response.json()
            )
    except Exception as e:
        logger.error("login_proxy_error", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/settings")
async def get_user_settings(request: Request, user_id: str):
    """Get user settings from User Service"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{settings.user_service_url}/settings/{user_id}",
                timeout=5.0
            )
            return JSONResponse(
                status_code=response.status_code,
                content=response.json()
            )
    except Exception as e:
        logger.error("get_settings_proxy_error", error=str(e))
        return JSONResponse(status_code=200, content={})

@app.post("/api/session/settings")
async def update_user_settings(request: Request):
    """Update user settings in User Service"""
    try:
        body = await request.json()
        user_id = body.get("user_id")
        user_settings = body.get("settings")
        
        if not user_id or not user_settings:
            raise HTTPException(status_code=400, detail="user_id and settings required")

        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{settings.user_service_url}/settings/{user_id}",
                json=user_settings,
                timeout=5.0
            )
            return JSONResponse(
                status_code=response.status_code,
                content=response.json()
            )
    except Exception as e:
        logger.error("update_settings_proxy_error", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))

# ===== Main =====
if __name__ == "__main__":
    import uvicorn
    
    logger.info("starting_backend", port=settings.port)
    
    uvicorn.run(
        "app:app",
        host="0.0.0.0",
        port=settings.port,
        reload=False,
        log_level=settings.log_level.lower()
    )