#!/usr/bin/env python3
"""
Тест полного потока Task G: Web UI → API → Agent → WebSocket → UI
Проверяет все 3 компонента вместе
"""

import asyncio
import json
import httpx
import websockets
from datetime import datetime

AGENT_URL = "http://agent_service-agent_dev-1:8250"
WEB_UI_URL = "http://web_ui_dev:8350"

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
    print(f"\n[2] Проверка Web UI ({WEB_UI_URL})...")
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(WEB_UI_URL, timeout=5.0)
            print(f"    ✅ Web UI доступен (status: {resp.status_code})")
    except Exception as e:
        print(f"    ❌ Ошибка: {e}")
        return False
    
    # Шаг 3: Подключаем WebSocket
    print(f"\n[3] Подключение WebSocket к {AGENT_URL.replace('http', 'ws')}/ws...")
    ws_url = f"{AGENT_URL.replace('http', 'ws')}/ws"
    ws = None
    try:
        ws = await websockets.connect(ws_url)
        # Отправляем подписку
        await ws.send(json.dumps({
            "cmd": "subscribe",
            "session_id": session_id
        }))
        response = await ws.recv()
        response_data = json.loads(response)
        print(f"    ✅ Подписка: {response_data.get('message', response_data)}")
    except Exception as e:
        print(f"    ❌ Ошибка WebSocket: {e}")
        if ws:
            await ws.close()
        return False
    
    # Шаг 4: Запускаем агента
    print(f"\n[4] Запуск агента (session_id={session_id})...")
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                f"{AGENT_URL}/api/agent/run",
                json={
                    "question": "Какой смысл жизни? (тестовый запрос)",
                    "session_id": session_id
                },
                timeout=60.0
            )
            result = resp.json()
            print(f"    ✅ Ответ получен: {result['answer'][:100]}...")
    except Exception as e:
        print(f"    ❌ Ошибка запуска: {e}")
        await ws.close()
        return False
    
    # Шаг 5: Проверяем события в WebSocket
    print(f"\n[5] Ожидание событий от WebSocket...")
    events_received = []
    try:
        # Читаем события в течение 10 секунд
        timeout = 10
        start_time = asyncio.get_event_loop().time()
        while asyncio.get_event_loop().time() - start_time < timeout:
            try:
                message = await asyncio.wait_for(ws.recv(), timeout=1.0)
                event = json.loads(message)
                events_received.append(event)
                print(f"    📨 {event.get('step', 'unknown')}: {event.get('details', '')[:50]}...")
            except asyncio.TimeoutError:
                continue
        print(f"    ✅ Получено {len(events_received)} событий")
    except Exception as e:
        print(f"    ⚠️ Ошибка чтения WebSocket: {e}")
    finally:
        await ws.close()
    
    # Шаг 6: Проверяем историю
    print(f"\n[6] Проверка истории сообщений...")
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{AGENT_URL}/api/messages",
                params={"session_id": session_id},
                timeout=5.0
            )
            history = resp.json()
            messages = history.get("messages", [])
            print(f"    ✅ История: {len(messages)} сообщений")
            for i, (author, text) in enumerate(messages, 1):
                print(f"       {i}. [{author}] {text[:60]}...")
    except Exception as e:
        print(f"    ❌ Ошибка истории: {e}")
        return False
    
    # Шаг 7: Проверяем прогресс-события
    print(f"\n[7] Проверка прогресс-событий...")
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"{AGENT_URL}/api/agent/progress",
                params={"session_id": session_id},
                timeout=5.0
            )
            progress = resp.json()
            events = progress.get("events", [])
            print(f"    ✅ Событий прогресса: {len(events)}")
            for event in events[:3]:  # Покажем первые 3
                print(f"       - {event.get('step')}: {event.get('message', '')[:50]}...")
    except Exception as e:
        print(f"    ❌ Ошибка прогресса: {e}")
        return False
    
    print("\n" + "=" * 60)
    print("✅ FULL FLOW TEST PASSED!")
    print("=" * 60)
    print("\nРекомендации:")
    print("1. Откройте http://localhost:8350 в браузере")
    print(f"2. Введите session_id: {session_id}")
    print("3. Нажмите 'Установить' → 'Подключиться'")
    print("4. Вы увидите историю и сможете отправить новое сообщение")
    print("5. При запуске агента в браузере увидите progress в реальном времени")
    
    return True

if __name__ == "__main__":
    result = asyncio.run(test_full_flow())
    exit(0 if result else 1)