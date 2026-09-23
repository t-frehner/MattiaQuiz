import { useState } from 'react';
import Beamer from './Beamer.jsx';
import Join from './Join.jsx';
import Quiz from './Quiz.jsx';
import Scoreboard from './Scoreboard.jsx';

const TOKEN_KEY = 'token';

// localStorage can throw (e.g. private mode); treat that as "no token".
function readToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

function writeToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    // ignore – the session then only lives as long as the tab
  }
}

export default function App() {
  const [token, setToken] = useState(readToken);

  if (window.location.pathname === '/beamer') return <Beamer />;
  if (window.location.pathname === '/scoreboard') return <Scoreboard />;

  const updateToken = (next) => {
    writeToken(next);
    setToken(next);
  };

  if (!token) return <Join onJoined={updateToken} />;
  return <Quiz token={token} onInvalidToken={() => updateToken(null)} />;
}
