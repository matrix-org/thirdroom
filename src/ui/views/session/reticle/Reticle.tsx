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

export interface EntityData {
  entityId?: number;
  networkId?: number;
  prefab?: string;
  peerId?: string;
}

interface IReticleProps {
  onEntityFocused: (o: EntityData) => void;
  onEntityClicked: (o: EntityData) => void;
}

export function Reticle({ onEntityFocused, onEntityClicked }: IReticleProps) {
  const { canvasRef } = useOutletContext<SessionOutletContext>();

  const ctx = useMainThreadContext();
  const [focused, setFocused] = useState<boolean>(false);
  const [entity, setEntity] = useState<EntityData>();
  const [mouseDown, setMouseDown] = useState<boolean>();

  useEffect(() => {
    const onReticleFocus = (ctx: IMainThreadContext, message: ReticleFocusMessageType) => {
      setFocused(message.focused);
      setEntity(message);
      onEntityFocused(message);
    };
    return registerMessageHandler(ctx, ReticleFocusMessage, onReticleFocus);
  }, [ctx, entity, onEntityFocused]);

  useEvent(
    "mousedown",
    () => {
      if (entity) onEntityClicked(entity);
      setMouseDown(true);
    },
    canvasRef.current,
    [entity]
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
        Reticle__yellow: focused && entity?.peerId,
      })}
    />
  );
}
