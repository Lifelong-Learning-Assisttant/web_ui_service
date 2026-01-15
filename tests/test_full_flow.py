#!/usr/bin/env python3
"""
Тест полного потока Task G: Web UI → API → Agent → WebSocket → UI
Проверяет все 3 компонента вместе
"""

import asyncio
import json
import httpx
import websockets
import os
import argparse
from datetime import datetime

# Настройки по умолчанию
DEFAULT_CONFIG = {
    "agent_url": os.getenv("AGENT_SERVICE_URL", "http://agent-service:8270"),
    "web_backend_url": os.getenv("WEB_UI_URL", "http://localhost:8151"),
    "web_frontend_url": os.getenv("FRONTEND_URL", "http://web-frontend:80"),
    "ws_base_url": "ws://localhost:8151",
    "ws_token": "dev_token_123"
}

def load_config():
    parser = argparse.ArgumentParser()
    parser.add_argument("--cfg", help="Path to JSON config file")
    args, unknown = parser.parse_known_args()
    
    config = DEFAULT_CONFIG.copy()
    if args.cfg and os.path.exists(args.cfg):
        try:
            with open(args.cfg, 'r') as f:
                file_config = json.load(f)
                config.update(file_config)
                print(f"✅ Loaded config from {args.cfg}")
        except Exception as e:
            print(f"⚠️ Failed to load config from {args.cfg}: {e}")
    return config

# Глобальная конфигурация
CONFIG = load_config()
AGENT_URL = CONFIG["agent_url"]
WEB_UI_URL = CONFIG["web_backend_url"]
FRONTEND_URL = CONFIG["web_frontend_url"]
WS_BASE_URL = CONFIG["ws_base_url"]
WS_TOKEN = CONFIG["ws_token"]

async def test_full_flow():
    """Тест полного потока"""
    print("=" * 60)
    print("FULL FLOW TEST: Web UI + API + WebSocket")
    print("=" * 60)
    
    session_id = f"test_full_{int(datetime.now().timestamp())}"
    
    # Шаг 1: Проверяем, что AgentService доступен
    print(f"\n[1] Проверка AgentService ({AGENT_URL})...")
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(f"{AGENT_URL}/api/agent/status", timeout=5.0)
            print(f"    ✅ Status: {resp.json()}")
    except Exception as e:
        print(f"    ❌ Ошибка: {e}")
        return False
    
    # Шаг 2: Проверяем, что Web UI доступен
    print(f"\n[2] Проверка Web UI ({FRONTEND_URL})...")
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(FRONTEND_URL, timeout=5.0)
            print(f"    ✅ Web UI доступен (status: {resp.status_code})")
    except Exception as e:
        print(f"    ❌ Ошибка: {e}")
        return False
    
    # Шаг 3: Подключаем WebSocket к БЭКЕНДУ
    ws_url = f"{WS_BASE_URL}/ws/{session_id}?token={WS_TOKEN}"
    print(f"\n[3] Подключение WebSocket к {ws_url}...")
    ws = None
    try:
        ws = await websockets.connect(ws_url)
        response = await ws.recv()
        response_data = json.loads(response)
        print(f"    ✅ Подписка: {response_data.get('message', response_data)}")
    except Exception as e:
        print(f"    ❌ Ошибка WebSocket: {e}")
        if ws:
            await ws.close()
        return False
    
    # Шаг 4: Запускаем агента через БЭКЕНД
    print(f"\n[4] Запуск агента через Backend (session_id={session_id})...")
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                f"{WEB_UI_URL}/api/agent/run",
                json={
                    "question": "Какой смысл жизни? (тестовый запрос)",
                    "session_id": session_id
                },
                timeout=60.0
            )
            result = resp.json()
            print(f"    ✅ Запрос отправлен: {result}")
    except Exception as e:
        print(f"    ❌ Ошибка запуска: {e}")
        await ws.close()
        return False
    
    # Шаг 5: Проверяем события в WebSocket
    print(f"\n[5] Ожидание событий от WebSocket...")
    events_received = []
    try:
        # Читаем события в течение 20 секунд (агент может быть медленным)
        timeout = 20
        start_time = asyncio.get_event_loop().time()
        while asyncio.get_event_loop().time() - start_time < timeout:
            try:
                message = await asyncio.wait_for(ws.recv(), timeout=1.0)
                event = json.loads(message)
                events_received.append(event)
                print(f"    📨 {event.get('step', 'unknown')}: {event.get('message', '')[:50]}...")
                if event.get('step') == 'final_answer':
                    break
            except asyncio.TimeoutError:
                continue
        print(f"    ✅ Получено {len(events_received)} событий")
    except Exception as e:
        print(f"    ⚠️ Ошибка чтения WebSocket: {e}")
    finally:
        await ws.close()
    
    # Шаг 6: Проверяем историю через БЭКЕНД
    print(f"\n[6] Проверка истории сообщений через Backend...")
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{WEB_UI_URL}/api/messages",
                params={"session_id": session_id},
                timeout=5.0
            )
            history = resp.json()
            messages = history.get("messages", [])
            print(f"    ✅ История: {len(messages)} сообщений")
            for i, msg in enumerate(messages, 1):
                role = msg.get('role', 'unknown')
                content = msg.get('content', '')
                print(f"       {i}. [{role}] {content[:60]}...")
    except Exception as e:
        print(f"    ❌ Ошибка истории: {e}")
        return False
    
    # Шаг 7: Проверяем прогресс-события через АГЕНТА
    print(f"\n[7] Проверка прогресс-событий через Agent...")
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{AGENT_URL}/api/agent/progress",
                params={"session_id": session_id},
                timeout=5.0
            )
            progress = resp.json()
            events = progress.get("events", [])
            print(f"    ✅ Событий прогресса в БД агента: {len(events)}")
    except Exception as e:
        print(f"    ❌ Ошибка прогресса: {e}")
        return False
    
    print("\n" + "=" * 60)
    print("✅ FULL FLOW TEST PASSED!")
    print("=" * 60)
    
    return True

if __name__ == "__main__":
    result = asyncio.run(test_full_flow())
    exit(0 if result else 1)