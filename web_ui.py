#!/usr/bin/env python3
"""
Веб-интерфейс для чата с агентом ЛЛМ.
"""

from nicegui import ui
import httpx
import json

# Загрузка настроек
try:
    with open("app_settings.json", "r") as f:
        settings = json.load(f)
    AGENT_SERVICE_URL = settings.get("agent_service_url", "http://localhost:8250")
except FileNotFoundError:
    # Используем переменную окружения, если файл настроек отсутствует
    import os
    AGENT_SERVICE_URL = os.getenv("AGENT_SERVICE_URL", "http://localhost:8250")

# Добавление поддержки MathJax для рендеринга формул
ui.add_head_html("""
<script src="https://polyfill.io/v3/polyfill.min.js?features=es6"></script>
<script id="MathJax-script" async src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"></script>
""")

# Список сообщений
messages_list = []

# Флаг для отслеживания состояния сессии
session_active = False

@ui.refreshable
def show_messages():
    """Отображает сообщения в чате."""
    with ui.column():
        for author, text in messages_list:
            ui.markdown(f"**{author}:**\n\n{text}")

def add_message(author, text):
    """Добавляет сообщение в чат."""
    messages_list.append((author, text))
    show_messages.refresh()
    # Вызов MathJax для обработки формул
    ui.run_javascript("if (typeof MathJax !== 'undefined') MathJax.typeset();")

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

def send_message():
    """Отправляет сообщение агенту."""
    global session_active
    user_message = input_field.value
    if user_message:
        # Замена одиночных знаков доллара на двойные для формул
        user_message_formatted = user_message.replace('$', '$$')
        add_message("User", user_message_formatted)
        input_field.value = ""
        
        if session_active:
            # Отправка сообщения агенту
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
ui.markdown(r"""
### Чат с агентом 🤖

Пусть $$f(x) = x^2 + 1$$
$$\int_0^1 x^2 dx = \\frac{1}{3}$$
""")

# Отображение сообщений
show_messages()

# Поле ввода для сообщения
input_field = ui.input(label="Ваше сообщение", placeholder="Введите сообщение...")

# Кнопка для начала сессии
ui.button("Начать общение", on_click=start_session)

# Кнопка для завершения сессии
ui.button("Завершить сессию", on_click=end_session)

# Кнопка для отправки сообщения
ui.button("Отправить", on_click=send_message)


# Запуск приложения
if __name__ in {"__main__", "__mp_main__"}:
    ui.run(port=8150)