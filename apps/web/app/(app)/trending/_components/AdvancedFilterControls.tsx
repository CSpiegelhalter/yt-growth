"use client";

import s from "../style.module.css";
import type { ChannelAge, ChannelSize, DiscoveryFilters } from "../types";
import { CHANNEL_AGE_LABELS, CHANNEL_SIZE_LABELS } from "../types";

type Props = {
  draftFilters: DiscoveryFilters;
  setDraftFilters: React.Dispatch<React.SetStateAction<DiscoveryFilters>>;
};

export function AdvancedFilterControls({
  draftFilters,
  setDraftFilters,
}: Props) {
  return (
    <>
      {/* Channel Size */}
      <div className={s.filterGroup}>
        <label className={s.filterLabel} htmlFor="discovery-size">
          Channel Size
        </label>
        <select
          id="discovery-size"
          className={s.select}
          value={draftFilters.channelSize}
          onChange={(e) =>
            setDraftFilters((prev) => ({
              ...prev,
              channelSize: e.target.value as ChannelSize,
            }))
          }
        >
          {(Object.keys(CHANNEL_SIZE_LABELS) as ChannelSize[]).map((key) => (
            <option key={key} value={key}>
              {CHANNEL_SIZE_LABELS[key].label} (
              {CHANNEL_SIZE_LABELS[key].range})
            </option>
          ))}
        </select>
      </div>

      {/* Channel Age */}
      <div className={s.filterGroup}>
        <label className={s.filterLabel} htmlFor="discovery-age">
          Channel Age
        </label>
        <select
          id="discovery-age"
          className={s.select}
          value={draftFilters.channelAge}
          onChange={(e) =>
            setDraftFilters((prev) => ({
              ...prev,
              channelAge: e.target.value as ChannelAge,
            }))
          }
        >
          {(Object.keys(CHANNEL_AGE_LABELS) as ChannelAge[]).map((key) => (
            <option key={key} value={key}>
              {CHANNEL_AGE_LABELS[key].label}
            </option>
          ))}
        </select>
      </div>

      {/* Min Views/Day */}
      <div className={s.filterGroup}>
        <label className={s.filterLabel} htmlFor="discovery-minvpd">
          Min Views/Day
        </label>
        <select
          id="discovery-minvpd"
          className={s.select}
          value={draftFilters.minViewsPerDay}
          onChange={(e) =>
            setDraftFilters((prev) => ({
              ...prev,
              minViewsPerDay: Number.parseInt(e.target.value, 10),
            }))
          }
        >
          <option value="0">No minimum</option>
          <option value="50">50+ views/day</option>
          <option value="100">100+ views/day</option>
          <option value="500">500+ views/day</option>
          <option value="1000">1K+ views/day</option>
          <option value="5000">5K+ views/day</option>
        </select>
      </div>
    </>
  );
}
