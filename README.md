# MattiaQuiz
All questions from: https://opentdb.com/api_config.php
Express + PostgreSQL backend, React frontend built with Vite.

Four pages:

- `/beamer` – QR code with the URL phones must open. Show this on the beamer.
- `/scoreboard` – team totals and player ranking, refreshed every 5 s. Also meant for the beamer.
- `/` without a saved player – name + team (A/B/C). Creates a player, then goes straight to the quiz.
- `/` with a saved player – the team's questions, one at a time, in a random order that is fixed per
  player. Every answer becomes a row in `answers`.

## Setup

```bash
make setup
```

Installs dependencies for both halves and creates the `mattiaquiz` database from `schema.sql`.

`make db` re-applies `schema.sql` without touching data. `make resetDB` drops both tables and
recreates them – run it once after the schema gained the `team` column, and before the party for a
clean slate.

## Run

```bash
make dev
```

Starts the backend and frontend together, waits for both to answer, then opens
http://localhost:5173/beamer in your browser. Ctrl+C stops both.

The Vite dev server listens on all interfaces and proxies `/api` to the backend, so phones only talk
to port 5173.

Run `make` on its own to list every target.

Database connection defaults to `postgres@localhost:5432/mattiaquiz` and can be overridden with the
standard `PGUSER` / `PGHOST` / `PGDATABASE` / `PGPASSWORD` / `PGPORT` environment variables.

## Questions

`questions.JSON` is the question list. Every entry needs a `"team": "A" | "B" | "C"`; the server
refuses to start otherwise and names the offending index. The entry's position in the array is its
`question_id` in the database – append new questions, don't reorder existing ones once answers exist
(or `make resetDB`). HTML entities (`&quot;` etc.) are decoded at load time.

The server reads the file once at startup; after editing it, restart `make dev`.

## Checkliste

- Laptop and phones on the **same WiFi**. Guest networks with client isolation block phone→laptop
  traffic entirely – test with one phone beforehand. Plan B: laptop hotspot.
- Firewall: `sudo ufw status`; if active, `sudo ufw allow 5173/tcp`.
- The QR shows the backend's current LAN IP, looked up on every page load. If it picks the wrong
  interface, force one: `QUIZ_HOST=192.168.1.50 make dev`. After a WiFi reconnect, reload `/beamer`.
- Reset before the start: `make resetDB`. Phones that joined earlier land on the name page again.

## Build

```bash
make build     # -> client/dist
make preview   # serve the production build and open the beamer page
```
