"use client";

import { useEffect, useRef } from "react";

import s from "../style.module.css";

type NotesEditorProps = {
  notesValue: string;
  onNotesChange: (v: string) => void;
  onSave: () => void;
  onCancel: () => void;
};

export function NotesEditor({ notesValue, onNotesChange, onSave, onCancel }: NotesEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  return (
    <div>
      <textarea
        ref={textareaRef}
        className={s.notesInput}
        value={notesValue}
        onChange={(e) => onNotesChange(e.target.value)}
        placeholder="Add your notes about this idea..."
      />
      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
        <button className={s.actionBtnPrimary} onClick={onSave}>
          Save
        </button>
        <button className={s.actionBtn} onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  );
}
