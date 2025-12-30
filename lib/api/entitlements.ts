import { ApiError } from "@/lib/api/errors";
import type { EntitlementError } from "@/lib/with-entitlements";

export function entitlementToApiError(error: EntitlementError): ApiError {
  if (error.type === "unauthorized") {
    return new ApiError({
      code: "UNAUTHORIZED",
      status: 401,
      message: "Unauthorized",
    });
  }

  if (error.type === "feature_locked") {
    return new ApiError({
      code: "FORBIDDEN",
      status: 403,
      message: error.body.message ?? "Upgrade required",
      details: error.body,
    });
  }

  if (error.type === "limit_reached") {
    return new ApiError({
      code: "LIMIT_REACHED",
      status: 403,
      message: "Limit reached",
      details: error.body,
    });
  }

  return new ApiError({ code: "FORBIDDEN", status: 403, message: "Forbidden" });
}


