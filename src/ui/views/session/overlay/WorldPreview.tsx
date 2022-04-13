import { useCallback, useState, MouseEvent } from "react";
import { Room } from "hydrogen-view-sdk";

import "./WorldPreview.css";
import { Text } from "../../../atoms/text/Text";
import { Icon } from "../../../atoms/icon/Icon";
import { Button } from "../../../atoms/button/Button";
import PeoplesIC from "../../../../../res/ic/peoples.svg";

interface IWorldPreview {
  room: Room;
  onLoadWorld: (room: Room) => Promise<void>;
  onEnterWorld: () => Promise<void>;
}

enum WorldLoadState {
  Preview = "preview",
  Loading = "loading",
  Loaded = "loaded",
  Entering = "entering",
  Error = "error",
}

const WorldLoadButtonText: { [key in WorldLoadState]: string } = {
  [WorldLoadState.Preview]: "Load Room",
  [WorldLoadState.Loading]: "Loading...",
  [WorldLoadState.Loaded]: "Enter Room",
  [WorldLoadState.Entering]: "Entering...",
  [WorldLoadState.Error]: "Error",
};

export function WorldPreview({ room, onLoadWorld, onEnterWorld }: IWorldPreview) {
  const [worldLoadState, setWorldLoadState] = useState<WorldLoadState>(WorldLoadState.Preview);

  const onClickRoomLoadButton = useCallback(
    (e: MouseEvent<HTMLButtonElement, globalThis.MouseEvent>) => {
      e.preventDefault();

      if (worldLoadState === WorldLoadState.Preview) {
        setWorldLoadState(WorldLoadState.Loading);
        onLoadWorld(room)
          .then(() => {
            setWorldLoadState(WorldLoadState.Loaded);
          })
          .catch((error: Error) => {
            console.error(error);
            setWorldLoadState(WorldLoadState.Error);
          });
      } else if (worldLoadState === WorldLoadState.Loaded) {
        setWorldLoadState(WorldLoadState.Entering);
        onEnterWorld().catch((error: Error) => {
          console.error(error);
          setWorldLoadState(WorldLoadState.Error);
        });
      }
    },
    [room, worldLoadState, onLoadWorld, onEnterWorld]
  );

  return (
    <div className="RoomPreview grow flex flex-column justify-end items-center">
      <div className="RoomPreview__card flex items-center">
        <div className="grow">
          <Text className="truncate" variant="s1" weight="semi-bold">
            {room.name || "Unnamed Room"}
          </Text>
        </div>
        <div className="RoomPreview__card-memberCount flex items-center">
          <Icon src={PeoplesIC} />
          {room.joinedMemberCount}
        </div>
        <div className="shrink-0">
          <Button
            variant={worldLoadState === WorldLoadState.Loaded ? "primary" : "secondary"}
            onClick={onClickRoomLoadButton}
          >
            {WorldLoadButtonText[worldLoadState]}
          </Button>
        </div>
      </div>
    </div>
  );
}
