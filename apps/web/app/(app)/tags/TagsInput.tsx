"use client";

import s from "./tags.module.css";

type TagsInputProps = {
  url: string;
  setUrl: (url: string) => void;
  loading: boolean;
  error: string | null;
  onSubmit: (e: React.FormEvent) => void;
};

export function TagsInput({ url, setUrl, loading, error, onSubmit }: TagsInputProps) {
  return (
    <form onSubmit={onSubmit} className={s.inputForm}>
      <label htmlFor="videoUrl" className={s.inputLabel}>
        Paste URL
      </label>
      <div className={s.inputRow}>
        <input
          id="videoUrl"
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://youtube.com/watch?v=..."
          className={`${s.urlInput} ${error ? s.inputError : ""}`}
          disabled={loading}
          autoComplete="off"
          aria-invalid={!!error}
          aria-describedby={error ? "url-error" : undefined}
        />
        <button
          type="submit"
          className={s.findBtn}
          disabled={loading || !url.trim()}
        >
          {loading ? (
            <>
              <span className={s.spinner} aria-hidden="true" />
              Finding...
            </>
          ) : (
            "Find Tags"
          )}
        </button>
      </div>
      {error && (
        <p id="url-error" className={s.errorText}>
          {error}
        </p>
      )}
    </form>
  );
}
