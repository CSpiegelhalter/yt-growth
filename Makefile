# ---------- Config ----------
DC := docker compose
WEB_DIR := apps/web
WORKER_DIR := apps/worker
VENV := $(WORKER_DIR)/.venv
PYTHON := $(VENV)/bin/python
PIP := $(VENV)/bin/pip

# ---------- Convenience ----------
.PHONY: help
help:
	@echo "Common targets:"
	@echo "  make dev           # start Next.js dev server"
	@echo "  make db-up         # start Postgres with pgvector"
	@echo "  make db-down       # stop Postgres"
	@echo "  make db-nuke       # nuke DB, restart, migrate, and seed (fresh start)"
	@echo "  make db-migrate    # run prisma migrations"
	@echo "  make db-seed       # seed development database"
	@echo "  make db-studio     # open Prisma Studio"
	@echo "  make db-discovery  # create worker discovery tables"
	@echo "  make logs          # tail compose logs"
	@echo "  make ps            # show compose services"
	@echo ""
	@echo "Worker targets:"
	@echo "  make worker-setup  # create venv and install dependencies"
	@echo "  make worker-embed  # embed video titles"
	@echo "  make worker-cluster # cluster embeddings"
	@echo "  make worker-score  # compute velocity/breakout scores"
	@echo "  make worker-run    # run full pipeline"
	@echo "  make worker-seed   # seed test data (no YouTube API needed)"
	@echo "  make worker-ingest # ingest from YouTube (uses API quota)"
	@echo "  make worker-rss    # expand from RSS feeds (FREE, no quota!)"

# ---------- Web App ----------
.PHONY: dev build

dev:
	cd $(WEB_DIR) && bun run dev

build:
	cd $(WEB_DIR) && bun run build

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
.PHONY: db-nuke db-migrate db-seed db-studio db-discovery

# Nuke everything and start fresh with migrations + seed
db-nuke:
	@echo "🔥 Nuking database..."
	$(DC) down --volumes --remove-orphans
	docker volume rm -f yt-growth-postgres-data 2>/dev/null || true
	@echo "🚀 Starting fresh postgres with pgvector..."
	$(DC) up -d
	@echo "⏳ Waiting for postgres to be ready..."
	@sleep 3
	@until docker exec yt-growth-postgres pg_isready -U yt_growth -d yt_growth > /dev/null 2>&1; do \
		echo "  ...waiting for postgres..."; \
		sleep 2; \
	done
	@echo "📦 Running Prisma migrations..."
	cd $(WEB_DIR) && bunx prisma migrate deploy
	@echo "📊 Creating discovery tables..."
	@$(MAKE) db-discovery
	@echo "🌱 Seeding database..."
	cd $(WEB_DIR) && bun prisma/seed.ts
	@echo "✅ Done! Database is fresh and ready."

db-migrate:
	cd $(WEB_DIR) && bunx prisma migrate deploy

db-seed:
	cd $(WEB_DIR) && bun prisma/seed.ts

db-studio:
	cd $(WEB_DIR) && bunx prisma studio

# Create discovery tables (worker schema - separate from Prisma)
db-discovery:
	@echo "📊 Creating discovery tables..."
	docker exec -i yt-growth-postgres psql -U yt_growth -d yt_growth < packages/db/sql/001_enable_pgvector.sql
	docker exec -i yt-growth-postgres psql -U yt_growth -d yt_growth < packages/db/sql/002_discovery_tables.sql
	@echo "✅ Discovery tables ready!"

# ---------- Worker ----------
.PHONY: worker-setup worker-embed worker-cluster worker-score worker-rank worker-run worker-seed worker-ingest worker-all

# Create venv and install dependencies (only runs if venv doesn't exist or requirements changed)
$(VENV)/bin/activate: $(WORKER_DIR)/requirements.txt $(WORKER_DIR)/pyproject.toml
	@echo "🐍 Creating Python virtual environment..."
	python3 -m venv $(VENV)
	@echo "📦 Installing worker package in development mode..."
	$(PIP) install --upgrade pip
	$(PIP) install -e $(WORKER_DIR)
	@touch $(VENV)/bin/activate
	@echo "✅ Worker environment ready!"

# Explicit setup target
worker-setup: $(VENV)/bin/activate

# Processing commands (no YouTube API needed)
worker-embed: $(VENV)/bin/activate
	cd $(WORKER_DIR) && $(CURDIR)/$(PYTHON) -m worker embed --window 7d

worker-cluster: $(VENV)/bin/activate
	cd $(WORKER_DIR) && $(CURDIR)/$(PYTHON) -m worker cluster --window 7d

worker-score: $(VENV)/bin/activate
	cd $(WORKER_DIR) && $(CURDIR)/$(PYTHON) -m worker score --window 7d

worker-rank: $(VENV)/bin/activate
	cd $(WORKER_DIR) && $(CURDIR)/$(PYTHON) -m worker rank --window 7d

worker-run: $(VENV)/bin/activate
	cd $(WORKER_DIR) && $(CURDIR)/$(PYTHON) -m worker run --window 7d

# Seed test data (no YouTube API needed)
worker-seed: $(VENV)/bin/activate
	cd $(WORKER_DIR) && $(CURDIR)/$(PYTHON) scripts/seed_test_data.py

# YouTube API commands (requires YOUTUBE_API_KEY in .env)
worker-ingest: $(VENV)/bin/activate
	cd $(WORKER_DIR) && $(CURDIR)/$(PYTHON) -m worker --mode ingest --once --window 7d

worker-all: $(VENV)/bin/activate
	cd $(WORKER_DIR) && $(CURDIR)/$(PYTHON) -m worker --mode all --once --window 7d

# FREE expansion via RSS (no quota!)
worker-rss: $(VENV)/bin/activate
	cd $(WORKER_DIR) && $(CURDIR)/$(PYTHON) -m worker rss-expand --max-channels 50
