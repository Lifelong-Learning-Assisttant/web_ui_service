#!/usr/bin/env python3
"""
Демонстрация Task G: Тестирование WebUI через API

Этот скрипт показывает, как можно тестировать NiceGUI интерфейс,
создавая сессию через API и наблюдая за ней в браузере.

Как использовать:
1. Запустите NiceGUI: docker exec web_ui_service-web_ui_dev-1 uv run python web_ui.py
2. Откройте в браузере: http://localhost:8350
3. Введите session_id: "demo_quiz_1"
4. Нажмите "Установить" и "Подключиться"
5. Запустите этот скрипт: python test_task_g_demo.py
6. Наблюдайте в браузере за live progress events!
"""

import asyncio
import httpx
import json
from datetime import datetime

# Конфигурация
AGENT_SERVICE_URL = "http://localhost:8250"
SESSION_ID = "demo_quiz_1"

def print_step(step: str, message: str):
    """Красивый вывод шагов"""
    timestamp = datetime.now().strftime("%H:%M:%S")
    print(f"[{timestamp}] {step}: {message}")

async def test_task_g_flow():
    """Тестовый сценарий Task G"""
    
    print_step("START", "Запуск теста Task G")
    print_step("INFO", "Откройте http://localhost:8350 в браузере")
    print_step("INFO", f"ВВведите session_id: {SESSION_ID}")
    print_step("INFO", "Нажмите 'Установить' и 'Подключиться'")
    print_step("WAIT", "Ожидание 5 секунд для подготовки UI...")
    
    await asyncio.sleep(5)
    
    # Шаг 1: Отправляем запрос агенту
    print_step("STEP 1", f"Отправка запроса к агенту (session_id={SESSION_ID})")
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{AGENT_SERVICE_URL}/api/agent/run",
                json={
                    "question": "Сгенерируй квиз по Python (3 вопроса)",
                    "session_id": SESSION_ID
                },
                timeout=60.0
            )
            
            if response.status_code == 200:
                print_step("SUCCESS", "Запрос успешно отправлен!")
                print_step("INFO", "В браузере вы должны увидеть:")
                print("  - User: Сгенерируй квиз по Python (3 вопроса)")
                print("  - Progress: intent_determined")
                print("  - Progress: start_retrieval")
                print("  - Progress: retrieval_done")
                print("  - Progress: start_generate_exam")
                print("  - Progress: generate_done")
                print("  - Agent: [сгенерированный квиз]")
            else:
                print_step("ERROR", f"Ошибка: {response.status_code}")
                print_step("DETAILS", response.text)
                
    except Exception as e:
        print_step("ERROR", f"Исключение: {str(e)}")
    
    # Шаг 2: Проверяем историю
    print_step("STEP 2", "Проверка истории в agent_service")
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{AGENT_SERVICE_URL}/api/messages",
                params={"session_id": SESSION_ID},
                timeout=5.0
            )
            
            if response.status_code == 200:
                data = response.json()
                messages = data.get("messages", [])
                print_step("SUCCESS", f"История загружена: {len(messages)} сообщений")
                
                for i, msg in enumerate(messages, 1):
                    if isinstance(msg, tuple) and len(msg) == 2:
                        author, text = msg
                        print(f"  {i}. {author}: {text[:50]}...")
            else:
                print_step("ERROR", f"Не удалось загрузить историю: {response.status_code}")
                
    except Exception as e:
        print_step("ERROR", f"Ошибка загрузки истории: {str(e)}")
    
    # Шаг 3: Инструкции
    print_step("STEP 3", "Дальнейшие действия")
    print("  1. Обновите страницу в браузере")
    print("  2. Нажмите 'Загрузить историю'")
    print("  3. Вы должны увидеть всю переписку")
    print("  4. Попробуйте отправить еще сообщение через браузер")
    print("\n✅ Task G успешно продемонстрирован!")

if __name__ == "__main__":
    print("=" * 60)
    print("Task G Demo: WebUI + API + WebSocket")
    print("=" * 60)
    print()
    
    asyncio.run(test_task_g_flow())
