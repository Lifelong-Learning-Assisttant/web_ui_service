#!/usr/bin/env python3
"""
Интеграционные тесты сценариев NetRunner v3.0:
Проверка логики графа через анализ событий прогресса (tools & steps).
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

CONFIG = load_config()
WEB_UI_URL = CONFIG["web_backend_url"]
WS_BASE_URL = CONFIG["ws_base_url"]
WS_TOKEN = CONFIG["ws_token"]

async def run_agent_message(session_id: str, message: str, ws):
    """Отправляет сообщение и возвращает (финальный ответ, список событий)"""
    print(f"\n📤 Отправка: '{message}'")
    
    events = []
    final_answer = None
    
    # Флаг завершения (успех или ошибка)
    done_future = asyncio.get_running_loop().create_future()

    async def reader():
        nonlocal final_answer
        try:
            while not done_future.done():
                try:
                    # Читаем с таймаутом, чтобы можно было прервать
                    msg = await asyncio.wait_for(ws.recv(), timeout=1.0)
                except asyncio.TimeoutError:
                    continue
                
                event = json.loads(msg)
                
                # События прогресса имеют поле 'step', но не 'final_answer' (хотя final_answer тоже имеет step)
                # Просто сохраняем все события, у которых есть step
                if event.get("step"):
                    events.append(event)
                    step = event.get("step")
                    tool = event.get("tool")
                    print(f"   🔄 Step: {step} | Tool: {tool}")
                
                if event.get("step") == "final_answer" or event.get("type") == "final":
                    final_answer = event.get("message") or event.get("answer")
                    print(f"✅ Ответ получен")
                    if not done_future.done():
                        done_future.set_result(True)
                    return
        except Exception as e:
            if not done_future.done():
                done_future.set_exception(e)

    # 1. Запускаем читателя
    reader_task = asyncio.create_task(reader())
    
    # 2. Ждем старта читателя
    await asyncio.sleep(0.5)

    # 3. Отправляем запрос
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"{WEB_UI_URL}/api/agent/run",
            json={"question": message, "session_id": session_id},
            timeout=300.0
        )
        if resp.status_code != 200:
            print(f"❌ Ошибка API: {resp.text}")
            reader_task.cancel()
            return None, []

    # 4. Ждем результата от читателя (макс 300 сек)
    try:
        await asyncio.wait_for(done_future, timeout=300.0)
    except asyncio.TimeoutError:
        print("❌ Timeout ожидания ответа")
        reader_task.cancel()
    except Exception as e:
        print(f"❌ Ошибка в reader: {e}")
    
    # Ждем корректного завершения таски
    try:
        await reader_task
    except asyncio.CancelledError:
        pass
            
    return final_answer, events

def check_event_sequence(events, expected_steps):
    """Проверяет наличие ожидаемых шагов в истории событий"""
    steps_found = [e.get("step") for e in events]
    for expected in expected_steps:
        if expected not in steps_found:
            print(f"❌ Ожидался шаг '{expected}', но его нет. Найдены: {steps_found}")
            return False
    return True

async def test_scenarios():
    session_id = f"netrunner_test_{int(datetime.now().timestamp())}"
    ws_url = f"{WS_BASE_URL}/ws/{session_id}?token={WS_TOKEN}"
    
    print(f"🚀 Запуск тестов NetRunner (Session: {session_id})")
    
    async with websockets.connect(ws_url) as ws:
        # Читаем приветствие
        await ws.recv()
        print("✅ WebSocket подключен")
        
        # 1. General
        print("\n--- [SCENARIO 1: General Chat] ---")
        ans, events = await run_agent_message(session_id, "Привет! Ты кто?", ws)
        assert check_event_sequence(events, ["intent_determined", "start_direct_answer"]), "Сбой в General Flow"

        # 2. RAG
        print("\n--- [SCENARIO 2: RAG Search] ---")
        ans, events = await run_agent_message(session_id, "Что такое градиентный спуск в ML?", ws)
        assert check_event_sequence(events, [
            "intent_determined",
            "start_retrieval",
            "retrieval_done",
            "start_prepare_material",
            "prepare_material_done"
        ]), "Сбой в RAG Flow (v3.1)"

        # 3. Quiz
        print("\n--- [SCENARIO 3: Quiz Flow] ---")
        
        print("\n[3.1] Запуск квиза (только с вариантами ответов)...")
        ans, events = await run_agent_message(session_id, "Хочу пройти тест по нейросетям. Создай квиз только из вопросов с вариантами ответов.", ws)
        assert check_event_sequence(events, [
            "start_retrieval",
            "start_prepare_material",
            "start_generate_exam",
            "generate_done"
        ]), "Сбой старта квиза (v3.1)"

        print("\n[3.2] Ответ на вопрос 1 (выбор первого варианта)...")
        ans, events = await run_agent_message(session_id, "1", ws)
        assert check_event_sequence(events, ["next_question"]), "Сбой обработки ответа"

        print("\n[3.3] Пропуск вопроса 2 (/skip_question)...")
        ans, events = await run_agent_message(session_id, "/skip_question", ws)
        assert check_event_sequence(events, ["next_question"]), "Сбой пропуска вопроса"

        print("\n[3.4] Уточнение контекста...")
        ans, events = await run_agent_message(session_id, "А что значит этот термин в вопросе?", ws)
        assert check_event_sequence(events, [
            "start_retrieval",
            "start_prepare_material",
            "start_rag_answer"
        ]), "Сбой уточнения (RAG v3.1)"
        assert "QUIZ_CONTEXT_RESUMED" in ans or "Напоминаю" in ans, "Нет возврата контекста"

        print("\n[3.5] Завершение квиза (/finish_quizz)...")
        ans, events = await run_agent_message(session_id, "/finish_quizz", ws)
        assert check_event_sequence(events, ["start_grade_exam", "grade_done"]), "Сбой завершения квиза"

    print("\n🎉 ВСЕ ТЕСТЫ ПРОЙДЕНЫ УСПЕШНО!")

if __name__ == "__main__":
    asyncio.run(test_scenarios())