SHELL := /bin/bash

DB         ?= mattiaquiz
PGUSER     ?= postgres
PGHOST     ?= localhost
PGPASSWORD ?= postgres
PGDATABASE ?= $(DB)
export PGUSER PGHOST PGPASSWORD PGDATABASE

SERVER_URL  := http://localhost:4000
CLIENT_URL  := http://localhost:5173
PREVIEW_URL := http://localhost:4173
OPEN        := $(shell command -v xdg-open >/dev/null 2>&1 && echo xdg-open || echo open)

.PHONY: help setup install db resetDB dev build preview clean

help:
	@echo "make setup    install dependencies and create the database"
	@echo "make db       apply schema.sql (keeps existing data)"
	@echo "make resetDB  drop and recreate all tables (wipes players and answers)"
	@echo "make dev      start backend + frontend, then open the beamer page"
	@echo "make build    build the frontend to client/dist compiles everything"
	@echo "make preview  serve the production build and open the beamer page"
	@echo "make clean    remove node_modules and build output"

setup: install db

install:
	cd server && npm install
	cd client && npm install

db:
	@createdb --maintenance-db=postgres $(DB) 2>/dev/null \
		&& echo "created database $(DB)" \
		|| echo "database $(DB) already exists"
	psql -d $(DB) -f schema.sql

resetDB:
	psql -d $(DB) -c 'DROP TABLE IF EXISTS answers, players;'
	$(MAKE) db

dev:
	@trap 'trap - INT TERM EXIT; kill -INT 0' INT TERM EXIT; \
	(cd server && npm run dev) & \
	(cd client && npm run dev) & \
	until curl -sf $(SERVER_URL)/api/health >/dev/null 2>&1; do sleep 0.5; done; \
	until curl -sf $(CLIENT_URL) >/dev/null 2>&1; do sleep 0.5; done; \
	$(OPEN) $(CLIENT_URL)/beamer >/dev/null 2>&1; \
	$(OPEN) $(CLIENT_URL)/scoreboard >/dev/null 2>&1; \
	wait

build:
	cd client && npm run build

preview: build
	@trap 'trap - INT TERM EXIT; kill -INT 0' INT TERM EXIT; \
	(cd server && npm run dev) & \
	(cd client && npm run preview) & \
	until curl -sf $(SERVER_URL)/api/health >/dev/null 2>&1; do sleep 0.5; done; \
	until curl -sf $(PREVIEW_URL) >/dev/null 2>&1; do sleep 0.5; done; \
	$(OPEN) $(PREVIEW_URL)/beamer >/dev/null 2>&1; \
	$(OPEN) $(PREVIEW_URL)/scoreboard >/dev/null 2>&1; \
	wait

clean:
	rm -rf server/node_modules client/node_modules client/dist
