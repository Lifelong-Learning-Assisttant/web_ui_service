# backend/Dockerfile
FROM python:3.13-slim-bookworm

# Установка системных утилит (curl нужен для healthcheck) и uv
RUN pip install uv==0.9.26
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Оптимизация uv / окружения
ENV UV_COMPILE_BYTECODE=1
ENV UV_LINK_MODE=copy
ENV PYTHONUNBUFFERED=1

# Виртуальное окружение вне /app, чтобы монтирование /app не затирало зависимости
ENV VIRTUAL_ENV=/opt/venv

WORKDIR /app

# Копируем метаданные проекта (для кэширования слоёв)
COPY pyproject.toml uv.lock ./

# Создаём venv в /opt/venv и синхронизируем зависимости через uv
# Используем кэш для ускорения сборки
RUN --mount=type=cache,target=/root/.cache/uv \
    uv venv ${VIRTUAL_ENV} \
    && uv sync --locked --active

# Копируем код приложения
COPY . /app

# Добавляем venv в PATH
ENV PATH="${VIRTUAL_ENV}/bin:${PATH}"

EXPOSE 8351

# Healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:8351/health || exit 1

# Запуск через uv (uv выполнит процесс в venv)
CMD ["uv", "run", "uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8351", "--workers", "1"]
