#!/usr/bin/env python3
"""
Веб-интерфейс для чата с агентом ЛЛМ.
"""

from nicegui import ui

# Добавление поддержки MathJax для рендеринга формул
ui.add_head_html("""
<script src="https://polyfill.io/v3/polyfill.min.js?features=es6"></script>
<script id="MathJax-script" async src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"></script>
""")

# Список сообщений
messages_list = []

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

# Кнопка для отправки сообщения
def send_message():
    user_message = input_field.value
    if user_message:
        # Замена одиночных знаков доллара на двойные для формул
        user_message_formatted = user_message.replace('$', '$$')
        add_message("User", user_message_formatted)
        input_field.value = ""
        # Здесь можно добавить логику для ответа агента
        agent_response = "Сообщение получено"
        add_message("Agent", agent_response)

ui.button("Отправить", on_click=send_message)

# Кнопка для добавления сообщения от агента
ui.button("Сообщение от агента", on_click=lambda:
    add_message("Agent", "Решим уравнение $$x^2 = 4$$ → $$x = \\pm 2$$")
)

# Запуск приложения
if __name__ in {"__main__", "__mp_main__"}:
    ui.run()