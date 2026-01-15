# Web UI Frontend - Документация

## Обзор

Документация по работе с математическими формулами и архитектурным решениям в NiceGUI.

## Содержание

### 📚 Руководства

1. **[Формулы LaTeX в NiceGUI](./formulas_rendering.md)**
   - Как использовать LaTeX формулы
   - Поддерживаемые форматы
   - Примеры кода
   - Стилизация

### 🏗️ Архитектура

2. **[ADR: Обработка LaTeX формул](./architecture_decision_record.md)**
   - Проблема и контекст
   - Принятое решение
   - Альтернативы
   - Выводы

## Быстрый старт

### Установка зависимостей

```bash
uv add latex2mathml
```

### Пример использования

```python
from nicegui import ui

# Строчная формула
ui.markdown('Формула $E=mc^2$', extras=['latex'])

# Блочная формула
ui.markdown('''
$$MSE = \frac{1}{n} \sum_{i=1}^{n} (y_i - \hat{y}_i)^2$$
''', extras=['latex'])
```

## Ключевые концепции

### 1. Двойная защита
- **Промпт агента**: Рекомендует правильные форматы
- **Парсер UI**: Конвертирует любые форматы

### 2. Поддерживаемые форматы
- `$...$` → `$...$` (строчные)
- `$$...$$` → `$$...$$` (блочные)
- `\(...\)` → `$...$` (конвертация)
- `\[...\]` → `$$...$$` (конвертация)

### 3. Преимущества
- ✅ Работает с любым LLM
- ✅ Надежная обработка ошибок
- ✅ Красивый UI
- ✅ Простота поддержки

## Структура проекта

```
web_ui_service/frontend/
├── web_ui.py              # Основной UI с парсером
├── docs/
│   ├── README.md          # Этот файл
│   ├── formulas_rendering.md
│   └── architecture_decision_record.md
└── tests/
    └── auto_integration_test.py
```

## Связанные файлы

- `agent_service/prompts/system_prompt.txt` - Промпт агента
- `web_ui_service/docker-compose-dev.yml` - Docker конфигурация
- `agent_service/app_settings-dev.json` - Настройки

## Поддержка

Если возникли проблемы:
1. Проверьте установленную зависимость: `uv add latex2mathml`
2. Проверьте формат формул в промпте агента
3. Проверьте логи парсера в `web_ui.py`
4. Запустите интеграционный тест

## Дополнительно

- [NiceGUI Documentation](https://nicegui.io/)
- [LaTeX Tutorial](https://www.overleaf.com/learn/latex)
- [MathJax Demo](https://www.mathjax.org/#demo)