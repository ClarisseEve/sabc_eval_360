PNPM := pnpm

.PHONY: web api build up down seed migrate-pg up-scale down-scale config-scale preflight-cutover

web:
	$(PNPM) --dir apps/web dev

api:
	$(PNPM) --dir apps/api start:dev

build:
	$(PNPM) --dir apps/web build
	$(PNPM) --dir apps/api build

seed:
	$(PNPM) --dir apps/api db:seed

migrate-pg:
	$(PNPM) --dir apps/api db:pg:migrate

preflight-cutover:
	$(PNPM) --dir apps/api preflight:cutover

up:
	docker compose up --build

down:
	docker compose down

up-scale:
	docker compose -f docker-compose.scale.yml up --build -d

down-scale:
	docker compose -f docker-compose.scale.yml down

config-scale:
	docker compose -f docker-compose.scale.yml config
