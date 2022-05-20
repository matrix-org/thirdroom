import { useEffect, useCallback, MouseEvent } from "react";
import { Room, RoomStatus, Session } from "@thirdroom/hydrogen-view-sdk";
import { useNavigate } from "react-router-dom";

import "./WorldPreview.css";
import { Button } from "../../../atoms/button/Button";
import { WorldPreviewCard, IWorldPreviewCard } from "../../components/world-preview-card/WorldPreviewCard";
import { useRoomStatus } from "../../../hooks/useRoomStatus";
import { useAsyncCallback } from "../../../hooks/useAsyncCallback";
import { useRoom } from "../../../hooks/useRoom";
import { useStore, WorldLoadState } from "../../../hooks/useStore";
import { useRoomBeingCreated } from "../../../hooks/useRoomBeingCreated";

interface IWorldPreview {
  session: Session;
  onLoadWorld: (room: Room) => Promise<void>;
  onEnterWorld: (room: Room) => Promise<void>;
}

const WorldLoadButtonText: { [key in WorldLoadState]: string } = {
  [WorldLoadState.None]: "Load Room",
  [WorldLoadState.Loading]: "Loading...",
  [WorldLoadState.Loaded]: "Enter Room",
  [WorldLoadState.Entering]: "Entering...",
  [WorldLoadState.Error]: "Reload Room",
  [WorldLoadState.Entered]: "Close Overlay",
};

export function WorldPreview({ session, onLoadWorld, onEnterWorld }: IWorldPreview) {
  const navigate = useNavigate();
  const selectedWorldId = useStore((state) => state.overlayWorld.selectedWorldId);
  const closeOverlay = useStore((state) => state.overlay.closeOverlay);
  const { worldId, loadState, loadError, loadingWorld, loadedWorld, loadWorldError, enteringWorld, enteredWorld } =
    useStore((state) => state.world);

  const previewWorldId = selectedWorldId || worldId;
  const isPreviewLoaded = previewWorldId === worldId;

  const room = useRoom(session, previewWorldId);
  const roomBeingCreated = useRoomBeingCreated(session, previewWorldId);

  const {
    loading: roomStatusLoading,
    error: roomStatusError,
    value: roomStatus,
  } = useRoomStatus(session, previewWorldId);

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

      if ((!isPreviewLoaded || loadState === WorldLoadState.None) && room) {
        loadingWorld(room.id);
        onLoadWorld(room)
          .then(() => {
            loadedWorld();
          })
          .catch((error: Error) => {
            console.error(error);
            loadWorldError(error);
          });
      } else if (loadState === WorldLoadState.Loaded && room) {
        enteringWorld();
        onEnterWorld(room)
          .then(() => {
            enteredWorld();
          })
          .catch((error: Error) => {
            console.error(error);
            loadWorldError(error);
          });
      } else if (loadState === WorldLoadState.Entered) {
        closeOverlay();
      }
    },
    [
      loadState,
      room,
      isPreviewLoaded,
      loadingWorld,
      onLoadWorld,
      loadedWorld,
      loadWorldError,
      enteringWorld,
      onEnterWorld,
      enteredWorld,
      closeOverlay,
    ]
  );

  useEffect(() => {
    if (
      roomBeingCreated &&
      roomStatus !== undefined &&
      (roomStatus & RoomStatus.Replaced) !== 0 &&
      roomStatus & RoomStatus.BeingCreated
    ) {
      navigate(`/world/${roomBeingCreated.roomId}`);
    }
  }, [navigate, roomStatus, roomBeingCreated]);

  if (!selectedWorldId && !worldId) {
    return null;
  }

  const renderCard = (props: IWorldPreviewCard) => (
    <div className="WorldPreview grow flex flex-column justify-end items-center">
      <WorldPreviewCard {...props} />
    </div>
  );

  if (roomStatus === undefined) {
    if (roomStatusLoading) return renderCard({ title: "Loading Room..." });
    if (roomStatusError)
      return renderCard({ title: "Loading Failed", desc: `Error loading world: ${roomStatusError}` });
    return renderCard({ title: "Loading Failed", desc: "Unknown error occurred" });
  }

  if (joiningRoom) {
    return renderCard({
      title: room?.name || "Unnamed Room",
      options: (
        <Button size="lg" variant="primary" disabled onClick={() => {}}>
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

  if (roomStatus & RoomStatus.Replaced) {
    return null;
  }

  let title;
  let memberCount;
  let options;
  let desc;
  if (roomStatus & RoomStatus.BeingCreated) title = "Creating Room...";
  else if (roomStatus & RoomStatus.Invited) title = "Invited To Room";
  else if (roomStatus & RoomStatus.Archived) title = "Room Archived";
  else if (roomStatus & RoomStatus.Joined) {
    title = room?.name || "Unnamed Room";
    memberCount = room?.joinedMemberCount || 0;
    desc = isPreviewLoaded && loadError ? loadError.message : undefined;
    options = (
      <Button
        size="lg"
        variant={isPreviewLoaded && loadState === WorldLoadState.Loaded ? "primary" : "secondary"}
        onClick={onClickRoomLoadButton}
      >
        {isPreviewLoaded ? WorldLoadButtonText[loadState] : WorldLoadButtonText[WorldLoadState.None]}
      </Button>
    );
  } else if (roomStatus === RoomStatus.None && selectedWorldId) {
    title = room?.name || "Unnamed Room";
    options = (
      <Button size="lg" variant="primary" onClick={() => onJoinWorld(selectedWorldId)}>
        Join World
      </Button>
    );
  } else title = "Unknown error occurred";
  return renderCard({ title, memberCount, desc, options });
}
