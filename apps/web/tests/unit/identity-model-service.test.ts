import { describe, test, expect, beforeEach, mock } from "bun:test";
import crypto from "crypto";

/**
 * Tests for the identity model service.
 * 
 * These tests verify:
 * - Dataset hash computation
 * - Coalescing logic (needsRetrain flag)
 * - Model invalidation behavior
 */

type MockAsset = { s3KeyOriginal: string };
type MockModel = {
  id: string;
  userId?: number;
  status: string;
  datasetHash: string | null;
  needsRetrain: boolean;
  replicateModelOwner?: string;
  replicateModelName?: string;
};

// Mock prisma with proper typing
const mockFindMany = mock<() => Promise<MockAsset[]>>(() => Promise.resolve([]));
const mockCount = mock<() => Promise<number>>(() => Promise.resolve(0));
const mockUpdateMany = mock<() => Promise<{ count: number }>>(() => Promise.resolve({ count: 0 }));
const mockFindUnique = mock<() => Promise<MockModel | null>>(() => Promise.resolve(null));
const mockUpdate = mock<() => Promise<object>>(() => Promise.resolve({}));
const mockDelete = mock<() => Promise<object>>(() => Promise.resolve({}));

const mockPrisma = {
  userTrainingAsset: {
    findMany: mockFindMany,
    count: mockCount,
    updateMany: mockUpdateMany,
  },
  userModel: {
    findUnique: mockFindUnique,
    update: mockUpdate,
    delete: mockDelete,
  },
};

// Mock the replicate client
const mockDeleteModel = mock<() => Promise<void>>(() => Promise.resolve());

// Mock modules
mock.module("@/prisma", () => ({
  prisma: mockPrisma,
}));

mock.module("@/lib/replicate/client", () => ({
  deleteModel: mockDeleteModel,
}));

mock.module("@/lib/shared/logger", () => ({
  createLogger: () => ({
    info: () => {},
    warn: () => {},
    error: () => {},
  }),
}));

// Import after mocks are set up
import {
  computeDatasetHash,
  checkNeedsInvalidation,
  handleDatasetChange,
  handleTrainingComplete,
  canTrain,
  MIN_TRAINING_PHOTOS,
} from "@/lib/features/identity";

describe("computeDatasetHash", () => {
  beforeEach(() => {
    mockFindMany.mockClear();
  });

  test("returns 'empty' when no assets exist", async () => {
    mockFindMany.mockResolvedValue([]);
    
    const hash = await computeDatasetHash(1);
    
    expect(hash).toBe("empty");
  });

  test("computes deterministic hash from asset keys", async () => {
    // Mock returns assets in sorted order (as DB query would)
    const assets: MockAsset[] = [
      { s3KeyOriginal: "identity/original/u1/a.jpg" },
      { s3KeyOriginal: "identity/original/u1/b.jpg" },
      { s3KeyOriginal: "identity/original/u1/c.jpg" },
    ];
    mockFindMany.mockResolvedValue(assets);
    
    const hash = await computeDatasetHash(1);
    
    // Hash should be based on the keys
    const expectedKeys = assets.map(a => a.s3KeyOriginal).join("\n");
    const expectedHash = crypto.createHash("sha256").update(expectedKeys, "utf8").digest("hex");
    
    expect(hash).toBe(expectedHash);
  });

  test("same assets produce same hash on subsequent calls", async () => {
    const assets: MockAsset[] = [
      { s3KeyOriginal: "key1" },
      { s3KeyOriginal: "key2" },
    ];
    
    mockFindMany.mockResolvedValueOnce(assets);
    const hash1 = await computeDatasetHash(1);
    
    mockFindMany.mockResolvedValueOnce(assets);
    const hash2 = await computeDatasetHash(1);
    
    expect(hash1).toBe(hash2);
  });

  test("different assets produce different hashes", async () => {
    mockFindMany.mockResolvedValueOnce([{ s3KeyOriginal: "key1" }]);
    const hash1 = await computeDatasetHash(1);
    
    mockFindMany.mockResolvedValueOnce([{ s3KeyOriginal: "key2" }]);
    const hash2 = await computeDatasetHash(1);
    
    expect(hash1).not.toBe(hash2);
  });
});

describe("checkNeedsInvalidation", () => {
  beforeEach(() => {
    mockFindMany.mockClear();
    mockFindUnique.mockClear();
  });

  test("returns no invalidation when no model exists", async () => {
    mockFindMany.mockResolvedValue([]);
    mockFindUnique.mockResolvedValue(null);
    
    const result = await checkNeedsInvalidation(1);
    
    expect(result.needsInvalidation).toBe(false);
    expect(result.model).toBeNull();
  });

  test("returns invalidation needed when hash differs and model is ready", async () => {
    const oldHash = "oldhash123";
    mockFindMany.mockResolvedValue([{ s3KeyOriginal: "newkey" }]);
    mockFindUnique.mockResolvedValue({
      id: "model-1",
      status: "ready",
      datasetHash: oldHash,
      needsRetrain: false,
    });
    
    const result = await checkNeedsInvalidation(1);
    
    expect(result.needsInvalidation).toBe(true);
    expect(result.currentHash).not.toBe(oldHash);
  });

  test("returns no invalidation when hash matches", async () => {
    const assets: MockAsset[] = [{ s3KeyOriginal: "key1" }];
    const expectedHash = crypto.createHash("sha256").update("key1", "utf8").digest("hex");
    
    mockFindMany.mockResolvedValue(assets);
    mockFindUnique.mockResolvedValue({
      id: "model-1",
      status: "ready",
      datasetHash: expectedHash,
      needsRetrain: false,
    });
    
    const result = await checkNeedsInvalidation(1);
    
    expect(result.needsInvalidation).toBe(false);
    expect(result.currentHash).toBe(expectedHash);
  });
});

describe("handleDatasetChange coalescing", () => {
  beforeEach(() => {
    mockFindMany.mockClear();
    mockFindUnique.mockClear();
    mockUpdate.mockClear();
    mockDelete.mockClear();
    mockUpdateMany.mockClear();
    mockDeleteModel.mockClear();
  });

  test("returns 'none' when no model exists", async () => {
    mockFindMany.mockResolvedValue([{ s3KeyOriginal: "key1" }]);
    mockFindUnique.mockResolvedValue(null);
    
    const result = await handleDatasetChange(1);
    
    expect(result.action).toBe("none");
  });

  test("sets needsRetrain when model is training", async () => {
    const oldHash = "oldhash";
    mockFindMany.mockResolvedValue([{ s3KeyOriginal: "newkey" }]);
    mockFindUnique.mockResolvedValue({
      id: "model-1",
      status: "training",
      datasetHash: oldHash,
      needsRetrain: false,
      replicateModelOwner: "owner",
      replicateModelName: "name",
    });
    
    const result = await handleDatasetChange(1);
    
    expect(result.action).toBe("coalesced");
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: "model-1" },
      data: { needsRetrain: true },
    });
  });

  test("invalidates model when ready and hash changed", async () => {
    const oldHash = "oldhash";
    mockFindMany.mockResolvedValue([{ s3KeyOriginal: "newkey" }]);
    mockFindUnique.mockResolvedValue({
      id: "model-1",
      status: "ready",
      datasetHash: oldHash,
      needsRetrain: false,
      replicateModelOwner: "owner",
      replicateModelName: "name",
    });
    
    const result = await handleDatasetChange(1);
    
    expect(result.action).toBe("invalidated");
    expect(mockDeleteModel).toHaveBeenCalled();
    expect(mockDelete).toHaveBeenCalled();
  });
});

describe("handleTrainingComplete", () => {
  beforeEach(() => {
    mockFindMany.mockClear();
    mockFindUnique.mockClear();
    mockUpdate.mockClear();
  });

  test("marks model as ready when needsRetrain is false", async () => {
    mockFindUnique.mockResolvedValue({
      id: "model-1",
      userId: 1,
      status: "training",
      needsRetrain: false,
      datasetHash: "hash",
    });
    
    const result = await handleTrainingComplete("model-1", {
      version: "v1",
      weightsUrl: "http://weights.url",
    });
    
    expect(result.action).toBe("completed");
    expect(result.needsRetrain).toBe(false);
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "model-1" },
        data: expect.objectContaining({
          status: "ready",
          needsRetrain: false,
        }),
      })
    );
  });

  test("marks for retraining when needsRetrain is true and hash differs", async () => {
    const storedHash = "oldhash";
    mockFindUnique.mockResolvedValue({
      id: "model-1",
      userId: 1,
      status: "training",
      needsRetrain: true,
      datasetHash: storedHash,
    });
    mockFindMany.mockResolvedValue([{ s3KeyOriginal: "newkey" }]);
    
    const result = await handleTrainingComplete("model-1", {
      version: "v1",
      weightsUrl: "http://weights.url",
    });
    
    expect(result.action).toBe("retraining");
    expect(result.needsRetrain).toBe(true);
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "model-1" },
        data: expect.objectContaining({
          status: "pending",
          needsRetrain: false,
        }),
      })
    );
  });
});

describe("canTrain", () => {
  beforeEach(() => {
    mockCount.mockClear();
  });

  test("returns false when not enough photos", async () => {
    mockCount.mockResolvedValue(3);
    
    const result = await canTrain(1);
    
    expect(result.canTrain).toBe(false);
    expect(result.photoCount).toBe(3);
    expect(result.minRequired).toBe(MIN_TRAINING_PHOTOS);
  });

  test("returns true when enough photos", async () => {
    mockCount.mockResolvedValue(10);
    
    const result = await canTrain(1);
    
    expect(result.canTrain).toBe(true);
    expect(result.photoCount).toBe(10);
  });

  test("returns true at exactly minimum photos", async () => {
    mockCount.mockResolvedValue(MIN_TRAINING_PHOTOS);
    
    const result = await canTrain(1);
    
    expect(result.canTrain).toBe(true);
    expect(result.photoCount).toBe(MIN_TRAINING_PHOTOS);
  });
});
