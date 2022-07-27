import { useState } from "react";
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
import MicIC from "../../../../../res/ic/mic.svg";
import MicOffIC from "../../../../../res/ic/mic-off.svg";
import CallCrossIC from "../../../../../res/ic/call-cross.svg";
import "./WorldView.css";
import { EditorView } from "../editor/EditorView";
import { useCallMute } from "../../../hooks/useCallMute";
import { Tooltip } from "../../../atoms/tooltip/Tooltip";

export function WorldView() {
  const { canvasRef, world, onExitWorld, activeCall } = useOutletContext<SessionOutletContext>();
  const isEnteredWorld = useStore((state) => state.world.isEnteredWorld);
  const { isOpen: isChatOpen, openWorldChat, closeWorldChat } = useStore((state) => state.worldChat);
  const setIsPointerLock = useStore((state) => state.pointerLock.setIsPointerLock);
  const { isOpen: isOverlayOpen, openOverlay, closeOverlay } = useStore((state) => state.overlay);
  const [editorEnabled, setEditorEnabled] = useState(false);
  const [statsEnabled, setStatsEnabled] = useState(false);
  const { mute: callMute, toggleMute } = useCallMute(activeCall);

  useKeyDown(
    (e) => {
      if (isEnteredWorld === false) return;
      const isEscape = e.key === "Escape";
      const isTyping = document.activeElement?.tagName.toLowerCase() === "input";

      if (isEscape && isChatOpen) {
        canvasRef.current?.requestPointerLock();
        closeWorldChat();
        return;
      }
      if (isEscape && isOverlayOpen === false) {
        document.exitPointerLock();
        openOverlay();
        return;
      }
      if (isEscape && isOverlayOpen) {
        canvasRef.current?.requestPointerLock();
        closeOverlay();
        return;
      }
      if (e.key === "Enter" && isOverlayOpen === false && isChatOpen === false) {
        document.exitPointerLock();
        openWorldChat();
        return;
      }
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
    },
    [isEnteredWorld, isChatOpen, isOverlayOpen, openWorldChat, closeWorldChat, openOverlay, closeOverlay]
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
    </div>
  );
}
