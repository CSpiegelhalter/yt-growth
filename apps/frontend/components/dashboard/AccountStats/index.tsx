"use client";

import s from "./style.module.css";
import type { Me } from "@/types/api";

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "ok" | "warn";
}) {
  return (
    <div className={`${s.stat} ${tone ? s[`tone-${tone}`] : ""}`}>
      <div className={s.statLabel}>{label}</div>
      <div className={s.statValue}>{value}</div>
    </div>
  );
}

export default function AccountStats({
  me,
  channelCount,
}: Readonly<{
  me: Me | null;
  channelCount: number;
}>) {
  return (
    <div className={s.grid}>
      <Stat label="Email" value={me?.email || "—"} />
      <Stat label="Plan" value={me?.plan || "—"} />
      <Stat
        label="Status"
        value={me?.status || "—"}
        tone={me?.status === "active" ? "ok" : "warn"}
      />
      <Stat
        label="Channels Used"
        value={`${channelCount}/${me?.channel_limit ?? 1}`}
      />
    </div>
  );
}
