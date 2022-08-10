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
  const [error, setError] = useState<boolean>(false);

  useEffect(() => {
    const onReticleFocus = (ctx: IMainThreadContext, message: ReticleFocusMessageType) => {
      setFocused(message.focused);
      setError(message.error || false);
    };

    return registerMessageHandler(ctx, ReticleFocusMessage, onReticleFocus);
  }, [ctx]);

  return (
    <div
      className={classNames("Reticle", {
        "Reticle--focused": focused,
        Reticle__blue: focused && !error,
        Reticle__red: focused && error,
      })}
    />
  );
}
