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
import { closeWorldChat, closeOverlay, openOverlay, openWorldChat, setIsPointerLock } from "../../../hooks/useStore";
import MicIC from "../../../../../res/ic/mic.svg";
import HeadphoneIC from "../../../../../res/ic/headphone.svg";
import LogoutIC from "../../../../../res/ic/logout.svg";
import "./WorldView.css";

export function WorldView() {
  const { canvasRef, loadedWorld, onLeftWorld } = useOutletContext<SessionOutletContext>();
  const isEnteredWorld = useStore((state) => state.world.isEnteredWorld);
  const isChatOpen = useStore((state) => state.world.isChatOpen);

  useKeyDown((e) => {
    const { isChatOpen, isEnteredWorld } = useStore.getState().world;
    const { isOpen: isOverlayOpen } = useStore.getState().overlay;
    if (isEnteredWorld === false) return;
    const isEscape = e.key === "Escape";

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
      onLeftWorld();
    }
  }, []);

  useEvent(
    "click",
    (e) => {
      const { isChatOpen, isEnteredWorld } = useStore.getState().world;
      const { isOpen: isOverlayOpen } = useStore.getState().overlay;
      if (isEnteredWorld === false) return;

      canvasRef.current?.requestPointerLock();
      if (isChatOpen) closeWorldChat();
      if (isOverlayOpen) closeOverlay();
    },
    canvasRef.current,
    []
  );

  usePointerLockChange(canvasRef.current, setIsPointerLock, []);

  if (isEnteredWorld === false || loadedWorld === undefined) {
    return null;
  }

  const renderControl = () => (
    <div className="WorldView__controls flex">
      <div className="flex flex-column items-center">
        <IconButton variant="world" label="Mic" iconSrc={MicIC} onClick={() => console.log("mic")} />
        <Text variant="b3" color="world" weight="bold">
          M
        </Text>
      </div>
      <div className="flex flex-column items-center">
        <IconButton variant="world" label="Settings" iconSrc={HeadphoneIC} onClick={() => console.log("headphone")} />
        <Text variant="b3" color="world" weight="bold">
          N
        </Text>
      </div>
      <div className="flex flex-column items-center">
        <IconButton variant="danger" label="Logout" iconSrc={LogoutIC} onClick={() => onLeftWorld()} />
        <Text variant="b3" color="world" weight="bold">
          Alt + L
        </Text>
      </div>
    </div>
  );

  return (
    <div className="WorldView">
      <Stats />
      <div className="WorldView__chat flex">
        <WorldChat open={isChatOpen} room={loadedWorld} />
      </div>
      {loadedWorld && renderControl()}
    </div>
  );
}
