import Image from "next/image";

import s from "./ui.module.css";

type InfoTooltipProps = {
  text: string;
};

export function InfoTooltip({ text }: InfoTooltipProps) {
  return (
    <span className={s.infoTooltipWrap} data-tooltip={text} aria-label={text}>
      <Image src="/info.svg" width={16} height={16} alt="" unoptimized />
    </span>
  );
}
