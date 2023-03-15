import { GroupCall, Room, RoomStatus, Session } from "@thirdroom/hydrogen-view-sdk";
import { useSetAtom } from "jotai";
import { useCallback, useState } from "react";

import MouseIC from "../../../../../res/ic/mouse-left.svg";
import { InteractableType } from "../../../../engine/resource/schema";
import { InteractableAction } from "../../../../plugins/interaction/interaction.common";
import { Icon } from "../../../atoms/icon/Icon";
import { Dots } from "../../../atoms/loading/Dots";
import { Text } from "../../../atoms/text/Text";
import { useIsMounted } from "../../../hooks/useIsMounted";
import { useMainThreadContext } from "../../../hooks/useMainThread";
import { useMemoizedState } from "../../../hooks/useMemoizedState";
import { useWorldAction } from "../../../hooks/useWorldAction";
import { overlayWorldAtom } from "../../../state/overlayWorld";
import { aliasToRoomId, getMxIdUsername, parseMatrixUri } from "../../../utils/matrixUtils";
import { InteractionState, useWorldInteraction } from "../../../hooks/useWorldInteraction";
import "./EntityTooltip.css";
import { Dialog } from "../../../atoms/dialog/Dialog";
import { MemberListDialog } from "../dialogs/MemberListDialog";

export interface IPortalProcess {
  joining?: boolean;
  error?: Error;
}

interface EntityTooltipProps {
  session: Session;
  world: Room;
  activeCall: GroupCall;
}

export function EntityTooltip({ session, world, activeCall }: EntityTooltipProps) {
  const mainThread = useMainThreadContext();
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
      const { interactableType, action, peerId } = interaction ?? {};

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

      setActiveEntity(interaction);
    },
    [handlePortalGrab, setActiveEntity]
  );

  useWorldInteraction(mainThread, handleInteraction);

  if (!activeEntity) return null;

  return (
    <div>
      {!("isBeingCreated" in world) && (
        <Dialog open={members} onOpenChange={setMembers}>
          <MemberListDialog room={world} requestClose={() => setMembers(false)} />
        </Dialog>
      )}
      <div className="EntityTooltip">
        {activeEntity.interactableType === InteractableType.Player && (
          <>
            <Text weight="bold" color="world">
              {activeEntity.peerId
                ? activeCall?.members.get(activeEntity.peerId)?.member.displayName ||
                  getMxIdUsername(activeEntity.peerId)
                : "Player"}
            </Text>
            <div className="flex flex-column gap-xxs">
              <Text variant="b3" color="world">
                {activeEntity.peerId}
              </Text>
              <Text variant="b3" color="world">
                <span className="EntityTooltip__boxedKey">E</span>
                <span> More Info</span>
              </Text>
            </div>
          </>
        )}
        {activeEntity.interactableType === InteractableType.Interactable && (
          <>
            <Text weight="bold" color="world">
              {activeEntity.name}
            </Text>
            <div className="flex flex-column gap-xxs">
              <Text variant="b3" color="world">
                <span className="EntityTooltip__boxedKey">E</span> /
                <Icon src={MouseIC} size="sm" className="EntityTooltip__mouseIcon" color="world" />
                <span> Interact</span>
              </Text>
            </div>
          </>
        )}
        {activeEntity.interactableType === InteractableType.UI && (
          <>
            <Text weight="bold" color="world">
              {activeEntity.name}
            </Text>
            <div className="flex flex-column gap-xxs">
              <Text variant="b3" color="world">
                <span className="EntityTooltip__boxedKey">E</span> /
                <Icon src={MouseIC} size="sm" className="EntityTooltip__mouseIcon" color="world" />
                <span> Interact</span>
              </Text>
            </div>
          </>
        )}
        {activeEntity.interactableType === InteractableType.Grabbable && (
          <>
            <Text weight="bold" color="world">
              {activeEntity.name}
            </Text>
            <div className="flex flex-column gap-xxs">
              <Text variant="b3" color="world">
                {activeEntity.ownerId}
              </Text>
              {activeEntity.held ? (
                <>
                  <Text variant="b3" color="world">
                    <span className="EntityTooltip__boxedKey">E</span>
                    <span> Drop</span>
                  </Text>
                  <Text variant="b3" color="world">
                    <Icon src={MouseIC} size="sm" className="EntityTooltip__mouseIcon" color="world" />
                    <span> Throw</span>
                  </Text>
                </>
              ) : (
                <Text variant="b3" color="world">
                  <span className="EntityTooltip__boxedKey">E</span> /
                  <Icon src={MouseIC} size="sm" className="EntityTooltip__mouseIcon" color="world" />
                  <span> Grab</span>
                </Text>
              )}
              {activeEntity.ownerId === activeEntity.peerId && (
                <Text variant="b3" color="world">
                  <span className="EntityTooltip__boxedKey">X</span>
                  <span> Delete</span>
                </Text>
              )}
            </div>
          </>
        )}
        {activeEntity.interactableType === InteractableType.Portal && (
          <>
            {portalProcess.joining && <Dots color="world" size="sm" />}
            <Text weight="bold" color="world">
              {portalProcess.joining ? "Joining portal" : "Portal"}
            </Text>
            <div className="flex flex-column gap-xxs">
              <Text variant="b3" color="world">
                {activeEntity.name}
              </Text>
              {portalProcess.error && (
                <Text variant="b3" color="world">
                  {portalProcess.error.message ?? "Unknown error joining portal."}
                </Text>
              )}
              {!portalProcess.joining && (
                <Text variant="b3" color="world">
                  <span className="EntityTooltip__boxedKey">E</span> /
                  <Icon src={MouseIC} size="sm" className="EntityTooltip__mouseIcon" color="world" />
                  <span> Enter World</span>
                </Text>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
