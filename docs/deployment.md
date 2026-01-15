# Развертывание Web UI

## Обзор

Документация по развертыванию Web UI сервиса через Docker. Подробности смотрите в [docker-compose-dev.yml](../docker-compose-dev.yml) и [docker-compose-prod.yml](../docker-compose-prod.yml).

## Требования

- Docker
- Docker Compose

## Режимы

### Development (Разработка)

**Назначение:** Быстрая разработка с горячей перезагрузкой

**Запуск:**
```bash
cd web_ui_service
docker-compose -f docker-compose-dev.yml up --build
```

**Особенности:**
- Порт: 8350
- Код монтируется через volume
- Изменения отражаются мгновенно
- Использует `app_settings-dev.json`

**Остановка:**
```bash
docker-compose -f docker-compose-dev.yml down
```

### Production (Продакшен)

**Назначение:** Стабильная версия для развертывания

**Сборка образа:**
```bash
cd web_ui_service
docker build -f Dockerfile-prod -t web_ui_service:v001 .
```

**Запуск:**
```bash
docker-compose -f docker-compose-prod.yml up
```

**Особенности:**
- Порт: 8150
- Код внутри образа
- Использует `app_settings-prod.json`

**Остановка:**
```bash
docker-compose -f docker-compose-prod.yml down
```

## Проверка работы

### Development
```bash
# Проверить логи
docker-compose -f docker-compose-dev.yml logs -f

# Проверить порт
curl http://localhost:8350

# Проверить контейнеры
docker-compose -f docker-compose-dev.yml ps
```

### Production
```bash
# Проверить логи
docker-compose -f docker-compose-prod.yml logs -f

# Проверить порт
curl http://localhost:8150

# Проверить контейнеры
docker-compose -f docker-compose-prod.yml ps
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
- `PYTHONUNBUFFERED=1` — немедленный вывод логов
- `AGENT_SERVICE_URL` — URL агент сервиса

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

## GitHub Container Registry

### Публикация
```bash
# Логин
docker login ghcr.io/your-username

# Сборка и тегирование
docker build -f Dockerfile-prod -t ghcr.io/your-username/web_ui_service:v001 .
docker push ghcr.io/your-username/web_ui_service:v001
```

### Запуск из GHCR
```bash
docker pull ghcr.io/your-username/web_ui_service:v001
docker-compose -f docker-compose-prod.yml up
```

## См. также

- [Web UI Documentation](web-ui.md)
- [API Documentation](api_documentation.md)
- [Docker Deployment Guide](docker_deployment.md)