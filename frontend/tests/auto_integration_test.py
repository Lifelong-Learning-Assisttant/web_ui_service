#!/usr/bin/env python3
"""
Автоматический интеграционный тест: Проверка работы бэкенда и фронтенда

Этот скрипт автоматически тестирует полный цикл без ручного ввода.

Запуск:
    docker exec web_ui_service-web_ui_frontend-1 uv run python tests/auto_integration_test.py
"""

import asyncio
import httpx
import json
from datetime import datetime


class AutoIntegrationTester:
    """Автоматический интеграционный тестер"""
    
    def __init__(self):
        self.backend_url = "http://web_ui_backend:8351"
        self.frontend_url = "http://web_ui_frontend:8350"
        self.session_id = "auto_test_1"
        self.client = httpx.AsyncClient(timeout=30.0)
        
        # Тестовые данные
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
            return response.status_code == 200
        except:
            return False
    
    async def send_user_message(self, question: str) -> bool:
        """Отправка сообщения пользователя"""
        try:
            response = await self.client.post(
                f"{self.backend_url}/api/agent/run",
                json={
                    "question": question,
                    "session_id": self.session_id
                }
            )
            return response.status_code == 200
        except:
            return False
    
    async def load_history(self) -> tuple[bool, list]:
        """Загрузка истории"""
        try:
            response = await self.client.get(
                f"{self.backend_url}/api/messages",
                params={"session_id": self.session_id}
            )
            
            if response.status_code == 200:
                data = response.json()
                return True, data.get("messages", [])
            return False, []
        except:
            return False, []
    
    async def run_test(self):
        """Запуск автоматического теста"""
        print("=" * 70)
        print("🔗 Auto Integration Test: Backend + Frontend")
        print("=" * 70)
        print()
        
        # Проверка сервисов
        print("🔄 Проверка доступности сервисов...")
        backend_ok = await self.check_service("Backend", self.backend_url)
        frontend_ok = await self.check_service("Frontend", self.frontend_url)
        
        print(f"   Backend: {'✅' if backend_ok else '❌'}")
        print(f"   Frontend: {'✅' if frontend_ok else '❌'}")
        
        if not (backend_ok and frontend_ok):
            print("\n❌ Сервисы недоступны")
            return False
        
        print()
        
        # Отправка сообщения
        print("🔄 Отправка тестового сообщения...")
        success = await self.send_user_message(self.test_data["user_question"])
        
        if not success:
            print("❌ Не удалось отправить сообщение")
            return False
        
        print("✅ Сообщение отправлено")
        print()
        
        # Ожидание обработки
        print("🔄 Ожидание обработки агентом (5 секунд)...")
        for i in range(5, 0, -1):
            print(f"   {i}...", end=" ", flush=True)
            await asyncio.sleep(1)
        print("\n✅ Готово")
        print()
        
        # Загрузка истории
        print("🔄 Загрузка истории...")
        history_ok, messages = await self.load_history()
        
        if not history_ok:
            print("❌ Не удалось загрузить историю")
            return False
        
        print(f"✅ История загружена: {len(messages)} сообщений")
        print()
        
        # Анализ результатов
        print("📊 Анализ результатов:")
        print()
        
        has_user = False
        has_progress = False
        has_agent = False
        
        for msg in messages:
            # Агент возвращает формат [role, content]
            if isinstance(msg, list) and len(msg) == 2:
                role = msg[0]
                content = msg[1]
            elif isinstance(msg, dict):
                role = msg.get("role", "")
                content = msg.get("content", "")
            else:
                role = "unknown"
                content = str(msg)
            
            preview = content[:60] + "..." if len(content) > 60 else content
            print(f"   [{role.upper()}] {preview}")
            
            if role == "User" and "MSE" in content:
                has_user = True
            elif role == "System":
                has_progress = True
            elif role == "Agent" and "MSE" in content:
                has_agent = True
        
        print()
        print("📈 Результаты:")
        print(f"   User message: {'✅' if has_user else '❌'}")
        print(f"   Progress events: {'✅' if has_progress else '❌'}")
        print(f"   Agent response: {'✅' if has_agent else '❌'}")
        
        print()
        print("=" * 70)
        
        if has_user and has_agent:
            print("✅ ТЕСТ УСПЕШЕН!")
            print("=" * 70)
            print()
            print("🎉 Оба сервиса работают корректно!")
            print()
            print("Теперь вы можете:")
            print("   1. Открыть http://localhost:8350 в браузере")
            print(f"   2. Ввести session_id: {self.session_id}")
            print("   3. Нажать Connect (🔗)")
            print("   4. Увидеть всю историю переписки")
            print()
            return True
        else:
            print("❌ ТЕСТ ПРОВАЛЕН")
            print("=" * 70)
            print()
            print("Что проверить:")
            print("   1. Логи бэкенда: docker logs web_ui_service-web_ui_backend-1")
            print("   2. Логи фронтенда: docker logs web_ui_service-web_ui_frontend-1")
            print("   3. Сеть между контейнерами")
            print()
            return False


async def main():
    tester = AutoIntegrationTester()
    success = await tester.run_test()
    exit(0 if success else 1)


if __name__ == "__main__":
    asyncio.run(main())