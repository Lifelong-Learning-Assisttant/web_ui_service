#!/bin/bash

# Скрипт для запуска development окружения
# React Frontend + FastAPI Backend

set -e

echo "🚀 Запуск Web UI Development Environment"
echo "=========================================="

# Проверка Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker не установлен"
    exit 1
fi

# Проверка Docker Compose
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "❌ Docker Compose не установлен"
    exit 1
fi

# Определяем команду docker-compose
DOCKER_COMPOSE="docker compose"
if ! docker compose version &> /dev/null; then
    DOCKER_COMPOSE="docker-compose"
fi

echo ""
echo "📦 Шаг 1: Сборка Docker образов..."
$DOCKER_COMPOSE -f docker-compose-dev.yml build

echo ""
echo "▶️ Шаг 2: Запуск сервисов..."
$DOCKER_COMPOSE -f docker-compose-dev.yml up -d

echo ""
echo "⏳ Ожидание запуска сервисов..."
sleep 5

echo ""
echo "📊 Статус сервисов:"
$DOCKER_COMPOSE -f docker-compose-dev.yml ps

echo ""
echo "✅ Готово!"
echo ""
echo "🔗 Доступные URL:"
echo "   - React Frontend: http://localhost:8080"
echo "   - Backend API:    http://localhost:8351"
echo "   - Backend Health: http://localhost:8351/health"
echo ""
echo "📋 Логи сервисов:"
echo "   - Frontend: $DOCKER_COMPOSE -f docker-compose-dev.yml logs -f frontend"
echo "   - Backend:  $DOCKER_COMPOSE -f docker-compose-dev.yml logs -f backend"
echo ""
echo "🛑 Остановка: $DOCKER_COMPOSE -f docker-compose-dev.yml down"