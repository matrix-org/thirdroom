import { RoomTile } from "../../../src/ui/views/components/roomtile/RoomTile";
import { RoomTilePlaying } from "../../../src/ui/views/components/roomtile/RoomTilePlaying";
import { RoomTileTitle } from "../../../src/ui/views/components/roomtile/RoomTileTitle";
import { RoomTileDesc } from "../../../src/ui/views/components/roomtile/RoomTileDesc";
import { Avatar } from "../../../src/ui/atoms/avatar/Avatar";
import { AvatarPile } from "../../../src/ui/atoms/avatar/AvatarPile";
import { AvatarBadgeWrapper } from "../../../src/ui/atoms/avatar/AvatarBadgeWrapper";
import { AvatarOutline } from "../../../src/ui/atoms/avatar/AvatarOutline";
import { StatusBadge } from "../../../src/ui/atoms/badge/StatusBadge";
import { IconButton } from "../../../src/ui/atoms/button/IconButton";
import NotificationIC from "../../../res/ic/notification.svg";
import MoreHorizontalIC from "../../../res/ic/more-horizontal.svg";

export function RoomTileStories() {
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
            <IconButton size="sm" label="Options" iconSrc={MoreHorizontalIC} onClick={(a) => alert("clicked")} />
            <IconButton size="sm" label="Notifications" iconSrc={NotificationIC} onClick={(a) => alert("clicked")} />
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
            <IconButton size="sm" label="Options" iconSrc={MoreHorizontalIC} onClick={(a) => alert("clicked")} />
            <IconButton size="sm" label="Notifications" iconSrc={NotificationIC} onClick={(a) => alert("clicked")} />
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
            <IconButton size="sm" label="Options" iconSrc={MoreHorizontalIC} onClick={(a) => alert("clicked")} />
            <IconButton size="sm" label="Notifications" iconSrc={NotificationIC} onClick={(a) => alert("clicked")} />
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
            <IconButton size="sm" label="Options" iconSrc={MoreHorizontalIC} onClick={(a) => alert("clicked")} />
            <IconButton size="sm" label="Notifications" iconSrc={NotificationIC} onClick={(a) => alert("clicked")} />
          </>
        }
      />
    </div>
  );
}
