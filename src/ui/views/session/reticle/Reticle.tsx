import classNames from "classnames";

import { InteractableType } from "../../../../engine/resource/schema";
import { useMainThreadContext } from "../../../hooks/useMainThread";
import { useMemoizedState } from "../../../hooks/useMemoizedState";
import { useMouseDown } from "../../../hooks/useMouseDown";
import { InteractionState, useWorldInteraction } from "../../../hooks/useWorldInteraction";

import "./Reticle.css";

export function Reticle() {
  const mainThread = useMainThreadContext();
  const mouseDown = useMouseDown(mainThread.canvas);

  const [activeEntity, setActiveEntity] = useMemoizedState<InteractionState | undefined>();

  useWorldInteraction(mainThread, setActiveEntity);

  return (
    <div
      className={classNames("Reticle", {
        "Reticle--focused": activeEntity,
        "Reticle--mousedown": mouseDown,
        Reticle__object:
          activeEntity &&
          (activeEntity.interactableType === InteractableType.Grabbable ||
            activeEntity.interactableType === InteractableType.Interactable),
        Reticle__player: activeEntity && activeEntity.interactableType === InteractableType.Player,
        Reticle__portal: activeEntity && activeEntity.interactableType === InteractableType.Portal,
      })}
    />
  );
}
