import type { AuthUser } from "@/lib/user";

function parseCsv(envVal: string | undefined): string[] {
  return (envVal ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function isAdminUser(user: AuthUser | null): boolean {
  if (!user) return false;

  const adminEmails = new Set(
    parseCsv(process.env.NEXT_PUBLIC_ADMIN_EMAILS).map((e) => e.toLowerCase())
  );
  if (adminEmails.size > 0 && adminEmails.has(user.email.toLowerCase()))
    return true;

  const adminIds = new Set(
    parseCsv(process.env.ADMIN_USER_IDS).map((id) => Number(id)).filter(Number.isFinite)
  );
  if (adminIds.size > 0 && adminIds.has(user.id)) return true;

  return false;
}


