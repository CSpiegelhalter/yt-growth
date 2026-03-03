"use client";

import s from "../style.module.css";
import type {
  ContentCategory,
  DiscoveryFilters,
  DiscoverySort,
} from "../types";
import { CATEGORY_OPTIONS, SORT_OPTIONS } from "../types";
import { AdvancedFilterControls } from "./AdvancedFilterControls";

type Props = {
  draftFilters: DiscoveryFilters;
  setDraftFilters: React.Dispatch<React.SetStateAction<DiscoveryFilters>>;
  draftQueryText: string;
  setDraftQueryText: (text: string) => void;
};

export function DiscoveryFilterDrawerContent({
  draftFilters,
  setDraftFilters,
  draftQueryText,
  setDraftQueryText,
}: Props) {
  return (
    <div className={s.filterDrawerFilters}>
      {/* Draft query */}
      <div className={s.searchInputGroup}>
        <label className={s.searchLabel} htmlFor="discovery-query-draft">
          Search (optional)
        </label>
        <input
          id="discovery-query-draft"
          type="text"
          className={s.searchInput}
          value={draftQueryText}
          onChange={(e) => setDraftQueryText(e.target.value)}
          placeholder="Search around a niche"
          autoComplete="off"
        />
      </div>

      {/* Sort By */}
      <div className={s.filterGroup}>
        <label className={s.filterLabel} htmlFor="discovery-sort-draft">
          Sort By
        </label>
        <select
          id="discovery-sort-draft"
          className={s.select}
          value={draftFilters.sortBy}
          onChange={(e) =>
            setDraftFilters((p) => ({
              ...p,
              sortBy: e.target.value as DiscoverySort,
            }))
          }
        >
          {(Object.keys(SORT_OPTIONS) as DiscoverySort[]).map((key) => (
            <option key={key} value={key}>
              {SORT_OPTIONS[key].label}
            </option>
          ))}
        </select>
      </div>

      {/* Category */}
      <div className={s.filterGroup}>
        <label className={s.filterLabel} htmlFor="discovery-category-draft">
          Category
        </label>
        <select
          id="discovery-category-draft"
          className={s.select}
          value={draftFilters.category}
          onChange={(e) =>
            setDraftFilters((p) => ({
              ...p,
              category: e.target.value as ContentCategory,
            }))
          }
        >
          {(Object.keys(CATEGORY_OPTIONS) as ContentCategory[]).map((key) => (
            <option key={key} value={key}>
              {CATEGORY_OPTIONS[key].label}
            </option>
          ))}
        </select>
      </div>

      {/* Content Type */}
      <div className={s.filterGroup}>
        <label className={s.filterLabel} htmlFor="discovery-content-draft">
          Content Type
        </label>
        <select
          id="discovery-content-draft"
          className={s.select}
          value={draftFilters.contentType}
          onChange={(e) =>
            setDraftFilters((p) => ({
              ...p,
              contentType: e.target.value as "both" | "shorts" | "long",
            }))
          }
        >
          <option value="both">All Videos</option>
          <option value="shorts">Shorts Only</option>
          <option value="long">Long-form Only</option>
        </select>
      </div>

      {/* Time Window */}
      <div className={s.filterGroup}>
        <label className={s.filterLabel} htmlFor="discovery-time-draft">
          Posted Within
        </label>
        <select
          id="discovery-time-draft"
          className={s.select}
          value={draftFilters.timeWindow}
          onChange={(e) =>
            setDraftFilters((p) => ({
              ...p,
              timeWindow: e.target.value as "24h" | "7d" | "30d" | "90d",
            }))
          }
        >
          <option value="24h">Last 24 hours</option>
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
        </select>
      </div>

      <div className={s.discoveryDrawerDivider} />

      <AdvancedFilterControls
        draftFilters={draftFilters}
        setDraftFilters={setDraftFilters}
      />
    </div>
  );
}
