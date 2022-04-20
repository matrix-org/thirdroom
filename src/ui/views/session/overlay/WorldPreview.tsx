import { useState, useEffect, useCallback, MouseEvent } from "react";
import { Room, RoomBeingCreated, RoomStatus, Session } from "@thirdroom/hydrogen-view-sdk";
import { useNavigate } from "react-router-dom";

import "./WorldPreview.css";
import { Text } from "../../../atoms/text/Text";
import { Icon } from "../../../atoms/icon/Icon";
import { Button } from "../../../atoms/button/Button";
import PeoplesIC from "../../../../../res/ic/peoples.svg";
import { useRoomStatus } from "../../../hooks/useRoomStatus";
import { useAsyncCallback } from "../../../hooks/useAsyncCallback";

interface IWorldPreview {
  session: Session;
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

export function WorldPreview({ session, room, roomId, onLoadWorld, onEnterWorld }: IWorldPreview) {
  const navigate = useNavigate();
  const { loading: roomStatusLoading, error: roomStatusError, value: roomStatus } = useRoomStatus(session, roomId);
  const [worldLoadState, setWorldLoadState] = useState<WorldLoadState>(WorldLoadState.Preview);

  useEffect(() => {
    setWorldLoadState(WorldLoadState.Preview);
  }, [room]);

  const {
    callback: onJoinWorld,
    error: joinRoomError,
    loading: joiningRoom,
  } = useAsyncCallback(
    async (roomId: string) => {
      await session.joinRoom(roomId);
    },
    [session]
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

  useEffect(() => {
    // TODO: Check that room is a World and not just a normal matrix room.
    if (room && roomStatus !== undefined && (roomStatus & RoomStatus.Replaced) !== 0) {
      const roomBeingCreated = room as RoomBeingCreated;
      navigate(`/world/${roomBeingCreated.roomId}`);
    }
  }, [navigate, roomStatus, room]);

  if (worldLoadState === WorldLoadState.Entered) {
    return null;
  }

  if (roomStatus === undefined) {
    return (
      <div className="RoomPreview grow flex flex-column justify-end items-center">
        <div className="RoomPreview__card flex items-center">
          {roomStatusLoading && (
            <div className="grow">
              <Text className="truncate" variant="s1" weight="semi-bold">
                Loading Room...
              </Text>
            </div>
          )}
          {roomStatusError && (
            <div className="grow">
              <Text className="truncate" variant="s1" weight="semi-bold">
                {`Error loading world: ${roomStatusError}`}
              </Text>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (joiningRoom) {
    return (
      <div className="RoomPreview grow flex flex-column justify-end items-center">
        <div className="RoomPreview__card flex items-center">
          <div className="grow">
            <Text className="truncate" variant="s1" weight="semi-bold">
              {room?.name || "Unnamed Room"}
            </Text>
          </div>
          <div className="shrink-0">
            <Button variant="primary" disabled onClick={() => {}}>
              Joining World...
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (joinRoomError) {
    return (
      <div className="RoomPreview grow flex flex-column justify-end items-center">
        <div className="RoomPreview__card flex items-center">
          <div className="grow">
            <Text className="truncate" variant="s1" weight="semi-bold">
              {room?.name || "Unnamed Room"}
            </Text>
          </div>
          <div className="grow">
            <Text className="truncate" variant="s1" weight="semi-bold">
              {`Error joining world: ${joinRoomError.message}`}
            </Text>
          </div>
        </div>
      </div>
    );
  }

  if (roomStatus & RoomStatus.Replaced) {
    return null;
  }

  return (
    <div className="RoomPreview grow flex flex-column justify-end items-center">
      <div className="RoomPreview__card flex items-center">
        {(roomStatus & RoomStatus.BeingCreated) !== 0 && (
          <div className="grow">
            <Text className="truncate" variant="s1" weight="semi-bold">
              Creating Room...
            </Text>
          </div>
        )}
        {(roomStatus & RoomStatus.Invited) !== 0 && (
          <div className="grow">
            <Text className="truncate" variant="s1" weight="semi-bold">
              Invited To Room
            </Text>
          </div>
        )}
        {(roomStatus & RoomStatus.Archived) !== 0 && (
          <div className="grow">
            <Text className="truncate" variant="s1" weight="semi-bold">
              Room Archived
            </Text>
          </div>
        )}
        {(roomStatus & RoomStatus.Joined) !== 0 && (
          <>
            <div className="grow">
              <Text className="truncate" variant="s1" weight="semi-bold">
                {room?.name || "Unnamed Room"}
              </Text>
            </div>
            <div className="RoomPreview__card-memberCount flex items-center">
              <Icon src={PeoplesIC} />
              {room?.joinedMemberCount || 0}
            </div>
            <div className="shrink-0">
              <Button
                variant={worldLoadState === WorldLoadState.Loaded ? "primary" : "secondary"}
                onClick={onClickRoomLoadButton}
              >
                {WorldLoadButtonText[worldLoadState]}
              </Button>
            </div>
          </>
        )}
        {roomStatus === RoomStatus.None && (
          <>
            <div className="grow">
              <Text className="truncate" variant="s1" weight="semi-bold">
                {room?.name || "Unnamed Room"}
              </Text>
            </div>
            <div className="shrink-0">
              <Button variant="primary" onClick={() => onJoinWorld(roomId)}>
                Join World
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
