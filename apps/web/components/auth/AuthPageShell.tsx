import { BRAND } from "@/lib/shared/brand";

type StyleModule = Record<string, string>;

interface AuthPageShellProps {
  styles: StyleModule;
  title: string;
  subtitle?: React.ReactNode;
  error?: string | null;
  successMessage?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Shared layout wrapper for auth pages (login, signup, forgot-password, reset-password).
 * Renders branding, header, alerts, content, and footer in a consistent card layout.
 */
export function AuthPageShell({
  styles: s,
  title,
  subtitle,
  error,
  successMessage,
  footer,
  children,
}: AuthPageShellProps) {
  return (
    <main className={s.page}>
      <div className={s.card}>
        <div className={s.branding}>
          <h1 className={s.logo}>{BRAND.name}</h1>
          <p className={s.tagline}>{BRAND.tagline}</p>
        </div>

        <div className={s.header}>
          <h2 className={s.title}>{title}</h2>
          {subtitle && <p className={s.subtitle}>{subtitle}</p>}
        </div>

        {successMessage && (
          <div className={s.successAlert}>{successMessage}</div>
        )}

        {error && (
          <div className={s.errorAlert} role="alert">
            {error}
          </div>
        )}

        {children}

        {footer && <p className={s.footer}>{footer}</p>}
      </div>
    </main>
  );
}
