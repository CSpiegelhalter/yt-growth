import s from "./full-report.module.css";

type FullReportErrorProps = {
  message: string;
  onRetry: () => void;
};

export function FullReportError({ message, onRetry }: FullReportErrorProps) {
  return (
    <div className={s.errorState}>
      <p>{message}</p>
      <button type="button" onClick={onRetry} className={s.retryBtn}>
        Try again
      </button>
    </div>
  );
}
