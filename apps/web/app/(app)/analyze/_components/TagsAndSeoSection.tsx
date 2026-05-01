"use client";

import { useCallback, useState } from "react";

import { TagSelector } from "@/app/videos/components/full-report/components/discoverability/TagSelector";
import { apiFetchJson, isApiClientError } from "@/lib/client/api";

import s from "../style.module.css";
import { AnalysisSection } from "./AnalysisSection";
import type { KeywordVolumeResponse, KeywordVolumeRow } from "./keyword-volume.types";

const MAX_KEYWORDS = 10;

type Props = {
  tags: string[];
  enableVolumeLookup?: boolean;
};

type LookupState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; rows: KeywordVolumeRow[]; fetchedAt: string }
  | { status: "error"; message: string };

function formatNumber(n: number): string {
  return new Intl.NumberFormat("en-US").format(Math.round(n));
}

function formatCpc(n: number): string {
  if (!n || n <= 0) {return "—";}
  return `$${n.toFixed(2)}`;
}

function competitionLabel(level: string | null, value: number): string {
  if (level) {return level.charAt(0) + level.slice(1).toLowerCase();}
  if (value < 0.34) {return "Low";}
  if (value < 0.67) {return "Medium";}
  return "High";
}

function competitionLevelKey(level: string | null, value: number): "low" | "medium" | "high" {
  const label = competitionLabel(level, value).toLowerCase();
  if (label.startsWith("low")) {return "low";}
  if (label.startsWith("medium")) {return "medium";}
  return "high";
}

function VolumeTable({ rows }: { rows: KeywordVolumeRow[] }) {
  return (
    <div className={s.volumeTableWrap}>
      <table className={s.volumeTable}>
        <thead>
          <tr>
            <th scope="col">Keyword</th>
            <th scope="col" className={s.volumeNumCol}>Volume</th>
            <th scope="col">Competition</th>
            <th scope="col" className={s.volumeNumCol}>CPC</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.keyword}>
              <td>{row.keyword}</td>
              <td className={s.volumeNumCol}>{formatNumber(row.searchVolume)}</td>
              <td>
                <span
                  className={s.compBadge}
                  data-comp={competitionLevelKey(row.competitionLevel, row.competition)}
                >
                  {competitionLabel(row.competitionLevel, row.competition)}
                </span>
              </td>
              <td className={s.volumeNumCol}>{formatCpc(row.cpc)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function VolumePanel({ tags }: { tags: string[] }) {
  const [state, setState] = useState<LookupState>({ status: "idle" });

  const lookupKeywords = tags.slice(0, MAX_KEYWORDS);

  const onClick = useCallback(async () => {
    setState({ status: "loading" });
    try {
      const data = await apiFetchJson<KeywordVolumeResponse>(
        "/api/analyze/keyword-volume",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ keywords: lookupKeywords }),
        },
      );
      if (data.rows.length === 0) {
        setState({
          status: "error",
          message: "No keyword data returned. Try analyzing a different video.",
        });
        return;
      }
      setState({ status: "success", rows: data.rows, fetchedAt: data.meta.fetchedAt });
    } catch (error) {
      const message = isApiClientError(error)
        ? errorMessage(error)
        : "Lookup failed. Please try again.";
      setState({ status: "error", message });
    }
  }, [lookupKeywords]);

  if (state.status === "success") {
    return (
      <div className={s.volumeResults}>
        <p className={s.volumeNote}>
          Top {state.rows.length} of your tags ranked by monthly search volume.
        </p>
        <VolumeTable rows={state.rows} />
      </div>
    );
  }

  return (
    <div className={s.volumeCta}>
      <div className={s.volumeCtaText}>
        <p className={s.volumeCtaTitle}>SEO insight</p>
        <p className={s.volumeCtaDesc}>
          Look up monthly search volume and competition for the top {lookupKeywords.length}{" "}
          {lookupKeywords.length === 1 ? "tag" : "tags"} on this video.
          One credit per lookup.
        </p>
      </div>
      <button
        type="button"
        className={s.volumeCtaBtn}
        onClick={onClick}
        disabled={state.status === "loading"}
      >
        {state.status === "loading" ? "Looking up…" : "Pull search volume"}
      </button>
      {state.status === "error" && (
        <p className={s.volumeError} role="alert">{state.message}</p>
      )}
    </div>
  );
}

function errorMessage(error: { code?: string; message?: string }): string {
  const code = error.code ?? "";
  if (code === "QUOTA_EXCEEDED" || code === "ENTITLEMENT_DENIED") {
    return "You've used all your keyword research credits for today. Upgrade for more.";
  }
  if (code === "RATE_LIMITED") {
    return "Too many requests. Please try again in a few minutes.";
  }
  return error.message || "Lookup failed. Please try again.";
}

export function TagsAndSeoSection({ tags, enableVolumeLookup = false }: Props) {
  if (tags.length === 0) {return null;}
  return (
    <AnalysisSection title="Tags & SEO">
      <TagSelector tags={tags} />
      {enableVolumeLookup && <VolumePanel tags={tags} />}
    </AnalysisSection>
  );
}
