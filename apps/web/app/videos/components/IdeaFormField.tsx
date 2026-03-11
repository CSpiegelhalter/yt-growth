"use client";

import s from "./idea-editor-panel.module.css";

type IdeaFormFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
  maxLength?: number;
  onSuggest?: () => void;
  suggestLoading?: boolean;
  suggestError?: string | null;
  placeholder?: string;
};

export function IdeaFormField({
  label,
  value,
  onChange,
  multiline = false,
  maxLength,
  onSuggest,
  suggestLoading = false,
  suggestError,
  placeholder,
}: IdeaFormFieldProps) {
  return (
    <div className={s.formField}>
      <div className={s.fieldHeader}>
        <label className={s.fieldLabel}>{label}</label>
        {onSuggest && (
          <button
            type="button"
            className={s.suggestBtn}
            onClick={onSuggest}
            disabled={suggestLoading}
          >
            {suggestLoading ? "Suggesting..." : "Suggest"}
          </button>
        )}
      </div>

      {multiline ? (
        <textarea
          className={`${s.fieldInput} ${s.fieldTextarea}`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          maxLength={maxLength}
          placeholder={placeholder}
          disabled={suggestLoading}
        />
      ) : (
        <input
          type="text"
          className={s.fieldInput}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          maxLength={maxLength}
          placeholder={placeholder}
          disabled={suggestLoading}
        />
      )}

      {maxLength && (
        <span className={s.charCount}>{value.length}/{maxLength}</span>
      )}

      {suggestError && (
        <span className={s.fieldError}>{suggestError}</span>
      )}
    </div>
  );
}
