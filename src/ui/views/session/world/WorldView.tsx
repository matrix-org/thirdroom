import { useCallback, useEffect, useRef, useState, forwardRef } from "react";
import { useOutletContext } from "react-router-dom";
import { GroupCall } from "@thirdroom/hydrogen-view-sdk";

import { SessionOutletContext } from "../SessionView";
import { WorldChat } from "../world-chat/WorldChat";
import { Stats } from "../stats/Stats";
import { Text } from "../../../atoms/text/Text";
import { IconButton } from "../../../atoms/button/IconButton";
import { useStore } from "../../../hooks/useStore";
import { useKeyDown } from "../../../hooks/useKeyDown";
import { usePointerLockChange } from "../../../hooks/usePointerLockChange";
import { useEvent } from "../../../hooks/useEvent";
import PeopleIC from "../../../../../res/ic/peoples.svg";
import SubtitlesIC from "../../../../../res/ic/subtitles.svg";
import SubtitlesOffIC from "../../../../../res/ic/subtitles-off.svg";
import MicIC from "../../../../../res/ic/mic.svg";
import MicOffIC from "../../../../../res/ic/mic-off.svg";
import CallCrossIC from "../../../../../res/ic/call-cross.svg";
import "./WorldView.css";
import { EditorView } from "../editor/EditorView";
import { useCallMute } from "../../../hooks/useCallMute";
import { Tooltip } from "../../../atoms/tooltip/Tooltip";
import { EntityData, Reticle } from "../reticle/Reticle";
import { EntitySelected } from "../entity-selected/EntitySelected";
import { Nametags } from "../nametags/Nametags";
import { Dialog } from "../../../atoms/dialog/Dialog";
import { MemberListDialog } from "../dialogs/MemberListDialog";
import { useMainThreadContext } from "../../../hooks/useMainThread";
import { Thread } from "../../../../engine/module/module.common";
import { NametagsEnableMessage, NametagsEnableMessageType } from "../../../../plugins/nametags/nametags.common";
import { usePermissionState } from "../../../hooks/usePermissionState";
import { useMicrophoneState } from "../../../hooks/useMicrophoneState";
import { MicStreamRequest } from "../../components/MicStreamRequest";
import { useHydrogen } from "../../../hooks/useHydrogen";

const FOCUSED_ENT_STORE_NAME = "showFocusedEntity";

const MuteButton = forwardRef<HTMLButtonElement, { activeCall?: GroupCall }>(({ activeCall }, ref) => {
  const { platform } = useHydrogen(true);
  const micPermission = usePermissionState("microphone");
  const [microphone, setMicrophone] = useMicrophoneState();
  const { mute: callMute, handleMute } = useCallMute(activeCall);
  if (callMute === microphone) {
    setMicrophone(!microphone);
  }

  return (
    <MicStreamRequest
      permissionState={micPermission}
      platform={platform}
      render={(requestStream) => (
        <Tooltip content={callMute ? "Unmute" : "Mute"}>
          <IconButton
            variant="world"
            label="Mic"
            iconSrc={callMute ? MicOffIC : MicIC}
            onClick={() => handleMute(requestStream)}
            ref={ref}
          />
        </Tooltip>
      )}
    />
  );
});

export function WorldView() {
  const { canvasRef, world, onExitWorld, activeCall } = useOutletContext<SessionOutletContext>();
  const isEnteredWorld = useStore((state) => state.world.isEnteredWorld);
  const { isOpen: isChatOpen, openWorldChat, closeWorldChat } = useStore((state) => state.worldChat);
  const setIsPointerLock = useStore((state) => state.pointerLock.setIsPointerLock);
  const { isOpen: isOverlayOpen, openOverlay, closeOverlay } = useStore((state) => state.overlay);
  const [editorEnabled, setEditorEnabled] = useState(false);
  const [statsEnabled, setStatsEnabled] = useState(false);

  const muteBtnRef = useRef<HTMLButtonElement | null>(null);

  const engine = useMainThreadContext();

  const [entity, setEntity] = useState<EntityData>();

  const [showFocusedEntity, setShowFocusedEntity] = useState<boolean>(() => {
    const store = localStorage.getItem(FOCUSED_ENT_STORE_NAME);
    if (!store) return true;
    const json = JSON.parse(store);
    return json.showFocusedEntity;
  });

  useEffect(() => {
    localStorage.setItem(FOCUSED_ENT_STORE_NAME, JSON.stringify({ showFocusedEntity }));

    engine.sendMessage<NametagsEnableMessageType>(Thread.Game, {
      type: NametagsEnableMessage,
      enabled: showFocusedEntity,
    });
  }, [engine, showFocusedEntity]);

  const [showActiveMembers, setShowActiveMembers] = useState<boolean>(false);

  const onEntitySelected = (entity: EntityData) => {
    if (entity.peerId) {
      setShowActiveMembers(true);
      document.exitPointerLock();
    }
  };

  const onEntityFocused = (entity: EntityData) => {
    setEntity(entity);
  };

  const toggleShowFocusedEnity = useCallback(() => {
    const enabled = !showFocusedEntity;
    setShowFocusedEntity(enabled);
    engine.sendMessage<NametagsEnableMessageType>(Thread.Game, { type: NametagsEnableMessage, enabled });
  }, [setShowFocusedEntity, showFocusedEntity, engine]);

  const toggleShowActiveMembers = () => {
    const enabled = !showActiveMembers;
    setShowActiveMembers(enabled);
  };

  useKeyDown(
    (e) => {
      if (isEnteredWorld === false) return;

      const isEscape = e.key === "Escape";
      const isTyping = document.activeElement?.tagName.toLowerCase() === "input";

      if (isEscape && showActiveMembers) {
        canvasRef.current?.requestPointerLock();
        setShowActiveMembers(false);
        return;
      }
      if (isEscape && isChatOpen) {
        canvasRef.current?.requestPointerLock();
        closeWorldChat();
        return;
      }
      if (isEscape && isOverlayOpen) {
        canvasRef.current?.requestPointerLock();
        closeOverlay();
        return;
      }
      if (isEscape && isOverlayOpen === false) {
        document.exitPointerLock();
        openOverlay();
        return;
      }
      if (e.key === "Enter" && isOverlayOpen === false && isChatOpen === false) {
        if (document.activeElement !== document.body) return;
        document.exitPointerLock();
        openWorldChat();
        return;
      }

      if (isChatOpen) return;

      if (e.altKey && e.code === "KeyL") {
        onExitWorld();
      }
      if (!isTyping && e.code === "KeyM" && muteBtnRef.current !== null) {
        muteBtnRef.current.click();
      }
      if (!isTyping && e.code === "Backquote") {
        setEditorEnabled((enabled) => !enabled);
      }
      if (e.code === "KeyS" && e.shiftKey && e.ctrlKey) {
        setStatsEnabled((enabled) => !enabled);
      }
      if (e.code === "KeyO") {
        toggleShowFocusedEnity();
      }
      if (e.code === "KeyP") {
        toggleShowActiveMembers();
      }
    },
    [
      isEnteredWorld,
      isChatOpen,
      isOverlayOpen,
      showFocusedEntity,
      showActiveMembers,
      openWorldChat,
      closeWorldChat,
      openOverlay,
      closeOverlay,
    ]
  );

  useEvent(
    "click",
    (e) => {
      const isChatOpen = useStore.getState().worldChat.isOpen;
      const isOverlayOpen = useStore.getState().overlay.isOpen;
      const isEnteredWorld = useStore.getState().world.isEnteredWorld;
      if (isEnteredWorld === false) return;

      canvasRef.current?.requestPointerLock();
      if (isChatOpen) closeWorldChat();
      if (isOverlayOpen) closeOverlay();
    },
    canvasRef.current,
    []
  );

  usePointerLockChange(canvasRef.current, setIsPointerLock, []);

  if (isEnteredWorld === false || world === undefined) {
    return null;
  }

  const renderControl = () => (
    <div className="WorldView__controls flex">
      <div className="flex flex-column items-center">
        <Tooltip content={showActiveMembers ? "Hide Members" : "Show Members"}>
          <IconButton variant="world" label="activeMembers" iconSrc={PeopleIC} onClick={toggleShowActiveMembers} />
        </Tooltip>
        <Text variant="b3" color="world" weight="bold">
          P
        </Text>
      </div>
      <div className="flex flex-column items-center">
        <Tooltip content={showFocusedEntity ? "Hide Names" : "Show Names"}>
          <IconButton
            variant="world"
            label="focusedEntity"
            iconSrc={showFocusedEntity ? SubtitlesIC : SubtitlesOffIC}
            onClick={toggleShowFocusedEnity}
          />
        </Tooltip>
        <Text variant="b3" color="world" weight="bold">
          O
        </Text>
      </div>
      {activeCall && (
        <div className="flex flex-column items-center">
          <MuteButton
            activeCall={activeCall}
            ref={(ref) => {
              muteBtnRef.current = ref;
            }}
          />
          <Text variant="b3" color="world" weight="bold">
            M
          </Text>
        </div>
      )}
      <div className="flex flex-column items-center">
        <Tooltip content="Disconnect">
          <IconButton variant="danger" label="Disconnect" iconSrc={CallCrossIC} onClick={onExitWorld} />
        </Tooltip>
        <Text variant="b3" color="world" weight="bold">
          Alt + L
        </Text>
      </div>
    </div>
  );

  return (
    <div className="WorldView">
      <Stats statsEnabled={statsEnabled} />
      <div className="WorldView__chat flex">
        {!("isBeingCreated" in world) && <WorldChat open={isChatOpen} room={world} />}
      </div>
      {world && renderControl()}
      {world && editorEnabled && <EditorView />}
      {!("isBeingCreated" in world) && !isOverlayOpen && <Nametags room={world} enabled={showFocusedEntity} />}
      {!("isBeingCreated" in world) && (
        <Dialog open={showActiveMembers} onOpenChange={setShowActiveMembers}>
          <MemberListDialog room={world} requestClose={() => setShowActiveMembers(false)} />
        </Dialog>
      )}
      {!isOverlayOpen && showFocusedEntity && <EntitySelected entity={entity} />}
      {!isOverlayOpen && <Reticle onEntityFocused={onEntityFocused} onEntitySelected={onEntitySelected} />}
    </div>
  );
}
