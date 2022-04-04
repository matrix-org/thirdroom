import "./RoomPreview.css";
import { RoomViewModel } from "../../../../viewModels/session/room/RoomViewModel";
import { InviteViewModel } from "../../../../viewModels/session/room/InviteViewModel";
import { Text } from "../../../atoms/text/Text";
import { Icon } from "../../../atoms/icon/Icon";
import { Button } from "../../../atoms/button/Button";
import PeoplesIC from "../../../../../res/ic/peoples.svg";

interface IRoomPreview {
  vm: RoomViewModel | InviteViewModel;
  roomId: string;
}

export function RoomPreview({ vm, roomId }: IRoomPreview) {
  const roomName = vm.name || "Empty room";

  const isPreview = vm.roomFlow === "preview";
  return (
    <div className="RoomPreview grow flex flex-column justify-end items-center">
      <div className="RoomPreview__card flex items-center">
        <div className="grow">
          <Text className="truncate" variant="s1" weight="semi-bold">
            {roomName}
          </Text>
        </div>
        <div className="RoomPreview__card-memberCount flex items-center">
          <Icon src={PeoplesIC} />
          {vm.room.joinedMemberCount}
        </div>
        <div className="shrink-0">
          <Button
            variant={isPreview ? "secondary" : "primary"}
            onClick={() => vm.setRoomFlow(isPreview ? "load" : "loaded")}
          >
            {isPreview ? "Load World" : "Open World"}
          </Button>
        </div>
      </div>
    </div>
  );
}
