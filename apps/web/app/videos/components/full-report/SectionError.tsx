import s from "./full-report.module.css";

type SectionErrorProps = {
  message: string;
  retryable?: boolean;
  onRetry?: () => void;
};

export function SectionError({ message, retryable, onRetry }: SectionErrorProps) {
  return (
    <div className={s.sectionError}>
      <p>{message}</p>
      {retryable && onRetry && (
        <button type="button" className={s.retryBtn} onClick={onRetry}>
          Retry
        </button>
      )}
    </div>
  );
}
