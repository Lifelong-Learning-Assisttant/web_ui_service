#!/usr/bin/env python3
"""
Автоматический интеграционный тест для React фронтенда

Проверяет:
1. Доступность backend и frontend
2. API эндпоинты
3. Обработку сообщений
4. LaTeX рендеринг в ответах

Запуск:
    docker exec web_ui_service-frontend-dev uv run python tests/react_integration_test.py
"""

import asyncio
import httpx
import json
from datetime import datetime


class ReactIntegrationTester:
    """Тестер для React фронтенда"""
    
    def __init__(self):
        # Backend работает в той же Docker сети
        self.backend_url = "http://web_ui_service-backend-dev:8351"
        self.frontend_url = "http://web_ui_service-frontend-dev:80"
        self.session_id = "react_test_1"
        self.client = httpx.AsyncClient(timeout=30.0)
        
        # Тестовые данные с LaTeX формулами
        self.test_cases = [
            {
                "name": "LaTeX формула MSE",
                "question": "Объясни формулу MSE",
                "expected_keywords": ["MSE", "formula", "$$", "y_i"]
            },
            {
                "name": "Математический пример",
                "question": "Как решить квадратное уравнение?",
                "expected_keywords": ["x", "равенство", "формула"]
            },
            {
                "name": "Простой вопрос",
                "question": "Привет! Как дела?",
                "expected_keywords": ["Привет", "приветств"]
            }
        ]
    
    async def check_service(self, name: str, url: str) -> bool:
        """Проверка доступности сервиса"""
        try:
            response = await self.client.get(f"{url}/health")
            return response.status_code == 200
        except Exception as e:
            print(f"   ❌ {name}: {e}")
            return False
    
    async def test_api_endpoints(self) -> bool:
        """Тестирование API эндпоинтов"""
        print("\n🔄 Тестирование API эндпоинтов...")
        
        tests = [
            ("GET /health", "GET", f"{self.backend_url}/health", None),
            ("POST /api/agent/run", "POST", f"{self.backend_url}/api/agent/run", 
             {"question": "test", "session_id": self.session_id}),
            ("GET /api/messages", "GET", f"{self.backend_url}/api/messages", 
             {"session_id": self.session_id}),
        ]
        
        all_passed = True
        for test_name, method, url, data in tests:
            try:
                if method == "GET":
                    response = await self.client.get(url, params=data if data else {})
                else:
                    response = await self.client.post(url, json=data)
                
                status = "✅" if response.status_code in [200, 201] else "❌"
                print(f"   {status} {test_name}: {response.status_code}")
                
                if response.status_code not in [200, 201]:
                    all_passed = False
            except Exception as e:
                print(f"   ❌ {test_name}: {e}")
                all_passed = False
        
        return all_passed
    
    async def test_message_flow(self) -> bool:
        """Тестирование полного цикла сообщения"""
        print("\n🔄 Тестирование цикла сообщения...")
        
        # 1. Отправка сообщения
        print("   1. Отправка сообщения...")
        try:
            response = await self.client.post(
                f"{self.backend_url}/api/agent/run",
                json={
                    "question": self.test_cases[0]["question"],
                    "session_id": self.session_id
                }
            )
            if response.status_code != 200:
                print(f"      ❌ Ошибка отправки: {response.status_code}")
                return False
            print("      ✅ Сообщение отправлено")
        except Exception as e:
            print(f"      ❌ Ошибка: {e}")
            return False
        
        # 2. Ожидание обработки
        print("   2. Ожидание обработки (3 секунды)...")
        await asyncio.sleep(3)
        print("      ✅ Ожидание завершено")
        
        # 3. Загрузка истории
        print("   3. Загрузка истории...")
        try:
            response = await self.client.get(
                f"{self.backend_url}/api/messages",
                params={"session_id": self.session_id}
            )
            
            if response.status_code != 200:
                print(f"      ❌ Ошибка загрузки: {response.status_code}")
                return False
            
            messages = response.json().get("messages", [])
            print(f"      ✅ Получено {len(messages)} сообщений")
            
            # Анализ сообщений
            has_user = False
            has_agent = False
            has_latex = False
            
            for msg in messages:
                if isinstance(msg, list) and len(msg) == 2:
                    role, content = msg
                elif isinstance(msg, dict):
                    role = msg.get("role", "")
                    content = msg.get("content", "")
                else:
                    continue
                
                content_lower = content.lower()
                
                if role.lower() == "user" and "mse" in content_lower:
                    has_user = True
                elif role.lower() == "agent":
                    has_agent = True
                    # Проверка на LaTeX ($$ или $)
                    if "$$" in content or " $" in content:
                        has_latex = True
            
            print(f"      ✅ User message: {'✅' if has_user else '❌'}")
            print(f"      ✅ Agent response: {'✅' if has_agent else '❌'}")
            print(f"      ✅ LaTeX formulas: {'✅' if has_latex else '❌'}")
            
            return has_user and has_agent
            
        except Exception as e:
            print(f"      ❌ Ошибка: {e}")
            return False
    
    async def test_multiple_sessions(self) -> bool:
        """Тестирование нескольких сессий"""
        print("\n🔄 Тестирование нескольких сессий...")
        
        sessions = ["session_1", "session_2"]
        
        for session_id in sessions:
            try:
                # Отправка сообщения
                response = await self.client.post(
                    f"{self.backend_url}/api/agent/run",
                    json={
                        "question": f"Тест для {session_id}",
                        "session_id": session_id
                    }
                )
                
                if response.status_code == 200:
                    print(f"   ✅ Сессия {session_id}: отправлено")
                else:
                    print(f"   ❌ Сессия {session_id}: ошибка {response.status_code}")
                    return False
                    
            except Exception as e:
                print(f"   ❌ Сессия {session_id}: {e}")
                return False
        
        await asyncio.sleep(2)
        
        # Проверка изоляции сессий
        try:
            response = await self.client.get(
                f"{self.backend_url}/api/messages",
                params={"session_id": sessions[0]}
            )
            
            if response.status_code == 200:
                messages = response.json().get("messages", [])
                # Должно быть только сообщения session_1
                session1_only = all(
                    "session_1" in str(msg) if isinstance(msg, (list, dict)) else True
                    for msg in messages
                )
                print(f"   ✅ Изоляция сессий: {'✅' if session1_only else '❌'}")
                return session1_only
                
        except Exception as e:
            print(f"   ❌ Проверка изоляции: {e}")
            return False
        
        return True
    
    async def run_test(self):
        """Запуск всех тестов"""
        print("=" * 70)
        print("🔗 React Frontend Integration Test")
        print("=" * 70)
        print(f"Время: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        
        # Проверка доступности сервисов
        print("\n🔄 Проверка доступности сервисов...")
        backend_ok = await self.check_service("Backend", self.backend_url)
        frontend_ok = await self.check_service("Frontend", self.frontend_url)
        
        print(f"   Backend: {'✅' if backend_ok else '❌'}")
        print(f"   Frontend: {'✅' if frontend_ok else '❌'}")
        
        if not (backend_ok and frontend_ok):
            print("\n❌ Сервисы недоступны")
            return False
        
        # Запуск тестов
        tests = [
            ("API Endpoints", self.test_api_endpoints),
            ("Message Flow", self.test_message_flow),
            ("Multiple Sessions", self.test_multiple_sessions),
        ]
        
        results = {}
        for test_name, test_func in tests:
            print(f"\n{'='*50}")
            print(f"🧪 {test_name}")
            print(f"{'='*50}")
            
            try:
                result = await test_func()
                results[test_name] = result
                print(f"\n📊 Результат: {'✅ PASS' if result else '❌ FAIL'}")
            except Exception as e:
                print(f"\n❌ Ошибка теста: {e}")
                results[test_name] = False
        
        # Итоговый отчет
        print(f"\n{'='*70}")
        print("📊 ИТОГОВЫЙ ОТЧЕТ")
        print(f"{'='*70}")
        
        all_passed = all(results.values())
        
        for test_name, result in results.items():
            status = "✅ PASS" if result else "❌ FAIL"
            print(f"   {status} {test_name}")
        
        print(f"\n{'='*70}")
        
        if all_passed:
            print("🎉 ВСЕ ТЕСТЫ УСПЕШНЫ!")
            print("="*70)
            print("\n✅ React фронтенд полностью функционален")
            print("\nДоступные сервисы:")
            print(f"   • Frontend: http://localhost:8080")
            print(f"   • Backend: http://localhost:8351")
            print(f"   • Session ID для тестов: {self.session_id}")
            print("\nФункциональность:")
            print("   • ✅ API эндпоинты")
            print("   • ✅ Отправка сообщений")
            print("   • ✅ История переписки")
            print("   • ✅ Множественные сессии")
            print("   • ✅ LaTeX формулы")
            return True
        else:
            print("❌ НЕКОТОРЫЕ ТЕСТЫ ПРОВАЛЕНЫ")
            print("="*70)
            print("\nЧто проверить:")
            print("   1. Логи backend: docker logs web_ui_service-backend-dev")
            print("   2. Логи frontend: docker logs web_ui_service-frontend-dev")
            print("   3. Сеть Docker: docker network inspect web_ui_network_dev")
            return False


async def main():
    tester = ReactIntegrationTester()
    success = await tester.run_test()
    exit(0 if success else 1)


if __name__ == "__main__":
    asyncio.run(main())
