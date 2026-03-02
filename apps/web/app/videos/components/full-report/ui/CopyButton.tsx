"use client";

import { useCallback, useState } from "react";

import { copyToClipboard } from "./copy-to-clipboard";
import s from "./ui.module.css";

type CopyButtonVariant = "default" | "icon";

type CopyButtonProps = {
  text: string;
  label?: string;
  variant?: CopyButtonVariant;
};

export function CopyButton({ text, label = "Copy", variant = "default" }: CopyButtonProps) {
  const [btnLabel, setBtnLabel] = useState(label);

  const handleCopy = useCallback(() => {
    void copyToClipboard(text, setBtnLabel, label);
  }, [text, label]);

  const className = variant === "icon" ? s.copyBtnIcon : s.copyBtn;

  return (
    <button type="button" className={className} onClick={handleCopy}>
      {btnLabel}
    </button>
  );
}
