import { useEffect, useState } from 'react';
import './scoreboard.css';

const REFRESH_MS = 5000;
const COLUMN_ROWS = 13; // what fits under the header at the row height in scoreboard.css

// Competition ranking: equal points share a rank, the next rank skips ("1, 1, 3").
function withRanks(players) {
  let rank = 0;
  return players.map((p, i) => {
    if (i === 0 || players[i - 1].correct !== p.correct) rank = i + 1;
    return { ...p, rank };
  });
}

function ScoreTable({ rows }) {
  return (
    <table className="score-table">
      <thead>
        <tr>
          <th>Platz</th>
          <th>Name</th>
          <th>Team</th>
          <th>Punkte</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((p) => (
          <tr key={p.id}>
            <td>{p.rank}.</td>
            <td>{p.name}</td>
            <td>{p.team}</td>
            <td>
              <strong>{p.correct}</strong> / {p.answered}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function Scoreboard() {
  const [data, setData] = useState({ players: [], teams: [] });
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = () =>
      fetch('/api/scores')
        .then((res) => (res.ok ? res.json() : Promise.reject(new Error(`HTTP ${res.status}`))))
        .then((body) => {
          setData(body);
          setError(null);
        })
        .catch((err) => setError(err.message));
    load();
    const timer = setInterval(load, REFRESH_MS);
    return () => clearInterval(timer);
  }, []);

  // Fill the left column completely before starting the right one.
  const rows = withRanks(data.players);
  const columns = [rows.slice(0, COLUMN_ROWS), rows.slice(COLUMN_ROWS)].filter((c) => c.length > 0);

  return (
    <div className="scoreboard">
      <header className="scoreboard-top">
        <h1>MattiaQuiz</h1>
        <ul className="team-totals">
          {data.teams.map((t) => (
            <li key={t.team}>
              <span className="team-name">Team {t.team}</span>
              <span className="team-points">{t.correct}</span>
            </li>
          ))}
        </ul>
      </header>
      <main className="scoreboard-scores">
        {columns.map((column, i) => (
          <ScoreTable key={i} rows={column} />
        ))}
      </main>
      <footer className="scoreboard-bottom">
        {error
          ? `Fehler: ${error}`
          : data.teams.map((t) => (
              <span key={t.team}>
                Team {t.team}: {t.players} Spieler
              </span>
            ))}
      </footer>
    </div>
  );
}
