import type { ChannelProfile } from "../types";
import type { ChannelProfileInput, ChannelProfileAI } from "../schemas";

export type ProfileRow = {
  id: string;
  channelId: number;
  inputJson: string;
  inputHash: string;
  aiProfileJson: string | null;
  lastGeneratedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export function dbToProfile(row: ProfileRow): ChannelProfile {
  let input: ChannelProfileInput;
  let aiProfile: ChannelProfileAI | null = null;

  try {
    input = JSON.parse(row.inputJson) as ChannelProfileInput;
  } catch {
    input = { description: "", categories: [] };
  }

  if (row.aiProfileJson) {
    try {
      aiProfile = JSON.parse(row.aiProfileJson) as ChannelProfileAI;
    } catch {
      aiProfile = null;
    }
  }

  return {
    id: row.id,
    channelId: row.channelId,
    input,
    inputHash: row.inputHash,
    aiProfile,
    lastGeneratedAt: row.lastGeneratedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
