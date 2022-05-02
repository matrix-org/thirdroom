import { useState, useEffect, useCallback, MouseEvent } from "react";
import { Room, MatrixClient } from "@thirdroom/matrix-js-sdk";

import "./WorldPreview.css";
import { Button } from "../../../atoms/button/Button";
import { WorldPreviewCard, IWorldPreviewCard } from "../../components/world-preview-card/WorldPreviewCard";
import { useAsyncCallback } from "../../../hooks/useAsyncCallback";

interface IWorldPreview {
  client: MatrixClient;
  roomId: string;
  room?: Room;
  onLoadWorld: (room: Room) => Promise<void>;
  onEnterWorld: (room: Room) => Promise<void>;
}

enum WorldLoadState {
  Preview = "preview",
  Loading = "loading",
  Loaded = "loaded",
  Entering = "entering",
  Entered = "entered",
  Error = "error",
}

const WorldLoadButtonText: { [key in WorldLoadState]: string } = {
  [WorldLoadState.Preview]: "Load Room",
  [WorldLoadState.Loading]: "Loading...",
  [WorldLoadState.Loaded]: "Enter Room",
  [WorldLoadState.Entering]: "Entering...",
  [WorldLoadState.Error]: "Error",
  [WorldLoadState.Entered]: "Entered",
};

export function WorldPreview({ client, room, roomId, onLoadWorld, onEnterWorld }: IWorldPreview) {
  const [worldLoadState, setWorldLoadState] = useState<WorldLoadState>(WorldLoadState.Preview);

  useEffect(() => {
    setWorldLoadState(WorldLoadState.Preview);
  }, [roomId]);

  const {
    callback: onJoinWorld,
    error: joinRoomError,
    loading: joiningRoom,
  } = useAsyncCallback(
    async (roomId: string) => {
      await client.joinRoom(roomId);
    },
    [client]
  );

  const onClickRoomLoadButton = useCallback(
    (e: MouseEvent) => {
      e.preventDefault();

      if (worldLoadState === WorldLoadState.Preview && room) {
        setWorldLoadState(WorldLoadState.Loading);
        onLoadWorld(room)
          .then(() => {
            setWorldLoadState(WorldLoadState.Loaded);
          })
          .catch((error: Error) => {
            console.error(error);
            setWorldLoadState(WorldLoadState.Error);
          });
      } else if (worldLoadState === WorldLoadState.Loaded && room) {
        setWorldLoadState(WorldLoadState.Entering);
        onEnterWorld(room)
          .then(() => {
            setWorldLoadState(WorldLoadState.Entered);
          })
          .catch((error: Error) => {
            console.error(error);
            setWorldLoadState(WorldLoadState.Error);
          });
      }
    },
    [room, worldLoadState, onLoadWorld, onEnterWorld]
  );

  if (worldLoadState === WorldLoadState.Entered) {
    return null;
  }

  const renderCard = (props: IWorldPreviewCard) => (
    <div className="WorldPreview grow flex flex-column justify-end items-center">
      <WorldPreviewCard {...props} />
    </div>
  );

  if (joiningRoom) {
    return renderCard({
      title: room?.name || "Unnamed Room",
      options: (
        <Button variant="primary" disabled onClick={() => {}}>
          Joining World...
        </Button>
      ),
    });
  }

  if (joinRoomError) {
    return renderCard({
      title: room?.name || "Unnamed Room",
      desc: `Error joining world: ${joinRoomError.message}`,
    });
  }

  // if (roomStatus === undefined) {
  //   if (roomStatusLoading) return renderCard({ title: "Loading Room..." });
  //   if (roomStatusError)
  //     return renderCard({ title: "Loading Failed", desc: `Error loading world: ${roomStatusError}` });
  //   return renderCard({ title: "Loading Failed", desc: "Unknown error occurs" });
  // }

  // if (roomStatus & RoomStatus.Replaced) {
  //   return null;
  // }

  // let title;
  // let memberCount;
  // let options;
  // if (roomStatus & RoomStatus.BeingCreated) title = "Creating Room...";
  // else if (roomStatus & RoomStatus.Invited) title = "Invited To Room";
  // else if (roomStatus & RoomStatus.Archived) title = "Room Archived";
  // else if (roomStatus & RoomStatus.Joined) {
  //   title = room?.name || "Unnamed Room";
  //   memberCount = room?.joinedMemberCount || 0;
  //   options = (
  //     <Button
  //       variant={worldLoadState === WorldLoadState.Loaded ? "primary" : "secondary"}
  //       onClick={onClickRoomLoadButton}
  //     >
  //       {WorldLoadButtonText[worldLoadState]}
  //     </Button>
  //   );
  // } else if (roomStatus === RoomStatus.None) {
  //   title = room?.name || "Unnamed Room";
  //   options = (
  //     <Button variant="primary" onClick={() => onJoinWorld(roomId)}>
  //       Join World
  //     </Button>
  //   );
  // } else title = "Unknown error occurs";
  // return renderCard({ title, memberCount, options });

  if (room) {
    return renderCard({
      title: room?.name || "Unnamed Room",
      memberCount: room.getJoinedMemberCount(),
      options: (
        <Button
          variant={worldLoadState === WorldLoadState.Loaded ? "primary" : "secondary"}
          onClick={onClickRoomLoadButton}
        >
          {WorldLoadButtonText[worldLoadState]}
        </Button>
      ),
    });
  } else {
    return renderCard({
      title: "Unnamed Room",
      options: (
        <Button variant="primary" onClick={() => onJoinWorld(roomId)}>
          Join World
        </Button>
      ),
    });
  }
}
