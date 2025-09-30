export const metadata = { title: 'YT Growth', description: 'YouTube channel growth tool' };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: 'system-ui, sans-serif', margin: 0 }}>
        <div style={{ maxWidth: 960, margin: '0 auto', padding: 24 }}>
          <header style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 24 }}>
            <a href="/">Home</a>
            <a href="/dashboard">Dashboard</a>
            <a href="/channels">Channels</a>
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}