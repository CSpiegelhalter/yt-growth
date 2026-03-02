"use client";

import { useCallback, useEffect, useReducer, useRef } from "react";

import type { ReportSectionKey, ReportStreamEvent } from "@/lib/features/full-report";

import { createInitialReport, type PartialFullReport, type StreamPhase } from "./full-report-types";
import { readNdjsonStream } from "./read-ndjson";

// ── Reducer ────────────────────────────────────────────

type State = {
  report: PartialFullReport;
  phase: StreamPhase;
};

type Action =
  | { type: "reset" }
  | { type: "phase"; phase: StreamPhase }
  | { type: "section"; key: ReportSectionKey; data: unknown }
  | { type: "sectionError"; key: ReportSectionKey; error: string }
  | { type: "fatalError" };

const SECTION_KEYS: ReportSectionKey[] = [
  "videoAudit", "discoverability", "promotionPlaybook", "retention", "hookAnalysis",
];

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "reset": {
      return { report: createInitialReport(), phase: "idle" };
    }

    case "phase": {
      return { ...state, phase: action.phase };
    }

    case "section": {
      return {
        ...state,
        report: {
          ...state.report,
          [action.key]: { status: "done" as const, data: action.data, error: null },
        },
      };
    }

    case "sectionError": {
      return {
        ...state,
        report: {
          ...state.report,
          [action.key]: { status: "error" as const, data: null, error: action.error },
        },
      };
    }

    case "fatalError": {
      return { ...state, phase: "error" };
    }

    default: {
      return state;
    }
  }
}

// ── Hook ───────────────────────────────────────────────

export type UseFullReportReturn = {
  report: PartialFullReport;
  phase: StreamPhase;
  hasAnySection: boolean;
  isComplete: boolean;
  generate: () => void;
  retry: () => void;
};

export function useFullReport(
  channelId: string,
  videoId: string | undefined,
): UseFullReportReturn {
  const [state, dispatch] = useReducer(reducer, {
    report: createInitialReport(),
    phase: "idle" as StreamPhase,
  });

  const abortRef = useRef<AbortController | null>(null);
  const runningRef = useRef(false);

  // Abort on unmount
  useEffect(() => {
    return () => { abortRef.current?.abort(); };
  }, []);

  const generate = useCallback(async () => {
    if (!videoId || runningRef.current) { return; }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    runningRef.current = true;

    dispatch({ type: "reset" });
    dispatch({ type: "phase", phase: "gathering" });

    try {
      const res = await fetch(
        `/api/me/channels/${channelId}/videos/${videoId}/full-report`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ range: "28d" }),
          signal: controller.signal,
        },
      );

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        const msg = (errData as Record<string, unknown>)?.error;
        throw new Error(typeof msg === "string" ? msg : `Request failed (${res.status})`);
      }

      if (!res.body) {
        throw new Error("No response body");
      }

      await readNdjsonStream(res.body, (event: ReportStreamEvent) => {
        if (controller.signal.aborted) { return; }

        switch (event.type) {
          case "status": {
            dispatch({ type: "phase", phase: event.phase });
            break;
          }
          case "section": {
            dispatch({ type: "section", key: event.key, data: event.data });
            break;
          }
          case "error": {
            dispatch({ type: "sectionError", key: event.key, error: event.error });
            break;
          }
          case "done": {
            dispatch({ type: "phase", phase: "done" });
            break;
          }
        }
      });

      // If stream ended without a done event, mark as done
      if (!controller.signal.aborted) {
        dispatch({ type: "phase", phase: "done" });
      }
    } catch (error) {
      if (controller.signal.aborted) { return; }
      console.error("[FullReport] Stream error:", error);
      dispatch({ type: "fatalError" });
    } finally {
      runningRef.current = false;
    }
  }, [channelId, videoId]);

  const retry = useCallback(() => {
    dispatch({ type: "reset" });
    void generate();
  }, [generate]);

  const hasAnySection = SECTION_KEYS.some((k) => state.report[k].status === "done");
  const isComplete = SECTION_KEYS.every((k) =>
    state.report[k].status === "done" || state.report[k].status === "error",
  );

  return {
    report: state.report,
    phase: state.phase,
    hasAnySection,
    isComplete,
    generate: () => void generate(),
    retry,
  };
}
