#!/usr/bin/env python3
import asyncio
import websockets
import json
from netrunner_utils import (
    run_agent_message, 
    check_event_sequence, 
    get_test_session_id, 
    get_ws_url,
    validate_rag_results
)

async def test_v3_retrieval_deep():
    session_id = get_test_session_id(prefix="v3_retrieval")
    ws_url = get_ws_url(session_id)
    
    print(f"🚀 [V3 Retrieval Deep Dive] Запуск интеграционного теста (Session: {session_id})")
    
    async with websockets.connect(ws_url) as ws:
        await ws.recv() # Приветствие
        print("✅ WebSocket подключен")
        
        print("\n--- [SCENARIO 1: Mixed Retrieval (RAG + Web + Docs)] ---")
        # Вопрос, требующий всех источников: теория (RAG), новости (Web), код (Docs)
        question = "Как реализовать кастомную функцию потерь в PyTorch и что об этом говорит теория глубокого обучения? Есть ли новые статьи на эту тему?"
        ans, events = await run_agent_message(session_id, question, ws)
        
        # Проверяем роутер
        router_event = next((e for e in events if e.get("step") == "retrieval_router_done"), None)
        assert router_event, "Событие retrieval_router_done не найдено"
        selected = router_event.get("meta", {}).get("selected_sources", [])
        print(f"🎯 Роутер выбрал: {selected}")
        
        # Ожидаем хотя бы 2 источника
        assert len(selected) >= 2, "Роутер должен был выбрать несколько источников"
        
        # Проверяем результаты
        assert validate_rag_results(events), "Поиск не вернул результатов"
        
        print("\n--- [SCENARIO 2: Library Docs Only] ---")
        # Вопрос специфичный для библиотеки
        question_docs = "Какие параметры принимает функция torch.optim.Adam?"
        ans, events = await run_agent_message(session_id, question_docs, ws)
        
        # Проверяем резолвер библиотеки
        resolver_event = next((e for e in events if e.get("step") == "library_resolving"), None)
        if resolver_event:
            print(f"📚 Определена библиотека: {resolver_event.get('message')}")
        
        # Проверяем что поиск был в docs
        router_event = next((e for e in events if e.get("step") == "retrieval_router_done"), None)
        selected = router_event.get("meta", {}).get("selected_sources", [])
        assert "docs" in selected, "Роутер не выбрал docs для вопроса по API"
            
        print("\n🎉 V3 RETRIEVAL DEEP DIVE SCENARIOS PASSED!")

if __name__ == "__main__":
    try:
        asyncio.run(test_v3_retrieval_deep())
    except Exception as e:
        print(f"❌ Тест провален: {e}")
        exit(1)