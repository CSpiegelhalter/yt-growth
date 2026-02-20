import { describe, it, expect } from "bun:test";
import { KeywordError } from "../errors";
import { DomainError } from "@/lib/shared/errors";
import { toApiError } from "@/lib/api/errors";

describe("KeywordError", () => {
  it("extends DomainError", () => {
    const err = new KeywordError("INVALID_INPUT", "Bad keyword");
    expect(err).toBeInstanceOf(DomainError);
    expect(err).toBeInstanceOf(Error);
  });

  it("preserves code, message, and name", () => {
    const err = new KeywordError("EXTERNAL_FAILURE", "Provider down");
    expect(err.code).toBe("EXTERNAL_FAILURE");
    expect(err.message).toBe("Provider down");
    expect(err.name).toBe("KeywordError");
  });

  it("carries cause through", () => {
    const cause = new Error("network timeout");
    const err = new KeywordError("TIMEOUT", "Request timed out", cause);
    expect(err.cause).toBe(cause);
  });

  it("maps INVALID_INPUT to 400 via toApiError", () => {
    const err = new KeywordError("INVALID_INPUT", "At least one keyword is required");
    const apiErr = toApiError(err);
    expect(apiErr.status).toBe(400);
    expect(apiErr.code).toBe("VALIDATION_ERROR");
    expect(apiErr.message).toBe("At least one keyword is required");
  });

  it("maps EXTERNAL_FAILURE to 502 via toApiError", () => {
    const err = new KeywordError("EXTERNAL_FAILURE", "DataForSEO unavailable");
    const apiErr = toApiError(err);
    expect(apiErr.status).toBe(502);
    expect(apiErr.code).toBe("INTEGRATION_ERROR");
  });

  it("maps RATE_LIMITED to 429 via toApiError", () => {
    const err = new KeywordError("RATE_LIMITED", "Too many requests");
    const apiErr = toApiError(err);
    expect(apiErr.status).toBe(429);
    expect(apiErr.code).toBe("RATE_LIMITED");
  });

  it("maps unknown code to 500 via toApiError", () => {
    const err = new KeywordError("UNKNOWN_CODE", "Something weird");
    const apiErr = toApiError(err);
    expect(apiErr.status).toBe(500);
    expect(apiErr.code).toBe("INTERNAL");
  });
});
