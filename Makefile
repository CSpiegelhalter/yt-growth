# ---------- Config ----------
DC := docker compose

# ---------- Convenience ----------
.PHONY: help
help:
	@echo "Common targets:"
	@echo "  make db-up         # start Postgres"
	@echo "  make db-down       # stop Postgres"
	@echo "  make db-nuke       # nuke DB, restart, migrate, and seed (fresh start)"
	@echo "  make db-migrate    # run prisma migrations"
	@echo "  make db-seed       # seed development database"
	@echo "  make db-studio     # open Prisma Studio"
	@echo "  make logs          # tail compose logs"
	@echo "  make ps            # show compose services"

# ---------- Compose lifecycle ----------
.PHONY: db-up db-down ps logs

db-up:
	$(DC) up -d

db-down:
	$(DC) down

ps:
	$(DC) ps

logs:
	$(DC) logs -f

# ---------- Database ----------
.PHONY: db-nuke db-migrate db-seed db-studio

# Nuke everything and start fresh with migrations + seed
db-nuke:
	@echo "🔥 Nuking database..."
	$(DC) down --volumes --remove-orphans
	docker volume rm -f yt-growth-postgres-data 2>/dev/null || true
	@echo "🚀 Starting fresh postgres..."
	$(DC) up -d
	@echo "⏳ Waiting for postgres to be ready..."
	@sleep 3
	@echo "📦 Running migrations..."
	bunx prisma migrate deploy
	@echo "🌱 Seeding database..."
	bun prisma/seed.ts
	@echo "✅ Done! Database is fresh and ready."

db-migrate:
	bunx prisma migrate deploy

db-seed:
	bun prisma/seed.ts

db-studio:
	bunx prisma studio
