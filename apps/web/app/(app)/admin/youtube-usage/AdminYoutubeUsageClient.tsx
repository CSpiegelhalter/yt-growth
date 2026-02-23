"use client";

import { useEffect, useMemo, useState } from "react";

import s from "./style.module.css";

type Usage = {
  source: "db" | "memory";
  window?: string;
  startedAt?: string | null;
  totalCalls: number;
  totalEstimatedUnits: number;
  byHost: Record<string, { calls: number; estimatedUnits: number }>;
  byPath: Record<string, { calls: number; estimatedUnits: number }>;
  lastCalls: Array<{
    at: string;
    url: string;
    status: string | number;
    estimatedUnits: number;
  }>;
  quotaExceededSeen?: boolean;
  error?: string;
};

type ApiErrorBody = {
  error?: string | { message?: string; requestId?: string };
  details?: { error?: string };
};

function buildUsageApiError(body: ApiErrorBody, status: number, headers: Headers): string {
  const err = body?.error;
  const msg =
    (typeof err === "object" ? err?.message : null) ??
    body?.details?.error ??
    (typeof err === "string" ? err : null) ??
    `Request failed (${status})`;
  const rid = (typeof err === "object" ? err?.requestId : null) ?? headers.get("x-request-id");
  return rid ? `${String(msg)} (requestId: ${rid})` : String(msg);
}

function sortEntries<T extends { calls: number; estimatedUnits: number }>(
  obj: Record<string, T>
) {
  return Object.entries(obj).sort((a, b) => {
    const ua = a[1]?.estimatedUnits ?? 0;
    const ub = b[1]?.estimatedUnits ?? 0;
    if (ub !== ua) {return ub - ua;}
    return (b[1]?.calls ?? 0) - (a[1]?.calls ?? 0);
  });
}

export default function AdminYoutubeUsageClient() {
  const [data, setData] = useState<Usage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/dev/youtube-usage", { cache: "no-store" });
      if (!res.ok) {
        const body: ApiErrorBody = await res.json().catch(() => ({}));
        throw new Error(buildUsageApiError(body, res.status, res.headers));
      }
      const json = (await res.json()) as Usage;
      setData(json);
    } catch (error_) {
      setError(error_ instanceof Error ? error_.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/dev/youtube-usage?action=reset", {
        method: "POST",
      });
      if (!res.ok) {throw new Error("Reset failed");}
      await fetchData();
    } catch (error_) {
      setError(error_ instanceof Error ? error_.message : "Reset failed");
    } finally {
      setLoading(false);
    }
  };

  const handleClearCache = async () => {
    if (!confirm("Clear all YouTube/competitor/insights caches? This will force fresh API calls on next page load.")) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/dev/youtube-usage?action=clear-cache", {
        method: "POST",
      });
      if (!res.ok) {throw new Error("Clear cache failed");}
      const json = await res.json();
      alert(`Cleared: ${json.cleared?.join(", ") || "none"}`);
    } catch (error_) {
      setError(error_ instanceof Error ? error_.message : "Clear cache failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchData();
     
  }, []);

  useEffect(() => {
    if (!autoRefresh) {return;}
    const id = setInterval(() => {
      void fetchData();
    }, 2000);
    return () => clearInterval(id);
     
  }, [autoRefresh]);

  const hostRows = useMemo(() => (data ? sortEntries(data.byHost) : []), [data]);
  const pathRows = useMemo(() => (data ? sortEntries(data.byPath) : []), [data]);

  return (
    <main className={s.page}>
      <div className={s.headerRow}>
        <div>
          <h1 className={s.title}>YouTube API Usage</h1>
          <p className={s.subtitle}>
            Tracks actual calls made by the backend, plus estimated quota units.
          </p>
        </div>
        <div className={s.actions}>
          <button
            className={s.btn}
            onClick={() => setAutoRefresh((v) => !v)}
            type="button"
          >
            Auto refresh: {autoRefresh ? "On" : "Off"}
          </button>
          <button className={s.btn} onClick={fetchData} disabled={loading}>
            Refresh
          </button>
          <button
            className={`${s.btn} ${s.btnPrimary}`}
            onClick={handleReset}
            disabled={loading}
          >
            Reset Stats
          </button>
          <button
            className={`${s.btn} ${s.btnDanger}`}
            onClick={handleClearCache}
            disabled={loading}
          >
            Clear Cache
          </button>
        </div>
      </div>

      {error && <div className={s.error}>{error}</div>}

      <UsageSummaryCards data={data} />
      <UsageBreakdownTables hostRows={hostRows} pathRows={pathRows} />
      <RecentCallsTable calls={data?.lastCalls ?? []} />
    </main>
  );
}

function UsageSummaryCards({ data }: { data: Usage | null }) {
  return (
    <div className={s.cards}>
      <div className={s.card}>
        <div className={s.cardLabel}>Total calls</div>
        <div className={s.cardValue}>{data?.totalCalls ?? "-"}</div>
        <div className={s.muted}>
          Source: {data?.source ?? "-"}
          {data?.window ? ` · Window: ${data.window}` : ""}
        </div>
      </div>
      <div className={s.card}>
        <div className={s.cardLabel}>Estimated quota units</div>
        <div className={s.cardValue}>{data?.totalEstimatedUnits ?? "-"}</div>
        <div className={s.muted}>
          search.list≈100, most others≈1 (rough estimate)
        </div>
      </div>
      <div className={s.card}>
        <div className={s.cardLabel}>Quota exceeded seen</div>
        <div className={s.cardValue}>
          {data?.quotaExceededSeen ? "Yes" : "No"}
        </div>
        <div className={s.muted}>
          Whether any Google API calls returned a 403 quotaExceeded error.
        </div>
      </div>
    </div>
  );
}

function UsageBreakdownTables({
  hostRows,
  pathRows,
}: {
  hostRows: [string, { calls: number; estimatedUnits: number }][];
  pathRows: [string, { calls: number; estimatedUnits: number }][];
}) {
  return (
    <div className={s.grid2}>
      <section className={s.section}>
        <h2 className={s.sectionTitle}>By host</h2>
        <table className={s.table}>
          <thead>
            <tr><th>Host</th><th>Calls</th><th>Units</th></tr>
          </thead>
          <tbody>
            {hostRows.slice(0, 25).map(([host, v]) => (
              <tr key={host}>
                <td className={s.mono}>{host}</td>
                <td>{v.calls}</td>
                <td>{v.estimatedUnits}</td>
              </tr>
            ))}
            {hostRows.length === 0 && (
              <tr><td colSpan={3} className={s.muted}>No data yet.</td></tr>
            )}
          </tbody>
        </table>
      </section>

      <section className={s.section}>
        <h2 className={s.sectionTitle}>By path</h2>
        <table className={s.table}>
          <thead>
            <tr><th>Path</th><th>Calls</th><th>Units</th></tr>
          </thead>
          <tbody>
            {pathRows.slice(0, 25).map(([path, v]) => (
              <tr key={path}>
                <td className={s.mono}>{path}</td>
                <td>{v.calls}</td>
                <td>{v.estimatedUnits}</td>
              </tr>
            ))}
            {pathRows.length === 0 && (
              <tr><td colSpan={3} className={s.muted}>No data yet.</td></tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}

function RecentCallsTable({ calls }: { calls: Usage["lastCalls"] }) {
  return (
    <section className={s.section} style={{ marginTop: 12 }}>
      <h2 className={s.sectionTitle}>Recent calls</h2>
      <table className={s.table}>
        <thead>
          <tr><th>Time</th><th>Status</th><th>Units</th><th>URL</th></tr>
        </thead>
        <tbody>
          {calls.map((c, idx) => (
            <tr key={`${c.at}-${idx}`}>
              <td className={s.mono}>{c.at}</td>
              <td>{String(c.status)}</td>
              <td>{c.estimatedUnits}</td>
              <td className={s.mono}>{c.url}</td>
            </tr>
          ))}
          {calls.length === 0 && (
            <tr>
              <td colSpan={4} className={s.muted}>
                No calls recorded yet. Navigate around the app to generate traffic.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </section>
  );
}
