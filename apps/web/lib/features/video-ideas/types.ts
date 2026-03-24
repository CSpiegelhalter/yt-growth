/**
 * Domain types for the video-ideas feature.
 */

export type VideoIdeaStatus = "draft" | "planned" | "published";

export type VideoIdea = {
  id: string;
  channelId: number;
  summary: string;
  title: string | null;
  script: string | null;
  description: string | null;
  tags: string[];
  postDate: string | null;
  status: VideoIdeaStatus;
  sourceProvenanceJson: string | null;
  publishedVideoId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateIdeaInput = {
  userId: number;
  channelId: number;
  summary: string;
  title?: string;
  script?: string;
  description?: string;
  tags?: string[];
  postDate?: string;
  sourceProvenanceJson?: string;
};

export type UpdateIdeaInput = {
  summary?: string;
  title?: string | null;
  script?: string | null;
  description?: string | null;
  tags?: string[];
  postDate?: string | null;
  status?: VideoIdeaStatus;
  publishedVideoId?: string | null;
};

export type SuggestableField = "title" | "script" | "description" | "tags" | "postDate";

export type SuggestFieldInput = {
  userId: number;
  channelId: number;
  field: SuggestableField;
  currentIdea: Partial<VideoIdea>;
};

export type SuggestFieldResult = {
  field: SuggestableField;
  value: string;
};
