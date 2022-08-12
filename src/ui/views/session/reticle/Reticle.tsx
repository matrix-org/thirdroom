import classNames from "classnames";
import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";

import { IMainThreadContext } from "../../../../engine/MainThread";
import { registerMessageHandler } from "../../../../engine/module/module.common";
import { ReticleFocusMessageType, ReticleFocusMessage } from "../../../../plugins/reticle/reticle.common";
import { useEvent } from "../../../hooks/useEvent";
import { useMainThreadContext } from "../../../hooks/useMainThread";
import { SessionOutletContext } from "../SessionView";

import "./Reticle.css";

interface IReticleProps {
  onEntityFocused: (o: { entityId?: number; networkId?: number; peerId?: string }) => void;
  onEntityClicked: (o: { entityId?: number; networkId?: number; peerId?: string }) => void;
}

export function Reticle({ onEntityFocused, onEntityClicked }: IReticleProps) {
  const { canvasRef } = useOutletContext<SessionOutletContext>();

  const ctx = useMainThreadContext();
  const [focused, setFocused] = useState<boolean>(false);
  const [mouseDown, setMouseDown] = useState<boolean>(false);
  const [entityId, setEntityId] = useState<number>();
  const [networkId, setNetworkId] = useState<number>();
  const [peerId, setPeerId] = useState<string>();

  useEffect(() => {
    const onReticleFocus = (ctx: IMainThreadContext, message: ReticleFocusMessageType) => {
      setFocused(message.focused);
      setPeerId(message.peerId);
      setEntityId(message.entityId);
      setNetworkId(message.networkId);
      onEntityFocused({ entityId: message.entityId, networkId: message.networkId, peerId: message.peerId });
    };
    return registerMessageHandler(ctx, ReticleFocusMessage, onReticleFocus);
  }, [ctx, onEntityFocused]);

  useEvent(
    "mousedown",
    () => {
      if (entityId || peerId || networkId) onEntityClicked({ entityId, peerId });
      setMouseDown(true);
    },
    canvasRef.current,
    [entityId, peerId]
  );
  useEvent(
    "mouseup",
    () => {
      setMouseDown(false);
    },
    canvasRef.current,
    []
  );

  return (
    <div
      className={classNames("Reticle", {
        "Reticle--focused": focused,
        "Reticle--mousedown": mouseDown,
        Reticle__blue: focused,
        Reticle__yellow: focused && peerId,
      })}
    />
  );
}
