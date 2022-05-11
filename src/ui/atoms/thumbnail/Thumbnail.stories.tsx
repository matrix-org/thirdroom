import { Thumbnail } from "./Thumbnail";
import { ThumbnailHover } from "./ThumbnailHover";
import { ThumbnailImg } from "./ThumbnailImg";
import { ThumbnailBadgeWrapper } from "./ThumbnailBadgeWrapper";
import { Avatar } from "../avatar/Avatar";
import { IconButton } from "../button/IconButton";
import { Text } from "../text/Text";
import LogoSvg from "../../../../res/svg/logo.svg";
import AddIC from "../../../../res/ic/add.svg";

export const title = "Thumbnail";

export default function ThumbnailStories() {
  return (
    <div className="flex items-start">
      <Thumbnail>
        <ThumbnailImg src={LogoSvg} alt="My thumbnail" />
      </Thumbnail>
      <Thumbnail size="sm">
        <ThumbnailImg src={LogoSvg} alt="My thumbnail" />
      </Thumbnail>
      <Thumbnail size="sm">
        <IconButton size="xl" iconSrc={AddIC} label="Add" />
      </Thumbnail>
      <ThumbnailHover
        content={
          <Text className="uppercase" color="world" weight="bold">
            Upload
          </Text>
        }
      >
        <Thumbnail size="sm">
          <ThumbnailImg src={LogoSvg} alt="My thumbnail" />
        </Thumbnail>
      </ThumbnailHover>
      <ThumbnailBadgeWrapper badge={<Avatar size="xs" imageSrc={LogoSvg} name="ThirdRoom" bgColor="red" />}>
        <Thumbnail size="sm">
          <ThumbnailImg src={LogoSvg} alt="My thumbnail" />
        </Thumbnail>
      </ThumbnailBadgeWrapper>
    </div>
  );
}
