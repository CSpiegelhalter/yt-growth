/**
 * useEditorHistory - Undo/Redo state management for the thumbnail editor
 * 
 * Uses a command-stack approach where:
 * - past[] holds previous states (for undo)
 * - present is the current state
 * - future[] holds undone states (for redo)
 */

import { useCallback, useRef, useState } from "react";
import type { EditorDocument, HistoryEntry, HistoryState } from "../types";
import { MAX_HISTORY_SIZE } from "../constants";

export interface UseEditorHistoryReturn {
  document: EditorDocument;
  setDocument: (doc: EditorDocument, description?: string) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  reset: (doc: EditorDocument) => void;
}

function createEntry(document: EditorDocument, description?: string): HistoryEntry {
  return {
    document: structuredClone(document),
    timestamp: Date.now(),
    description,
  };
}

export function useEditorHistory(initialDocument: EditorDocument): UseEditorHistoryReturn {
  const [state, setState] = useState<HistoryState>(() => ({
    past: [],
    present: createEntry(initialDocument),
    future: [],
    maxSize: MAX_HISTORY_SIZE,
  }));

  // Track last committed state to avoid duplicate entries
  const lastCommittedRef = useRef<string>(JSON.stringify(initialDocument));

  const setDocument = useCallback((doc: EditorDocument, description?: string) => {
    const serialized = JSON.stringify(doc);
    
    // Skip if no actual change
    if (serialized === lastCommittedRef.current) {
      return;
    }
    
    lastCommittedRef.current = serialized;

    setState((prev) => {
      const newPast = [...prev.past, prev.present];
      // Trim history if it exceeds max size
      while (newPast.length > prev.maxSize) {
        newPast.shift();
      }

      return {
        ...prev,
        past: newPast,
        present: createEntry(doc, description),
        future: [], // Clear redo stack on new change
      };
    });
  }, []);

  const undo = useCallback(() => {
    setState((prev) => {
      if (prev.past.length === 0) return prev;

      const newPast = [...prev.past];
      const previous = newPast.pop()!;
      
      lastCommittedRef.current = JSON.stringify(previous.document);

      return {
        ...prev,
        past: newPast,
        present: previous,
        future: [prev.present, ...prev.future],
      };
    });
  }, []);

  const redo = useCallback(() => {
    setState((prev) => {
      if (prev.future.length === 0) return prev;

      const newFuture = [...prev.future];
      const next = newFuture.shift()!;
      
      lastCommittedRef.current = JSON.stringify(next.document);

      return {
        ...prev,
        past: [...prev.past, prev.present],
        present: next,
        future: newFuture,
      };
    });
  }, []);

  const reset = useCallback((doc: EditorDocument) => {
    lastCommittedRef.current = JSON.stringify(doc);
    setState({
      past: [],
      present: createEntry(doc),
      future: [],
      maxSize: MAX_HISTORY_SIZE,
    });
  }, []);

  return {
    document: state.present.document,
    setDocument,
    undo,
    redo,
    canUndo: state.past.length > 0,
    canRedo: state.future.length > 0,
    reset,
  };
}

// ============================================================================
// REDUCER VERSION (for testing and more complex scenarios)
// ============================================================================

export type HistoryAction =
  | { type: "SET"; document: EditorDocument; description?: string }
  | { type: "UNDO" }
  | { type: "REDO" }
  | { type: "RESET"; document: EditorDocument };

export function historyReducer(state: HistoryState, action: HistoryAction): HistoryState {
  switch (action.type) {
    case "SET": {
      const newPast = [...state.past, state.present];
      while (newPast.length > state.maxSize) {
        newPast.shift();
      }
      return {
        ...state,
        past: newPast,
        present: createEntry(action.document, action.description),
        future: [],
      };
    }

    case "UNDO": {
      if (state.past.length === 0) return state;
      const newPast = [...state.past];
      const previous = newPast.pop()!;
      return {
        ...state,
        past: newPast,
        present: previous,
        future: [state.present, ...state.future],
      };
    }

    case "REDO": {
      if (state.future.length === 0) return state;
      const newFuture = [...state.future];
      const next = newFuture.shift()!;
      return {
        ...state,
        past: [...state.past, state.present],
        present: next,
        future: newFuture,
      };
    }

    case "RESET": {
      return {
        past: [],
        present: createEntry(action.document),
        future: [],
        maxSize: state.maxSize,
      };
    }

    default:
      return state;
  }
}
