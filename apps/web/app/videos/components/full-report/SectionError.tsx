import s from "./full-report.module.css";

type SectionErrorProps = {
  message: string;
};

export function SectionError({ message }: SectionErrorProps) {
  return (
    <div className={s.sectionError}>
      <p>{message}</p>
    </div>
  );
}
