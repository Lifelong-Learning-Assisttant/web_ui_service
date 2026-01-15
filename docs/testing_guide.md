# 📋 Руководство по тестированию Web UI Service

Это руководство описывает два подхода к тестированию Web UI Service: **Unit Tests** (симуляция) и **Demo Script** (реальный flow).

## 📊 Сравнение подходов

| Критерий | Unit Tests | Demo Script |
|----------|------------|-------------|
| **Зависимости** | Mock (без LLM/Agent) | Реальный агент |
| **Скорость** | Мгновенно | 2-5 секунд |
| **Детерминизм** | 100% | Зависит от LLM |
| **Что тестирует** | UI логику | Интеграцию |
| **Использование** | CI/CD | Ручное тестирование |

---

## 🔹 Unit Tests (Симуляция)

**Файл:** `tests/test_web_ui_simulation.py`

### Запуск
```bash
docker exec web_ui_service-web_ui_dev-1 uv run pytest tests/test_web_ui_simulation.py -v
```

### Что тестирует
- ✅ Подключение к WebSocket
- ✅ Обработка 6 шагов прогресса
- ✅ Форматирование формул MathJax
- 🔹 Изоляция сессий
- 🔹 Последовательность событий

### Пример вывода
```
test_connect_and_subscribe ✓
test_progress_events ✓
test_formula_rendering ✓
test_session_isolation ✓
test_event_sequence ✓
test_history_loading ✓
test_error_handling ✓

7/7 tests passed
```

### Преимущества
- **Быстро**: выполняется за <1 секунду
- **Надежно**: не зависит от внешних сервисов
- **CI/CD**: можно запускать в пайплайнах

---

## 🔹 Demo Script (Реальный flow)

**Файл:** `tests/test_task_g_demo.py`

### Запуск

**Шаг 1: Подготовка UI**
```bash
# Откройте в браузере
http://localhost:8350

# Введите session_id: demo_quiz_1
# Нажмите "Загрузить" → "Подключиться"
```

**Шаг 2: Запуск скрипта**
```bash
docker exec web_ui_service-web_ui_dev-1 uv run python tests/test_task_g_demo.py
```

**Шаг 3: Наблюдение**
- В браузере увидите progress events
- Скрипт завершится через 2-5 секунд
- В UI появится история сообщений

### Что делает скрипт
1. Отправляет POST запрос: `http://localhost:8250/api/agent/run`
2. Передает вопрос: "Что такое MSE?"
3. Агент выполняет 6 шагов
4. UI показывает прогресс в реальном времени
5. В конце загружается история

### Пример команды
```bash
# Альтернативно можно отправить вручную
curl -X POST http://localhost:8250/api/agent/run \
  -H "Content-Type: application/json" \
  -d '{"question": "Объясни MSE", "session_id": "demo_quiz_1"}'
```

---

## 🔹 Пошаговый тест через API

### 1. Подготовка UI
```bash
# Браузер: http://localhost:8350
# Session ID: test_api_1
# Кнопки: "Загрузить" → "Подключиться"
```

### 2. Отправка запроса
```bash
curl -X POST http://localhost:8250/api/agent/run \
  -H "Content-Type: application/json" \
  -d '{"question": "Что такое MSE?", "session_id": "test_api_1"}'
```

### 3. Наблюдение в UI
- **Шаг 1**: `Подключение к WebSocket...`
- **Шаг 2**: `Запуск агента...`
- **Шаг 3**: `Анализ запроса...`
- **Шаг 4**: `Получение ответа...`
- **Шаг 5**: `Форматирование...`
- **Шаг 6**: `Завершено`

### 4. Проверка истории
- Обновите страницу
- Введите `test_api_1`
- Нажмите "Загрузить"
- Увидите историю сообщений

---

## 🔹 Формулы MathJax

### Правила ввода
- **Inline**: `$x^2 = 4$` → x² = 4
- **Block**: `$$MSE = \frac{1}{n}\sum...$$` → отдельный блок

### Примеры формул
```
MSE: $$MSE = \frac{1}{n}\sum_{i=1}^{n}(y_i - \hat{y}_i)^2$$

Linear: $y = wx + b$

Gradient: $\nabla L = \frac{2}{n}X^T(Xw - y)$
```

### Проверка
1. Отправьте запрос с формулой
2. Убедитесь, что она отображается корректно
3. Проверьте в разных браузерах

---

## 🔹 Отладка

### Проблема: UI не подключается
```bash
# Проверьте логи
docker logs web_ui_service-web_ui_dev-1

# Проверьте порт
curl http://localhost:8250/health
```

### Проблема: Нет событий
```bash
# Проверьте agent_service
docker ps | grep agent_service

# Проверьте логи агента
docker logs agent_service-agent_dev-1
```

### Проблема: Формулы не рендерятся
- Проверьте синтаксис: `$...$` или `$$...$$`
- Проверьте консоль браузера на ошибки
- Убедитесь, что MathJax загружен

---

## 🔹 CI/CD Интеграция

### GitHub Actions
```yaml
- name: Test Web UI
  run: |
    docker exec web_ui_service-web_ui_dev-1 \
      uv run pytest tests/test_web_ui_simulation.py -v
```

### Преимущества
- ✅ Быстро
- ✅ Надежно
- ✅ Не требует внешних зависимостей

---

## 📚 Связанные документы

- [API Documentation](api_documentation.md) — endpoints
- [Web UI Architecture](web-ui.md) — общая архитектура
- [Deployment](deployment.md) — развертывание

---

## ✅ Чек-лист тестирования

- [ ] Unit tests проходят (7/7)
- [ ] Demo script работает
- [ ] UI показывает progress
- [ ] Формулы рендерятся
- [ ] История загружается
- [ ] API отвечает
- [ ] WebSocket подключен

---

**Для вопросов:** смотрите `web_ui_service/README.md`