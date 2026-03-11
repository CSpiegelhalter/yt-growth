"use client";

import s from "../style.module.css";

type Props = {
  url: string;
  setUrl: (v: string) => void;
  loading: boolean;
  error: string | null;
  onSubmit: (e: React.FormEvent) => void;
};

export function AnalyzeInput({ url, setUrl, loading, error, onSubmit }: Props) {
  const inputId = "analyze-url";
  const errorId = "analyze-url-error";

  return (
    <form onSubmit={onSubmit} className={s.inputForm}>
      <label htmlFor={inputId} className={s.inputLabel}>
        Paste URL
      </label>
      <div className={s.inputRow}>
        <input
          id={inputId}
          type="url"
          className={`${s.urlInput} ${error ? s.inputError : ""}`}
          placeholder="https://youtube.com/watch?v=..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          disabled={loading}
          autoComplete="off"
          aria-invalid={!!error}
          aria-describedby={error ? errorId : undefined}
        />
        <button
          type="submit"
          className={s.analyzeBtn}
          disabled={loading || !url.trim()}
        >
          {loading ? (
            <>
              <span className={s.spinner} aria-hidden="true" />
              Analyzing...
            </>
          ) : (
            "Analyze"
          )}
        </button>
      </div>
      {error && (
        <p id={errorId} className={s.errorText} role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
