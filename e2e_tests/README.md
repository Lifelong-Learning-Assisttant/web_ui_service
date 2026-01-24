# Netrunner E2E Tests

Автоматические тесты интерфейса с использованием [Playwright](https://playwright.dev/).
Проверяют реальную работу UI в браузере: рендеринг Markdown, работу WebSocket и интерактивность квизов.

## Предварительные требования

У вас должен быть установлен [uv](https://github.com/astral-sh/uv).

## Установка

1. Перейдите в директорию тестов:
   ```bash
   cd web_ui_service/e2e_tests
   ```

2. Установите зависимости и браузеры (это создаст виртуальное окружение `.venv`):
   ```bash
   uv run playwright install chromium
   ```
   *Примечание: `uv run` автоматически установит пакеты из pyproject.toml перед запуском команды.*

## Запуск тестов

Запуск всех тестов (по умолчанию запустится браузер в видимом режиме `--headed`):
```bash
uv run pytest
```

Запуск в фоновом режиме (headless):
```bash
uv run pytest --headless
```

Запуск конкретного теста:
```bash
uv run pytest -k "quiz"
```

## Структура

- `test_ui_e2e.py` — основные сценарии проверки (Чат, RAG, Квиз).
- `pyproject.toml` — конфигурация зависимостей.