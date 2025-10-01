import { notFound } from 'next/navigation';

async function loadAudit(channelId: string) {
  const r = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/audit/${channelId}`, { cache: 'no-store' });
  if (!r.ok) return null;
  return r.json();
}

export default async function AuditPage({ params }: { params: { channelId: string } }) {
  const data = await loadAudit(params.channelId);
  if (!data) return notFound();
  return (
    <main>
      <h1>Audit for {params.channelId}</h1>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </main>
  );
}