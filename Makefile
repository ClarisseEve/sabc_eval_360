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

setup: ## Initial project setup (core services only)
	@echo "$(CYAN)Setting up SABC Eval360...$(RESET)"
	@if [ ! -f .env ]; then cp .env.docker .env; echo "$(GREEN)Created .env from .env.docker$(RESET)"; fi
	@docker compose build core-app mysql postgres clickhouse redis
	@docker compose up -d mysql postgres clickhouse redis
	@echo "$(YELLOW)Waiting for databases to be healthy...$(RESET)"
	@docker compose up -d --wait mysql postgres clickhouse redis 2>/dev/null || sleep 15
	@docker compose up -d core-app
	@docker compose exec core-app php artisan key:generate --force
	@docker compose exec core-app php artisan migrate --force
	@docker compose exec core-app php artisan db:seed --class=CoreSeeder --force 2>/dev/null || true
	@docker compose exec core-app php artisan storage:link
	@echo "$(GREEN)Setup complete!$(RESET)"
	@echo "  App:      http://localhost"
	@echo "  MySQL:    localhost:3307  (DataGrip)"
	@echo "  Postgres: localhost:5433  (DataGrip)"
	@echo "  CH HTTP:  localhost:8124  (DataGrip)"

install-deps: ## Install PHP and Node dependencies
	@echo "$(CYAN)Installing dependencies...$(RESET)"
	@docker compose exec core-app composer install
	@docker compose exec core-app pnpm install
	@docker compose exec core-app pnpm run build

# =============================================================================
# Docker Compose Operations
# =============================================================================

up: ## Start core services (app + dbs + redis)
	@echo "$(CYAN)Starting core services...$(RESET)"
	@docker compose up -d
	@echo "$(GREEN)Services démarrés$(RESET)"
	@echo "$(YELLOW)Accès:$(RESET)"
	@echo "  App:      http://localhost"
	@echo "  MySQL:    localhost:3307  (DataGrip: user=sabc_user db=sabc_core)"
	@echo "  Postgres: localhost:5433  (DataGrip: user=sabc_user db=sabc_business)"
	@echo "  CH HTTP:  localhost:8124  (DataGrip: user=default   db=sabc_analytics)"

up-gateway: ## Start core + gateway (Traefik)
	@docker compose --profile gateway up -d
	@echo "$(GREEN)Gateway + core démarrés$(RESET)"
	@echo "  Traefik: http://localhost:8080"

up-observability: ## Start core + observability stack
	@docker compose --profile observability up -d
	@echo "$(GREEN)Observability stack démarré$(RESET)"
	@echo "  Grafana:     http://localhost:3001 (admin/$$GRAFANA_PASSWORD)"
	@echo "  Prometheus:  http://localhost:9090"
	@echo "  Jaeger:      http://localhost:16686"
	@echo "  Alertmanager: http://localhost:9093"

up-microservices: ## Start core + Go microservices
	@docker compose --profile microservices up -d
	@echo "$(GREEN)Microservices démarrés$(RESET)"
	@echo "  Evaluation: http://localhost:8081"
	@echo "  Analytics:  http://localhost:8082"

up-full: ## Start everything (all profiles)
	@docker compose --profile gateway --profile observability --profile microservices --profile pipeline --profile scale-workers up -d
	@echo "$(GREEN)Stack complète démarrée$(RESET)"

down: ## Stop all containers
	@echo "$(CYAN)Stopping containers...$(RESET)"
	@docker compose --profile gateway --profile observability --profile microservices --profile pipeline --profile scale-workers down
	@echo "$(GREEN)Containers stopped$(RESET)"

restart: ## Restart core services
	@echo "$(CYAN)Restarting containers...$(RESET)"
	@docker compose restart
	@echo "$(GREEN)Containers restarted$(RESET)"

build: ## Build core app image
	@echo "$(CYAN)Building core-app...$(RESET)"
	@docker compose build --no-cache core-app
	@echo "$(GREEN)Build complete$(RESET)"

build-all: ## Build all images
	@echo "$(CYAN)Building all images...$(RESET)"
	@docker compose --profile microservices --profile pipeline build --no-cache
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
	@docker compose exec mysql mysql -u sabc_user -psecret sabc_core

shell-postgres: ## Open PostgreSQL shell
	@docker compose exec postgres psql -U sabc_user -d sabc_business

shell-clickhouse: ## Open ClickHouse client
	@docker compose exec clickhouse clickhouse-client --database sabc_analytics

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

db-dump: ## Dump all databases to ./backups/
	@mkdir -p backups
	@echo "$(CYAN)Dumping MySQL...$(RESET)"
	@docker compose exec mysql mysqldump -u sabc_user -psecret sabc_core > backups/mysql_sabc_core_$$(date +%Y%m%d_%H%M%S).sql
	@echo "$(CYAN)Dumping PostgreSQL...$(RESET)"
	@docker compose exec -T postgres pg_dump -U sabc_user sabc_business > backups/postgres_sabc_business_$$(date +%Y%m%d_%H%M%S).sql
	@echo "$(GREEN)Dumps saved in ./backups/$(RESET)"

db-restore-mysql: ## Restore MySQL from file: make db-restore-mysql FILE=backups/mysql_sabc_core_xxx.sql
	@docker compose exec -T mysql mysql -u sabc_user -psecret sabc_core < $(FILE)
	@echo "$(GREEN)MySQL restored from $(FILE)$(RESET)"

db-restore-postgres: ## Restore PostgreSQL from file: make db-restore-postgres FILE=backups/postgres_sabc_business_xxx.sql
	@docker compose exec -T postgres psql -U sabc_user sabc_business < $(FILE)
	@echo "$(GREEN)PostgreSQL restored from $(FILE)$(RESET)"

clean: ## Remove all containers, volumes, and networks
	@echo "$(RED)WARNING: This will remove all data!$(RESET)"
	@read -p "Are you sure? [y/N] " confirm && [ "$$confirm" = "y" ]
	@docker compose --profile gateway --profile observability --profile microservices --profile pipeline --profile scale-workers down -v --remove-orphans
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
