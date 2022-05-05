import { Thumbnail } from "./Thumbnail";
import { ThumbnailImg } from "./ThumbnailImg";
import { IconButton } from "../button/IconButton";
import LogoSvg from "../../../../res/svg/logo.svg";
import AddIC from "../../../../res/ic/add.svg";

export const title = "Thumbnail";

export default function ThumbnailStories() {
  return (
    <div className="flex">
      <Thumbnail>
        <ThumbnailImg src={LogoSvg} alt="My thumbnail" />
      </Thumbnail>
      <Thumbnail size="sm">
        <ThumbnailImg src={LogoSvg} alt="My thumbnail" />
      </Thumbnail>
      <Thumbnail size="sm">
        <IconButton size="lg" iconSrc={AddIC} label="Add" />
      </Thumbnail>
    </div>
  );
}
