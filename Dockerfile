# Используем официальный образ Python
FROM python:3.13-slim

# Устанавливаем зависимости
RUN apt-get update && apt-get install -y \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Устанавливаем uv через pip
RUN pip install uv

# Копируем только pyproject.toml
WORKDIR /app
COPY pyproject.toml .

# Устанавливаем зависимости
RUN uv sync

# Открываем порт 8150 для веб-интерфейса
EXPOSE 8150

# Запускаем веб-интерфейс
CMD ["uv", "run", "python", "web_ui.py"]