import type { Idea } from "@/types/api";

import type {
  GeneratedDetailsPayload,
  IdeaJsonData,
  SavedIdea,
  Status,
} from "../saved-ideas-types";
import {
  buildEnrichedIdeaJson,
  hasExistingGeneratedDetails,
  isEmptyDetailsPayload,
  STATUS_LABELS,
} from "../saved-ideas-types";

type ActionDeps = {
  ideaList: SavedIdea[];
  refetchIdeas: () => Promise<unknown>;
  showToast: (msg: string) => void;
  setSelectedIdea: (fn: (prev: SavedIdea | null) => SavedIdea | null) => void;
  setEditingNotes: (id: string | null) => void;
};

export function createPersistGeneratedDetails(deps: ActionDeps) {
  return async (ideaId: string, payload: GeneratedDetailsPayload) => {
    if (isEmptyDetailsPayload(payload)) { return; }

    const current = deps.ideaList.find((i) => i.ideaId === ideaId);
    if (!current) { return; }

    const existing = (current.ideaJson ?? {}) as IdeaJsonData;
    if (hasExistingGeneratedDetails(existing)) { return; }

    const enriched = buildEnrichedIdeaJson(existing, payload);

    try {
      const res = await fetch(`/api/me/saved-ideas/${ideaId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ideaJson: enriched }),
      });
      if (!res.ok) { return; }

      deps.setSelectedIdea((prev) =>
        prev?.ideaId === ideaId ? { ...prev, ideaJson: enriched as unknown as Idea } : prev,
      );
      void deps.refetchIdeas();
    } catch {
      // Non-critical: modal still works even if persistence fails.
    }
  };
}

export function createUpdateStatus(deps: ActionDeps) {
  return async (ideaId: string, status: Status) => {
    try {
      const res = await fetch(`/api/me/saved-ideas/${ideaId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) { throw new Error("Failed to update"); }

      void deps.refetchIdeas();
      deps.showToast(`Status updated to "${STATUS_LABELS[status]}"`);
    } catch {
      deps.showToast("Failed to update status");
    }
  };
}

export function createUpdateNotes(deps: ActionDeps) {
  return async (ideaId: string, notes: string) => {
    try {
      const res = await fetch(`/api/me/saved-ideas/${ideaId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes }),
      });
      if (!res.ok) { throw new Error("Failed to update"); }

      void deps.refetchIdeas();
      deps.setEditingNotes(null);
      deps.showToast("Notes saved");
    } catch {
      deps.showToast("Failed to save notes");
    }
  };
}

export function createDeleteIdea(deps: ActionDeps) {
  return async (ideaId: string) => {
    if (!confirm("Remove this idea from your saved list?")) { return; }

    try {
      const res = await fetch(`/api/me/saved-ideas/${ideaId}`, {
        method: "DELETE",
      });
      if (!res.ok) { throw new Error("Failed to delete"); }

      void deps.refetchIdeas();
      deps.showToast("Idea removed");
    } catch {
      deps.showToast("Failed to remove idea");
    }
  };
}
