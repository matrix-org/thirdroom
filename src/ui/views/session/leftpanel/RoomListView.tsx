import { Room } from "hydrogen-view-sdk";

import "./RoomListView.css";
import { RoomListViewModel } from "../../../../viewModels/session/leftpanel/RoomListViewModel";
import { Text } from "../../../atoms/text/Text";
import { Button } from "../../../atoms/button/Button";
import { Scroll } from "../../../atoms/scroll/Scroll";
import { Avatar } from "../../../atoms/avatar/Avatar";
import { RoomTile } from "./RoomTile";
import AddBoxIC from "../../../../../res/ic/add-box.svg";
import ManageSearchIC from "../../../../../res/ic/manage-search.svg";
import { useVMProp } from "../../../hooks/useVMProp";

interface IRoomListView {
  vm: RoomListViewModel;
}

export function RoomListView({ vm }: IRoomListView) {
  const allRooms: typeof Room[] = useVMProp(vm, "allRooms");
  const activeRoom: string = useVMProp(vm, "activeRoomId");

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
            {allRooms.map((room) => (
              <RoomTile
                key={room.id}
                isActive={room.id === activeRoom}
                onClick={() => vm.navigation.push("room", room.id)}
                avatar={(
                  <Avatar
                    name={room.name || "Empty room"}
                    size="large"
                    isCircle
                    className="shrink-0"
                    bgColor={vm.getRoomColor(room)}
                    imageSrc={vm.getRoomAvatarHttpUrl(room, 32)}
                  />
                )}
                title={(
                  <Text className="truncate" variant="b2" weight="semi-bold">
                    {room.name || "Empty room"}
                  </Text>
                )}
              />
            ))}
          </div>
        </Scroll>
      </div>
    </div>
  );
}
