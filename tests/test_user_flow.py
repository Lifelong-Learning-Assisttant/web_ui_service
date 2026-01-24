#!/usr/bin/env python3
"""
Тест пользовательского потока: Логин → Чтение настроек → Обновление настроек
"""

import asyncio
import httpx
import os
import argparse
import json
from datetime import datetime

# Настройки по умолчанию
DEFAULT_CONFIG = {
    "web_backend_url": os.getenv("WEB_UI_URL", "http://localhost:8151"),
    "test_user": "test_user",
    "test_password": "test_password"
}

def load_config():
    parser = argparse.ArgumentParser()
    parser.add_argument("--cfg", help="Path to JSON config file")
    args, unknown = parser.parse_known_args()
    
    config = DEFAULT_CONFIG.copy()
    if args.cfg and os.path.exists(args.cfg):
        try:
            with open(args.cfg, 'r') as f:
                file_config = json.load(f)
                config.update(file_config)
        except Exception as e:
            print(f"⚠️ Failed to load config: {e}")
    return config

CONFIG = load_config()
WEB_UI_URL = CONFIG["web_backend_url"]

async def test_user_flow():
    print("=" * 60)
    print("USER FLOW TEST: Login + Settings + Update")
    print("=" * 60)
    
    # Шаг 1: Логин
    print(f"\n[1] Логин пользователя {CONFIG['test_user']}...")
    token = None
    user_id = None
    
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                f"{WEB_UI_URL}/api/auth/login",
                data={
                    "username": CONFIG["test_user"],
                    "password": CONFIG["test_password"]
                },
                timeout=10.0
            )
            
            if resp.status_code != 200:
                print(f"    ❌ Ошибка логина: {resp.status_code} {resp.text}")
                # Если пользователя нет, возможно стоит попробовать его создать или пропустить
                return False
            
            data = resp.json()
            token = data.get("access_token")
            user_id = data.get("user_id")
            
            if not token or not user_id:
                print(f"    ❌ Некорректный ответ логина: {data}")
                return False
                
            print(f"    ✅ Логин успешен. User ID: {user_id}")
            
            # Шаг 2: Чтение настроек
            print(f"\n[2] Чтение текущих настроек...")
            resp = await client.get(
                f"{WEB_UI_URL}/api/settings",
                params={"user_id": user_id},
                headers={"Authorization": f"Bearer {token}"},
                timeout=5.0
            )
            
            if resp.status_code == 200:
                current_settings = resp.json()
                print(f"    ✅ Текущие настройки загружены: {list(current_settings.keys())}")
            else:
                print(f"    ⚠️ Ошибка чтения настроек: {resp.status_code}")

            # Шаг 3: Обновление настроек
            print(f"\n[3] Обновление настроек...")
            new_settings = {
                "agent": {"provider": "openai", "model": "gpt-4o-test"},
                "rag": {"provider": "openai", "model": "gpt-4o-mini-test"},
                "quiz": {"provider": "openai", "model": "gpt-4o-mini-test"}
            }
            
            resp = await client.post(
                f"{WEB_UI_URL}/api/session/settings",
                json={
                    "user_id": user_id,
                    "settings": new_settings
                },
                headers={"Authorization": f"Bearer {token}"},
                timeout=5.0
            )
            
            if resp.status_code == 200:
                updated = resp.json()
                print(f"    ✅ Настройки успешно обновлены")
                
                # Проверяем, что настройки действительно применились (опционально)
                # В реальном тесте можно сделать еще один GET
            else:
                print(f"    ❌ Ошибка обновления настроек: {resp.status_code} {resp.text}")
                return False

    except Exception as e:
        print(f"    ❌ Системная ошибка: {e}")
        return False

    print("\n" + "=" * 60)
    print("✅ USER FLOW TEST PASSED!")
    print("=" * 60)
    return True

if __name__ == "__main__":
    asyncio.run(test_user_flow())
