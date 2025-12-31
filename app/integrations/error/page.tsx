import Link from "next/link";
import { EmptyState } from "@/components/ui/EmptyState";

type SearchParams = Promise<{ m?: string; rid?: string }>;

const errorMessages: Record<string, { title: string; description: string }> = {
  missing: {
    title: "Connection incomplete",
    description:
      "The authorization was cancelled or incomplete. Please try connecting your channel again.",
  },
  state: {
    title: "Session expired",
    description:
      "Your authorization session has expired or is invalid. Please try connecting your channel again.",
  },
  oauth: {
    title: "Connection failed",
    description:
      "We couldn't complete the connection to your YouTube account. Please try again.",
  },
};

const defaultError = {
  title: "Something went wrong",
  description:
    "An unexpected error occurred while connecting your account. Please try again.",
};

export default async function IntegrationsErrorPage(props: {
  searchParams: SearchParams;
}) {
  const searchParams = await props.searchParams;
  const messageKey = searchParams.m ?? "";
  const requestId = searchParams.rid;

  const { title, description } = errorMessages[messageKey] ?? defaultError;

  return (
    <main style={{ padding: "48px 16px" }}>
      <EmptyState
        icon={
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ color: "var(--danger)" }}
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        }
        title={title}
        description={description}
        action={
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
            <Link className="btn btn-primary" href="/dashboard">
              Try again
            </Link>
            <Link className="btn" href="/">
              Go home
            </Link>
          </div>
        }
      />
      {requestId && (
        <p
          style={{
            marginTop: 24,
            textAlign: "center",
            fontSize: "0.875rem",
            color: "var(--text-secondary)",
          }}
        >
          Request ID: <code style={{ fontFamily: "var(--font-mono)" }}>{requestId}</code>
        </p>
      )}
    </main>
  );
}
