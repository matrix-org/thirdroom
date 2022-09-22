import { Text } from "../../../atoms/text/Text";
import { ThumbnailImg } from "../../../atoms/thumbnail/ThumbnailImg";
import { Tooltip } from "../../../atoms/tooltip/Tooltip";
import "./Hotbar.css";

interface Slot {
  imageSrc: string;
  label?: string;
  shortcutKey?: string;
}

function Slot(slot: Slot, i: number) {
  return (
    <div className="Slot flex flex-column items-center" key={i}>
      <Tooltip content={`Spawn ${slot.label}`}>
        <ThumbnailImg src={slot.imageSrc} />
      </Tooltip>
      <Text variant="b3" color="world" weight="bold">
        {slot.shortcutKey || i + 1}
      </Text>
    </div>
  );
}

export function Hotbar({ slots }: { slots: Slot[] }) {
  return <div className="WorldView__controls Hotbar flex">{slots.map(Slot)}</div>;
}
