/**
 * Authorization Security Tests
 * 
 * Tests to verify server-side authorization controls work correctly.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

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
  hasActiveSubscription,
  checkChannelLimit,
} from "@/lib/security/authz";

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

