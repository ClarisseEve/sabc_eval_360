# =============================================================================
# SABC Eval360 - Makefile
# =============================================================================
# Usage: make [target]
#
# Targets:
#   setup       - Initial setup (copy env, generate key, install deps)
#   up          - Start all containers
#   down        - Stop all containers
#   restart     - Restart all containers
#   logs        - Show logs from all containers
#   shell       - Open shell in core-app container
#   migrate     - Run database migrations
#   seed        - Run database seeders
#   test        - Run tests
#   build       - Build/rebuild containers
#   clean       - Remove all containers and volumes

.PHONY: setup up down restart logs shell migrate seed test build clean help

# Default target
.DEFAULT_GOAL := help

# Colors for output
CYAN := \033[36m
GREEN := \033[32m
YELLOW := \033[33m
RED := \033[31m
RESET := \033[0m

# =============================================================================
# Setup & Installation
# =============================================================================

setup: ## Initial project setup
	@echo "$(CYAN)Setting up SABC Eval360...$(RESET)"
	@if [ ! -f .env ]; then cp .env.docker .env; echo "$(GREEN)Created .env from .env.docker$(RESET)"; fi
	@docker compose build
	@docker compose up -d
	@sleep 10
	@docker compose exec core-app php artisan key:generate --force
	@docker compose exec core-app php artisan migrate --force
	@docker compose exec core-app php artisan storage:link
	@echo "$(GREEN)Setup complete! Access the app at http://localhost$(RESET)"

install-deps: ## Install PHP and Node dependencies
	@echo "$(CYAN)Installing dependencies...$(RESET)"
	@docker compose exec core-app composer install
	@docker compose exec core-app pnpm install
	@docker compose exec core-app pnpm run build

# =============================================================================
# Docker Compose Operations
# =============================================================================

up: ## Start all containers
	@echo "$(CYAN)Starting containers...$(RESET)"
	@docker compose up -d
	@echo "$(GREEN)Containers started$(RESET)"
	@echo "$(YELLOW)Services:$(RESET)"
	@echo "  - App:        http://localhost"
	@echo "  - Traefik:    http://localhost:8080"
	@echo "  - Grafana:    http://localhost:3001"
	@echo "  - Prometheus: http://localhost:9090"
	@echo "  - Jaeger:     http://localhost:16686"

down: ## Stop all containers
	@echo "$(CYAN)Stopping containers...$(RESET)"
	@docker compose down
	@echo "$(GREEN)Containers stopped$(RESET)"

restart: ## Restart all containers
	@echo "$(CYAN)Restarting containers...$(RESET)"
	@docker compose restart
	@echo "$(GREEN)Containers restarted$(RESET)"

build: ## Build/rebuild containers
	@echo "$(CYAN)Building containers...$(RESET)"
	@docker compose build --no-cache
	@echo "$(GREEN)Build complete$(RESET)"

# =============================================================================
# Logs & Debugging
# =============================================================================

logs: ## Show logs from all containers
	@docker compose logs -f

logs-app: ## Show logs from core-app only
	@docker compose logs -f core-app

logs-queue: ## Show logs from queue workers
	@docker compose logs -f queue-worker-default queue-worker-evaluations queue-worker-analytics

logs-db: ## Show logs from databases
	@docker compose logs -f mysql postgres clickhouse

# =============================================================================
# Shell Access
# =============================================================================

shell: ## Open shell in core-app container
	@docker compose exec core-app sh

shell-mysql: ## Open MySQL shell
	@docker compose exec mysql mysql -u sabc_user -p sabc_core

shell-postgres: ## Open PostgreSQL shell
	@docker compose exec postgres psql -U sabc_user -d sabc_business

shell-redis: ## Open Redis CLI
	@docker compose exec redis redis-cli

# =============================================================================
# Laravel Operations
# =============================================================================

migrate: ## Run database migrations
	@echo "$(CYAN)Running migrations...$(RESET)"
	@docker compose exec core-app php artisan migrate --force
	@echo "$(GREEN)Migrations complete$(RESET)"

migrate-fresh: ## Fresh migration (drop all tables)
	@echo "$(RED)WARNING: This will drop all tables!$(RESET)"
	@docker compose exec core-app php artisan migrate:fresh --force

seed: ## Run database seeders
	@echo "$(CYAN)Running seeders...$(RESET)"
	@docker compose exec core-app php artisan db:seed --force
	@echo "$(GREEN)Seeding complete$(RESET)"

cache-clear: ## Clear all caches
	@echo "$(CYAN)Clearing caches...$(RESET)"
	@docker compose exec core-app php artisan cache:clear
	@docker compose exec core-app php artisan config:clear
	@docker compose exec core-app php artisan route:clear
	@docker compose exec core-app php artisan view:clear
	@echo "$(GREEN)Caches cleared$(RESET)"

optimize: ## Optimize for production
	@echo "$(CYAN)Optimizing...$(RESET)"
	@docker compose exec core-app php artisan config:cache
	@docker compose exec core-app php artisan route:cache
	@docker compose exec core-app php artisan view:cache
	@echo "$(GREEN)Optimization complete$(RESET)"

# =============================================================================
# Testing
# =============================================================================

test: ## Run all tests
	@echo "$(CYAN)Running tests...$(RESET)"
	@docker compose exec core-app php artisan test

test-unit: ## Run unit tests only
	@docker compose exec core-app php artisan test --testsuite=Unit

test-feature: ## Run feature tests only
	@docker compose exec core-app php artisan test --testsuite=Feature

test-coverage: ## Run tests with coverage
	@docker compose exec core-app php artisan test --coverage

# =============================================================================
# Queue Operations
# =============================================================================

queue-work: ## Start queue worker (foreground)
	@docker compose exec core-app php artisan queue:work

queue-restart: ## Restart queue workers
	@docker compose restart queue-worker-default queue-worker-evaluations queue-worker-analytics

queue-failed: ## List failed jobs
	@docker compose exec core-app php artisan queue:failed

queue-retry: ## Retry all failed jobs
	@docker compose exec core-app php artisan queue:retry all

# =============================================================================
# Frontend
# =============================================================================

dev: ## Start Vite dev server
	@docker compose exec core-app pnpm run dev

build-assets: ## Build frontend assets
	@docker compose exec core-app pnpm run build

# =============================================================================
# Cleanup
# =============================================================================

clean: ## Remove all containers, volumes, and networks
	@echo "$(RED)WARNING: This will remove all data!$(RESET)"
	@read -p "Are you sure? [y/N] " confirm && [ "$$confirm" = "y" ]
	@docker compose down -v --remove-orphans
	@echo "$(GREEN)Cleanup complete$(RESET)"

prune: ## Remove unused Docker resources
	@docker system prune -f
	@docker volume prune -f

# =============================================================================
# Status & Health
# =============================================================================

status: ## Show container status
	@docker compose ps

health: ## Check health of all services
	@echo "$(CYAN)Checking service health...$(RESET)"
	@docker compose exec core-app curl -s http://localhost/health || echo "$(RED)Core app: unhealthy$(RESET)"
	@docker compose exec redis redis-cli ping || echo "$(RED)Redis: unhealthy$(RESET)"
	@docker compose exec mysql mysqladmin ping -u root -p$$MYSQL_ROOT_PASSWORD 2>/dev/null || echo "$(RED)MySQL: unhealthy$(RESET)"
	@echo "$(GREEN)Health check complete$(RESET)"

# =============================================================================
# Help
# =============================================================================

help: ## Show this help message
	@echo "$(CYAN)SABC Eval360 - Available commands:$(RESET)"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(GREEN)%-15s$(RESET) %s\n", $$1, $$2}'
	@echo ""
	@echo "$(YELLOW)Examples:$(RESET)"
	@echo "  make setup      # First time setup"
	@echo "  make up         # Start the application"
	@echo "  make logs       # View all logs"
	@echo "  make test       # Run tests"
