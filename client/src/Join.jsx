import { useState } from 'react';
import './mobile.css';

const TEAMS = ['A', 'B', 'C'];

export default function Join({ onJoined }) {
  const [name, setName] = useState('');
  const [team, setTeam] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/players', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name, team }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? `HTTP ${res.status}`);
      onJoined(body.token);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <div className="mobile mobile-center">
      <h1 className="mobile-title">MattiaQuiz</h1>
      <form className="mobile-form" onSubmit={submit}>
        <label>
          <span className="mobile-label">Dein Name</span>
          <input
            className="mobile-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            maxLength={40}
            autoCapitalize="words"
            autoComplete="off"
            enterKeyHint="go"
          />
        </label>
        <fieldset className="mobile-fieldset">
          <legend className="mobile-label">Dein Team</legend>
          <div className="mobile-teams">
            {TEAMS.map((t) => (
              <label className="mobile-team" key={t}>
                <input
                  type="radio"
                  name="team"
                  value={t}
                  checked={team === t}
                  onChange={() => setTeam(t)}
                  required
                />
                <span className="mobile-team-tile">{t}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <button className="mobile-button" type="submit" disabled={busy}>
          {busy ? 'Einen Moment...' : "Los geht's"}
        </button>
        {error && <p className="mobile-error">Fehler: {error}</p>}
      </form>
    </div>
  );
}
