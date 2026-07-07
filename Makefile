.PHONY: dev build preview install clean lint

# ─── Development ────────────────────────────────────────────

## Start Vite dev server with hot reload
dev:
	npm run dev

## Install all dependencies
install:
	npm install

# ─── Build & Preview ────────────────────────────────────────

## TypeScript check + production build
build:
	npx tsc --noEmit && npx vite build

## Preview the production build locally
preview:
	npm run preview

# ─── Quality ────────────────────────────────────────────────

## TypeScript type-check (no emit)
lint:
	npx tsc --noEmit

# ─── Clean ──────────────────────────────────────────────────

## Remove build output and node_modules
clean:
	rm -rf dist node_modules

## Remove only build output
clean-dist:
	rm -rf dist
