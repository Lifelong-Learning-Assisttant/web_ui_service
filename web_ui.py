#!/usr/bin/env python3
"""
Веб-интерфейс для чата с агентом ЛЛМ.
"""

from nicegui import ui
import httpx
import json
import sys
import argparse
from scripts.mathjax_config import add_mathjax_support, render_mathjax

# Парсинг аргументов командной строки
parser = argparse.ArgumentParser(description='Web UI for agent chat')
parser.add_argument('--settings', default='app_settings.json', help='Path to settings file')
args, unknown = parser.parse_known_args()

# Загрузка настроек
try:
    with open(args.settings, "r") as f:
        settings = json.load(f)
    AGENT_SERVICE_URL = settings.get("agent_service_url", "http://localhost:8250")
    WEB_UI_PORT = settings.get("web_ui_port", 8150)
    IS_DEV_VERSION = settings.get("is_dev_version", False)
except FileNotFoundError:
    # Используем переменную окружения, если файл настроек отсутствует
    import os
    AGENT_SERVICE_URL = os.getenv("AGENT_SERVICE_URL", "http://localhost:8250")
    WEB_UI_PORT = int(os.getenv("WEB_UI_PORT", "8150"))
    IS_DEV_VERSION = os.getenv("IS_DEV_VERSION", "false").lower() == "true"

# Добавление поддержки MathJax для рендеринга формул
add_mathjax_support(ui)

# Список сообщений
messages_list = []

# Флаг для отслеживания состояния сессии
session_active = False

@ui.refreshable
def show_messages():
    """Отображает сообщения в чате как пузырьки — внутри широкой колонки."""
    with ui.column().style('width: 90vw; max-width: 1100px; margin: 12px auto; gap: 12px;'):
        for author, text in messages_list:
            if author == "User":
                # выравнивание вправо для сообщений пользователя
                with ui.row().style('justify-content: flex-end;'):
                    with ui.card().style('padding:8px; max-width: 80%;'):
                        ui.markdown(f"**{author}:**  \n\n{text}")
            elif author == "Agent":
                # выравнивание влево для сообщений агента
                with ui.row().style('justify-content: flex-start;'):
                    with ui.card().style('padding:8px; max-width: 80%;'):
                        ui.markdown(f"**{author}:**  \n\n{text}")
            else:
                # системные сообщения — по центру
                with ui.row().style('justify-content: center;'):
                    ui.markdown(f"**{author}:**  \n\n{text}")

def add_message(author, text):
    """Добавляет сообщение в чат (не меняем $ на $$)."""
    messages_list.append((author, text))
    show_messages.refresh()
    # Ререндер MathJax для новых формул (inline будут корректно распознаны)
    ui.run_javascript(render_mathjax())

# Добавление первого сообщения с руководством по формулам
messages_list.append(("Agent", r"""
Пусть $$f(x) = x^2 + 1$$
$$\int_0^1 x^2 dx = \\frac{1}{3}$$

**Краткое руководство по вводу формул:**
- **Inline-формулы** (внутри текста): используйте `$...$`. Пример: `$x^2 = 4$`.
- **Блочные формулы** (отдельной строкой): используйте `$$...$$`. Пример:
  ```
  $$x^2 = 4$$
  ```
"""))

def start_session():
    """Начинает сессию общения с агентом."""
    global session_active
    if not session_active:
        session_active = True
        add_message("System", "Сессия начата. Вы можете отправлять сообщения агенту.")
    else:
        add_message("System", "Сессия уже активна.")

def end_session():
    """Завершает сессию общения с агентом."""
    global session_active
    if session_active:
        session_active = False
        add_message("System", "Сессия завершена.")
        
        # Отправка запроса на завершение сессии агенту
        try:
            response = httpx.post(
                f"{AGENT_SERVICE_URL}/api/agent/end_session",
                json={"session_id": "default"}
            )
            if response.status_code == 200:
                add_message("System", "Сессия агента успешно завершена.")
            else:
                add_message("System", "Ошибка при завершении сессии агента.")
        except Exception as e:
            add_message("System", f"Ошибка соединения с агентом при завершении сессии: {str(e)}")
    else:
        add_message("System", "Сессия не активна.")

def send_message_sync():
    """Синхронная отправка сообщения агенту."""
    global session_active
    user_message = input_field.value
    if user_message:
        # НЕ заменяем $ -> $$, передаём как есть
        add_message("User", user_message)
        input_field.value = ""
        
        if session_active:
            # Отправка сообщения агенту в синхронном режиме
            try:
                response = httpx.post(
                    f"{AGENT_SERVICE_URL}/api/agent/run",
                    json={"question": user_message, "session_id": "default"},
                    timeout=30.0
                )
                if response.status_code == 200:
                    agent_response = response.json()["answer"]
                    add_message("Agent", agent_response)
                else:
                    add_message("Agent", "Ошибка при обработке сообщения.")
            except Exception as e:
                add_message("Agent", f"Ошибка соединения с агентом: {str(e)}")
        else:
            add_message("Agent", "Пожалуйста, начните сессию, чтобы отправлять сообщения агенту.")

# Создание основного интерфейса
with ui.row().style('align-items:center; gap:12px; width:90vw; max-width:1100px; margin: 8px auto;'):
    ui.image('repo_pics/assistant_icon_small.png').style('width:48px; height:48px; border-radius:6px;')
    ui.markdown(r'### Чат с агентом')
    
# Отображение индикатора dev версии
if IS_DEV_VERSION:
    with ui.row().style('width: 90vw; max-width: 1100px; margin: 0 auto;'):
        ui.label('⚠️ Это dev версия').style('color: #d32f2f; font-weight: bold; background: #ffebee; padding: 4px 12px; border-radius: 4px; border: 1px solid #d32f2f;')

# Отображение сообщений
show_messages()

# Контролы ввода (в той же широкой колонке)
with ui.row().style('width: 90vw; max-width: 1100px; margin: 6px auto; gap: 8px; align-items: center;'):
    input_field = ui.input(label="Ваше сообщение", placeholder="Введите сообщение...")
    input_field.style('flex: 1;')   # input растягивается
    ui.button("Отправить", on_click=send_message_sync)
    ui.button("Начать общение", on_click=start_session)
    ui.button("Завершить сессию", on_click=end_session)


# Запуск приложения
if __name__ in {"__main__", "__mp_main__"}:
    ui.run(port=WEB_UI_PORT)