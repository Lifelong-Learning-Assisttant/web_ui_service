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

def save_session_log(session_id: str, message: str, final_answer: str, events: list):
    """Сохраняет историю сообщения и событий в текстовый лог"""
    logs_dir = os.path.join(os.path.dirname(__file__), "logs")
    os.makedirs(logs_dir, exist_ok=True)
    
    log_file = os.path.join(logs_dir, f"{session_id}.log")
    
    with open(log_file, "a", encoding="utf-8") as f:
        f.write(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] SESSION: {session_id}\n")
        f.write(f"USER: {message}\n")
        f.write("-" * 20 + "\n")
        f.write("STREAMS/EVENTS:\n")
        for event in events:
            # Упрощенная запись события
            step = event.get("step")
            tool = event.get("tool")
            f.write(f"  - Step: {step} | Tool: {tool}\n")
            meta = event.get("meta")
            if meta:
                f.write(f"    Meta: {json.dumps(meta, ensure_ascii=False)}\n")
            if event.get("message"):
                f.write(f"    Msg: {event.get('message')[:100]}...\n")
        
        f.write("-" * 20 + "\n")
        f.write(f"FINAL ANSWER: {final_answer}\n")
        f.write("=" * 60 + "\n\n")
    
    print(f"📝 Лог сохранен: {log_file}")

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
                
                # События прогресса имеют поле 'step', но не 'final_answer'
                if event.get("step"):
                    events.append(event)
                    step = event.get("step")
                    tool = event.get("tool")
                    meta = event.get("meta")
                    # Логируем ключи метаданных для отладки
                    meta_info = f" | Meta: {list(meta.keys())}" if meta else ""
                    if meta and "documents" in meta:
                        meta_info += f" (docs: {len(meta['documents'])})"
                    
                    print(f"   🔄 Step: {step} | Tool: {tool}{meta_info}")
                
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
            
    # Сохраняем лог после завершения
    save_session_log(session_id, message, final_answer, events)
            
    return final_answer, events

def check_event_sequence(events, expected_steps):
    """Проверяет наличие ожидаемых шагов в истории событий"""
    steps_found = [e.get("step") for e in events]
    missing = []
    for expected in expected_steps:
        if expected not in steps_found:
            missing.append(expected)
    
    if missing:
        print(f"❌ Отсутствуют шаги: {missing}")
        print(f"   Найдены: {steps_found}")
        return False
    return True

def validate_rag_results(events):
    """Проверяет, что поиск вернул непустые результаты"""
    retrieval = next((e for e in events if e.get("step") == "retrieval_done"), None)
    if not retrieval:
        print("❌ Шаг retrieval_done не найден")
        return False
        
    meta = retrieval.get("meta", {})
    docs = meta.get("documents") or meta.get("context") or meta.get("results")
    docs_count = meta.get("docs_count")
    
    if not docs and not docs_count:
        print(f"❌ RAG вернул пустой результат (0 документов). Meta: {meta}")
        return False
        
    count = docs_count if docs_count is not None else (len(docs) if isinstance(docs, list) else 1)
    print(f"✅ RAG нашел документов: {count}")
    return True

def validate_quiz_question(events):
    """Проверяет структуру вопроса квиза"""
    q_event = next((e for e in events if e.get("step") == "quizz_question"), None)
    if not q_event:
        print("❌ Событие quizz_question не найдено")
        return False
        
    meta = q_event.get("meta", {})
    question_text = meta.get("question") or q_event.get("message")
    options = meta.get("options")
    q_type = meta.get("type", "unknown")
    
    if not question_text:
        print("❌ Отсутствует текст вопроса")
        return False

    if options:
        if not isinstance(options, list) or len(options) < 2:
            print(f"❌ Некорректный формат вариантов ответов: {options}")
            return False
        print(f"✅ Вопрос '{q_type}' корректен. Вариантов: {len(options)}")
    else:
        print(f"✅ Вопрос '{q_type}' (открытый или без вариантов). Текст: {question_text[:50]}...")
        
    return True

def get_test_session_id(prefix: str = "test"):
    """Генерирует ID сессии с заданным префиксом для прослеживаемости"""
    return f"{prefix}_{int(datetime.now().timestamp())}"

def get_ws_url(session_id):
    return f"{WS_BASE_URL}/ws/{session_id}?token={WS_TOKEN}"