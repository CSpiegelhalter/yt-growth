"use client";

import { useState, useCallback, useEffect } from "react";
import s from "./ProfileEditor.module.css";
import {
  ChannelProfileInput,
  DEFAULT_PROFILE_INPUT,
  PROFILE_CATEGORIES,
  CONTENT_FORMATS,
} from "@/lib/channel-profile/types";
import { sanitizeUserText } from "@/lib/channel-profile/utils";

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
  // Form state
  const [input, setInput] = useState<ChannelProfileInput>(
    initialInput ?? DEFAULT_PROFILE_INPUT
  );
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(
    null
  );

  // Reset form when initialInput changes
  useEffect(() => {
    if (initialInput) {
      setInput(initialInput);
    }
  }, [initialInput]);

  // Auto-clear message after 5 seconds
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  // Check if "Other" is selected
  const hasOtherCategory = input.categories.includes("Other");

  // Validate form
  const validate = useCallback((): boolean => {
    const newErrors: ValidationErrors = {};

    if (!input.description || input.description.trim().length < 10) {
      newErrors.description = "Description must be at least 10 characters";
    }

    if (!input.categories || input.categories.length === 0) {
      newErrors.categories = "Select at least one category";
    }

    // If "Other" is selected, require custom category
    if (hasOtherCategory && (!input.customCategory || input.customCategory.trim().length < 2)) {
      newErrors.customCategory = "Please specify your category";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [input, hasOtherCategory]);

  // Handle save
  const handleSave = async () => {
    if (!validate()) return;

    const success = await onSave(input);
    if (success) {
      setMessage({ type: "success", text: "Profile saved successfully!" });
    } else {
      setMessage({ type: "error", text: "Failed to save profile" });
    }
  };

  // Handle generate
  const handleGenerate = async () => {
    if (!validate()) {
      setMessage({ type: "error", text: "Please fix the form errors first" });
      return;
    }

    // Save first, then generate
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

  // Toggle chip selection
  const toggleChip = (
    field: "categories" | "formats",
    value: string
  ) => {
    setInput((prev) => {
      const current = prev[field] || [];
      const isSelected = current.includes(value);

      // For categories, limit to 5
      if (field === "categories" && !isSelected && current.length >= 5) {
        return prev;
      }

      const newCategories = isSelected
        ? current.filter((v) => v !== value)
        : [...current, value];

      // If deselecting "Other", clear customCategory
      if (field === "categories" && value === "Other" && isSelected) {
        return {
          ...prev,
          [field]: newCategories,
          customCategory: undefined,
        };
      }

      return {
        ...prev,
        [field]: newCategories,
      };
    });

    // Clear category error when selection changes
    if (field === "categories") {
      setErrors((prev) => ({ ...prev, categories: undefined }));
    }
  };

  // Handle custom category input with sanitization
  const handleCustomCategoryChange = (value: string) => {
    // Sanitize the input
    const sanitized = sanitizeUserText(value);
    setInput((prev) => ({ ...prev, customCategory: sanitized }));
    if (errors.customCategory) {
      setErrors((prev) => ({ ...prev, customCategory: undefined }));
    }
  };

  const isDisabled = disabled || saving || generating;

  return (
    <div className={s.editor}>
      {/* Message */}
      {message && (
        <div
          className={`${s.inlineMessage} ${
            message.type === "success" ? s.inlineSuccess : s.inlineError
          }`}
          role="status"
        >
          {message.text}
        </div>
      )}

      {/* Description (Required) */}
      <div className={s.section}>
        <div className={s.sectionHeader}>
          <h3 className={s.sectionTitle}>
            Channel Description<span className={s.required}>*</span>
          </h3>
        </div>
        <p className={s.helpText}>Describe your channel and the type of videos you make.</p>
        <textarea
          className={`${s.textarea} ${errors.description ? s.textareaError : ""}`}
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
          aria-describedby={errors.description ? "desc-error" : undefined}
        />
        <div className={s.charCount}>{input.description.length}/2000</div>
        {errors.description && (
          <div id="desc-error" className={s.errorMessage}>
            {errors.description}
          </div>
        )}
      </div>

      {/* Categories (Required) */}
      <div className={s.section}>
        <div className={s.sectionHeader}>
          <h3 className={s.sectionTitle}>
            Primary Categories<span className={s.required}>*</span>
          </h3>
          <span className={s.optional}>Select 1-5</span>
        </div>
        <div
          className={s.chipGroup}
          role="group"
          aria-label="Select primary categories"
        >
          {PROFILE_CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              className={`${s.chip} ${
                input.categories.includes(cat) ? s.chipSelected : ""
              }`}
              aria-pressed={input.categories.includes(cat)}
              onClick={() => toggleChip("categories", cat)}
              disabled={isDisabled}
            >
              {cat}
            </button>
          ))}
        </div>
        {errors.categories && (
          <div className={s.errorMessage}>{errors.categories}</div>
        )}

        {/* Custom category input when "Other" is selected */}
        {hasOtherCategory && (
          <div className={s.customCategoryWrapper}>
            <label htmlFor="customCategory" className={s.customCategoryLabel}>
              Specify your category:
            </label>
            <input
              id="customCategory"
              type="text"
              className={`${s.input} ${errors.customCategory ? s.inputError : ""}`}
              value={input.customCategory || ""}
              onChange={(e) => handleCustomCategoryChange(e.target.value)}
              placeholder="e.g., Sustainable Fashion, AI Art, etc."
              maxLength={100}
              disabled={isDisabled}
              aria-invalid={!!errors.customCategory}
              aria-describedby={errors.customCategory ? "custom-cat-error" : undefined}
            />
            {errors.customCategory && (
              <div id="custom-cat-error" className={s.errorMessage}>
                {errors.customCategory}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Content Formats (Optional) */}
      <div className={s.section}>
        <div className={s.sectionHeader}>
          <h3 className={s.sectionTitle}>Content Formats</h3>
          <span className={s.optional}>Optional</span>
        </div>
        <div
          className={s.chipGroup}
          role="group"
          aria-label="Select content formats"
        >
          {CONTENT_FORMATS.map((format) => (
            <button
              key={format}
              type="button"
              className={`${s.chip} ${
                (input.formats || []).includes(format) ? s.chipSelected : ""
              }`}
              aria-pressed={(input.formats || []).includes(format)}
              onClick={() => toggleChip("formats", format)}
              disabled={isDisabled}
            >
              {format}
            </button>
          ))}
        </div>
      </div>

      {/* Target Audience (Optional) */}
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

      {/* Actions */}
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

        {hasAIProfile && onGenerate && (
          <button
            type="button"
            className={s.btnSecondary}
            onClick={handleGenerate}
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
          onClick={hasAIProfile ? handleSave : handleGenerate}
          disabled={isDisabled}
        >
          {saving ? (
            <>
              <span className={s.spinner} />
              Saving...
            </>
          ) : generating ? (
            <>
              <span className={s.spinner} />
              Generating...
            </>
          ) : hasAIProfile ? (
            "Save Changes"
          ) : (
            "Save & Generate AI Summary"
          )}
        </button>
      </div>
    </div>
  );
}
