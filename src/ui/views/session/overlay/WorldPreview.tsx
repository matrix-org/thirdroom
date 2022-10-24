import { useState } from "react";
import { RoomStatus, Session } from "@thirdroom/hydrogen-view-sdk";

import "./WorldPreview.css";
import { Button } from "../../../atoms/button/Button";
import { WorldPreviewCard } from "../../components/world-preview-card/WorldPreviewCard";
import { useStore } from "../../../hooks/useStore";
import { useRoom } from "../../../hooks/useRoom";
import { useHydrogen } from "../../../hooks/useHydrogen";
import { useRoomStatus } from "../../../hooks/useRoomStatus";
import { Dots } from "../../../atoms/loading/Dots";
import { useInviteControl } from "../../../hooks/useInviteControl";
import { MemberListDialog } from "../dialogs/MemberListDialog";
import { Dialog } from "../../../atoms/dialog/Dialog";
import { usePermissionState } from "../../../hooks/usePermissionState";
import { exceptionToString, useStreamRequest, RequestException } from "../../../hooks/useStreamRequest";
import { AlertDialog } from "../dialogs/AlertDialog";
import { Text } from "../../../atoms/text/Text";
import { useWorldAction } from "../../../hooks/useWorldAction";
import { useUnknownWorldPath } from "../../../hooks/useWorld";
import { useAsyncCallback } from "../../../hooks/useAsyncCallback";

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

function JoinWorldCard({ worldIdOrAlias }: { worldIdOrAlias: string }) {
  const { selectWorld } = useStore((state) => state.overlayWorld);
  const { session } = useHydrogen(true);

  const {
    loading,
    error,
    callback: joinRoomCallback,
  } = useAsyncCallback<(roomIdOrAlias: string) => Promise<string>, string>(async (roomIdOrAlias) => {
    const roomId = await session.joinRoom(roomIdOrAlias);
    return roomId;
  }, []);

  const handleJoinWorld = async (roomIdOrAlias: string) => {
    const roomId = await joinRoomCallback(roomIdOrAlias);
    if (roomId) {
      selectWorld(roomId);
    }
  };

  return (
    <WorldPreviewCard
      title={worldIdOrAlias.startsWith("#") ? worldIdOrAlias : "Unknown world"}
      desc={error && error.message}
      options={(() => {
        if (loading) {
          // TODO: this doesn't work because the parent component's state changes when joining
          return (
            <Button variant="secondary" disabled>
              Joining...
            </Button>
          );
        }
        if (error) return null;
        return (
          <Button variant="secondary" onClick={() => handleJoinWorld(worldIdOrAlias)}>
            Join World
          </Button>
        );
      })()}
    />
  );
}

export function WorldPreview() {
  const { session, platform } = useHydrogen(true);
  const micPermission = usePermissionState("microphone");
  const requestStream = useStreamRequest(platform, micPermission);
  const [micException, setMicException] = useState<RequestException>();

  const { enterWorld } = useWorldAction(session);

  const worldId = useStore((state) => state.world.worldId);
  const { selectedWorldId } = useStore((state) => state.overlayWorld);
  const [unknownWorldId, unknownWorldAlias] = useUnknownWorldPath();

  const previewWorldId = selectedWorldId || worldId;

  const room = useRoom(session, previewWorldId);

  const [isMemberDialog, setIsMemberDialog] = useState(false);

  const {
    loading: roomStatusLoading,
    error: roomStatusError,
    value: roomStatus,
  } = useRoomStatus(session, previewWorldId);

  const handleLoadWorld = () => {
    if (!selectedWorldId) return;
    enterWorld(selectedWorldId);
  };

  return (
    <div className="WorldPreview grow flex flex-column justify-end items-center">
      {room && (
        <Dialog open={isMemberDialog} onOpenChange={setIsMemberDialog}>
          <MemberListDialog room={room} requestClose={() => setIsMemberDialog(false)} />
        </Dialog>
      )}
      {(() => {
        const unknownIdOrAlias = unknownWorldAlias ?? unknownWorldId;
        if (!previewWorldId && unknownIdOrAlias) {
          return <JoinWorldCard worldIdOrAlias={unknownIdOrAlias} />;
        }
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
          return (
            <WorldPreviewCard
              title={room?.name || "Unnamed Room"}
              memberCount={room?.joinedMemberCount || 0}
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
                            Connecting to other users may be unreliable without microphone access. We intend to fix this
                            in the near future.
                          </Text>
                        </div>
                      }
                      buttons={
                        <Button fill="outline" onClick={handleLoadWorld}>
                          Enter without Microphone
                        </Button>
                      }
                      requestClose={() => setMicException(undefined)}
                    />
                  )}
                  <Button
                    size="lg"
                    variant="primary"
                    onClick={async () => {
                      if (micPermission === "granted") {
                        handleLoadWorld();
                        return;
                      }
                      const [stream, exception] = await requestStream(true, false);
                      if (stream) {
                        stream.getAudioTracks().forEach((track) => track.stop());
                        handleLoadWorld();
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
        }

        // TODO: this default case may not only be the loading state
        return <WorldPreviewCard title="Joining World..." />;
      })()}
    </div>
  );
}
