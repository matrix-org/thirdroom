import { ReactNode } from "react";

import { Text } from "../../../atoms/text/Text";
import { ThumbnailImg } from "../../../atoms/thumbnail/ThumbnailImg";
import { Tooltip } from "../../../atoms/tooltip/Tooltip";
import "./Hotbar.css";

interface HotbarSlotProps {
  imageSrc: string;
  label?: string;
  shortcutKey: string | number;
}

export function HotbarSlot({ imageSrc, label = "Object", shortcutKey }: HotbarSlotProps) {
  return (
    <div className="HotbarSlot flex items-center">
      <Tooltip content={label}>
        <ThumbnailImg src={imageSrc} alt={label} />
      </Tooltip>
      <Text className="HotbarSlot__key" variant="b3" color="world" weight="bold">
        {shortcutKey}
      </Text>
    </div>
  );
}

export function Hotbar({ children }: { children: ReactNode }) {
  return <div className="Hotbar flex gap-sm">{children}</div>;
}
