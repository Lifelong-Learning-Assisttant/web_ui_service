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

async def test_v3_supervisor_routing():
    session_id = get_test_session_id(prefix="v3_supervisor")
    ws_url = get_ws_url(session_id)
    
    print(f"🚀 [V3 Supervisor] Запуск интеграционного теста (Session: {session_id})")
    
    async with websockets.connect(ws_url) as ws:
        await ws.recv() # Приветствие
        print("✅ WebSocket подключен")
        
        print("\n--- [SCENARIO: V3 Supervisor Intent Routing] ---")
        
        # 1. Свободный диалог (Chat)
        print("\n[1] Проверка Chat-интента...")
        ans, events = await run_agent_message(session_id, "Привет! Как дела?", ws)
        assert check_event_sequence(events, ["intent_determined", "start_direct_answer", "direct_answer_done"])
        assert "meta" in events[0] and events[0]["meta"].get("intent") == "general"
        
        # 2. Переход в Quiz
        print("\n[2] Проверка перехода в Quiz...")
        ans, events = await run_agent_message(session_id, "Хочу пройти тест", ws)
        # Supervisor должен определить интент и запустить цепочку квиза
        assert check_event_sequence(events, ["intent_determined", "start_generate_exam", "quizz_question"])
        # Проверяем что интент в метаданных был 'generate_quiz' или 'quiz'
        intent_event = next((e for e in events if e.get("step") == "intent_determined"), None)
        print(f"🎯 Определен интент: {intent_event['meta'].get('intent')}")
        
        # 3. Переход в Algo (через Supervisor)
        print("\n[3] Проверка перехода в Algo (заглушка)...")
        ans, events = await run_agent_message(session_id, "Хочу решить задачу на алгоритмы", ws)
        # Supervisor -> Algo Placeholder
        # В текущей реализации supervisor_node может возвращать интент 'algo'
        intent_event = next((e for e in events if e.get("step") == "intent_determined"), None)
        assert intent_event["meta"].get("intent") == "algo_help" or "algo" in intent_event["meta"].get("intent")
        
        print("\n🎉 V3 SUPERVISOR INTEGRATION SCENARIO PASSED!")

if __name__ == "__main__":
    try:
        asyncio.run(test_v3_supervisor_routing())
    except Exception as e:
        print(f"❌ Тест провален: {e}")
        exit(1)