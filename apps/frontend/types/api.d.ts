export type Me = {
  id: number;
  email: string;
  plan: "free" | "pro" | string;
  status: "active" | "trialing" | "past_due" | "canceled" | string;
  channel_limit: number;
};

export type Channel = {
  id: number;
  youtubeChannelId: string;
  title?: string | null;
  thumbnailUrl?: string | null;
  lastSyncedAt?: string | null;
  lastRetentionSyncedAt?: string | null;
  lastPlanGeneratedAt?: string | null;
  lastSubscriberAuditAt?: string | null;
  syncStatus?: string | null;
  syncError?: string | null;
};

export type Plan = {
  id: number;
  channelId: number;
  createdAt: string;
  outputMarkdown: string;
  cachedUntil?: string | null;
};

export type RetentionRow = {
  videoId: string;
  title?: string | null;
  durationSec?: number | null;
  cliffTimeSec?: number | null;
  cliffReason?: string | null;
  context?: Array<{ second: number; ratio: number }> | null;
};

export type SubscriberMagnetRow = {
  videoId?: string;
  title: string;
  views: number;
  subscribersGained: number;
  subsPerThousand: number;
};
