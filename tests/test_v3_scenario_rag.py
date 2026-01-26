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

async def test_v3_rag_flow():
    session_id = get_test_session_id(prefix="v3_rag")
    ws_url = get_ws_url(session_id)
    
    print(f"🚀 [V3 RAG] Запуск интеграционного теста (Session: {session_id})")
    
    async with websockets.connect(ws_url) as ws:
        await ws.recv() # Приветствие
        print("✅ WebSocket подключен")
        
        print("\n--- [SCENARIO: V3 RAG Flow with Citations] ---")
        
        # 1. Запрос по теории
        print("\n[1] Запрос технической информации...")
        question = "Как работает градиентный спуск в нейронных сетях? Расскажи подробно."
        ans, events = await run_agent_message(session_id, question, ws)
        
        # Проверка последовательности шагов V3
        assert check_event_sequence(events, [
            "intent_determined",
            "start_retrieval",
            "retrieval_done",
            "start_prepare_material",
            "prepare_material_done",
            "start_rag_answer",
            "rag_answer_done"
        ]), "Сбой в последовательности событий RAG"
        
        # Проверка наличия документов в метаданных retrieval_done
        ret_event = next((e for e in events if e.get("step") == "retrieval_done"), None)
        assert ret_event is not None
        assert ret_event.get("meta", {}).get("docs_count", 0) > 0, "RAG не нашел документов"
        
        # Проверка финального ответа на наличие источников
        print(f"📝 Финальный ответ (фрагмент): {ans[:200]}...")
        assert "Источники:" in ans or "Учебник Яндекса" in ans, "В ответе отсутствуют источники"
        
        # Проверка наличия рассуждений (thought) в событии final_answer
        final_event = next((e for e in events if e.get("step") == "final_answer"), None)
        if final_event and final_event.get("meta", {}).get("thought"):
            print("✅ Найдено поле thought (reasoning)")
        
        print("\n🎉 V3 RAG INTEGRATION SCENARIO PASSED!")

if __name__ == "__main__":
    try:
        asyncio.run(test_v3_rag_flow())
    except Exception as e:
        print(f"❌ Тест провален: {e}")
        exit(1)