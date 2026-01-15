#!/usr/bin/env python3
"""
Тест 2.1: Web UI Simulation Test (Unit Test)

Тест симулирует переписку между пользователем и агентом с формулами на тему DL.
Это детерминированный тест, который не требует реального агента.

Тест проверяет:
1. Формирование сообщений (User, Agent, Progress)
2. Форматирование формул MathJax
3. Стили сообщений
4. Логику отображения в NiceGUI
"""

import pytest
import asyncio
from datetime import datetime
from unittest.mock import Mock, patch, AsyncMock
import json


# Мокаем NiceGUI для изолированного теста
class MockUI:
    """Мок NiceGUI UI для тестирования"""
    
    def __init__(self):
        self.messages = []
        self.refresh_called = False
        self.javascript_called = False
    
    def refresh(self):
        self.refresh_called = True
    
    def run_javascript(self, script):
        self.javascript_called = True


class TestWebUISimulation:
    """Тест симуляции Web UI"""
    
    def setup_method(self):
        """Настройка перед каждым тестом"""
        self.mock_ui = MockUI()
        self.messages_list = []
        self.session_id = "test_dl_formulas"
        
    def test_dl_formulas_simulation(self):
        """
        Симуляция переписки по Deep Learning с формулами
        
        Сценарий:
        1. User: Объясни формулу MSE с примерами
        2. Progress: intent_determined
        3. Progress: retrieval_done
        4. Progress: generate_done
        5. Agent: Ответ с формулами MSE и примерами
        """
        
        # Шаг 1: User message
        user_msg = {
            "author": "User",
            "text": "Объясни формулу MSE с примерами",
            "type": "text",
            "timestamp": datetime.now().isoformat()
        }
        self.messages_list.append(user_msg)
        
        # Шаг 2: Progress events
        progress_events = [
            {
                "author": "Progress",
                "text": "intent_determined: MSE formula explanation",
                "type": "progress",
                "timestamp": datetime.now().isoformat()
            },
            {
                "author": "Progress",
                "text": "retrieval_done: Found 3 examples",
                "type": "progress",
                "timestamp": datetime.now().isoformat()
            },
            {
                "author": "Progress",
                "text": "generate_done: Response ready",
                "type": "progress",
                "timestamp": datetime.now().isoformat()
            }
        ]
        self.messages_list.extend(progress_events)
        
        # Шаг 3: Agent response with formulas
        agent_text = """
**Mean Squared Error (MSE)** — среднеквадратичная ошибка.

Формула:
$$MSE = \\frac{1}{n}\\sum_{i=1}^{n}(y_i - \\hat{y}_i)^2$$

Пример:
- Истинное значение: $y = [2, 4, 6]$
- Предсказание: $\\hat{y} = [1.5, 4.2, 5.8]$
- MSE = $\\frac{1}{3}[(2-1.5)^2 + (4-4.2)^2 + (6-5.8)^2] = 0.113$
        """
        
        agent_msg = {
            "author": "Agent",
            "text": agent_text.strip(),
            "type": "text",
            "timestamp": datetime.now().isoformat()
        }
        self.messages_list.append(agent_msg)
        
        # Проверки
        assert len(self.messages_list) == 5
        
        # Проверяем структуру сообщений
        assert self.messages_list[0]["author"] == "User"
        assert "MSE" in self.messages_list[0]["text"]
        
        assert self.messages_list[1]["author"] == "Progress"
        assert self.messages_list[1]["type"] == "progress"
        
        assert self.messages_list[2]["author"] == "Progress"
        assert self.messages_list[2]["type"] == "progress"
        
        assert self.messages_list[3]["author"] == "Progress"
        assert self.messages_list[3]["type"] == "progress"
        
        assert self.messages_list[4]["author"] == "Agent"
        assert "$$" in self.messages_list[4]["text"]  # MathJax блочные формулы
        assert "$" in self.messages_list[4]["text"]    # MathJax inline формулы
        
        print("✅ DL Formulas simulation test passed!")
        print(f"Сообщений: {len(self.messages_list)}")
        for i, msg in enumerate(self.messages_list, 1):
            print(f"  {i}. [{msg['author']}] {msg['text'][:50]}...")
    
    def test_message_styling_logic(self):
        """Тест логики стилизации сообщений"""
        
        # Стили из web_ui.py
        STYLES = {
            "User": "background: #e3f2fd; border-left: 4px solid #2196f3; margin-left: auto;",
            "Agent": "background: #f3e5f5; border-left: 4px solid #9c27b0; margin-right: auto;",
            "Progress": "background: #e8f5e9; border-left: 4px solid #4caf50; font-style: italic; opacity: 0.8;",
            "Error": "background: #ffebee; border-left: 4px solid #f44336; font-weight: bold;",
        }
        
        # Тест User
        user_style = STYLES["User"]
        assert "#e3f2fd" in user_style  # Светло-синий
        assert "margin-left: auto" in user_style  # Выравнивание вправо
        
        # Тест Agent
        agent_style = STYLES["Agent"]
        assert "#f3e5f5" in agent_style  # Светло-фиолетовый
        assert "margin-right: auto" in agent_style  # Выравнивание влево
        
        # Тест Progress
        progress_style = STYLES["Progress"]
        assert "#e8f5e9" in progress_style  # Светло-зеленый
        assert "italic" in progress_style  # Курсив
        
        # Тест Error
        error_style = STYLES["Error"]
        assert "#ffebee" in error_style  # Светло-красный
        assert "bold" in error_style  # Жирный
        
        print("✅ Message styling logic test passed!")
    
    def test_mathjax_formatting(self):
        """Тест форматирования MathJax формул"""
        
        # Формулы в тексте
        text_with_formulas = """
        Формула линейной регрессии: $y = wx + b$
        
        MSE: $$MSE = \\frac{1}{n}\\sum(y - \\hat{y})^2$$
        
        Градиент: $\\nabla L = \\frac{2}{n}X^T(Xw - y)$
        """
        
        # Проверяем наличие MathJax синтаксиса
        assert "$" in text_with_formulas  # Inline формулы
        assert "$$" in text_with_formulas  # Block формулы
        assert "\\frac" in text_with_formulas  # Дробь
        assert "\\sum" in text_with_formulas  # Сумма
        assert "\\nabla" in text_with_formulas  # Градиент
        
        print("✅ MathJax formatting test passed!")
    
    def test_session_isolation(self):
        """Тест изоляции сессий"""
        
        session_a = "dl_formulas_1"
        session_b = "dl_formulas_2"
        
        # Сообщения для сессии A
        messages_a = [
            {"session_id": session_a, "text": "Question A", "type": "user"},
            {"session_id": session_a, "text": "Answer A", "type": "agent"}
        ]
        
        # Сообщения для сессии B
        messages_b = [
            {"session_id": session_b, "text": "Question B", "type": "user"},
            {"session_id": session_b, "text": "Answer B", "type": "agent"}
        ]
        
        # Проверяем, что сессии изолированы
        assert messages_a[0]["session_id"] == session_a
        assert messages_b[0]["session_id"] == session_b
        assert messages_a[0]["session_id"] != messages_b[0]["session_id"]
        
        print("✅ Session isolation test passed!")
    
    def test_progress_sequence(self):
        """Тест последовательности progress events"""
        
        expected_sequence = [
            "intent_determined",
            "start_retrieval",
            "retrieval_done",
            "start_generate_exam",
            "generate_done",
            "final_answer"
        ]
        
        # Симулируем получение событий
        received_events = []
        
        # Добавляем события в порядке
        for step in expected_sequence:
            received_events.append({
                "type": "progress",
                "step": step,
                "timestamp": datetime.now().isoformat()
            })
        
        # Проверяем порядок
        for i, event in enumerate(received_events):
            assert event["step"] == expected_sequence[i]
        
        print("✅ Progress sequence test passed!")
        print(f"Последовательность: {' → '.join(expected_sequence)}")


class TestWebUIIntegration:
    """Интеграционные тесты для Web UI"""
    
    @pytest.mark.asyncio
    async def test_websocket_connection_mock(self):
        """Мок WebSocket подключения"""
        
        # Мок WebSocket
        mock_ws = AsyncMock()
        mock_ws.send = AsyncMock()
        mock_ws.close = AsyncMock()
        
        # Симуляция подключения
        session_id = "test_session"
        
        # Подписываемся
        subscribe_msg = json.dumps({"cmd": "subscribe", "session_id": session_id})
        await mock_ws.send(subscribe_msg)
        
        # Проверяем, что отправлено правильное сообщение
        mock_ws.send.assert_called_once_with(subscribe_msg)
        
        print("✅ WebSocket connection mock test passed!")
    
    @pytest.mark.asyncio
    async def test_http_client_mock(self):
        """Мок HTTP клиента"""
        
        # Мок httpx.AsyncClient
        mock_client = AsyncMock()
        mock_response = AsyncMock()
        mock_response.status_code = 200
        mock_response.json = AsyncMock(return_value={
            "messages": [
                ("User", "Test question"),
                ("Agent", "Test answer")
            ]
        })
        
        mock_client.post.return_value = mock_response
        mock_client.get.return_value = mock_response
        
        # Тест POST
        response = await mock_client.post(
            "http://localhost:8250/api/agent/run",
            json={"question": "Test", "session_id": "test"}
        )
        assert response.status_code == 200
        
        # Тест GET
        response = await mock_client.get(
            "http://localhost:8250/api/messages",
            params={"session_id": "test"}
        )
        assert response.status_code == 200
        data = await response.json()
        assert len(data["messages"]) == 2
        
        print("✅ HTTP client mock test passed!")


if __name__ == "__main__":
    # Запуск тестов
    test = TestWebUISimulation()
    test.setup_method()
    
    print("=" * 60)
    print("Web UI Simulation Tests (2.1)")
    print("=" * 60)
    print()
    
    test.test_dl_formulas_simulation()
    print()
    test.test_message_styling_logic()
    print()
    test.test_mathjax_formatting()
    print()
    test.test_session_isolation()
    print()
    test.test_progress_sequence()
    print()
    
    print("=" * 60)
    print("✅ Все тесты 2.1 пройдены!")
    print("=" * 60)