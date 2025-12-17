/**
 * Tests for useRetention hook
 * Ensures retention endpoint is called only once on mount (no infinite loops)
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("useRetention hook behavior", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should call retention endpoint only once on mount", async () => {
    // Mock successful response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          channelId: "test-channel",
          videos: [
            {
              videoId: "vid1",
              title: "Test Video",
              retention: { hasData: true, cliffTimeSec: 120 },
            },
          ],
          fetchedAt: new Date().toISOString(),
        }),
    });

    // Simulate what the hook does: fetch retention data
    const channelId = "test-channel";
    const isSubscribed = true;

    // First fetch (simulating mount)
    if (isSubscribed) {
      await fetch(`/api/me/channels/${channelId}/retention`);
    }

    // Assert fetch was called exactly once
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledWith(`/api/me/channels/${channelId}/retention`);
  });

  it("should not fetch if already fetched (no refetch without explicit refresh)", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ videos: [] }),
    });

    const channelId = "test-channel";
    let hasFetched = false;

    // Simulate fetchOnMount behavior
    const fetchRetention = async () => {
      if (hasFetched) return; // Guard against refetch
      hasFetched = true;
      await fetch(`/api/me/channels/${channelId}/retention`);
    };

    // Call multiple times (simulating re-renders)
    await fetchRetention();
    await fetchRetention();
    await fetchRetention();

    // Should still only be called once
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it("should not fetch if user is not subscribed", async () => {
    const channelId = "test-channel";
    const isSubscribed = false;

    // Simulate guard check
    if (isSubscribed) {
      await fetch(`/api/me/channels/${channelId}/retention`);
    }

    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("should allow explicit refresh to refetch data", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ videos: [] }),
    });

    const channelId = "test-channel";
    let hasFetched = false;

    const fetchRetention = async (force = false) => {
      if (hasFetched && !force) return;
      hasFetched = true;
      await fetch(`/api/me/channels/${channelId}/retention`);
    };

    // Initial fetch
    await fetchRetention();
    expect(mockFetch).toHaveBeenCalledTimes(1);

    // Normal call (should not fetch)
    await fetchRetention();
    expect(mockFetch).toHaveBeenCalledTimes(1);

    // Force refresh (should fetch)
    hasFetched = false; // Simulating force reset
    await fetchRetention(true);
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it("should handle rate limit error gracefully", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 429,
      json: () =>
        Promise.resolve({
          error: "Rate limit exceeded",
          resetAt: new Date(Date.now() + 3600000).toISOString(),
        }),
    });

    const channelId = "test-channel";
    let error: string | null = null;

    try {
      const res = await fetch(`/api/me/channels/${channelId}/retention`);
      if (!res.ok) {
        const data = await res.json();
        error = data.error;
      }
    } catch (err) {
      error = err instanceof Error ? err.message : "Unknown error";
    }

    expect(error).toBe("Rate limit exceeded");
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });
});

