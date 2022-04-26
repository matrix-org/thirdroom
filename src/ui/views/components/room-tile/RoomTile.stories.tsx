import { RoomTile } from "./RoomTile";
import { RoomTilePlaying } from "./RoomTilePlaying";
import { RoomTileTitle } from "./RoomTileTitle";
import { RoomTileDesc } from "./RoomTileDesc";
import { Avatar } from "../../../atoms/avatar/Avatar";
import { AvatarPile } from "../../../atoms/avatar/AvatarPile";
import { AvatarBadgeWrapper } from "../../../atoms/avatar/AvatarBadgeWrapper";
import { AvatarOutline } from "../../../atoms/avatar/AvatarOutline";
import { StatusBadge } from "../../../atoms/badge/StatusBadge";
import { IconButton } from "../../../atoms/button/IconButton";
import NotificationIC from "../../../../../res/ic/notification.svg";
import MoreHorizontalIC from "../../../../../res/ic/more-horizontal.svg";

export const title = "RoomTile";

export default function RoomTileStories() {
  return (
    <div style={{ backgroundColor: "white", maxWidth: "380px" }}>
      <RoomTile
        onClick={() => false}
        avatar={
          <AvatarOutline>
            <Avatar size="xl" shape="circle" name="Ram's House" bgColor="gray" />
          </AvatarOutline>
        }
        content={
          <>
            <RoomTileTitle>Ram's House</RoomTileTitle>
            <AvatarPile>
              <Avatar shape="circle" size="xxs" name="Ram" bgColor="#2a38e7" />
              <Avatar shape="circle" size="xxs" name="Sam" bgColor="blue" />
              <Avatar shape="circle" size="xxs" name="Lucky" bgColor="red" />
              <Avatar shape="circle" size="xxs" name="Man" bgColor="green" />
            </AvatarPile>
          </>
        }
        options={
          <>
            <IconButton size="sm" label="Options" iconSrc={MoreHorizontalIC} onClick={(a) => console.log("clicked")} />
            <IconButton
              size="sm"
              label="Notifications"
              iconSrc={NotificationIC}
              onClick={(a) => console.log("clicked")}
            />
          </>
        }
      />

      <RoomTile
        onClick={() => false}
        avatar={
          <AvatarBadgeWrapper badge={<Avatar size="xxs" name="Sam" bgColor="green" />}>
            <Avatar size="lg" name="The Gaming Bunch" bgColor="blue" />
          </AvatarBadgeWrapper>
        }
        content={
          <>
            <RoomTileTitle>The Gaming Bunch</RoomTileTitle>
            <RoomTileDesc>Here's a message with media.</RoomTileDesc>
          </>
        }
        options={
          <>
            <IconButton size="sm" label="Options" iconSrc={MoreHorizontalIC} onClick={(a) => console.log("clicked")} />
            <IconButton
              size="sm"
              label="Notifications"
              iconSrc={NotificationIC}
              onClick={(a) => console.log("clicked")}
            />
          </>
        }
      />

      <RoomTile
        isActive
        onClick={() => false}
        avatar={
          <AvatarBadgeWrapper badge={<StatusBadge status="online" />}>
            <Avatar shape="circle" size="lg" name="Ram" bgColor="black" />
          </AvatarBadgeWrapper>
        }
        content={
          <>
            <RoomTileTitle>Ram</RoomTileTitle>
            <RoomTileDesc>Here's a message with media and few other items</RoomTileDesc>
          </>
        }
        options={
          <>
            <IconButton size="sm" label="Options" iconSrc={MoreHorizontalIC} onClick={(a) => console.log("clicked")} />
            <IconButton
              size="sm"
              label="Notifications"
              iconSrc={NotificationIC}
              onClick={(a) => console.log("clicked")}
            />
          </>
        }
      />

      <RoomTile
        onClick={() => false}
        avatar={
          <AvatarBadgeWrapper badge={<StatusBadge status="online" />}>
            <Avatar shape="circle" size="lg" name="Sam" bgColor="blue" />
          </AvatarBadgeWrapper>
        }
        content={
          <>
            <RoomTileTitle>Sam</RoomTileTitle>
            <RoomTilePlaying avatar={<Avatar size="xxs" shape="circle" name="Ram's House" bgColor="gray" />}>
              In Ram's House
            </RoomTilePlaying>
          </>
        }
        options={
          <>
            <IconButton size="sm" label="Options" iconSrc={MoreHorizontalIC} onClick={(a) => console.log("clicked")} />
            <IconButton
              size="sm"
              label="Notifications"
              iconSrc={NotificationIC}
              onClick={(a) => console.log("clicked")}
            />
          </>
        }
      />
    </div>
  );
}
