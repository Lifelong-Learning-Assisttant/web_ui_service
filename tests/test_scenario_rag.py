#!/usr/bin/env python3
import asyncio
import websockets
from netrunner_utils import (
    run_agent_message, 
    check_event_sequence, 
    validate_rag_results,
    get_test_session_id, 
    get_ws_url
)

async def test_rag():
    session_id = get_test_session_id()
    ws_url = get_ws_url(session_id)
    
    print(f"🚀 [RAG] Запуск теста (Session: {session_id})")
    
    async with websockets.connect(ws_url) as ws:
        await ws.recv()
        print("✅ WebSocket подключен")
        
        print("\n--- [SCENARIO 2: RAG Search] ---")
        ans, events = await run_agent_message(session_id, "Что такое градиентный спуск в ML?", ws)
        
        assert check_event_sequence(events, [
            "intent_determined",
            "start_retrieval",
            "retrieval_done",
            "start_prepare_material",
            "prepare_material_done"
        ]), "Сбой в RAG Flow"
        
        assert validate_rag_results(events), "RAG вернул пустые результаты!"
        
        if ans and len(ans) < 50:
             print(f"⚠️ Warning: Ответ RAG подозрительно короткий: {ans}")
             
        print("\n🎉 RAG SCENARIO PASSED!")

if __name__ == "__main__":
    asyncio.run(test_rag())