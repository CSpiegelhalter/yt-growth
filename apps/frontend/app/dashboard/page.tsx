'use client';

import { useEffect, useMemo, useState } from 'react';

type Me = {
  id: number;
  email: string;
  plan: 'basic' | 'pro' | 'team' | string;
  status: 'active' | 'past_due' | 'canceled' | string;
  channel_limit: number;
};

type Channel = {
  channel_id: string;
  title: string;
};

export default function Dashboard() {
  const [me, setMe] = useState<Me | null>(null);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null); // channelId or 'global' when doing actions

  const apiBase = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000';
  const canAddAnother = useMemo(() => {
    if (!me) return false;
    return channels.length < (me.channel_limit ?? 1) && me.status === 'active';
  }, [me, channels]);

  const load = async () => {
    setLoading(true);
    setErr(null);
    try {
      const [mRes, cRes] = await Promise.all([
        fetch('/api/me', { cache: 'no-store' }),
        fetch('/api/me/channels', { cache: 'no-store' }),
      ]);
      if (!mRes.ok) throw new Error('Failed to load /api/me');
      if (!cRes.ok) throw new Error('Failed to load /api/me/channels');
      const [m, c] = await Promise.all([mRes.json(), cRes.json()]);
      setMe(m);
      setChannels(c);
    } catch (e: any) {
      setErr(e.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const connect = () => {
    window.location.href = `${apiBase}/auth/google/start`;
  };

  const unlink = async (channelId: string) => {
    setBusy(channelId);
    setErr(null);
    try {
      const r = await fetch(`${apiBase}/me/channels/${channelId}`, { method: 'DELETE' });
      if (!r.ok) throw new Error('Failed to unlink channel');
      await load();
    } catch (e: any) {
      setErr(e.message || 'Failed to unlink channel');
    } finally {
      setBusy(null);
    }
  };

  const refreshAudit = async (channelId: string) => {
    setBusy(channelId);
    setErr(null);
    try {
      const r = await fetch(`${apiBase}/audit/${channelId}/refresh?days=90`, { method: 'POST' });
      if (!r.ok) throw new Error('Failed to queue audit refresh');
      // Optional: toast; for now a quick banner
      setErr('Refresh queued. Check back in a minute.');
    } catch (e: any) {
      setErr(e.message || 'Failed to refresh audit');
    } finally {
      setBusy(null);
    }
  };

  return (
    <main style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.h1}>Dashboard</h1>
          <p style={styles.subtle}>Manage your account, channels, and run audits.</p>
        </div>
        <div>
          <button
            onClick={connect}
            style={{ ...styles.btn, ...styles.btnPrimary }}
            disabled={!me || !canAddAnother}
            title={canAddAnother ? 'Connect your YouTube channel' : 'Upgrade plan to add more channels'}
          >
            {canAddAnother ? 'Connect YouTube' : 'Channel limit reached'}
          </button>
        </div>
      </div>

      {err && (
        <div style={styles.alert}>
          {err}
        </div>
      )}

      {/* Summary */}
      <section style={styles.section}>
        <h2 style={styles.h2}>Account</h2>
        <div style={styles.grid3}>
          <Stat label="Email" value={me?.email || '—'} />
          <Stat label="Plan" value={me?.plan || '—'} />
          <Stat
            label="Status"
            value={me?.status || '—'}
            tone={me?.status === 'active' ? 'ok' : 'warn'}
          />
          <Stat
            label="Channels Used"
            value={`${channels.length}/${me?.channel_limit ?? 1}`}
          />
        </div>
      </section>

      {/* Channels */}
      <section style={styles.section}>
        <div style={styles.rowBetween}>
          <h2 style={styles.h2}>Your channels</h2>
          <button
            onClick={connect}
            style={{ ...styles.btn, ...(canAddAnother ? styles.btnSecondary : styles.btnDisabled) }}
            disabled={!canAddAnother}
          >
            Add channel
          </button>
        </div>

        {loading ? (
          <div style={styles.card}><p>Loading…</p></div>
        ) : channels.length === 0 ? (
          <EmptyState onConnect={connect} canAdd={!!canAddAnother} />
        ) : (
          <div style={styles.cardGrid}>
            {channels.map((ch) => (
              <ChannelCard
                key={ch.channel_id}
                channel={ch}
                busy={busy === ch.channel_id}
                onUnlink={() => unlink(ch.channel_id)}
                onRefresh={() => refreshAudit(ch.channel_id)}
              />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

/* ===== Components ===== */

function Stat({ label, value, tone }: { label: string; value: string; tone?: 'ok' | 'warn' }) {
  const color = tone === 'ok' ? '#0a7a40' : tone === 'warn' ? '#9a3412' : '#111';
  return (
    <div style={styles.stat}>
      <div style={styles.statLabel}>{label}</div>
      <div style={{ ...styles.statValue, color }}>{value}</div>
    </div>
  );
}

function ChannelCard({
  channel,
  busy,
  onUnlink,
  onRefresh,
}: {
  channel: Channel;
  busy: boolean;
  onUnlink: () => void;
  onRefresh: () => void;
}) {
  return (
    <div style={styles.card}>
      <div style={styles.cardHeader}>
        <div style={{ minWidth: 0 }}>
          <div style={styles.cardTitle}>{channel.title}</div>
          <div style={styles.monoSmall}>{channel.channel_id}</div>
        </div>
        <a href={`/audit/${channel.channel_id}`} style={{ ...styles.btn, ...styles.btnLink }}>
          View audit →
        </a>
      </div>
      <div style={styles.cardActions}>
        <button
          onClick={onRefresh}
          style={{ ...styles.btn, ...styles.btnSecondary }}
          disabled={busy}
        >
          {busy ? 'Queuing…' : 'Refresh audit (90d)'}
        </button>
        <button
          onClick={onUnlink}
          style={{ ...styles.btn, ...styles.btnDanger }}
          disabled={busy}
          title="Remove this channel from your account"
        >
          {busy ? 'Working…' : 'Unlink'}
        </button>
      </div>
    </div>
  );
}

function EmptyState({ onConnect, canAdd }: { onConnect: () => void; canAdd: boolean }) {
  return (
    <div style={styles.empty}>
      <div>
        <h3 style={{ margin: 0 }}>No channels linked yet</h3>
        <p style={styles.subtle}>
          Link your YouTube channel to run audits, keyword research, and title tests.
        </p>
        <button
          onClick={onConnect}
          style={{ ...styles.btn, ...styles.btnPrimary }}
          disabled={!canAdd}
        >
          Connect YouTube
        </button>
      </div>
    </div>
  );
}

/* ===== Styles (inline, minimal) ===== */

const styles: Record<string, any> = {
  page: { maxWidth: 1000, margin: '0 auto', padding: 24 },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  h1: { fontSize: 28, margin: 0 },
  h2: { fontSize: 20, margin: '16px 0' },
  subtle: { color: '#555', marginTop: 4 },
  section: { marginTop: 24 },
  rowBetween: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },

  grid3: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: 12,
  },
  stat: { border: '1px solid #eee', padding: 12, borderRadius: 12, background: '#fff' },
  statLabel: { fontSize: 12, color: '#666' },
  statValue: { fontSize: 18, fontWeight: 600 },

  cardGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 12 },
  card: { border: '1px solid #eee', borderRadius: 12, padding: 12, background: '#fff' },
  cardHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  cardTitle: { fontSize: 16, fontWeight: 600, marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 420 },
  cardActions: { display: 'flex', gap: 8, marginTop: 8 },
  monoSmall: { fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: 12, color: '#666' },

  empty: { border: '1px dashed #ccc', borderRadius: 12, padding: 24, background: '#fafafa', textAlign: 'center' },

  alert: { background: '#fff6f6', border: '1px solid #ffd6d6', color: '#8a1f1f', borderRadius: 12, padding: 12, marginBottom: 12 },

  btn: {
    appearance: 'none',
    border: '1px solid #ddd',
    background: '#fff',
    padding: '8px 12px',
    borderRadius: 10,
    cursor: 'pointer',
    fontSize: 14,
  },
  btnPrimary: { background: '#111', color: '#fff', borderColor: '#111' },
  btnSecondary: { background: '#f5f5f5' },
  btnDanger: { background: '#fee2e2', borderColor: '#fecaca', color: '#7f1d1d' },
  btnDisabled: { opacity: 0.6, cursor: 'not-allowed' },
  btnLink: { background: 'transparent', border: 'none', color: '#2563eb', padding: 0, textDecoration: 'none' },
};
