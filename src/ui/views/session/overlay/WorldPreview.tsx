import { useEffect, useCallback, MouseEvent } from "react";
import { Room, RoomStatus, Session } from "@thirdroom/hydrogen-view-sdk";
import { useNavigate } from "react-router-dom";

import "./WorldPreview.css";
import { Button } from "../../../atoms/button/Button";
import { WorldPreviewCard } from "../../components/world-preview-card/WorldPreviewCard";
import { useRoomStatus } from "../../../hooks/useRoomStatus";
import { useAsyncCallback } from "../../../hooks/useAsyncCallback";
import { useRoom } from "../../../hooks/useRoom";
import { useStore, WorldLoadState } from "../../../hooks/useStore";
import { useRoomBeingCreated } from "../../../hooks/useRoomBeingCreated";

interface JoinWorldPreviewProps {
  session: Session;
  roomId: string;
}
function JoinWorldPreview({ session, roomId }: JoinWorldPreviewProps) {
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

  if (joinRoomError) {
    return <WorldPreviewCard title="Unnamed Room" desc={`Error joining world: ${joinRoomError.message}`} />;
  }
  return (
    <WorldPreviewCard
      title="Unnamed Room"
      options={
        <Button size="lg" variant="primary" disabled={joiningRoom} onClick={() => onJoinWorld(roomId)}>
          {joiningRoom ? "Joining World..." : "Join World"}
        </Button>
      }
    />
  );
}

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

  const onClickRoomLoadButton = useCallback(
    async (e: MouseEvent) => {
      e.preventDefault();
      if (!room) return;

      if (isPreviewLoaded) {
        if (loadState === WorldLoadState.Entered) {
          closeOverlay();
          return;
        }
        if (loadState === WorldLoadState.Loaded) {
          enteringWorld();
          try {
            await onEnterWorld(room);
            enteredWorld();
          } catch (error: any) {
            console.error(error);
            loadWorldError(error);
          }
        }
      }

      if (isPreviewLoaded === false || loadState === WorldLoadState.None) {
        loadingWorld(room.id);
        try {
          await onLoadWorld(room);
          loadedWorld();
        } catch (error: any) {
          console.error(error);
          loadWorldError(error);
        }
        return;
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
    if (!roomBeingCreated) return;
    if (roomStatus === undefined) return;

    if ((roomStatus & RoomStatus.Replaced) !== 0 && roomStatus & RoomStatus.BeingCreated) {
      navigate(`/world/${roomBeingCreated.roomId}`);
    }
  }, [navigate, roomStatus, roomBeingCreated]);

  if (!selectedWorldId && !worldId) {
    return null;
  }

  return (
    <div className="WorldPreview grow flex flex-column justify-end items-center">
      {(() => {
        if (roomStatus === undefined) {
          if (roomStatusLoading) return <WorldPreviewCard title="Loading Room..." />;
          return (
            <WorldPreviewCard
              title="Loading Failed"
              desc={roomStatusError ? `Error loading world: ${roomStatusError}` : "Unknown error occured"}
            />
          );
        }

        if (roomStatus & RoomStatus.Replaced) {
          return null;
        }

        if (roomStatus & RoomStatus.BeingCreated) return <WorldPreviewCard title="Creating Room..." />;
        if (roomStatus & RoomStatus.Invited) <WorldPreviewCard title="Invited To Room" />;
        if (roomStatus & RoomStatus.Archived) <WorldPreviewCard title="Room Archived" />;

        if (roomStatus & RoomStatus.Joined) {
          return (
            <WorldPreviewCard
              title={room?.name || "Unnamed Room"}
              memberCount={room?.joinedMemberCount || 0}
              desc={isPreviewLoaded && loadError ? loadError.message : undefined}
              options={
                <Button
                  size="lg"
                  variant={isPreviewLoaded && loadState === WorldLoadState.Loaded ? "primary" : "secondary"}
                  onClick={onClickRoomLoadButton}
                >
                  {isPreviewLoaded ? WorldLoadButtonText[loadState] : WorldLoadButtonText[WorldLoadState.None]}
                </Button>
              }
            />
          );
        }
        if (roomStatus === RoomStatus.None && selectedWorldId) {
          return <JoinWorldPreview session={session} roomId={selectedWorldId} />;
        }

        return <WorldPreviewCard title="Unknown error occurred" />;
      })()}
    </div>
  );
}
