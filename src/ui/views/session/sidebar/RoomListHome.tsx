import { GroupCall, Room } from "@thirdroom/hydrogen-view-sdk";

import { useHydrogen } from "../../../hooks/useHydrogen";
import { getIdentifierColorNumber, getAvatarHttpUrl } from "../../../utils/avatar";
import { Avatar } from "../../../atoms/avatar/Avatar";
import { AvatarOutline } from "../../../atoms/avatar/AvatarOutline";
import { IconButton } from "../../../atoms/button/IconButton";
import { RoomTile } from "../../components/room-tile/RoomTile";
import { RoomTileTitle } from "../../components/room-tile/RoomTileTitle";
import { Category } from "../../components/category/Category";
import { CategoryHeader } from "../../components/category/CategoryHeader";
import { WorldTileMembers } from "./WorldTileMembers";
import { useRoomsOfType, RoomTypes } from "../../../hooks/useRoomsOfType";
import { useStore } from "../../../hooks/useStore";
import AddUserIC from "../../../../../res/ic/add-user.svg";
import SettingIC from "../../../../../res/ic/setting.svg";
import { InviteDialog } from "../dialogs/InviteDialog";

interface RoomListHomeProps {
  groupCalls: Map<string, GroupCall>;
}

export function RoomListHome({ groupCalls }: RoomListHomeProps) {
  const { session, platform } = useHydrogen(true);

  const [worlds] = useRoomsOfType(session, RoomTypes.World);
  const [rooms] = useRoomsOfType(session, RoomTypes.Room);

  const { selectedChatId, selectChat } = useStore((state) => state.overlayChat);
  const { selectedWorldId, selectWorld } = useStore((state) => state.overlayWorld);
  const { selectWorldSettingsWindow } = useStore((state) => state.overlayWindow);

  const renderAvatar = (room: Room, isWorld: boolean) => {
    const avatar = (
      <Avatar
        name={room.name || "Empty room"}
        size={isWorld ? "xl" : "lg"}
        shape={isWorld ? "circle" : "rounded"}
        className="shrink-0"
        bgColor={`var(--usercolor${getIdentifierColorNumber(room.id)})`}
        imageSrc={getAvatarHttpUrl(room.avatarUrl || "", 50, platform, room.mediaRepository)}
      />
    );
    if (selectedChatId === room.id || selectedWorldId === room.id) return <AvatarOutline>{avatar}</AvatarOutline>;
    return avatar;
  };

  return (
    <>
      <Category header={<CategoryHeader title="Worlds" />}>
        {worlds.map((room) => {
          const groupCall = groupCalls.get(room.id);
          return (
            <RoomTile
              key={room.id}
              isActive={room.id === selectedWorldId}
              avatar={renderAvatar(room, true)}
              onClick={() => selectWorld(room.id)}
              content={
                <>
                  <RoomTileTitle>{room.name || "Empty room"}</RoomTileTitle>
                  {groupCall && <WorldTileMembers session={session} platform={platform} groupCall={groupCall} />}
                </>
              }
              options={
                <>
                  <InviteDialog
                    key={room.id}
                    roomId={room.id}
                    renderTrigger={(openDialog) => (
                      <IconButton onClick={openDialog} iconSrc={AddUserIC} variant="surface-low" label="More options" />
                    )}
                  />
                  <IconButton
                    onClick={() => selectWorldSettingsWindow(room.id)}
                    iconSrc={SettingIC}
                    variant="surface-low"
                    label="Settings"
                  />
                </>
              }
            />
          );
        })}
      </Category>
      <Category header={<CategoryHeader title="Rooms" />}>
        {rooms.map((room) => (
          <RoomTile
            key={room.id}
            isActive={room.id === selectedChatId}
            avatar={renderAvatar(room, false)}
            onClick={() => selectChat(room.id)}
            content={<RoomTileTitle>{room.name || "Empty room"}</RoomTileTitle>}
            options={
              <InviteDialog
                key={room.id}
                roomId={room.id}
                renderTrigger={(openDialog) => (
                  <IconButton onClick={openDialog} iconSrc={AddUserIC} variant="surface-low" label="More options" />
                )}
              />
            }
          />
        ))}
      </Category>
    </>
  );
}
