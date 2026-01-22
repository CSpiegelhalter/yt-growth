import { describe, it, expect } from "vitest";
import {
  clearAllDiscoveryState,
  getActiveDiscoveryFilterCount,
  toggleQuickChip,
} from "@/app/(app)/competitors/discovery-utils";
import { DEFAULT_DISCOVERY_FILTERS } from "@/app/(app)/competitors/types";

describe("discovery-utils", () => {
  describe("getActiveDiscoveryFilterCount", () => {
    it("returns 0 for defaults with empty query", () => {
      expect(
        getActiveDiscoveryFilterCount(DEFAULT_DISCOVERY_FILTERS, DEFAULT_DISCOVERY_FILTERS, "")
      ).toBe(0);
    });

    it("counts queryText as an active filter", () => {
      expect(
        getActiveDiscoveryFilterCount(DEFAULT_DISCOVERY_FILTERS, DEFAULT_DISCOVERY_FILTERS, "espresso")
      ).toBe(1);
    });

    it("counts multiple changed filters", () => {
      const modified = {
        ...DEFAULT_DISCOVERY_FILTERS,
        timeWindow: "7d" as const,
        minViewsPerDay: 500,
      };
      expect(getActiveDiscoveryFilterCount(modified, DEFAULT_DISCOVERY_FILTERS, "")).toBe(2);
    });
  });

  describe("clearAllDiscoveryState", () => {
    it("resets filters to defaults and clears queryText", () => {
      const cleared = clearAllDiscoveryState(DEFAULT_DISCOVERY_FILTERS);
      expect(cleared.filters).toEqual(DEFAULT_DISCOVERY_FILTERS);
      expect(cleared.queryText).toBe("");
    });
  });

  describe("toggleQuickChip", () => {
    it("toggles breakout sort on/off", () => {
      const on = toggleQuickChip(DEFAULT_DISCOVERY_FILTERS, DEFAULT_DISCOVERY_FILTERS, "breakout");
      expect(on.sortBy).toBe("breakout");
      const off = toggleQuickChip(on, DEFAULT_DISCOVERY_FILTERS, "breakout");
      expect(off.sortBy).toBe(DEFAULT_DISCOVERY_FILTERS.sortBy);
    });

    it("toggles shorts content type on/off", () => {
      const on = toggleQuickChip(DEFAULT_DISCOVERY_FILTERS, DEFAULT_DISCOVERY_FILTERS, "shorts");
      expect(on.contentType).toBe("shorts");
      const off = toggleQuickChip(on, DEFAULT_DISCOVERY_FILTERS, "shorts");
      expect(off.contentType).toBe(DEFAULT_DISCOVERY_FILTERS.contentType);
    });

    it("toggles smallChannels on/off", () => {
      const on = toggleQuickChip(DEFAULT_DISCOVERY_FILTERS, DEFAULT_DISCOVERY_FILTERS, "smallChannels");
      expect(on.channelSize).toBe("small");
      const off = toggleQuickChip(on, DEFAULT_DISCOVERY_FILTERS, "smallChannels");
      expect(off.channelSize).toBe(DEFAULT_DISCOVERY_FILTERS.channelSize);
    });

    it("toggles newChannels on/off", () => {
      const on = toggleQuickChip(DEFAULT_DISCOVERY_FILTERS, DEFAULT_DISCOVERY_FILTERS, "newChannels");
      expect(on.channelAge).toBe("new");
      const off = toggleQuickChip(on, DEFAULT_DISCOVERY_FILTERS, "newChannels");
      expect(off.channelAge).toBe(DEFAULT_DISCOVERY_FILTERS.channelAge);
    });
  });
});

