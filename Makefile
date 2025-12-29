# ---------- Config ----------
DC_BASE := docker compose -f docker/docker-compose.yml
DC_FULL := docker compose -f docker/docker-compose.yml -f docker/docker-compose.full.yml
ATLAS   := $(DC_BASE) run --rm atlas
DEV_URL := postgres://app:app@postgres:5432/appdb?sslmode=disable

# ---------- Convenience ----------
.PHONY: help
help:
	@echo "Common targets:"
	@echo "  make db-up         # start Postgres (and deps)"
	@echo "  make db-down       # stop Postgres"
	@echo "  make db-migrate    # atlas diff + apply (local dev)"
	@echo "  make prisma        # prisma db pull + generate (Next.js)"
	@echo "  make py-up         # start Python API/worker (compose profile)"
	@echo "  make py-down       # stop Python services"
	@echo "  make logs          # tail compose logs"
	@echo "  make ps            # show compose services"
	@echo "  make clean         # down + remove orphans/volumes (DANGEROUS)"

# ---------- Compose lifecycle ----------
.PHONY: db-up db-down ps logs clean
db-up:
	$(DC_BASE) up -d postgres

db-down:
	$(DC_BASE) down

ps:
	$(DC_BASE) ps

logs:
	$(DC_BASE) logs -f

# Blow away everything (containers + volumes) and orphans. Be careful.
clean:
	$(DC_BASE) down --volumes --remove-orphans

# ---------- Atlas (schema/migrations) ----------
# Diff from schema.hcl -> migrations/ (needs a dev scratch DB) then apply to dev.
.PHONY: db-diff db-apply db-migrate
db-diff: db-up
	$(ATLAS) migrate diff \
	  --config file://atlas.hcl \
	  --env dev \
	  --dev-url "$(DEV_URL)" \
	  --to file://schema.hcl

db-apply: db-up
	$(ATLAS) migrate apply \
	  --config file://atlas.hcl \
	  --env dev

db-migrate: db-diff db-apply

PRISMA_SCHEMA := prisma/schema.prisma
DB_URL := postgres://app:app@localhost:5432/appdb?sslmode=disable

.PHONY: prisma prisma-pull prisma-generate
prisma: prisma-pull prisma-generate

prisma-pull:
	DATABASE_URL="$(DB_URL)" bunx prisma db pull --schema $(PRISMA_SCHEMA)

prisma-generate:
	DATABASE_URL="$(DB_URL)" bunx prisma generate --schema $(PRISMA_SCHEMA)



# ---------- Python services (API + worker) ----------
.PHONY: py-up py-down py-logs
py-up:
	$(DC_FULL) --profile python up -d api worker

py-down:
	$(DC_FULL) --profile python down

py-logs:
	$(DC_FULL) --profile python logs -f api worker

# ---------- Utility ----------
.PHONY: atlas-shell
atlas-shell:
	$(DC_BASE) run --rm atlas sh -lc 'pwd; ls -la'
