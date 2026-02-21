/**
 * Domain types for the saved-ideas feature.
 */

export type IdeaStatus = "saved" | "in_progress" | "filmed" | "published";

export type SaveIdeaInput = {
  userId: number;
  ideaId: string;
  channelId?: number | string | null;
  title: string;
  angle?: string | null;
  format: string;
  difficulty: string;
  ideaJson: Record<string, unknown>;
  notes?: string | null;
};

export type UpdateIdeaInput = {
  userId: number;
  ideaId: string;
  notes?: string;
  status?: IdeaStatus;
  ideaJson?: Record<string, unknown>;
};

export type DeleteIdeaInput = {
  userId: number;
  ideaId: string;
};

export type ListIdeasInput = {
  userId: number;
  status?: string | null;
};

export type SavedIdea = {
  id: string;
  ideaId: string;
  youtubeChannelId: string | null;
  title: string;
  angle: string | null;
  format: string;
  difficulty: string;
  ideaJson: Record<string, unknown>;
  notes: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
};

export type SaveIdeaResult = {
  id: string;
  ideaId: string;
  title: string;
  status: string;
  createdAt: string;
};

export type ListIdeasResult = {
  savedIdeas: SavedIdea[];
  total: number;
};

export type DeleteIdeaResult = {
  success: true;
  ideaId: string;
};

export type UpdateIdeaResult = {
  id: string;
  ideaId: string;
  notes: string | null;
  status: string;
  updatedAt: string;
};
