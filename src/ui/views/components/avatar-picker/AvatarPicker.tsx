import { IconButton } from "../../../atoms/button/IconButton";
import { Thumbnail } from "../../../atoms/thumbnail/Thumbnail";
import { ThumbnailHover } from "../../../atoms/thumbnail/ThumbnailHover";
import { ThumbnailImg } from "../../../atoms/thumbnail/ThumbnailImg";
import CrossIC from "../../../../../res/ic/cross.svg";
import AddIC from "../../../../../res/ic/add.svg";
import { Text } from "../../../atoms/text/Text";

interface AvatarPickerProps {
  url?: string;
  onAvatarPick: () => void;
  onAvatarDrop: () => void;
}
export function AvatarPicker({ url, onAvatarPick, onAvatarDrop }: AvatarPickerProps) {
  return (
    <ThumbnailHover
      className="shrink-0"
      content={
        !url ? undefined : (
          <IconButton variant="world" onClick={onAvatarDrop} size="xl" iconSrc={CrossIC} label="Remove avatar" />
        )
      }
    >
      <Thumbnail size="sm" className="flex flex-column">
        {url ? (
          <ThumbnailImg src={url} />
        ) : (
          <>
            <IconButton variant="surface-low" onClick={onAvatarPick} size="xl" iconSrc={AddIC} label="Add avatar" />
            <Text color="surface-low" variant="b3" weight="semi-bold">
              Upload
            </Text>
          </>
        )}
      </Thumbnail>
    </ThumbnailHover>
  );
}
