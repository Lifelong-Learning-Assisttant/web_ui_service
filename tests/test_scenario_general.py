#!/usr/bin/env python3
import asyncio
import websockets
from netrunner_utils import (
    run_agent_message, 
    check_event_sequence, 
    get_test_session_id, 
    get_ws_url
)

async def test_general():
    session_id = get_test_session_id()
    ws_url = get_ws_url(session_id)
    
    print(f"🚀 [General] Запуск теста (Session: {session_id})")
    
    async with websockets.connect(ws_url) as ws:
        await ws.recv() # Приветствие
        print("✅ WebSocket подключен")
        
        print("\n--- [SCENARIO 1: General Chat] ---")
        ans, events = await run_agent_message(session_id, "Привет! Ты кто?", ws)
        
        assert check_event_sequence(events, [
            "intent_determined", 
            "start_direct_answer", 
            "direct_answer_done"
        ]), "Сбой в General Flow"
        
        print("\n🎉 GENERAL SCENARIO PASSED!")

if __name__ == "__main__":
    asyncio.run(test_general())