import { useEffect } from "react";
import { useOutletContext } from "react-router-dom";

import { SessionOutletContext } from "../SessionView";
import { WorldChat } from "../world-chat/WorldChat";
import { Stats } from "../stats/Stats";
import "./WorldView.css";
import { useKeyDown } from "../../../hooks/useKeyDown";

export function WorldView() {
  const { activeWorld, chatOpen, onOpenChat, onCloseChat, canvasRef } = useOutletContext<SessionOutletContext>();

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

  if (!activeWorld) {
    return null;
  }

  return (
    <div className="WorldView">
      <Stats />
      <div className="WorldView__chat flex">
        <WorldChat open={chatOpen} room={activeWorld} />
      </div>
    </div>
  );
}
