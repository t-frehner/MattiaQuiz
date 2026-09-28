# MattiaQuiz
All questions from: https://opentdb.com/api_config.php
Express + PostgreSQL backend, React frontend built with Vite.

Four pages run on port 5173:

- `/beamer` – QR code with the URL phones must open. Show this on the beamer.
- `/scoreboard` – team totals and player ranking, refreshed every 5 s. Also meant for the beamer.
- `/` without a saved player – name + team (A/B/C). Creates a player, then goes straight to the quiz.
- `/` with a saved player – the team's questions, one at a time, in a random order that is fixed per
  player. Every answer becomes a row in `answers`.

## Setup
1. add a SSH key or Personal Access Token
2. clone gitRepo using: 
git clone https://github.com/t-frehner/MattiaQuiz.git
or 
git clone git@github.com:t-frehner/MattiaQuiz.git
3. have a look at the make file or type make help in the terminal (this folder)


## Run
make dev            for developing not precompiled

or 

make build +        precompiled thus runs faster
make preview

Starts the backend and frontend together, waits for both to answer, then opens
http://localhost:5173/beamer in your browser. Ctrl+C stops both.



## Questions

`questions.JSON` is the question list. Every entry needs a `"team": "A" | "B" | "C"`; the server
refuses to start otherwise and names the offending index. The entry's position in the array is its
`question_id` in the database. Append new questions, don't reorder existing ones once answers exist
(or `make resetDB`). The server reads the file once at startup.

## Todos
- pick good questions