/**
 * Authorization Security Tests
 * 
 * Tests to verify server-side authorization controls work correctly.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock Prisma
vi.mock("@/prisma", () => ({
  prisma: {
    channel: {
      findFirst: vi.fn(),
      count: vi.fn(),
    },
    video: {
      findFirst: vi.fn(),
    },
    savedIdea: {
      findFirst: vi.fn(),
    },
    subscription: {
      findUnique: vi.fn(),
    },
  },
}));

import { prisma } from "@/prisma";
import {
  verifyChannelOwnership,
  verifyVideoOwnership,
  verifySavedIdeaOwnership,
  hasActiveSubscription,
  checkChannelLimit,
  isAdminUser,
} from "@/lib/security/authz";

describe("Authorization - verifyChannelOwnership", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should allow access when user owns the channel", async () => {
    vi.mocked(prisma.channel.findFirst).mockResolvedValue({ id: 1 } as any);

    const result = await verifyChannelOwnership(123, "UC123");

    expect(result.allowed).toBe(true);
    expect(prisma.channel.findFirst).toHaveBeenCalledWith({
      where: {
        youtubeChannelId: "UC123",
        userId: 123,
      },
      select: { id: true },
    });
  });

  it("should deny access when user does not own the channel", async () => {
    vi.mocked(prisma.channel.findFirst).mockResolvedValue(null);

    const result = await verifyChannelOwnership(123, "UC456");

    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("not owned");
  });

  it("should work with numeric channel IDs", async () => {
    vi.mocked(prisma.channel.findFirst).mockResolvedValue({ id: 1 } as any);

    const result = await verifyChannelOwnership(123, 1);

    expect(result.allowed).toBe(true);
    expect(prisma.channel.findFirst).toHaveBeenCalledWith({
      where: {
        id: 1,
        userId: 123,
      },
      select: { id: true },
    });
  });
});

describe("Authorization - verifyVideoOwnership", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should allow access when user owns the video via channel", async () => {
    vi.mocked(prisma.video.findFirst).mockResolvedValue({ id: 1 } as any);

    const result = await verifyVideoOwnership(123, "video123");

    expect(result.allowed).toBe(true);
    expect(prisma.video.findFirst).toHaveBeenCalledWith({
      where: {
        youtubeVideoId: "video123",
        Channel: { userId: 123 },
      },
      select: { id: true },
    });
  });

  it("should deny access for video not owned by user", async () => {
    vi.mocked(prisma.video.findFirst).mockResolvedValue(null);

    const result = await verifyVideoOwnership(123, "video456");

    expect(result.allowed).toBe(false);
  });
});

describe("Authorization - hasActiveSubscription", () => {
  it("should deny when no subscription", () => {
    const user = {
      id: 1,
      email: "test@test.com",
      name: null,
      subscription: null,
    };

    const result = hasActiveSubscription(user);

    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("No subscription");
  });

  it("should deny for free plan", () => {
    const user = {
      id: 1,
      email: "test@test.com",
      name: null,
      subscription: {
        status: "active",
        plan: "free",
        channelLimit: 1,
        currentPeriodEnd: null,
      },
    };

    const result = hasActiveSubscription(user);

    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("Free plan");
  });

  it("should allow for active pro subscription", () => {
    const user = {
      id: 1,
      email: "test@test.com",
      name: null,
      subscription: {
        status: "active",
        plan: "pro",
        channelLimit: 5,
        currentPeriodEnd: new Date(Date.now() + 86400000), // Tomorrow
      },
    };

    const result = hasActiveSubscription(user);

    expect(result.allowed).toBe(true);
  });

  it("should deny for expired subscription", () => {
    const user = {
      id: 1,
      email: "test@test.com",
      name: null,
      subscription: {
        status: "active",
        plan: "pro",
        channelLimit: 5,
        currentPeriodEnd: new Date(Date.now() - 86400000), // Yesterday
        cancelAt: null,
      },
    };

    const result = hasActiveSubscription(user);

    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("expired");
  });
});

describe("Authorization - checkChannelLimit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should allow when under limit", async () => {
    vi.mocked(prisma.subscription.findUnique).mockResolvedValue({
      channelLimit: 5,
      plan: "pro",
    } as any);
    vi.mocked(prisma.channel.count).mockResolvedValue(2);

    const result = await checkChannelLimit(123);

    expect(result.allowed).toBe(true);
    expect(result.limit).toBe(5);
    expect(result.current).toBe(2);
  });

  it("should deny when at limit", async () => {
    vi.mocked(prisma.subscription.findUnique).mockResolvedValue({
      channelLimit: 5,
      plan: "pro",
    } as any);
    vi.mocked(prisma.channel.count).mockResolvedValue(5);

    const result = await checkChannelLimit(123);

    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("Channel limit reached");
  });

  it("should default to 1 channel when no subscription", async () => {
    vi.mocked(prisma.subscription.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.channel.count).mockResolvedValue(1);

    const result = await checkChannelLimit(123);

    expect(result.allowed).toBe(false);
    expect(result.limit).toBe(1);
  });
});

describe("Authorization - isAdminUser", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("should return true for admin email", () => {
    process.env.NEXT_PUBLIC_ADMIN_EMAILS = "admin@test.com, super@test.com";

    const result = isAdminUser({ id: 1, email: "admin@test.com", name: null });

    expect(result).toBe(true);
  });

  it("should return true for admin ID", () => {
    process.env.ADMIN_USER_IDS = "1, 2, 3";

    const result = isAdminUser({ id: 2, email: "user@test.com", name: null });

    expect(result).toBe(true);
  });

  it("should return false for non-admin", () => {
    process.env.NEXT_PUBLIC_ADMIN_EMAILS = "admin@test.com";
    process.env.ADMIN_USER_IDS = "999";

    const result = isAdminUser({ id: 1, email: "user@test.com", name: null });

    expect(result).toBe(false);
  });
});
