#!/usr/bin/env python3
import asyncio
import websockets
import json
from netrunner_utils import (
    run_agent_message, 
    check_event_sequence, 
    get_test_session_id, 
    get_ws_url
)

async def test_v3_quiz_rich_events():
    session_id = get_test_session_id(prefix="v3_quiz")
    ws_url = get_ws_url(session_id)
    
    print(f"🚀 [V3 Quiz] Запуск интеграционного теста (Session: {session_id})")
    
    async with websockets.connect(ws_url) as ws:
        await ws.recv() # Приветствие
        print("✅ WebSocket подключен")
        
        print("\n--- [SCENARIO: V3 Quiz Flow with Rich Events] ---")
        
        # 1. Запуск квиза
        print("\n[1] Запрос на создание квиза...")
        question = "Создай тест по основам машинного обучения. Используй вопросы с вариантами ответов."
        ans, events = await run_agent_message(session_id, question, ws)
        
        # Проверка последовательности шагов
        assert check_event_sequence(events, [
            "intent_determined",
            "start_retrieval",
            "start_generate_exam",
            "quizz_question"
        ]), "Сбой в последовательности событий запуска квиза"
        
        # Поиск события с вопросом и проверка метаданных (Rich UI)
        quiz_event = next((e for e in events if e.get("step") == "quizz_question"), None)
        assert quiz_event is not None, "Событие quizz_question не найдено"
        
        meta = quiz_event.get("meta", {})
        print(f"📊 Метаданные вопроса: {json.dumps(meta, ensure_ascii=False, indent=2)}")
        
        assert "options" in meta, "В метаданных отсутствуют варианты ответов (options)"
        assert isinstance(meta["options"], list), "Options должен быть списком"
        assert len(meta["options"]) > 0, "Список вариантов ответов пуст"
        assert "type" in meta, "В метаданных отсутствует тип вопроса (type)"
        assert meta.get("current_quiz_index") == 0, "Неверный индекс первого вопроса"
        
        # 2. Ответ на вопрос через новую команду /answer
        print(f"\n[2] Отправка ответа на вопрос 1 (выбор индекса 0)...")
        ans, events = await run_agent_message(session_id, "/answer [0]", ws)
        
        # Проверка что мы получили следующий вопрос или перешли к оценке
        # В новой архитектуре после ответа идет judge -> explainer -> quizz_question (следующий)
        next_step_found = any(e.get("step") in ["quizz_question", "start_grade_exam"] for e in events)
        assert next_step_found, "После ответа не получено следующее событие квиза"
        
        # Если это следующий вопрос, проверяем метаданные
        next_quiz_event = next((e for e in events if e.get("step") == "quizz_question"), None)
        if next_quiz_event:
            next_meta = next_quiz_event.get("meta", {})
            print(f"📊 Метаданные следующего вопроса: index={next_meta.get('current_quiz_index')}")
            assert next_meta.get("current_quiz_index") == 1, "Индекс вопроса не инкрементировался"
            assert "options" in next_meta, "Нет вариантов ответов в следующем вопросе"

        # 3. Завершение квиза
        print("\n[3] Принудительное завершение квиза...")
        ans, events = await run_agent_message(session_id, "/finish_quizz", ws)
        
        assert check_event_sequence(events, [
            "start_grade_exam",
            "grade_done"
        ]), "Сбой в завершении квиза"
        
        assert "Результаты квиза" in ans or "📊" in ans, "Финальный ответ не содержит отчета"
        
        print("\n🎉 V3 QUIZ INTEGRATION SCENARIO PASSED!")

if __name__ == "__main__":
    try:
        asyncio.run(test_v3_quiz_rich_events())
    except Exception as e:
        print(f"❌ Тест провален: {e}")
        exit(1)