# Studio Booking — qulay buyruqlar

.PHONY: up down logs migrate shell-api shell-db

# ─── Docker ───────────────────────────────────────────────────
up:
	docker-compose up -d --build

down:
	docker-compose down

logs:
	docker-compose logs -f

logs-bot:
	docker-compose logs -f bot

logs-api:
	docker-compose logs -f api

# ─── Database ─────────────────────────────────────────────────
migrate:
	docker-compose exec api alembic upgrade head

migrate-create:
	docker-compose exec api alembic revision --autogenerate -m "$(name)"

migrate-down:
	docker-compose exec api alembic downgrade -1

# ─── Shell ────────────────────────────────────────────────────
shell-api:
	docker-compose exec api bash

shell-db:
	docker-compose exec postgres psql -U studio_user -d studio_booking

# ─── Dev ──────────────────────────────────────────────────────
dev-api:
	cd api && uvicorn main:app --reload --port 8000

dev-bot:
	cd bot && python main.py

# ─── Env setup ────────────────────────────────────────────────
setup:
	cp .env.example .env
	@echo "✅ .env fayl yaratildi. Ichidagi qiymatlarni to'ldiring!"
