PNPM := pnpm

.PHONY: install dev web api build typecheck test verify config up down logs seed migrate migrate-pg preflight-cutover up-scale down-scale config-scale

install:
	$(PNPM) install:all

dev:
	$(PNPM) dev

web:
	$(PNPM) dev:web

api:
	$(PNPM) dev:api

build:
	$(PNPM) build

typecheck:
	$(PNPM) typecheck

test:
	$(PNPM) test

verify:
	$(PNPM) verify:static
	$(PNPM) verify:compose

config:
	docker compose config

up:
	docker compose up --build

down:
	docker compose down

logs:
	docker compose logs -f api frontend

seed:
	$(PNPM) --dir apps/api db:seed

migrate:
	$(PNPM) --dir apps/api db:migrate:all

migrate-pg:
	$(PNPM) --dir apps/api db:pg:migrate

preflight-cutover:
	$(PNPM) --dir apps/api preflight:cutover

up-scale:
	docker compose -f docker-compose.scale.yml up --build -d

down-scale:
	docker compose -f docker-compose.scale.yml down

config-scale:
	docker compose -f docker-compose.scale.yml config
