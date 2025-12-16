import s from "./style.module.css";

export default function BillingCTA({
  status,
  onSubscribe,
  busy,
  text,
}: {
  status: string;
  onSubscribe: () => void;
  busy?: boolean;
  text?: string;
}) {
  return (
    <div className={s.card}>
      <div>
        <div className={s.title}>Upgrade to unlock growth features</div>
        <div className={s.subtle}>
          {text ??
            "Retention cliffs, Decide-for-Me plans, and subscriber magnets require an active subscription."}
        </div>
      </div>
      <button className={s.btn} onClick={onSubscribe} disabled={busy}>
        {busy ? "Opening checkout…" : "Subscribe"}
      </button>
    </div>
  );
}
