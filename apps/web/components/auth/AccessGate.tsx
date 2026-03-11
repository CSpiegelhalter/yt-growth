import type { ReactNode } from "react";

import { Button } from "@/components/ui/Button";
import type { Channel, Me } from "@/types/api";

import s from "./access-gate.module.css";

type BootstrapData = {
  me: Me;
  channels: Channel[];
  activeChannelId: string | null;
  activeChannel: Channel | null;
};

type AccessGateProps = {
  bootstrap: BootstrapData | null;
  requireChannel?: boolean;
  children: ReactNode | ((data: BootstrapData) => ReactNode);
};

function GateCard({
  icon,
  title,
  description,
  actions,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  actions: ReactNode;
}) {
  return (
    <div className={s.gate}>
      <div className={s.card}>
        <div className={s.icon}>{icon}</div>
        <h2 className={s.title}>{title}</h2>
        <p className={s.description}>{description}</p>
        <div className={s.actions}>{actions}</div>
      </div>
    </div>
  );
}

const SVG_PROPS = {
  width: 40,
  height: 40,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  "aria-hidden": true,
} as const;

const signInIcon = (
  <svg {...SVG_PROPS}>
    <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4" />
    <polyline points="10 17 15 12 10 7" />
    <line x1="15" y1="12" x2="3" y2="12" />
  </svg>
);

const connectIcon = (
  <svg {...SVG_PROPS}>
    <path d="M22.54 6.42a2.78 2.78 0 00-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 00-1.94 2A29.94 29.94 0 001 11.75a29.94 29.94 0 00.46 5.33A2.78 2.78 0 003.4 19.1c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 001.94-2 29.94 29.94 0 00.46-5.25 29.94 29.94 0 00-.46-5.43z" />
    <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" />
  </svg>
);

/**
 * AccessGate — unified access-state wrapper for protected pages.
 *
 * Renders children when the user is authenticated (and has a channel,
 * if `requireChannel` is true). Otherwise shows the appropriate prompt.
 *
 * Children can be a render function to safely access bootstrap data:
 *   <AccessGate bootstrap={bootstrap}>
 *     {(data) => <MyComponent channels={data.channels} />}
 *   </AccessGate>
 *
 * Or plain ReactNode when children don't need bootstrap data:
 *   <AccessGate bootstrap={bootstrap}>
 *     <MyComponent />
 *   </AccessGate>
 */
export function AccessGate({
  bootstrap,
  requireChannel = true,
  children,
}: AccessGateProps) {
  if (!bootstrap) {
    return (
      <GateCard
        icon={signInIcon}
        title="Sign in to get started"
        description="Connect your YouTube channel to unlock analytics, AI-powered video suggestions, and growth insights."
        actions={
          <>
            <Button as="a" href="/auth/login" variant="primary" className={`${s.gateButton} ${s.ctaButton}`}>
              Sign in
            </Button>
            <Button as="a" href="/auth/signup" variant="secondary" className={s.gateButton}>
              Create account
            </Button>
          </>
        }
      />
    );
  }

  if (requireChannel && bootstrap.channels.length === 0) {
    return (
      <GateCard
        icon={connectIcon}
        title="Connect a YouTube channel"
        description="Link your channel to unlock analytics, AI suggestions, and growth insights."
        actions={
          <Button as="a" href="/api/integrations/google/start" variant="primary" className={`${s.gateButton} ${s.ctaButton}`}>
            Connect channel
          </Button>
        }
      />
    );
  }

  return <>{typeof children === "function" ? children(bootstrap) : children}</>;
}
