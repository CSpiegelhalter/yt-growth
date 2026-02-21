// Types
export type { ChannelProfile } from "./types";

export {
  PROFILE_CATEGORIES,
  CONTENT_FORMATS,
  DEFAULT_PROFILE_INPUT,
  createFallbackAIProfile,
} from "./types";

// Schemas
export {
  ChannelProfileInputSchema,
  ChannelProfileAISchema,
  UpdateProfileBodySchema,
  GenerateProfileBodySchema,
} from "./schemas";

export type {
  ChannelProfileInput,
  ChannelProfileAI,
} from "./schemas";

// Utils
export {
  formatInputForLLM,
} from "./utils";

// Use-cases
export { getProfile } from "./use-cases/getProfile";
export { updateProfile } from "./use-cases/updateProfile";
export { generateProfile } from "./use-cases/generateProfile";
export { listChannels } from "./use-cases/listChannels";
export { getChannel } from "./use-cases/getChannel";
export { deleteChannel } from "./use-cases/deleteChannel";
export { listChannelVideos } from "./use-cases/listChannelVideos";
export type { ListChannelVideosDeps } from "./use-cases/listChannelVideos";
