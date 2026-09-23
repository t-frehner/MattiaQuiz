import { randomUUID } from 'node:crypto';
import os from 'node:os';
import express from 'express';
import QRCode from 'qrcode';
import { pool } from './db.js';
import { TEAMS, isTeam, questionsForPlayer, publicView } from './questions.js';

const app = express();
app.use(express.json());

app.get('/api/health', async (req, res) => {
  const result = await pool.query('SELECT NOW()');
  res.json({ ok: true, time: result.rows[0].now });
});

// The IP phones must use. Looked up on every call so a new DHCP lease only needs a page reload.
function lanIp() {
  if (process.env.QUIZ_HOST) return process.env.QUIZ_HOST;
  const candidates = [];
  for (const [name, addrs] of Object.entries(os.networkInterfaces())) {
    if (/^(docker|br-|veth|virbr)/.test(name)) continue;
    for (const a of addrs) {
      if (a.family === 'IPv4' && !a.internal) candidates.push(a.address);
    }
  }
  return (
    candidates.find((ip) => ip.startsWith('192.168.')) ??
    candidates.find((ip) => ip.startsWith('10.')) ??
    candidates[0] ??
    'localhost'
  );
}

app.get('/api/beamer', async (req, res) => {
  const port = req.query.port || '5173';
  const url = `http://${lanIp()}:${port}`;
  const qr = await QRCode.toDataURL(url, { width: 512, margin: 1 });
  res.json({ url, qr });
});

app.post('/api/players', async (req, res) => {
  const name = String(req.body?.name ?? '').trim();
  const team = req.body?.team;
  if (name.length === 0 || name.length > 40) {
    return res.status(400).json({ error: 'Name muss 1 bis 40 Zeichen lang sein' });
  }
  if (!isTeam(team)) {
    return res.status(400).json({ error: 'Team muss A, B oder C sein' });
  }
  const token = randomUUID();
  await pool.query('INSERT INTO players (token, name, team) VALUES ($1, $2, $3)', [token, name, team]);
  res.status(201).json({ token, name, team });
});

// Player row plus their team's questions in their fixed order and the ids already answered.
async function loadPlayer(token) {
  const { rows } = await pool.query('SELECT id, name, team FROM players WHERE token = $1', [token]);
  const player = rows[0];
  if (!player) return null;
  const answered = await pool.query('SELECT question_id FROM answers WHERE player_id = $1', [player.id]);
  const done = new Set(answered.rows.map((r) => r.question_id));
  const order = questionsForPlayer(player.team, player.id);
  const next = order.find((q) => !done.has(q.id)) ?? null;
  return { player, done, order, next };
}

app.get('/api/players/:token/next', async (req, res) => {
  const state = await loadPlayer(req.params.token);
  if (!state) return res.status(404).json({ error: 'Spieler unbekannt' });
  const { player, done, order, next } = state;
  res.json({
    player: { name: player.name, team: player.team },
    progress: { answered: done.size, total: order.length },
    question: next ? publicView(next) : null,
  });
});

app.post('/api/players/:token/answers', async (req, res) => {
  const state = await loadPlayer(req.params.token);
  if (!state) return res.status(404).json({ error: 'Spieler unbekannt' });
  const { player, next } = state;
  const questionId = Number(req.body?.questionId);
  const text = String(req.body?.text ?? '');
  if (!next || questionId !== next.id) {
    return res.status(409).json({ error: 'Das ist nicht die aktuelle Frage' });
  }
  const correct = text === next.correctAnswer;
  await pool.query(
    `INSERT INTO answers (player_id, question_id, text, correct)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (player_id, question_id) DO NOTHING`,
    [player.id, questionId, text, correct],
  );
  res.json({ correct });
});

// Ranking for the scoreboard: every player (also those without answers), best first.
app.get('/api/scores', async (req, res) => {
  const { rows: players } = await pool.query(
    `SELECT p.id, p.name, p.team,
            count(a.id)::int AS answered,
            coalesce(sum(a.correct::int), 0)::int AS correct
     FROM players p LEFT JOIN answers a ON a.player_id = p.id
     GROUP BY p.id
     ORDER BY correct DESC, answered ASC, p.name ASC`,
  );
  const teams = TEAMS.map((team) => {
    const members = players.filter((p) => p.team === team);
    return { team, players: members.length, correct: members.reduce((sum, p) => sum + p.correct, 0) };
  });
  res.json({ players, teams });
});

// Express 5 forwards rejected promises here; answer with JSON instead of the default HTML page.
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Serverfehler' });
});

const PORT = process.env.PORT ?? 4000;
app.listen(PORT, () => console.log(`Server läuft auf Port ${PORT}`));
