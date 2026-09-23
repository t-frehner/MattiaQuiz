import { useState } from 'react';

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
    <form onSubmit={submit}>
      <h1>MattiaQuiz</h1>
      <label>
        Dein Name
        <br />
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          maxLength={40}
          autoCapitalize="words"
          autoComplete="off"
          enterKeyHint="go"
        />
      </label>
      <fieldset>
        <legend>Dein Team</legend>
        {TEAMS.map((t) => (
          <label key={t}>
            <input
              type="radio"
              name="team"
              value={t}
              checked={team === t}
              onChange={() => setTeam(t)}
              required
            />
            Team {t}
          </label>
        ))}
      </fieldset>
      <button type="submit" disabled={busy}>
        Los geht's
      </button>
      {error && <p>Fehler: {error}</p>}
    </form>
  );
}
