// Types (only what's currently consumed by feature callers)
export type {
  EntitlementError,
  FeatureKey,
  Plan,
  UsageCheckResult,
} from "./types";

// Use-cases — checkEntitlement
export {
  checkChannelLimit,
  checkEntitlement,
} from "./use-cases/checkEntitlement";

// Use-cases — getUserProfile
export { getUserProfile } from "./use-cases/getUserProfile";

// Use-cases — syncSubscription
export { syncSubscription } from "./use-cases/syncSubscription";
