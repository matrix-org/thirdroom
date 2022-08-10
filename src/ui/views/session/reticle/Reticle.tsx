import classNames from "classnames";
import { useState, useEffect } from "react";

import { IMainThreadContext } from "../../../../engine/MainThread";
import { registerMessageHandler } from "../../../../engine/module/module.common";
import { ReticleFocusMessageType, ReticleFocusMessage } from "../../../../plugins/reticle/reticle.common";
import { useMainThreadContext } from "../../../hooks/useMainThread";

import "./Reticle.css";

export function Reticle() {
  const ctx = useMainThreadContext();
  const [focused, setFocused] = useState<boolean>(false);
  const [mouseDown, setMouseDown] = useState<boolean>(false);

  useEffect(() => {
    const onReticleFocus = (ctx: IMainThreadContext, message: ReticleFocusMessageType) => {
      setFocused(message.focused);
    };

    return registerMessageHandler(ctx, ReticleFocusMessage, onReticleFocus);
  }, [ctx]);

  document.addEventListener("mousedown", () => {
    setMouseDown(true);
  });
  document.addEventListener("mouseup", () => {
    setMouseDown(false);
  });

  return (
    <div
      className={classNames("Reticle", {
        "Reticle--focused": focused,
        Reticle__blue: focused,
        "Reticle--mousedown": mouseDown,
      })}
    />
  );
}
