/**
 * YouTube API — backward-compatible re-export barrel.
 *
 * All implementation has moved to lib/adapters/youtube/.
 * This file preserves the existing import paths for consumers.
 */
export {
  fetchVideoDetails,
  fetchVideosStatsBatch,
  getGoogleAccount,
  searchNicheVideos,
} from "@/lib/adapters/youtube/index";
