import { GroupCall, Room, RoomStatus, Session } from "@thirdroom/hydrogen-view-sdk";
import { useSetAtom } from "jotai";
import { useCallback, useState } from "react";

import { InteractableType } from "../../../../engine/resource/schema";
import { InteractableAction } from "../../../../plugins/interaction/interaction.common";
import { useIsMounted } from "../../../hooks/useIsMounted";
import { useMainThreadContext } from "../../../hooks/useMainThread";
import { useMemoizedState } from "../../../hooks/useMemoizedState";
import { useWorldAction } from "../../../hooks/useWorldAction";
import { overlayWorldAtom } from "../../../state/overlayWorld";
import { aliasToRoomId, getMxIdUsername, parseMatrixUri } from "../../../utils/matrixUtils";
import { InteractionState, useWorldInteraction } from "../../../hooks/useWorldInteraction";
import { Dialog } from "../../../atoms/dialog/Dialog";
import { EntityTooltip } from "../entity-tooltip/EntityTooltip";
import { MemberListDialog } from "../dialogs/MemberListDialog";
import { getModule } from "../../../../engine/module/module.common";
import { CameraRigModule } from "../../../../plugins/camera/CameraRig.main";
import { Reticle } from "../reticle/Reticle";

export interface IPortalProcess {
  joining?: boolean;
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
  const [portalProcess, setPortalProcess] = useMemoizedState<IPortalProcess>({});
  const [members, setMembers] = useState(false);

  const { enterWorld } = useWorldAction(session);
  const selectWorld = useSetAtom(overlayWorldAtom);
  const isMounted = useIsMounted();

  const handlePortalGrab = useCallback(
    async (interaction) => {
      let unSubStatusObserver: () => void | undefined;

      try {
        setPortalProcess({});
        const { uri } = interaction;
        if (!uri) throw Error("Portal does not have valid matrix id/alias");

        const parsedUri = parseMatrixUri(uri);
        if (parsedUri instanceof URL) {
          window.location.href = parsedUri.href;
          return;
        }

        const roomIdOrAlias = parsedUri.mxid1;
        const roomId = roomIdOrAlias.startsWith("#") ? aliasToRoomId(session.rooms, parsedUri.mxid1) : parsedUri.mxid1;

        if (roomId && session.rooms.get(roomId)) {
          selectWorld(roomId);
          enterWorld(roomId);
          return;
        }

        setPortalProcess({ joining: true });
        const rId = await session.joinRoom(roomIdOrAlias);
        if (!isMounted()) return;
        setPortalProcess({});
        const roomStatusObserver = await session.observeRoomStatus(rId);
        unSubStatusObserver = roomStatusObserver.subscribe((roomStatus) => {
          if (roomStatus !== RoomStatus.Joined) return;
          selectWorld(rId);
          enterWorld(rId);
        });
      } catch (err) {
        if (!isMounted()) return;
        setPortalProcess({ error: err as Error });
      }
      return () => {
        unSubStatusObserver?.();
      };
    },
    [session, selectWorld, enterWorld, isMounted, setPortalProcess]
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
    [handlePortalGrab, setActiveEntity, activeCall]
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
        <EntityTooltip activeEntity={activeEntity} portalProcess={portalProcess} />
      )}
    </div>
  );
}
