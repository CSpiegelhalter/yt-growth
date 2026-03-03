"use client";

/**
 * DescriptionInput
 *
 * Step 2 of the thumbnail workflow: describe what the thumbnail
 * should depict. Includes example prompt chips.
 */

import s from "../style.module.css";

type DescriptionInputProps = {
  prompt: string;
  onPromptChange: (value: string) => void;
  examples: string[];
  disabled: boolean;
};

export function DescriptionInput({
  prompt,
  onPromptChange,
  examples,
  disabled,
}: DescriptionInputProps) {
  return (
    <div className={`${s.formGroup} ${s.fullWidth}`}>
      <label className={s.label} htmlFor="prompt">
        2) Describe what you want
      </label>
      <textarea
        id="prompt"
        className={s.textarea}
        placeholder={
          examples.length > 0
            ? `Example: ${examples[0]}`
            : "Describe the thumbnail..."
        }
        value={prompt}
        onChange={(e) => onPromptChange(e.target.value)}
        maxLength={500}
        rows={3}
        disabled={disabled}
      />
      {examples.length > 0 && (
        <div className={s.examples}>
          {examples.slice(0, 3).map((ex) => (
            <button
              key={ex}
              type="button"
              className={s.exampleChip}
              onClick={() => onPromptChange(ex)}
              disabled={disabled}
            >
              {ex}
            </button>
          ))}
        </div>
      )}
      <span className={s.inputHint}>
        Tip: mention the subject, the prop, and the vibe. We&apos;ll keep the
        image text-free.
      </span>
    </div>
  );
}
