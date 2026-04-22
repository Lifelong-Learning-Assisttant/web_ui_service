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

async def test_v3_quiz_edge_cases():
    session_id = get_test_session_id(prefix="v3_quiz_edge")
    ws_url = get_ws_url(session_id)
    
    print(f"🚀 [V3 Quiz Edge Cases] Запуск интеграционного теста (Session: {session_id})")
    
    async with websockets.connect(ws_url) as ws:
        await ws.recv() # Приветствие
        print("✅ WebSocket подключен")
        
        print("\n--- [SCENARIO 1: Interrupt Quiz with /finish_quizz] ---")
        # Сначала запускаем квиз
        await run_agent_message(session_id, "Создай короткий тест по ML", ws)
        
        # Прерываем
        print("\n[1] Прерывание квиза...")
        ans, events = await run_agent_message(session_id, "/finish_quizz", ws)
        assert check_event_sequence(events, ["mentor_eval", "grade_done"])
        assert "📊 **Результаты квиза**" in ans
        
        print("\n--- [SCENARIO 2: Skip Question] ---")
        # Запускаем новый квиз
        session_id_2 = get_test_session_id(prefix="v3_quiz_skip")
        ws_url_2 = get_ws_url(session_id_2)
        async with websockets.connect(ws_url_2) as ws2:
            await ws2.recv()
            await run_agent_message(session_id_2, "Хочу пройти тест", ws2)
            
            print("\n[2] Пропуск вопроса...")
            ans, events = await run_agent_message(session_id_2, "/skip_question", ws2)
            # Должен быть переход к следующему вопросу или финиш
            assert any(e.get("step") in ["quizz_question", "mentor_eval"] for e in events)
            
        print("\n--- [SCENARIO 3: RAG Clarification during Quiz] ---")
        session_id_3 = get_test_session_id(prefix="v3_quiz_rag")
        ws_url_3 = get_ws_url(session_id_3)
        async with websockets.connect(ws_url_3) as ws3:
            await ws3.recv()
            await run_agent_message(session_id_3, "Дай мне сложный вопрос по нейронкам", ws3)
            
            print("\n[3] Запрос уточнения (RAG)...")
            ans, events = await run_agent_message(session_id_3, "А что именно ты имеешь в виду под обратным распространением?", ws3)
            # Должен сработать поиск и подсказка
            assert check_event_sequence(events, ["start_retrieval", "interviewer_hint"])
            assert "final_answer" in events[-1]
            
        print("\n🎉 V3 QUIZ EDGE CASES INTEGRATION SCENARIOS PASSED!")

if __name__ == "__main__":
    try:
        asyncio.run(test_v3_quiz_edge_cases())
    except Exception as e:
        print(f"❌ Тест провален: {e}")
        exit(1)