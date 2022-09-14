import classNames from "classnames";
import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";

import { IMainThreadContext } from "../../../../engine/MainThread";
import { registerMessageHandler } from "../../../../engine/module/module.common";
import { EntityGrabbedMessage } from "../../../../plugins/GrabThrowController";
import { ReticleFocusMessageType, ReticleFocusMessage } from "../../../../plugins/reticle/reticle.common";
import { useEvent } from "../../../hooks/useEvent";
import { useKeyDown } from "../../../hooks/useKeyDown";
import { useKeyUp } from "../../../hooks/useKeyUp";
import { useMainThreadContext } from "../../../hooks/useMainThread";
import { SessionOutletContext } from "../SessionView";

import "./Reticle.css";

export interface EntityData {
  entityId?: number;
  networkId?: number;
  prefab?: string;
  ownerId?: string;
  peerId?: string;
  held?: boolean;
}

interface IReticleProps {
  onEntityFocused: (o: EntityData) => void;
  onEntitySelected: (o: EntityData) => void;
}

export function Reticle({ onEntityFocused, onEntitySelected }: IReticleProps) {
  const { canvasRef } = useOutletContext<SessionOutletContext>();

  const ctx = useMainThreadContext();
  const [focused, setFocused] = useState<boolean>(false);
  const [entity, setEntity] = useState<EntityData>();
  const [mouseDown, setMouseDown] = useState<boolean>();

  useEffect(() => {
    const onReticleFocus = (ctx: IMainThreadContext, message: ReticleFocusMessageType) => {
      if (!entity?.held) {
        setFocused(message.focused);
        setEntity(message);
        onEntityFocused(message);
      }
    };
    return registerMessageHandler(ctx, ReticleFocusMessage, onReticleFocus);
  }, [ctx, entity, onEntityFocused]);

  useEffect(() => {
    const onEntityGrabbed = (ctx: IMainThreadContext, message: any) => {
      if (entity) {
        const e = {
          ...entity,
          held: message.held,
          ownerId: message.ownerId,
          peerId: message.peerId,
          entityId: message.entityId,
          networkId: message.networkId,
          prefab: message.prefab,
        };

        if (message.held) {
          setEntity(e);
          onEntityFocused(e);
        } else {
          setEntity(e);
          onEntityFocused(e);
        }
      }
    };
    return registerMessageHandler(ctx, EntityGrabbedMessage, onEntityGrabbed);
  }, [ctx, entity, onEntityFocused]);

  useKeyDown(
    (e) => {
      if (e.code === "KeyE" && entity) {
        if (entity.held) {
          onEntitySelected(entity);
          onEntityFocused(entity);
        } else {
          onEntitySelected(entity);
        }
      }
      setMouseDown(true);
    },
    [entity]
  );
  useKeyUp(() => {
    setMouseDown(false);
  }, []);

  useEvent(
    "mousedown",
    () => {
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
    [entity]
  );

  return (
    <div
      className={classNames("Reticle", {
        "Reticle--focused": focused,
        "Reticle--mousedown": mouseDown,
        Reticle__blue: focused && !entity?.peerId,
        Reticle__yellow: focused && entity?.peerId,
      })}
    />
  );
}
