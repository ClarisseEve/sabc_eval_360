PNPM := pnpm

.PHONY: web api build up down seed

web:
	$(PNPM) --dir apps/web dev

api:
	$(PNPM) --dir apps/api start:dev

build:
	$(PNPM) --dir apps/web build
	$(PNPM) --dir apps/api build

seed:
	$(PNPM) --dir apps/api db:seed

up:
	docker compose up --build

down:
	docker compose down
