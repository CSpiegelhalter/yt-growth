"use client";

import { useCallback, useEffect,useState } from "react";

import type { ChannelProfileInput } from "@/lib/features/channels/schemas";
import {
  CONTENT_FORMATS,
  DEFAULT_PROFILE_INPUT,
  PROFILE_CATEGORIES,
} from "@/lib/features/channels/types";
import { sanitizeUserText } from "@/lib/features/channels/utils";

import s from "./ProfileEditor.module.css";

type Props = {
  initialInput?: ChannelProfileInput | null;
  onSave: (input: ChannelProfileInput) => Promise<boolean>;
  onCancel?: () => void;
  onGenerate?: () => Promise<void>;
  saving?: boolean;
  generating?: boolean;
  hasAIProfile?: boolean;
  disabled?: boolean;
};

type ValidationErrors = {
  description?: string;
  categories?: string;
  customCategory?: string;
};

type FormMsg = { type: "success" | "error"; text: string };

/* ------------------------------------------------------------------ */
/*  Extracted helpers to reduce cyclomatic complexity                  */
/* ------------------------------------------------------------------ */

function validateProfileInput(
  input: ChannelProfileInput,
  hasOtherCategory: boolean,
): ValidationErrors {
  const errs: ValidationErrors = {};

  if (!input.description || input.description.trim().length < 10) {
    errs.description = "Description must be at least 10 characters";
  }

  if (!input.categories || input.categories.length === 0) {
    errs.categories = "Select at least one category";
  }

  if (hasOtherCategory && (!input.customCategory || input.customCategory.trim().length < 2)) {
    errs.customCategory = "Please specify your category";
  }

  return errs;
}

function computeChipToggle(
  prev: ChannelProfileInput,
  field: "categories" | "formats",
  value: string,
): ChannelProfileInput {
  const current = prev[field] || [];
  const isSelected = current.includes(value);

  if (field === "categories" && !isSelected && current.length >= 5) {
    return prev;
  }

  const updated = isSelected
    ? current.filter((v) => v !== value)
    : [...current, value];

  if (field === "categories" && value === "Other" && isSelected) {
    return { ...prev, [field]: updated, customCategory: undefined };
  }

  return { ...prev, [field]: updated };
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                    */
/* ------------------------------------------------------------------ */

function FormMessage({ message }: { message: FormMsg }) {
  const cls = message.type === "success" ? s.inlineSuccess : s.inlineError;
  return (
    <div className={`${s.inlineMessage} ${cls}`} role="status">
      {message.text}
    </div>
  );
}

function FieldError({ id, error }: { id?: string; error?: string }) {
  if (!error) {return null;}
  return <div id={id} className={s.errorMessage}>{error}</div>;
}

function errorClass(base: string, error: string | undefined, errCls: string): string {
  if (error) {return `${base} ${errCls}`;}
  return base;
}

function ariaDescBy(error: string | undefined, id: string): string | undefined {
  if (error) {return id;}
  return undefined;
}

function CustomCategoryField({
  value,
  error,
  isDisabled,
  onChange,
}: {
  value: string | undefined;
  error: string | undefined;
  isDisabled: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <div className={s.customCategoryWrapper}>
      <label htmlFor="customCategory" className={s.customCategoryLabel}>
        Specify your category:
      </label>
      <input
        id="customCategory"
        type="text"
        className={errorClass(s.input, error, s.inputError)}
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder="e.g., Sustainable Fashion, AI Art, etc."
        maxLength={100}
        disabled={isDisabled}
        aria-invalid={!!error}
        aria-describedby={ariaDescBy(error, "custom-cat-error")}
      />
      <FieldError id="custom-cat-error" error={error} />
    </div>
  );
}

function ChipGroup({
  options,
  selected,
  onToggle,
  disabled,
  ariaLabel,
}: {
  options: readonly string[];
  selected: string[];
  onToggle: (value: string) => void;
  disabled: boolean;
  ariaLabel: string;
}) {
  return (
    <div className={s.chipGroup} role="group" aria-label={ariaLabel}>
      {options.map((item) => (
        <button
          key={item}
          type="button"
          className={`${s.chip} ${selected.includes(item) ? s.chipSelected : ""}`}
          aria-pressed={selected.includes(item)}
          onClick={() => onToggle(item)}
          disabled={disabled}
        >
          {item}
        </button>
      ))}
    </div>
  );
}

function ActionBar({
  onCancel,
  onPrimary,
  onRegenerate,
  saving,
  generating,
  hasAIProfile,
  showRegenerate,
  isDisabled,
}: {
  onCancel?: () => void;
  onPrimary: () => void;
  onRegenerate?: () => void;
  saving: boolean;
  generating: boolean;
  hasAIProfile: boolean;
  showRegenerate: boolean;
  isDisabled: boolean;
}) {
  return (
    <div className={s.actions}>
      {onCancel && (
        <button
          type="button"
          className={s.btnSecondary}
          onClick={onCancel}
          disabled={isDisabled}
        >
          Cancel
        </button>
      )}

      {showRegenerate && onRegenerate && (
        <button
          type="button"
          className={s.btnSecondary}
          onClick={onRegenerate}
          disabled={isDisabled}
        >
          {generating ? (
            <>
              <span className={s.spinner} />
              Regenerating...
            </>
          ) : (
            "Regenerate AI Summary"
          )}
        </button>
      )}

      <button
        type="button"
        className={s.btnPrimary}
        onClick={onPrimary}
        disabled={isDisabled}
      >
        <PrimaryButtonLabel saving={saving} generating={generating} hasAIProfile={hasAIProfile} />
      </button>
    </div>
  );
}

function PrimaryButtonLabel({
  saving,
  generating,
  hasAIProfile,
}: {
  saving: boolean;
  generating: boolean;
  hasAIProfile: boolean;
}) {
  if (saving) {
    return <><span className={s.spinner} />Saving...</>;
  }
  if (generating) {
    return <><span className={s.spinner} />Generating...</>;
  }
  return <>{hasAIProfile ? "Save Changes" : "Save & Generate AI Summary"}</>;
}

/* ------------------------------------------------------------------ */
/*  Main component                                                    */
/* ------------------------------------------------------------------ */

export default function ProfileEditor({
  initialInput,
  onSave,
  onCancel,
  onGenerate,
  saving = false,
  generating = false,
  hasAIProfile = false,
  disabled = false,
}: Props) {
  const [input, setInput] = useState<ChannelProfileInput>(
    initialInput ?? DEFAULT_PROFILE_INPUT
  );
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [message, setMessage] = useState<FormMsg | null>(null);

  useEffect(() => {
    if (initialInput) {
      setInput(initialInput);
    }
  }, [initialInput]);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const hasOtherCategory = input.categories.includes("Other");

  const validate = useCallback((): boolean => {
    const newErrors = validateProfileInput(input, hasOtherCategory);
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [input, hasOtherCategory]);

  const handleSave = async () => {
    if (!validate()) {return;}

    const success = await onSave(input);
    if (success) {
      setMessage({ type: "success", text: "Profile saved successfully!" });
    } else {
      setMessage({ type: "error", text: "Failed to save profile" });
    }
  };

  const handleGenerate = async () => {
    if (!validate()) {
      setMessage({ type: "error", text: "Please fix the form errors first" });
      return;
    }

    const saved = await onSave(input);
    if (!saved) {
      setMessage({ type: "error", text: "Failed to save profile" });
      return;
    }

    if (onGenerate) {
      await onGenerate();
      setMessage({ type: "success", text: "AI summary generated!" });
    }
  };

  const toggleChip = (field: "categories" | "formats", value: string) => {
    setInput((prev) => computeChipToggle(prev, field, value));
    if (field === "categories") {
      setErrors((prev) => ({ ...prev, categories: undefined }));
    }
  };

  const handleCustomCategoryChange = (value: string) => {
    const sanitized = sanitizeUserText(value);
    setInput((prev) => ({ ...prev, customCategory: sanitized }));
    if (errors.customCategory) {
      setErrors((prev) => ({ ...prev, customCategory: undefined }));
    }
  };

  const isDisabled = disabled || saving || generating;
  const formatsArray = input.formats || [];

  return (
    <div className={s.editor}>
      {message && <FormMessage message={message} />}

      {/* Description */}
      <div className={s.section}>
        <div className={s.sectionHeader}>
          <h3 className={s.sectionTitle}>
            Channel Description<span className={s.required}>*</span>
          </h3>
        </div>
        <p className={s.helpText}>Describe your channel and the type of videos you make.</p>
        <textarea
          className={errorClass(s.textarea, errors.description, s.textareaError)}
          value={input.description}
          onChange={(e) => {
            setInput((prev) => ({ ...prev, description: e.target.value }));
            if (errors.description) {
              setErrors((prev) => ({ ...prev, description: undefined }));
            }
          }}
          placeholder="e.g., I create budget cooking videos for busy parents who want to feed their families healthy meals without spending hours in the kitchen..."
          maxLength={2000}
          disabled={isDisabled}
          aria-label="Channel description"
          aria-invalid={!!errors.description}
          aria-describedby={ariaDescBy(errors.description, "desc-error")}
        />
        <div className={s.charCount}>{input.description.length}/2000</div>
        <FieldError id="desc-error" error={errors.description} />
      </div>

      {/* Categories */}
      <div className={s.section}>
        <div className={s.sectionHeader}>
          <h3 className={s.sectionTitle}>
            Primary Categories<span className={s.required}>*</span>
          </h3>
          <span className={s.optional}>Select 1-5</span>
        </div>
        <ChipGroup
          options={PROFILE_CATEGORIES}
          selected={input.categories}
          onToggle={(val) => toggleChip("categories", val)}
          disabled={isDisabled}
          ariaLabel="Select primary categories"
        />
        <FieldError error={errors.categories} />

        {hasOtherCategory && (
          <CustomCategoryField
            value={input.customCategory}
            error={errors.customCategory}
            isDisabled={isDisabled}
            onChange={handleCustomCategoryChange}
          />
        )}
      </div>

      {/* Content Formats */}
      <div className={s.section}>
        <div className={s.sectionHeader}>
          <h3 className={s.sectionTitle}>Content Formats</h3>
          <span className={s.optional}>Optional</span>
        </div>
        <ChipGroup
          options={CONTENT_FORMATS}
          selected={formatsArray}
          onToggle={(val) => toggleChip("formats", val)}
          disabled={isDisabled}
          ariaLabel="Select content formats"
        />
      </div>

      {/* Target Audience */}
      <div className={s.section}>
        <div className={s.sectionHeader}>
          <h3 className={s.sectionTitle}>Target Audience</h3>
          <span className={s.optional}>Optional</span>
        </div>
        <p className={s.helpText}>Who is your content for?</p>
        <input
          type="text"
          className={s.input}
          value={input.audience || ""}
          onChange={(e) =>
            setInput((prev) => ({ ...prev, audience: e.target.value }))
          }
          placeholder="e.g., Busy parents aged 25-45 who want quick healthy meals"
          maxLength={500}
          disabled={isDisabled}
          aria-label="Target audience"
        />
      </div>

      <ActionBar
        onCancel={onCancel}
        onPrimary={hasAIProfile ? handleSave : handleGenerate}
        onRegenerate={onGenerate ? handleGenerate : undefined}
        saving={saving}
        generating={generating}
        hasAIProfile={hasAIProfile}
        showRegenerate={hasAIProfile && !!onGenerate}
        isDisabled={isDisabled}
      />
    </div>
  );
}
