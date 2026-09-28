import { useEffect, useState } from 'react';

export default function Beamer() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    // The server knows the LAN IP, only the browser knows which port it was opened on.
    fetch(`/api/beamer?port=${window.location.port}`)
      .then((res) => res.json())
      .then(setData)
      .catch((err) => setError(String(err)));
  }, []);

  if (error) return <p className="beamer">Fehler: {error}</p>;
  if (!data) return <p className="beamer">Lade...</p>;

  return (
    <div className="beamer">
      <h1>Scanne den Code zum Mitspielen</h1>
      <img src={data.qr} alt="QR-Code" width="512" height="512" />
      <p style={{ fontSize: '2em' }}>{data.url}</p>
    </div>
  );
}
