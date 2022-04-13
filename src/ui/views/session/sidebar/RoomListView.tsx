import { Room } from "hydrogen-view-sdk";

import "./RoomListView.css";
import { Text } from "../../../atoms/text/Text";
import { Button } from "../../../atoms/button/Button";
import { Scroll } from "../../../atoms/scroll/Scroll";
import { Avatar } from "../../../atoms/avatar/Avatar";
import { RoomTile } from "./RoomTile";
import AddBoxIC from "../../../../../res/ic/add-box.svg";
import ManageSearchIC from "../../../../../res/ic/manage-search.svg";
import { getAvatarHttpUrl, getIdentifierColorNumber } from "../../../utils/avatar";
import { useHydrogen } from "../../../hooks/useHydrogen";

interface RoomListViewProps {
  rooms: Room[];
  selectedRoomId?: string;
  onSelectRoom: (roomId: string) => void;
}

export function RoomListView({ rooms, selectedRoomId, onSelectRoom }: RoomListViewProps) {
  const { platform } = useHydrogen();

  return (
    <div className="RoomListView flex flex-column">
      <header className="flex items-center">
        <Text className="truncate" variant="s1" weight="semi-bold">
          Home
        </Text>
      </header>
      <div className="RoomListView__container grow">
        <Scroll>
          <div className="RoomListView__content">
            <header className="flex items-center">
              <Text className="grow" variant="b2" weight="semi-bold">
                Rooms
              </Text>
              <Button iconSrc={AddBoxIC} size="extra-small" onClick={() => alert("create room")}>
                Create
              </Button>
              <Button iconSrc={ManageSearchIC} size="extra-small" onClick={() => alert("Discover")}>
                Discover
              </Button>
            </header>
            {rooms.map((room) => (
              <RoomTile
                key={room.id}
                isActive={room.id === selectedRoomId}
                onClick={() => onSelectRoom(room.id)}
                avatar={
                  <Avatar
                    name={room.name || "Empty room"}
                    size="large"
                    isCircle
                    className="shrink-0"
                    bgColor={`var(--usercolor${getIdentifierColorNumber(room.id)})`}
                    imageSrc={getAvatarHttpUrl(room.avatarUrl || "", 32, platform, room.mediaRepository)}
                  />
                }
                title={
                  <Text className="truncate" variant="b2" weight="semi-bold">
                    {room.name || "Empty room"}
                  </Text>
                }
              />
            ))}
          </div>
        </Scroll>
      </div>
    </div>
  );
}
