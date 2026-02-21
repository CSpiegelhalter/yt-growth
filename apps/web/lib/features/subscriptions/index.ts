// Types (only what's currently consumed by feature callers)
export type {
  Plan,
  FeatureKey,
  EntitlementError,
  UsageCheckResult,
} from "./types";

// Use-cases — checkEntitlement
export {
  checkEntitlement,
  checkChannelLimit,
} from "./use-cases/checkEntitlement";

// Use-cases — getUserProfile
export { getUserProfile } from "./use-cases/getUserProfile";

// Use-cases — syncSubscription
export { syncSubscription } from "./use-cases/syncSubscription";
