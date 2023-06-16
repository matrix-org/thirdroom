import { GroupCall, Room, RoomStatus, Session } from "@thirdroom/hydrogen-view-sdk";
import { useSetAtom } from "jotai";
import { useCallback, useState } from "react";

import { InteractableType } from "../../../../engine/resource/schema";
import { InteractableAction } from "../../../../plugins/interaction/interaction.common";
import { useIsMounted } from "../../../hooks/useIsMounted";
import { useMainThreadContext } from "../../../hooks/useMainThread";
import { useMemoizedState } from "../../../hooks/useMemoizedState";
import { overlayWorldAtom } from "../../../state/overlayWorld";
import { aliasToRoomId, getMxIdUsername, parseMatrixUri } from "../../../utils/matrixUtils";
import { InteractionState, useWorldInteraction } from "../../../hooks/useWorldInteraction";
import { Dialog } from "../../../atoms/dialog/Dialog";
import { EntityTooltip } from "../entity-tooltip/EntityTooltip";
import { MemberListDialog } from "../dialogs/MemberListDialog";
import { getModule } from "../../../../engine/module/module.common";
import { CameraRigModule } from "../../../../plugins/camera/CameraRig.main";
import { Reticle } from "../reticle/Reticle";
import { useWorldNavigator } from "../../../hooks/useWorldNavigator";
import { useWorldLoader } from "../../../hooks/useWorldLoader";
import { useHydrogen } from "../../../hooks/useHydrogen";

export interface IInteractionProcess {
  loading?: boolean;
  error?: Error;
}

interface WorldInteractionProps {
  session: Session;
  world: Room;
  activeCall?: GroupCall;
}

export function WorldInteraction({ session, world, activeCall }: WorldInteractionProps) {
  const mainThread = useMainThreadContext();
  const camRigModule = getModule(mainThread, CameraRigModule);

  const [activeEntity, setActiveEntity] = useMemoizedState<InteractionState | undefined>();
  const [interactionProcess, setInteractionProcess] = useMemoizedState<IInteractionProcess>({});
  const [members, setMembers] = useState(false);
  const { platform } = useHydrogen(true);

  const { navigateEnterWorld } = useWorldNavigator(session);
  const { exitWorld } = useWorldLoader();
  const selectWorld = useSetAtom(overlayWorldAtom);
  const isMounted = useIsMounted();

  const handleScreenshareGrab = useCallback(
    async (interaction) => {
      setInteractionProcess({});

      if (!activeCall) {
        setInteractionProcess({ error: new Error("no active call") });
        return;
      }
      const { peerId } = interaction;
      if (peerId) {
        // Someone else is already using it.
        if (peerId === session.userId) {
          // "someone else" is you. Stop using it. (bonus: don't stop screen sharing if you have multiple going)
          console.log("Stopping screensharing.");
          activeCall.localMedia?.screenShare?.getTracks().forEach((track) => track.stop());
        } else {
          // Tell the user to try again later.
          const currentUser = peerId
            ? activeCall?.members.get(peerId)?.member.displayName || getMxIdUsername(peerId)
            : "Player";
          setInteractionProcess({ error: new Error(`${currentUser} is currently using this.`) });
        }
      } else {
        // Nobody is using it, go ahead and share your screen.
        if (!activeCall.localMedia) {
          setInteractionProcess({ error: new Error("activeCall.localMedia not initialized") });
        } else {
          try {
            // TODO: use platform.mediaDevices.getDisplayMedia({audio: true, video: true}) to get screenshare with PC audio?
            // See hydrogen-web/src/platform/web/dom/MediaDevices.ts
            const screenStream = await platform.mediaDevices.getScreenShareTrack();
            if (screenStream) await activeCall.setMedia(activeCall.localMedia.withScreenShare(screenStream));
          } catch (err) {
            setInteractionProcess({ error: err as Error });
          }
        }
      }
    },
    [activeCall, platform.mediaDevices, session.userId, setInteractionProcess]
  );

  const handlePortalGrab = useCallback(
    async (interaction) => {
      let unSubStatusObserver: () => void | undefined;

      try {
        setInteractionProcess({});
        const { uri } = interaction;
        if (!uri) throw Error("Portal does not have valid matrix id/alias");

        const parsedUri = parseMatrixUri(uri);
        if (parsedUri instanceof URL) {
          window.location.href = parsedUri.href;
          return;
        }

        const roomIdOrAlias = parsedUri.mxid1;
        const roomId = roomIdOrAlias.startsWith("#") ? aliasToRoomId(session.rooms, parsedUri.mxid1) : parsedUri.mxid1;

        if (!roomId) {
          setInteractionProcess({ loading: true });
          const rId = await session.joinRoom(roomIdOrAlias);
          if (!isMounted()) return;

          setInteractionProcess({});
          const roomStatusObserver = await session.observeRoomStatus(rId);
          unSubStatusObserver = roomStatusObserver.subscribe(async (roomStatus) => {
            const newWorld = session.rooms.get(rId);
            if (!newWorld || roomStatus !== RoomStatus.Joined) return;

            const stateEvent = await newWorld.getStateEvent("org.matrix.msc3815.world");
            const content = stateEvent?.event.content;
            if (!content) return;

            selectWorld(roomId);

            exitWorld();
            navigateEnterWorld(newWorld);
          });

          return;
        }

        const newWorld = session.rooms.get(roomId);
        if (newWorld) {
          const stateEvent = await newWorld.getStateEvent("org.matrix.msc3815.world");
          const content = stateEvent?.event.content;
          if (!content) return;

          selectWorld(roomId);

          exitWorld();
          navigateEnterWorld(newWorld);
          return;
        }
      } catch (err) {
        if (!isMounted()) return;
        setInteractionProcess({ error: err as Error });
      }
      return () => {
        unSubStatusObserver?.();
      };
    },
    [session, selectWorld, exitWorld, navigateEnterWorld, isMounted, setInteractionProcess]
  );

  const handleInteraction = useCallback(
    (interaction?: InteractionState) => {
      if (!interaction) return setActiveEntity(undefined);
      const { interactableType, action, peerId } = interaction;

      if (action === InteractableAction.Grab) {
        if (interactableType === InteractableType.Player && typeof peerId === "string") {
          setMembers(true);
          document.exitPointerLock();
          return;
        }
        if (interactableType === InteractableType.Portal) {
          handlePortalGrab(interaction);
          return;
        }
        if (interactableType === InteractableType.Screenshare) {
          handleScreenshareGrab(interaction);
        }
      }

      if (interactableType === InteractableType.Player) {
        const entity: InteractionState = {
          ...interaction,
          name: peerId ? activeCall?.members.get(peerId)?.member.displayName || getMxIdUsername(peerId) : "Player",
        };
        setActiveEntity(entity);
      }

      setActiveEntity(interaction);
    },
    [handlePortalGrab, handleScreenshareGrab, setActiveEntity, activeCall]
  );

  useWorldInteraction(mainThread, handleInteraction);

  return (
    <div>
      {!("isBeingCreated" in world) && (
        <Dialog open={members} onOpenChange={setMembers}>
          <MemberListDialog room={world} requestClose={() => setMembers(false)} />
        </Dialog>
      )}
      {!camRigModule.orbiting && <Reticle />}
      {activeEntity && !camRigModule.orbiting && (
        <EntityTooltip activeEntity={activeEntity} interactionProcess={interactionProcess} />
      )}
    </div>
  );
}
