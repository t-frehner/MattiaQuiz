import { useCallback, useEffect, useState } from 'react';

export default function Quiz({ token, onInvalidToken }) {
  const [state, setState] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  // Everything about "where am I" comes from the server, never from local state.
  const loadNext = useCallback(async () => {
    setError(null);
    const res = await fetch(`/api/players/${token}/next`);
    if (res.status === 404) return onInvalidToken();
    const body = await res.json();
    if (!res.ok) throw new Error(body.error ?? `HTTP ${res.status}`);
    setState(body);
  }, [token, onInvalidToken]);

  useEffect(() => {
    loadNext().catch((err) => setError(err.message));
  }, [loadNext]);

  async function answer(text) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/players/${token}/answers`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ questionId: state.question.id, text }),
      });
      if (res.status === 404) return onInvalidToken();
      // 409 = already answered / stale question; loadNext resolves both by moving on.
      if (!res.ok && res.status !== 409) {
        const body = await res.json();
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      await loadNext();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (error) {
    return (
      <div>
        <p>Fehler: {error}</p>
        <button onClick={() => loadNext().catch((err) => setError(err.message))}>Nochmal</button>
      </div>
    );
  }
  if (!state) return <p>Lade...</p>;

  const { player, progress, question } = state;

  if (!question) {
    return (
      <div>
        <h1>Fertig!</h1>
        <p>
          Danke fürs Mitspielen, {player.name} (Team {player.team}).
        </p>
      </div>
    );
  }

  return (
    <div>
      <p>
        {player.name} · Team {player.team} · Frage {progress.answered + 1} von {progress.total}
      </p>
      <p>
        <small>{question.category}</small>
      </p>
      <h2>{question.question}</h2>
      {question.answers.map((text) => (
        <p key={text}>
          <button onClick={() => answer(text)} disabled={busy}>
            {text}
          </button>
        </p>
      ))}
    </div>
  );
}
