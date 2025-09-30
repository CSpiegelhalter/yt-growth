export async function GET() {
  // For MVP dev we mock an authenticated user.
  // Replace with reading an ID token from cookies/session and forwarding Authorization to backend.
  return Response.json({ id: 'dev-user-1', email: 'dev@example.com' });
}