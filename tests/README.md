# Integration Tests (NetRunner Scenarios)

Этот набор тестов проверяет работу всей системы (Agent -> RAG -> Web UI Backend) через WebSocket API, эмулируя поведение реального фронтенда.

## Структура

Тесты разделены на отдельные сценарии для удобства отладки и экономии ресурсов:

*   `test_scenario_general.py`: Проверка обычного чата (General Flow).
*   `test_scenario_rag.py`: Проверка поиска по базе знаний (RAG Flow).
*   `test_scenario_quiz.py`: Проверка интерактивного режима квиза (Quiz Flow).
*   `netrunner_utils.py`: Общие утилиты и валидаторы.

## Что проверяется

### 1. General Chat Flow (`test_scenario_general.py`)
*   **Действие**: Отправка простого приветствия.
*   **Проверка**: Цепочка событий `intent_determined` -> `start_direct_answer` -> `direct_answer_done`.

### 2. RAG Search Flow (`test_scenario_rag.py`)
*   **Действие**: Вопрос по базе знаний.
*   **Проверка**:
    *   Цепочка событий RAG.
    *   **Deep Assertion**: Проверка непустых результатов поиска (meta).
    *   **Content Check**: Проверка длины ответа.

### 3. Quiz Flow (`test_scenario_quiz.py`)
*   **Действие**: Полный цикл прохождения квиза.
*   **Проверка**:
    *   Валидация структуры вопроса (варианты ответов).
    *   Обработка ответов пользователя.
    *   Работа команд `/skip_question` и `/finish_quizz`.
    *   RAG-уточнение внутри контекста квиза.

## Как запустить

Тесты запускаются внутри контейнера `web_ui_service-backend`.

**Запуск отдельного сценария:**
```bash
docker exec web_ui_service-backend-dev uv run python /app/tests_integration/test_scenario_general.py --cfg /app/tests_integration/config-dev.json
```

```bash
docker exec web_ui_service-backend-dev uv run python /app/tests_integration/test_scenario_rag.py --cfg /app/tests_integration/config-dev.json
```

```bash
docker exec web_ui_service-backend-dev uv run python /app/tests_integration/test_scenario_quiz.py --cfg /app/tests_integration/config-dev.json