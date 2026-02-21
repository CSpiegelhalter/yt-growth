import type { CommentInsights, LlmCallFn } from "../types";
import { VideoInsightError } from "../errors";
import { analyzeComments } from "./analyzeComments";

type GetCommentInsightsDeps = {
  getGoogleAccount: (userId: number, channelId: string) => Promise<any>;
  fetchComments: (ga: any, videoId: string, limit: number) => Promise<any[]>;
  callLlm: LlmCallFn;
};

const NO_COMMENTS_RESULT: CommentInsights & { noComments: boolean } = {
  sentiment: { positive: 0, neutral: 100, negative: 0 },
  themes: [],
  viewerLoved: [],
  viewerAskedFor: [],
  hookInspiration: [],
  noComments: true,
};

export async function getCommentInsights(
  input: { userId: number; channelId: string; videoId: string; videoTitle: string },
  deps: GetCommentInsightsDeps,
): Promise<CommentInsights & { noComments?: boolean }> {
  const { userId, channelId, videoId, videoTitle } = input;

  const ga = await deps.getGoogleAccount(userId, channelId);
  if (!ga) {
    throw new VideoInsightError("INVALID_INPUT", "Google account not connected");
  }

  const rawComments = await deps.fetchComments(ga, videoId, 30);
  if (rawComments.length === 0) {
    return NO_COMMENTS_RESULT;
  }

  return analyzeComments(
    {
      videoTitle,
      comments: rawComments.map((c: any) => ({
        text: c.text,
        likes: c.likes ?? 0,
      })),
    },
    deps.callLlm,
  );
}
