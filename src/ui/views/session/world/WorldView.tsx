import { useEffect } from "react";
import { useOutletContext } from "react-router-dom";

import { SessionOutletContext } from "../SessionView";
import { WorldChat } from "../world-chat/WorldChat";
import { Stats } from "../stats/Stats";
import { useKeyDown } from "../../../hooks/useKeyDown";
import { Text } from "../../../atoms/text/Text";
import { IconButton } from "../../../atoms/button/IconButton";
import MicIC from "../../../../../res/ic/mic.svg";
import HeadphoneIC from "../../../../../res/ic/headphone.svg";
import LogoutIC from "../../../../../res/ic/logout.svg";
import "./WorldView.css";

export function WorldView() {
  const { activeWorld, enteredWorld, chatOpen, onOpenChat, onCloseChat, canvasRef } =
    useOutletContext<SessionOutletContext>();

  useKeyDown(
    (e) => {
      if (e.key === "Enter" && !chatOpen) {
        onOpenChat();
      } else if (e.key === "Escape" && chatOpen) {
        onCloseChat();
      }
    },
    [chatOpen, canvasRef]
  );

  useEffect(() => {
    const canvas = canvasRef.current;

    if (canvas) {
      const onClickCanvas = () => {
        if (chatOpen) {
          onCloseChat();
        }
      };

      canvas.addEventListener("click", onClickCanvas);

      return () => {
        canvas.removeEventListener("click", onClickCanvas);
      };
    }
  }, [chatOpen, onCloseChat, canvasRef]);

  if (!enteredWorld || !activeWorld) {
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
        <IconButton variant="danger" label="Logout" iconSrc={LogoutIC} onClick={() => console.log("exit")} />
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
        <WorldChat open={chatOpen} room={activeWorld} />
      </div>
      {activeWorld && renderControl()}
    </div>
  );
}
