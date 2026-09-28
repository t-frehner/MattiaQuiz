import { useCallback, useEffect, useState } from 'react';
import './mobile.css';

export default function Quiz({ token, onInvalidToken }) {
  const [state, setState] = useState(null);
  const [busy, setBusy] = useState(false);
  const [chosen, setChosen] = useState(null);
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
    setChosen(text);
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
      setChosen(null);
    }
  }

  if (error) {
    return (
      <div className="mobile mobile-center">
        <p className="mobile-error">Fehler: {error}</p>
        <button
          className="mobile-button mobile-retry"
          onClick={() => loadNext().catch((err) => setError(err.message))}
        >
          Nochmal
        </button>
      </div>
    );
  }

  if (!state) {
    return (
      <div className="mobile mobile-center">
        <p className="mobile-note">Lade...</p>
      </div>
    );
  }

  const { player, progress, question } = state;

  if (!question) {
    return (
      <div className="mobile mobile-center">
        <h1 className="mobile-done">Fertig!</h1>
        <p className="mobile-note">
          Danke fürs Mitspielen, {player.name} (Team {player.team}).
        </p>
      </div>
    );
  }

  const percent = progress.total > 0 ? (progress.answered / progress.total) * 100 : 0;

  return (
    <div className="mobile">
      <div className="mobile-quiz-head">
        <span>{player.name}</span>
        <span className="mobile-badge">Team {player.team}</span>
      </div>
      <div className="mobile-progress">
        <div className="mobile-progress-bar" style={{ width: `${percent}%` }} />
      </div>
      <p className="mobile-progress-text">
        Frage {progress.answered + 1} von {progress.total}
      </p>

      <p className="mobile-category">{question.category}</p>
      <h2 className="mobile-question">{question.question}</h2>
      <div className="mobile-answers">
        {question.answers.map((text) => (
          <button
            key={text}
            className={text === chosen ? 'mobile-answer mobile-answer-chosen' : 'mobile-answer'}
            onClick={() => answer(text)}
            disabled={busy}
          >
            {text}
          </button>
        ))}
      </div>
    </div>
  );
}
