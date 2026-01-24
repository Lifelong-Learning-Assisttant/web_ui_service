#!/usr/bin/env python3
import asyncio
import websockets
from netrunner_utils import (
    run_agent_message, 
    check_event_sequence, 
    validate_quiz_question,
    get_test_session_id, 
    get_ws_url
)

async def test_quiz():
    session_id = get_test_session_id(prefix="quiz")
    ws_url = get_ws_url(session_id)
    
    print(f"🚀 [Quiz] Запуск теста (Session: {session_id})")
    
    async with websockets.connect(ws_url) as ws:
        await ws.recv()
        print("✅ WebSocket подключен")
        
        print("\n--- [SCENARIO 3: Quiz Flow] ---")
        
        print("\n[3.1] Запуск квиза...")
        ans, events = await run_agent_message(session_id, "Хочу пройти тест по нейросетям. Создай квиз только из вопросов с вариантами ответов.", ws)
        assert check_event_sequence(events, [
            "start_retrieval",
            "start_prepare_material",
            "start_generate_exam",
            "quizz_question"
        ]), "Сбой старта квиза"
        
        assert validate_quiz_question(events), "Некорректная структура вопроса"

        print("\n[3.2] Ответ на вопрос 1...")
        ans, events = await run_agent_message(session_id, "1", ws)
        assert check_event_sequence(events, ["quizz_question"]), "Сбой обработки ответа"

        print("\n[3.3] Пропуск вопроса 2...")
        ans, events = await run_agent_message(session_id, "/skip_question", ws)
        assert check_event_sequence(events, ["quizz_question"]), "Сбой пропуска вопроса"

        print("\n[3.4] Уточнение контекста...")
        ans, events = await run_agent_message(session_id, "А что значит этот термин в вопросе?", ws)
        assert check_event_sequence(events, [
            "start_retrieval",
            "start_prepare_material",
            "start_rag_answer"
        ]), "Сбой уточнения"
        
        assert "QUIZ_CONTEXT_RESUMED" in ans or "Напоминаю" in ans, "Нет возврата контекста"

        print("\n[3.5] Завершение квиза...")
        ans, events = await run_agent_message(session_id, "/finish_quizz", ws)
        assert check_event_sequence(events, ["start_grade_exam", "grade_done"]), "Сбой завершения квиза"
        
        print("\n🎉 QUIZ SCENARIO PASSED!")

if __name__ == "__main__":
    asyncio.run(test_quiz())