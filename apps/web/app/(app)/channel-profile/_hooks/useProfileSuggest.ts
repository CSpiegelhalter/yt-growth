"use client";

import { useCallback, useState } from "react";

import type { ChannelProfileInput } from "@/lib/features/channels/schemas";

type LoadingState = Record<string, boolean>;

export function useProfileSuggest(channelId: string | null) {
  const [loading, setLoading] = useState<LoadingState>({});

  const suggestField = useCallback(
    async (
      field: string,
      section: string,
      currentInput: Partial<ChannelProfileInput>,
    ): Promise<string | null> => {
      if (!channelId) { return null; }

      setLoading((prev) => ({ ...prev, [field]: true }));
      try {
        const res = await fetch(
          `/api/me/channels/${channelId}/profile/suggest`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ field, section, currentInput }),
          },
        );

        if (!res.ok) { return null; }

        const data = (await res.json()) as { value?: string };
        return data.value ?? null;
      } catch {
        return null;
      } finally {
        setLoading((prev) => ({ ...prev, [field]: false }));
      }
    },
    [channelId],
  );

  const isFieldLoading = useCallback(
    (field: string): boolean => !!loading[field],
    [loading],
  );

  return { suggestField, isFieldLoading };
}
