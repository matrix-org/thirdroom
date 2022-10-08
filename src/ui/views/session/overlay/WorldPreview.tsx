import { MouseEventHandler, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { RoomStatus, Session } from "@thirdroom/hydrogen-view-sdk";

import "./WorldPreview.css";
import { Button } from "../../../atoms/button/Button";
import { WorldPreviewCard } from "../../components/world-preview-card/WorldPreviewCard";
import { useStore, WorldLoadState } from "../../../hooks/useStore";
import { useRoom } from "../../../hooks/useRoom";
import { useHydrogen } from "../../../hooks/useHydrogen";
import { useRoomStatus } from "../../../hooks/useRoomStatus";
import { useRoomBeingCreated } from "../../../hooks/useRoomBeingCreated";
import { Dots } from "../../../atoms/loading/Dots";
import { useInviteControl } from "../../../hooks/useInviteControl";
import { MemberListDialog } from "../dialogs/MemberListDialog";
import { Dialog } from "../../../atoms/dialog/Dialog";
import { usePermissionState } from "../../../hooks/usePermissionState";
import { exceptionToString, useStreamRequest, RequestException } from "../../../hooks/useStreamRequest";
import { AlertDialog } from "../dialogs/AlertDialog";
import { Text } from "../../../atoms/text/Text";
import { useMainThreadContext } from "../../../hooks/useMainThread";
import { FetchProgressMessage, FetchProgressMessageType } from "../../../../engine/utils/fetchWithProgress.game";
import { registerMessageHandler } from "../../../../engine/module/module.common";
import { IMainThreadContext } from "../../../../engine/MainThread";
import { Progress } from "../../../atoms/progress/Progress";
import { bytesToSize, getPercentage } from "../../../utils/common";
import { roomIdToAlias } from "../../../utils/matrixUtils";

interface InviteWorldPreviewProps {
  session: Session;
  roomId: string;
}

function InviteWorldPreview({ session, roomId }: InviteWorldPreviewProps) {
  const { invite, accept, reject } = useInviteControl(session, roomId);

  if (invite === undefined) return <WorldPreviewCard title="Failed to load Invite" />;

  return (
    <WorldPreviewCard
      title={invite.name}
      desc={`${invite.inviter.name} invites you`}
      options={
        <div className="flex gap-xs">
          {!(invite.accepting || invite.accepted) && (
            <Button fill="outline" onClick={reject} disabled={invite.rejecting}>
              {invite.rejecting ? <Dots color="primary" /> : "Reject"}
            </Button>
          )}
          {!(invite.rejecting || invite.rejected) && (
            <Button onClick={accept} disabled={invite.accepting}>
              {invite.accepting ? <Dots color="on-primary" /> : "Accept"}
            </Button>
          )}
        </div>
      }
    />
  );
}

interface IWorldPreview {
  onReloadWorld: MouseEventHandler<HTMLButtonElement>;
  onEnterWorld: MouseEventHandler<HTMLButtonElement>;
}

export function WorldPreview({ onReloadWorld, onEnterWorld }: IWorldPreview) {
  const navigate = useNavigate();
  const { session, platform } = useHydrogen(true);
  const micPermission = usePermissionState("microphone");
  const requestStream = useStreamRequest(platform, micPermission);
  const [micException, setMicException] = useState<RequestException>();

  const engine = useMainThreadContext();

  const { worldId, selectedWorldId, joiningWorld, loadState, error, closeOverlay } = useStore((state) => ({
    selectedWorldId: state.overlayWorld.selectedWorldId,
    worldId: state.world.worldId,
    joiningWorld: state.world.joiningWorld,
    loadState: state.world.loadState,
    error: state.world.error,
    closeOverlay: state.overlay.closeOverlay,
  }));

  const previewWorldId = selectedWorldId || worldId;

  const room = useRoom(session, previewWorldId);
  const roomBeingCreated = useRoomBeingCreated(session, previewWorldId);

  const [isMemberDialog, setIsMemberDialog] = useState(false);

  const {
    loading: roomStatusLoading,
    error: roomStatusError,
    value: roomStatus,
  } = useRoomStatus(session, previewWorldId);

  useEffect(() => {
    if (!roomBeingCreated) return;
    if (roomStatus === undefined) return;

    if ((roomStatus & RoomStatus.Replaced) !== 0 && roomStatus & RoomStatus.BeingCreated) {
      navigate(`/world/${roomBeingCreated.roomId}`);
    }
  }, [navigate, roomStatus, roomBeingCreated]);

  const [loadProgress, setLoadProgress] = useState<{ loaded: number; total: number }>({ loaded: 0, total: 0 });
  useEffect(() => {
    const onFetchProgress = (ctx: IMainThreadContext, message: FetchProgressMessage) => {
      setLoadProgress(message.status);
    };
    return registerMessageHandler(engine, FetchProgressMessageType, onFetchProgress);
  }, [engine]);

  const handleLoadWorld = () => {
    if (!selectedWorldId) return;
    navigate(`/world/${roomIdToAlias(session.rooms, selectedWorldId) ?? selectedWorldId}`);
  };
  const handleJoinWorld = async () => {
    if (!selectedWorldId) return;
    try {
      useStore.getState().world.joinWorld();
      await session.joinRoom(selectedWorldId);
    } catch (error) {
      useStore.getState().world.setWorldError(error as Error);
    }
  };

  return (
    <div className="WorldPreview grow flex flex-column justify-end items-center">
      {room && (
        <Dialog open={isMemberDialog} onOpenChange={setIsMemberDialog}>
          <MemberListDialog room={room} requestClose={() => setIsMemberDialog(false)} />
        </Dialog>
      )}
      {(() => {
        if (roomStatus === undefined) {
          if (roomStatusLoading) {
            return <WorldPreviewCard title="Loading Room..." />;
          } else if (room === undefined) {
            return null;
          } else {
            return (
              <WorldPreviewCard
                title="Loading Failed"
                desc={roomStatusError ? `Error loading world: ${roomStatusError}` : "Unknown error occured"}
              />
            );
          }
        } else if (roomStatus & RoomStatus.Replaced) {
          return null;
        } else if (roomStatus & RoomStatus.BeingCreated) {
          return <WorldPreviewCard title="Creating Room..." />;
        } else if (roomStatus & RoomStatus.Invited) {
          if (!previewWorldId) {
            return <WorldPreviewCard title="Loading Room..." />;
          }

          return <InviteWorldPreview session={session} roomId={previewWorldId} />;
        } else if (roomStatus & RoomStatus.Archived) {
          return <WorldPreviewCard title="Room Archived" />;
        } else if (roomStatus & RoomStatus.Joined) {
          const roomName = room?.name || "Unnamed Room";
          const memberCount = room?.joinedMemberCount || 0;

          if (selectedWorldId !== worldId) {
            return (
              <WorldPreviewCard
                title={roomName}
                memberCount={memberCount}
                onMembersClick={() => setIsMemberDialog(true)}
                options={
                  <Button size="lg" variant="secondary" onClick={handleLoadWorld}>
                    Load World
                  </Button>
                }
              />
            );
          }

          switch (loadState) {
            case WorldLoadState.None:
              return (
                <WorldPreviewCard
                  title={roomName}
                  memberCount={memberCount}
                  onMembersClick={() => setIsMemberDialog(true)}
                  options={
                    <Button size="lg" variant="secondary" onClick={handleLoadWorld}>
                      Load World
                    </Button>
                  }
                />
              );
            case WorldLoadState.Loading:
              return (
                <WorldPreviewCard
                  title={roomName}
                  memberCount={memberCount}
                  onMembersClick={() => setIsMemberDialog(true)}
                  content={
                    <div className="flex flex-column gap-xs">
                      <Progress
                        variant="secondary"
                        max={100}
                        value={loadProgress.total === 0 ? 0 : getPercentage(loadProgress.total, loadProgress.loaded)}
                      />
                      <div className="flex justify-between gap-md">
                        <Text color="surface-low" variant="b3">
                          {`Loading: ${getPercentage(loadProgress.total, loadProgress.loaded)}%`}
                        </Text>
                        <Text color="surface-low" variant="b3">{`${bytesToSize(loadProgress.loaded)} / ${bytesToSize(
                          loadProgress.total
                        )}`}</Text>
                      </div>
                    </div>
                  }
                />
              );
            case WorldLoadState.Loaded:
              return (
                <WorldPreviewCard
                  title={roomName}
                  memberCount={memberCount}
                  onMembersClick={() => setIsMemberDialog(true)}
                  options={
                    <>
                      {micException && (
                        <AlertDialog
                          open={!!micException}
                          title="Microphone"
                          content={
                            <div className="flex flex-column gap-xs">
                              <Text variant="b2">{exceptionToString(micException)}</Text>
                              <Text variant="b2">
                                Connecting to other users may be unreliable without microphone access. We intend to fix
                                this in the near future.
                              </Text>
                            </div>
                          }
                          buttons={
                            <Button fill="outline" onClick={onEnterWorld}>
                              Enter without Microphone
                            </Button>
                          }
                          requestClose={() => setMicException(undefined)}
                        />
                      )}
                      <Button
                        size="lg"
                        variant="primary"
                        onClick={async (evt) => {
                          if (micPermission === "granted") {
                            onEnterWorld(evt);
                            return;
                          }
                          const [stream, exception] = await requestStream(true, false);
                          if (stream) {
                            stream.getAudioTracks().forEach((track) => track.stop());
                            onEnterWorld(evt);
                          }
                          if (exception) setMicException(exception);
                        }}
                      >
                        Enter World
                      </Button>
                    </>
                  }
                />
              );
            case WorldLoadState.Error:
              return (
                <WorldPreviewCard
                  title={roomName}
                  memberCount={memberCount}
                  onMembersClick={() => setIsMemberDialog(true)}
                  desc={error ? error.message : "Unknown error"}
                  options={
                    <Button size="lg" variant="secondary" onClick={onReloadWorld}>
                      Reload World
                    </Button>
                  }
                />
              );
            case WorldLoadState.Entering:
              return (
                <WorldPreviewCard
                  title={roomName}
                  memberCount={memberCount}
                  onMembersClick={() => setIsMemberDialog(true)}
                  options={
                    <Button size="lg" variant="secondary" disabled>
                      Entering...
                    </Button>
                  }
                />
              );
            case WorldLoadState.Entered:
              return (
                <WorldPreviewCard
                  title={roomName}
                  memberCount={memberCount}
                  onMembersClick={() => setIsMemberDialog(true)}
                  options={
                    <Button size="lg" variant="secondary" onClick={closeOverlay}>
                      Close Overlay
                    </Button>
                  }
                />
              );
          }
        } else if (roomStatus === RoomStatus.None) {
          if (error) {
            return <WorldPreviewCard title="Unnamed Room" desc={`Error joining world: ${error.message}`} />;
          }

          return (
            <WorldPreviewCard
              title="Unnamed Room"
              options={
                <Button size="lg" variant="primary" disabled={joiningWorld} onClick={handleJoinWorld}>
                  {joiningWorld ? "Joining World..." : "Join World"}
                </Button>
              }
            />
          );
        }

        return <WorldPreviewCard title="Unknown error occurred" />;
      })()}
    </div>
  );
}
