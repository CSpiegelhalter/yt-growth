import s from "./ui.module.css";

type InfoTooltipProps = {
  text: string;
};

export function InfoTooltip({ text }: InfoTooltipProps) {
  return (
    <span className={s.infoTooltipWrap} data-tooltip={text} aria-label={text}>
      <img src="/info.svg" width={16} height={16} alt="" />
    </span>
  );
}
