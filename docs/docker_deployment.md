# Docker Deployment Guide

Этот документ описывает систему развертывания web_ui_service с использованием Docker для разработки и продакшена.

## Структура файлов

```
web_ui_service/
├── app_settings-dev.json      # Конфиг для разработки (порт 8350, is_dev_version: true)
├── app_settings-prod.json     # Конфиг для продакшена (порт 8150, is_dev_version: false)
├── Dockerfile-dev             # Dockerfile для разработки
├── Dockerfile-prod            # Dockerfile для продакшена
├── docker-compose-dev.yml     # Docker Compose для разработки (web_ui_dev)
├── docker-compose-prod.yml    # Docker Compose для продакшена (web_ui_prod)
├── web_ui.py                 # Основной код (поддерживает --settings, показывает индикатор dev)
└── docs/
    └── docker_deployment.md  # Эта документация
```

## Индикатор версии

В интерфейсе отображается индикатор версии:
- **Dev версия**: Показывает красную плашку "⚠️ Это dev версия" сверху
- **Prod версия**: Без индикатора

Это помогает визуально отличить среды при одновременной работе.

## Режим разработки (Development)

### Назначение
- Быстрая разработка с горячей перезагрузкой кода
- Изменения в коде отражаются автоматически без пересборки контейнера
- Используется для отладки и тестирования новых функций

### Как использовать

1. **Запуск сервиса:**
   ```bash
   cd web_ui_service
   docker-compose -f docker-compose-dev.yml up --build
   ```

2. **Особенности:**
   - Порт: 8350
   - Имя сервиса: `web_ui_dev`
   - Код монтируется через volume: `./:/app`
   - Изменения в файлах `.py` сразу отражаются в контейнере
   - Использует `app_settings-dev.json`
   - Команда запуска: `uv run python web_ui.py --settings app_settings-dev.json`

3. **Остановка:**
   ```bash
   docker-compose -f docker-compose-dev.yml down
   ```

### Технические детали

**Dockerfile-dev:**
- Минимальный образ Python 3.13-slim
- Устанавливает только uv и зависимости
- НЕ копирует код приложения
- Код монтируется при запуске через volume

**docker-compose-dev.yml:**
```yaml
services:
  web_ui_dev:              # Уникальное имя сервиса
    build:
      context: .
      dockerfile: Dockerfile-dev
    ports:
      - "8350:8350"
    volumes:
      - .:/app              # Монтирование кода
      - /app/__pycache__    # Исключение кэша
      - /app/.pytest_cache  # Исключение кэша тестов
    command: uv run python web_ui.py --settings app_settings-dev.json
```

## Режим продакшена (Production)

### Назначение
- Стабильная версия сервиса для развертывания
- Использует заранее собранный Docker образ
- Подходит для CI/CD и production сред

### Как использовать

1. **Сборка образа:**
   ```bash
   cd web_ui_service
   docker build -f Dockerfile-prod -t web_ui_service:v001 .
   ```

2. **Запуск сервиса:**
   ```bash
   docker-compose -f docker-compose-prod.yml up
   ```

3. **Особенности:**
   - Порт: 8150
   - Имя сервиса: `web_ui_prod`
   - Код ВКЛЮЧЕН в образ (скопирован при сборке)
   - Монтируется ТОЛЬКО конфиг: `./app_settings-prod.json:/app/app_settings.json:ro`
   - Использует `app_settings-prod.json`
   - Команда запуска: `uv run python web_ui.py --settings app_settings.json`

### Технические детали

**Dockerfile-prod:**
- Полный образ с кодом приложения
- Копирует весь код: `COPY . .`
- Использует `app_settings.json` внутри контейнера (переопределяется через volume)

**docker-compose-prod.yml:**
```yaml
services:
  web_ui_prod:             # Уникальное имя сервиса
    image: web_ui_service:latest  # Использует готовый образ
    ports:
      - "8150:8150"
    volumes:
      - ./app_settings-prod.json:/app/app_settings.json:ro  # Только конфиг
    command: uv run python web_ui.py --settings app_settings.json
```

## Публикация в GitHub Container Registry

Для публикации образа в GitHub Container Registry (GHCR):

```bash
# Логин в GHCR
docker login ghcr.io/your-username

# Сборка и тегирование
docker build -f Dockerfile-prod -t ghcr.io/your-username/web_ui_service:v001 .
docker push ghcr.io/your-username/web_ui_service:v001

# Запуск из GHCR
docker pull ghcr.io/your-username/web_ui_service:v001
docker-compose -f docker-compose-prod.yml up
```

## Сравнение режимов

| Аспект | Development | Production |
|--------|-------------|------------|
| **Порт** | 8350 | 8150 |
| **Код** | Volume (изменения实时) | Внутри образа |
| **Конфиг** | app_settings-dev.json | app_settings-prod.json |
| **Сборка** | При каждом запуске | Один раз |
| **Скорость** | Быстрые изменения | Стабильность |
| **Назначение** | Разработка | Продакшен |

## Переменные окружения

Оба режима используют:
- `PYTHONUNBUFFERED=1` - немедленный вывод логов
- `AGENT_SERVICE_URL=http://agent_service:8250` - URL агент сервиса

## Проверка работы

### Development
```bash
# Запуск
cd web_ui_service
docker-compose -f docker-compose-dev.yml up --build

# Проверить логи
docker-compose -f docker-compose-dev.yml logs -f

# Проверить порт
curl http://localhost:8350

# Проверить контейнеры
docker-compose -f docker-compose-dev.yml ps

# Остановка
docker-compose -f docker-compose-dev.yml down
```

### Production
```bash
# Сборка образа
cd web_ui_service
docker build -f Dockerfile-prod -t web_ui_service:v001 .

# Запуск
docker-compose -f docker-compose-prod.yml up

# Проверить логи
docker-compose -f docker-compose-prod.yml logs -f

# Проверить порт
curl http://localhost:8150

# Проверить контейнеры
docker-compose -f docker-compose-prod.yml ps

# Остановка
docker-compose -f docker-compose-prod.yml down
```

### Запуск обоих окружений одновременно
```bash
# Terminal 1 - Development
cd web_ui_service
docker-compose -f docker-compose-dev.yml up --build

# Terminal 2 - Production
cd web_ui_service
docker-compose -f docker-compose-prod.yml up
```

Контейнеры будут называться:
- `web_ui_dev_1` (dev, порт 8350)
- `web_ui_prod_1` (prod, порт 8150)

## Отладка

### Проблемы с development
1. **Изменения не отражаются:**
   - Проверьте права доступа к файлам
   - Убедитесь, что файлы в текущей директории
   - Перезапустите контейнер

2. **Порт занят:**
   - Измените порт в docker-compose-dev.yml и app_settings-dev.json

### Проблемы с production
1. **Образ не найден:**
   - Убедитесь, что образ собран: `docker images | grep web_ui_service`
   
2. **Ошибка конфигурации:**
   - Проверьте путь к app_settings-prod.json
   - Убедитесь, что файл существует и читаем