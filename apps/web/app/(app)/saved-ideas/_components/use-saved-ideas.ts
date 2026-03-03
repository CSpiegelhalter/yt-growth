"use client";

import { useState } from "react";

import { copyToClipboard } from "@/components/ui/Toast";
import { useAsync } from "@/lib/hooks/use-async";

import type { SavedIdea, Status } from "../saved-ideas-types";
import {
  createDeleteIdea,
  createPersistGeneratedDetails,
  createUpdateNotes,
  createUpdateStatus,
} from "./saved-ideas-actions";

export function useSavedIdeas() {
  const [filter, setFilter] = useState<Status | "all">("all");
  const [toast, setToast] = useState<string | null>(null);
  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const [notesValue, setNotesValue] = useState("");
  const [selectedIdea, setSelectedIdea] = useState<SavedIdea | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  const {
    data: ideas,
    loading,
    execute: refetchIdeas,
  } = useAsync<SavedIdea[]>(
    async () => {
      const res = await fetch("/api/me/saved-ideas");
      if (!res.ok) { throw new Error("Failed to fetch"); }
      const data = await res.json();
      return data.savedIdeas || [];
    },
    { immediate: true, onError: () => showToast("Failed to load saved ideas") },
  );

  const ideaList = ideas ?? [];

  const deps = {
    ideaList,
    refetchIdeas: refetchIdeas as () => Promise<unknown>,
    showToast,
    setSelectedIdea,
    setEditingNotes,
  };

  const handleCopy = async (text: string, id: string) => {
    const success = await copyToClipboard(text);
    if (success) {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1500);
    }
  };

  const filteredIdeas =
    filter === "all" ? ideaList : ideaList.filter((idea) => idea.status === filter);

  const counts: Record<string, number> = { all: ideaList.length };
  for (const idea of ideaList) {
    counts[idea.status] = (counts[idea.status] || 0) + 1;
  }

  return {
    loading,
    filter,
    setFilter,
    toast,
    editingNotes,
    setEditingNotes,
    notesValue,
    setNotesValue,
    selectedIdea,
    setSelectedIdea,
    copiedId,
    handleCopy,
    persistGeneratedDetails: createPersistGeneratedDetails(deps),
    updateStatus: createUpdateStatus(deps),
    updateNotes: createUpdateNotes(deps),
    deleteIdea: createDeleteIdea(deps),
    filteredIdeas,
    counts,
  };
}
