"use client";

import { useState } from "react";
import s from "../style.module.css";

type CopyButtonProps = {
  text: string;
  label?: string;
};

/**
 * CopyButton - Small inline copy button for text snippets
 */
export function CopyButton({ text, label = "Copy" }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  return (
    <button onClick={handleCopy} className={s.copyBtn} type="button">
      {copied ? "✓" : label}
    </button>
  );
}

