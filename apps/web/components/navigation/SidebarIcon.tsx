import Image from "next/image";

import type { NavIconType } from "@/lib/shared/nav-config";

import { getNavIconSrc } from "./nav-utils";
import { NavIcon } from "./NavIcon";

type SidebarIconProps = {
  itemId: string;
  iconType: NavIconType;
  size?: number;
};

export function SidebarIcon({ itemId, iconType, size = 20 }: SidebarIconProps) {
  const src = getNavIconSrc(itemId);

  if (src) {
    return (
      <Image
        src={src}
        alt=""
        width={size}
        height={size}
        aria-hidden="true"
      />
    );
  }

  return <NavIcon type={iconType} size={size} />;
}
