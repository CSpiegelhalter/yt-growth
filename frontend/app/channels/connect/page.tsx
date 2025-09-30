'use client';
export default function ConnectChannel() {
  const api = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000';
  const start = () => {
    window.location.href = `${api}/auth/google/start`;
  };
  return (
    <main>
      <h1>Connect YouTube</h1>
      <p>Click below to start the Google OAuth flow on the backend.</p>
      <button onClick={start}>Connect with Google</button>
    </main>
  );
}