import { IconButton } from "../../../atoms/button/IconButton";
import { Thumbnail } from "../../../atoms/thumbnail/Thumbnail";
import { ThumbnailHover } from "../../../atoms/thumbnail/ThumbnailHover";
import { ThumbnailImg } from "../../../atoms/thumbnail/ThumbnailImg";
import CrossIC from "../../../../../res/ic/cross.svg";
import AddIC from "../../../../../res/ic/add.svg";

interface AvatarPickerProps {
  url?: string;
  onAvatarPick: () => void;
  onAvatarDrop: () => void;
}
export function AvatarPicker({ url, onAvatarPick, onAvatarDrop }: AvatarPickerProps) {
  return (
    <ThumbnailHover
      content={
        !url ? undefined : (
          <IconButton variant="world" onClick={onAvatarDrop} size="xl" iconSrc={CrossIC} label="Remove avatar" />
        )
      }
    >
      <Thumbnail size="sm" className="flex">
        {url ? (
          <ThumbnailImg src={url} />
        ) : (
          <IconButton onClick={onAvatarPick} size="xl" iconSrc={AddIC} label="Add avatar" />
        )}
      </Thumbnail>
    </ThumbnailHover>
  );
}
