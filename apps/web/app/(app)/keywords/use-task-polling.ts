"use client";

import { useRef, useState } from "react";

import { apiFetchJson } from "@/lib/client/api";
import { usePolling } from "@/lib/hooks/use-polling";

import {
  MAX_POLL_ATTEMPTS,
  POLL_INTERVAL_MS,
  TRENDS_MAX_POLL_ATTEMPTS,
  TRENDS_POLL_INTERVAL_MS,
} from "./constants";
import type { KeywordTaskResponse } from "./schemas";
import {
  GoogleTrendsResponseSchema,
  parseRelatedKeywordRows,
} from "./schemas";
import type { GoogleTrendsData, RelatedKeyword } from "./types";

export function useKeywordTaskPolling(
  onComplete: (rows: RelatedKeyword[]) => void,
) {
  const [taskId, setTaskId] = useState<string | null>(null);
  const attemptsRef = useRef(0);

  const { isPolling, pause } = usePolling<KeywordTaskResponse>({
    fetcher: () =>
      apiFetchJson<KeywordTaskResponse>(`/api/keywords/task/${taskId}`),
    interval: POLL_INTERVAL_MS,
    enabled: taskId !== null,
    shouldStop: (data) => {
      attemptsRef.current++;
      if (attemptsRef.current >= MAX_POLL_ATTEMPTS) {return true;}
      return !data.pending;
    },
    onData: (data) => {
      if (!data.pending) {
        onComplete(parseRelatedKeywordRows(data.rows));
        setTaskId(null);
        attemptsRef.current = 0;
      }
      if (attemptsRef.current >= MAX_POLL_ATTEMPTS) {
        setTaskId(null);
        attemptsRef.current = 0;
      }
    },
  });

  function start(id: string) {
    attemptsRef.current = 0;
    setTaskId(id);
  }

  function stop() {
    pause();
    setTaskId(null);
    attemptsRef.current = 0;
  }

  return { isPolling, start, stop };
}

export function useTrendsTaskPolling(
  onComplete: (data: GoogleTrendsData) => void,
) {
  const [taskId, setTaskId] = useState<string | null>(null);
  const attemptsRef = useRef(0);

  usePolling<KeywordTaskResponse>({
    fetcher: () =>
      apiFetchJson<KeywordTaskResponse>(`/api/keywords/task/${taskId}`),
    interval: TRENDS_POLL_INTERVAL_MS,
    enabled: taskId !== null,
    shouldStop: (data) => {
      attemptsRef.current++;
      if (attemptsRef.current >= TRENDS_MAX_POLL_ATTEMPTS) {return true;}
      return !data.pending;
    },
    onData: (data) => {
      if (!data.pending) {
        const parsed = GoogleTrendsResponseSchema.safeParse(data);
        if (parsed.success) {onComplete(parsed.data);}
        setTaskId(null);
        attemptsRef.current = 0;
      }
      if (attemptsRef.current >= TRENDS_MAX_POLL_ATTEMPTS) {
        setTaskId(null);
        attemptsRef.current = 0;
      }
    },
  });

  function start(id: string) {
    attemptsRef.current = 0;
    setTaskId(id);
  }

  return { start };
}
