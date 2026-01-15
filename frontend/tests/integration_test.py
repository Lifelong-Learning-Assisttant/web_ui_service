#!/usr/bin/env python3
"""
Интеграционный тест: Проверка работы бэкенда и фронтенда вместе

Этот скрипт:
1. Проверяет доступность бэкенда
2. Отправляет тестовые сообщения через API бэкенда
3. Проверяет, что фронтенд может загрузить историю
4. Демонстрирует полный цикл работы

Запуск:
    docker exec web_ui_service-web_ui_frontend-1 uv run python tests/integration_test.py

Предварительные шаги:
    1. Убедитесь, что оба контейнера запущены:
       - web_ui_service-web_ui_backend-1
       - web_ui_service-web_ui_frontend-1
    2. Откройте http://localhost:8350 в браузере
    3. Введите session_id: integration_test_1
    4. Нажмите Connect (🔗)
    5. Запустите этот скрипт
"""

import asyncio
import httpx
import json
from datetime import datetime


class IntegrationTester:
    """Интеграционный тестер для бэкенда и фронтенда"""
    
    def __init__(self):
        # Docker service names
        self.backend_url = "http://web_ui_backend:8351"
        self.frontend_url = "http://web_ui_frontend:8350"
        self.session_id = "integration_test_1"
        self.client = httpx.AsyncClient(timeout=30.0)
        
        # Тестовые данные (из test_web_ui_simulation.py)
        self.test_data = {
            "user_question": "Объясни формулу MSE с примерами",
            "agent_response": """**Mean Squared Error (MSE)** — среднеквадратичная ошибка.

Формула:
$$MSE = \\frac{1}{n}\\sum_{i=1}^{n}(y_i - \\hat{y}_i)^2$$

Пример:
- Истинное значение: $y = [2, 4, 6]$
- Предсказание: $\\hat{y} = [1.5, 4.2, 5.8]$
- MSE = $\\frac{1}{3}[(2-1.5)^2 + (4-4.2)^2 + (6-5.8)^2] = 0.113$""",
            "progress_steps": [
                "intent_determined: MSE formula explanation",
                "retrieval_done: Found 3 examples",
                "generate_done: Response ready"
            ]
        }
    
    async def check_service(self, name: str, url: str) -> bool:
        """Проверка доступности сервиса"""
        try:
            response = await self.client.get(f"{url}/health")
            if response.status_code == 200:
                print(f"✅ {name} доступен ({url})")
                return True
            else:
                print(f"⚠️ {name} вернул статус {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ {name} недоступен ({url}): {e}")
            return False
    
    async def send_user_message(self, question: str) -> bool:
        """Отправка сообщения от пользователя через API бэкенда"""
        try:
            print(f"   Отправка: {question}")
            response = await self.client.post(
                f"{self.backend_url}/api/agent/run",
                json={
                    "question": question,
                    "session_id": self.session_id
                }
            )
            
            if response.status_code == 200:
                print(f"   ✅ Запрос принят")
                return True
            else:
                print(f"   ❌ Ошибка: {response.status_code}")
                print(f"   {response.text}")
                return False
                
        except Exception as e:
            print(f"   ❌ Исключение: {e}")
            return False
    
    async def send_progress_events(self) -> bool:
        """Отправка progress событий (если API поддерживает)"""
        # Примечание: В реальном бэкенде progress события создаются автоматически
        # Этот метод оставлен для совместимости
        return True
    
    async def send_agent_response(self, content: str) -> bool:
        """Отправка ответа агента (если API поддерживает)"""
        # Примечание: В реальном бэкенде ответы создаются автоматически
        # Этот метод оставлен для совместимости
        return True
    
    async def load_history_from_frontend(self) -> bool:
        """Проверка загрузки истории через фронтенд"""
        try:
            # Фронтенд использует API бэкенда, поэтому проверяем через бэкенд
            response = await self.client.get(
                f"{self.backend_url}/api/messages",
                params={"session_id": self.session_id}
            )
            
            if response.status_code == 200:
                data = response.json()
                messages = data.get("messages", [])
                
                print(f"   ✅ История загружена: {len(messages)} сообщений")
                
                for i, msg in enumerate(messages, 1):
                    role = msg.get("role", "unknown")
                    content = msg.get("content", "")
                    preview = content[:60] + "..." if len(content) > 60 else content
                    print(f"      {i}. [{role.upper()}] {preview}")
                
                return True
            else:
                print(f"   ❌ Ошибка загрузки: {response.status_code}")
                return False
                
        except Exception as e:
            print(f"   ❌ Исключение: {e}")
            return False
    
    async def run_full_test(self):
        """Запуск полного интеграционного теста"""
        print("=" * 70)
        print("🔗 Integration Test: Backend + Frontend")
        print("=" * 70)
        print()
        
        # Шаг 1: Проверка сервисов
        print("🔄 Шаг 1: Проверка доступности сервисов")
        backend_ok = await self.check_service("Backend", self.backend_url)
        frontend_ok = await self.check_service("Frontend", self.frontend_url)
        
        if not (backend_ok and frontend_ok):
            print("\n❌ Необходимые сервисы недоступны")
            print("   Убедитесь, что оба контейнера запущены")
            return
        
        print()
        
        # Шаг 2: Инструкция для пользователя
        print("📋 Шаг 2: Подготовка UI")
        print(f"   1. Откройте http://localhost:8350 в браузере")
        print(f"   2. Введите session_id: {self.session_id}")
        print(f"   3. Нажмите кнопку Connect (🔗)")
        print(f"   4. Нажмите Enter для продолжения...")
        input()
        
        print()
        
        # Шаг 3: Отправка сообщения пользователя
        print("🔄 Шаг 3: Отправка сообщения пользователя")
        success = await self.send_user_message(self.test_data["user_question"])
        
        if not success:
            print("\n❌ Не удалось отправить сообщение")
            return
        
        print()
        
        # Шаг 4: Ожидание обработки
        print("🔄 Шаг 4: Ожидание обработки агентом (5 секунд)")
        for i in range(5, 0, -1):
            print(f"   Осталось {i} секунд...", end="\r")
            await asyncio.sleep(1)
        print("   Готово!          ")
        
        print()
        
        # Шаг 5: Загрузка истории
        print("🔄 Шаг 5: Загрузка истории из бэкенда")
        history_ok = await self.load_history_from_frontend()
        
        if not history_ok:
            print("\n❌ История не загружена")
            print("   Возможно, агент еще не обработал запрос")
            print("   Подождите и попробуйте снова")
            return
        
        print()
        
        # Шаг 6: Проверка UI
        print("🔄 Шаг 6: Проверка UI")
        print("   В браузере вы должны увидеть:")
        print("   1. User: Объясни формулу MSE с примерами")
        print("   2. Progress: intent_determined...")
        print("   3. Progress: retrieval_done...")
        print("   4. Progress: generate_done...")
        print("   5. Agent: [ответ с формулами]")
        print()
        print("   Если сообщений нет:")
        print("   - Обновите страницу")
        print("   - Введите session_id еще раз")
        print("   - Нажмите 'Загрузить'")
        
        print()
        print("=" * 70)
        print("✅ Интеграционный тест завершен!")
        print("=" * 70)
        print()
        print("Результаты:")
        print(f"   - Backend: {'✅' if backend_ok else '❌'}")
        print(f"   - Frontend: {'✅' if frontend_ok else '❌'}")
        print(f"   - History: {'✅' if history_ok else '❌'}")
        print()
        print("Дальнейшие действия:")
        print("   1. Проверьте браузер на наличие сообщений")
        print("   2. Попробуйте отправить еще сообщение через UI")
        print("   3. Проверьте логи контейнеров при проблемах")
        print()


async def main():
    tester = IntegrationTester()
    await tester.run_full_test()


if __name__ == "__main__":
    asyncio.run(main())