import { useCallback, useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";

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

const SHOW_NAMES_STORE = "showNames";

export function WorldView() {
  const { canvasRef, world, onExitWorld, activeCall } = useOutletContext<SessionOutletContext>();
  const isEnteredWorld = useStore((state) => state.world.isEnteredWorld);
  const { isOpen: isChatOpen, openWorldChat, closeWorldChat } = useStore((state) => state.worldChat);
  const setIsPointerLock = useStore((state) => state.pointerLock.setIsPointerLock);
  const { isOpen: isOverlayOpen, openOverlay, closeOverlay } = useStore((state) => state.overlay);
  const [editorEnabled, setEditorEnabled] = useState(false);
  const [statsEnabled, setStatsEnabled] = useState(false);
  const { mute: callMute, toggleMute } = useCallMute(activeCall);

  const engine = useMainThreadContext();

  const [entity, setEntity] = useState<EntityData>();

  const [showNames, setShowNames] = useState<boolean>(() => {
    const store = localStorage.getItem(SHOW_NAMES_STORE);
    if (!store) return true;
    const json = JSON.parse(store);
    return json.showNames;
  });

  useEffect(() => {
    localStorage.setItem(SHOW_NAMES_STORE, JSON.stringify({ showNames }));

    engine.sendMessage<NametagsEnableMessageType>(Thread.Game, {
      type: NametagsEnableMessage,
      enabled: showNames,
    });
  }, [engine, showNames]);

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

  const toggleShowNames = useCallback(() => {
    const enabled = !showNames;
    setShowNames(enabled);
    engine.sendMessage<NametagsEnableMessageType>(Thread.Game, { type: NametagsEnableMessage, enabled });
  }, [setShowNames, showNames, engine]);

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
        document.exitPointerLock();
        openWorldChat();
        return;
      }

      if (isChatOpen) return;

      if (e.altKey && e.code === "KeyL") {
        onExitWorld();
      }
      if (!isTyping && e.code === "KeyM") {
        toggleMute();
      }
      if (!isTyping && e.code === "Backquote") {
        setEditorEnabled((enabled) => !enabled);
      }
      if (e.code === "KeyS" && e.shiftKey && e.ctrlKey) {
        setStatsEnabled((enabled) => !enabled);
      }
      if (e.code === "KeyN") {
        toggleShowNames();
      }
      if (e.code === "KeyP") {
        toggleShowActiveMembers();
      }
    },
    [
      isEnteredWorld,
      isChatOpen,
      isOverlayOpen,
      showNames,
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
        <Tooltip content={showNames ? "Hide Names" : "Show Names"}>
          <IconButton
            variant="world"
            label="Toggle Names"
            iconSrc={showNames ? SubtitlesIC : SubtitlesOffIC}
            onClick={toggleShowNames}
          />
        </Tooltip>
        <Text variant="b3" color="world" weight="bold">
          N
        </Text>
      </div>
      <div className="flex flex-column items-center">
        <Tooltip content={callMute ? "Unmute" : "Mute"}>
          <IconButton variant="world" label="Mic" iconSrc={callMute ? MicOffIC : MicIC} onClick={toggleMute} />
        </Tooltip>
        <Text variant="b3" color="world" weight="bold">
          M
        </Text>
      </div>
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
      {!("isBeingCreated" in world) && !isOverlayOpen && <Nametags room={world} enabled={showNames} />}
      {!("isBeingCreated" in world) && (
        <Dialog open={showActiveMembers} onOpenChange={setShowActiveMembers}>
          <MemberListDialog room={world} requestClose={() => setShowActiveMembers(false)} />
        </Dialog>
      )}
      {!isOverlayOpen && showNames && <EntitySelected entity={entity} />}
      {!isOverlayOpen && <Reticle onEntityFocused={onEntityFocused} onEntitySelected={onEntitySelected} />}
    </div>
  );
}
