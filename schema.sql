-- MattiaQuiz database schema
-- make db       applies this (idempotent, keeps existing data)
-- make resetDB  drops both tables and re-applies this (wipes players and answers)
--
-- Questions live outside the database in questions.JSON; question_id below
-- is the entry's index in that array.

CREATE TABLE IF NOT EXISTS players (
  id        SERIAL      PRIMARY KEY,
  token     TEXT        NOT NULL UNIQUE,
  name      TEXT        NOT NULL,
  team      TEXT        NOT NULL CHECK (team IN ('A', 'B', 'C')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS answers (
  id          SERIAL      PRIMARY KEY,
  player_id   INTEGER     NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  question_id INTEGER     NOT NULL,
  text        TEXT        NOT NULL,
  correct     BOOLEAN     NOT NULL,
  answered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (player_id, question_id)
);
