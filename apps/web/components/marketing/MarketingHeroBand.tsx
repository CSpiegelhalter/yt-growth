import Image from "next/image";

import s from "./MarketingHeroBand.module.css";

interface MarketingHeroBandProps {
  children: React.ReactNode;
  iconAlt?: string;
  className?: string;
}

export function MarketingHeroBand({
  children,
  iconAlt = "ChannelBoost analytics illustration",
  className,
}: MarketingHeroBandProps) {
  return (
    <section className={`${s.heroBand} ${className ?? ""}`}>
      <Image
        src="/hero-texture.webp"
        alt=""
        width={1600}
        height={900}
        className={s.heroTexture}
        priority
      />
      <div className={s.heroInner}>
        <div className={s.heroText}>{children}</div>
        <Image
          src="/landing_icon.svg"
          alt={iconAlt}
          width={320}
          height={287}
          className={s.heroIcon}
          priority
        />
      </div>
    </section>
  );
}
