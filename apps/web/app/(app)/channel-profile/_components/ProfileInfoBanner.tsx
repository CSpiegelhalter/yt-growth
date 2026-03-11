import { AlertCircleIcon } from "@/components/icons";

import s from "./ProfileInfoBanner.module.css";

type Props = {
  title: string;
  description: string;
};

export function ProfileInfoBanner({ title, description }: Props) {
  return (
    <div className={s.banner} role="status">
      <div className={s.content}>
        <h3 className={s.title}>{title}</h3>
        <p className={s.description}>{description}</p>
      </div>
      <AlertCircleIcon className={s.icon} size={24} />
    </div>
  );
}
