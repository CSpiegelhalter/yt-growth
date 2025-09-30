'use client';
import { useEffect, useState } from 'react';

export default function Dashboard() {
  const [me, setMe] = useState<any>(null);
  const [channels, setChannels] = useState<any[]>([]);
  const [err, setErr] = useState<string| null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const m = await fetch('/api/me', { cache: 'no-store' });
        if (!m.ok) throw new Error('Failed to load /api/me');
        setMe(await m.json());
        const c = await fetch('/api/me/channels', { cache: 'no-store' });
        if (!c.ok) throw new Error('Failed to load /api/me/channels');
        setChannels(await c.json());
      } catch (e:any) {
        setErr(e.message);
      }
    };
    load();
  }, []);

  return (
    <main>
      <h1>Dashboard</h1>
      {err && <p style={{color:'crimson'}}>Error: {err}</p>}
      <pre>{JSON.stringify(me, null, 2)}</pre>
      <h2>Your channels</h2>
      <ul>
        {channels.map((ch) => (
          <li key={ch.channel_id}>
            <a href={`/audit/${ch.channel_id}`}>{ch.title}</a>
          </li>
        ))}
      </ul>
      <p><a href="/channels/connect">Connect YouTube →</a></p>
    </main>
  );
}