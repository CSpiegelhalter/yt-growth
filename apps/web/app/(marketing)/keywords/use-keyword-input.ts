"use client";

import { useRef, useState } from "react";

import type { useToast } from "@/components/ui/Toast";

import { MAX_KEYWORDS } from "./constants";

export function useKeywordInput(toast: ReturnType<typeof useToast>["toast"]) {
  const [keywords, setKeywords] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [database, setDatabase] = useState("us");
  const inputRef = useRef<HTMLInputElement>(null);

  const [searchedKeywords, setSearchedKeywords] = useState<string[]>([]);
  const [searchHistory, setSearchHistory] = useState<string[][]>([]);
  const currentSearch = searchHistory.at(-1) || [];
  const canGoBack = searchHistory.length > 1;

  function addKeyword(kw: string) {
    const keyword = kw.trim().toLowerCase();
    if (!keyword) {return;}
    if (keywords.includes(keyword)) { toast("Keyword already added", "info"); return; }
    if (keywords.length >= MAX_KEYWORDS) { toast(`Maximum ${MAX_KEYWORDS} keywords allowed`, "info"); return; }
    setKeywords((prev) => [...prev, keyword]);
    setInputValue("");
  }

  function removeKeyword(kw: string) {
    setKeywords((prev) => prev.filter((k) => k !== kw));
  }

  function collectAndClearKeywords(): string[] {
    const allKeywords = inputValue.trim()
      ? [...keywords, inputValue.trim().toLowerCase()]
      : keywords;
    setKeywords([]);
    setInputValue("");
    return allKeywords;
  }

  function pushHistory(kws: string[]) {
    setSearchHistory((prev) => [...prev, kws].slice(-5));
  }

  function truncateHistory(index: number) {
    setSearchHistory((prev) => prev.slice(0, index + 1));
  }

  function clearHistory() {
    setSearchHistory([]);
    setInputValue("");
  }

  return {
    keywords, inputValue, setInputValue, database, setDatabase, inputRef,
    searchedKeywords, setSearchedKeywords, searchHistory, currentSearch, canGoBack,
    addKeyword, removeKeyword, collectAndClearKeywords,
    pushHistory, truncateHistory, clearHistory,
  };
}

export function handleKeyDown(
  e: React.KeyboardEvent<HTMLInputElement>,
  inputValue: string,
  keywords: string[],
  addKeyword: (kw: string) => void,
  removeKeyword: (kw: string) => void,
  onSearch: () => void,
) {
  if (e.key === "Enter") {
    e.preventDefault();
    if (inputValue.trim()) { addKeyword(inputValue); }
    else if (keywords.length > 0) { onSearch(); }
  } else if (e.key === "," || e.key === "Tab") {
    if (inputValue.trim()) { e.preventDefault(); addKeyword(inputValue); }
  } else if (e.key === "Backspace" && !inputValue && keywords.length > 0) {
    const lastKeyword = keywords.at(-1);
    if (lastKeyword) { removeKeyword(lastKeyword); }
  }
}
