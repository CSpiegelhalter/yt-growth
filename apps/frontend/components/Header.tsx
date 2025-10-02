import Link from 'next/link';
import type { Session } from 'next-auth';

export function Header({ session }: { session: Session | null }) {
  return (
    <header style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 24 }}>
      <Link href="/">Home</Link>
      <Link href="/dashboard">Dashboard</Link>
      <Link href="/channels">Channels</Link>
      <div style={{ marginLeft: 'auto' }}>
        {session ? (
          <span>Hi, {session.user?.name ?? 'User'}</span>
        ) : (
          <Link href="/api/auth/signin">Sign in</Link>
        )}
      </div>
    </header>
  );
}
