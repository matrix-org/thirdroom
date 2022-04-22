import { NowPlaying } from "./NowPlaying";
import { NowPlayingTitle } from "./NowPlayingTitle";
import { NowPlayingStatus } from "./NowPlayingStatus";
import { Avatar } from "../../../atoms/avatar/Avatar";
import { AvatarOutline } from "../../../atoms/avatar/AvatarOutline";
import { IconButton } from "../../../atoms/button/IconButton";
import MicIC from "../../../../../res/ic/mic.svg";
import HeadphoneIC from "../../../../../res/ic/headphone.svg";
import LogoutIC from "../../../../../res/ic/logout.svg";
import MoreHorizontalIC from "../../../../../res/ic/more-horizontal.svg";
import InfoIC from "../../../../../res/ic/info.svg";

export const title = "NowPlaying";

export default function NowPlayingStories() {
  return (
    <div style={{ backgroundColor: "white", maxWidth: "380px" }}>
      <NowPlaying
        avatar={
          <AvatarOutline>
            <Avatar shape="circle" size="lg" name="Robert's House" bgColor="#9a1c75" />
          </AvatarOutline>
        }
        content={
          <>
            <NowPlayingStatus status="connected">Connected</NowPlayingStatus>
            <NowPlayingTitle>Robert's House</NowPlayingTitle>
          </>
        }
        options={
          <IconButton variant="surface-low" label="Info" iconSrc={InfoIC} onClick={(a) => console.log("clicked")} />
        }
        leftControls={
          <>
            <IconButton variant="surface-low" label="Mic" iconSrc={MicIC} onClick={(a) => console.log("clicked")} />
            <IconButton
              variant="surface-low"
              label="Headphone"
              iconSrc={HeadphoneIC}
              onClick={(a) => console.log("clicked")}
            />
            <IconButton variant="danger" label="Leave" iconSrc={LogoutIC} onClick={(a) => console.log("clicked")} />
          </>
        }
        rightControls={
          <IconButton
            variant="surface-low"
            label="Options"
            iconSrc={MoreHorizontalIC}
            onClick={(a) => console.log("clicked")}
          />
        }
      />

      <NowPlaying
        avatar={
          <AvatarOutline>
            <Avatar shape="circle" size="lg" name="Robert's House" bgColor="#9a1c75" />
          </AvatarOutline>
        }
        content={
          <>
            <NowPlayingStatus status="disconnected">Disconnected</NowPlayingStatus>
            <NowPlayingTitle>Robert's House</NowPlayingTitle>
          </>
        }
        options={
          <IconButton variant="surface-low" label="Info" iconSrc={InfoIC} onClick={(a) => console.log("clicked")} />
        }
        leftControls={
          <>
            <IconButton variant="surface-low" label="Mic" iconSrc={MicIC} onClick={(a) => console.log("clicked")} />
            <IconButton
              variant="surface-low"
              label="Headphone"
              iconSrc={HeadphoneIC}
              onClick={(a) => console.log("clicked")}
            />
            <IconButton variant="danger" label="Leave" iconSrc={LogoutIC} onClick={(a) => console.log("clicked")} />
          </>
        }
        rightControls={
          <IconButton
            variant="surface-low"
            label="Options"
            iconSrc={MoreHorizontalIC}
            onClick={(a) => console.log("clicked")}
          />
        }
      />
    </div>
  );
}
