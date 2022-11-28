import classNames from "classnames";

import { InteractableType } from "../../../../engine/resource/schema";
import { ActiveEntityState } from "../world/WorldView";

import "./Reticle.css";

interface IReticleProps {
  activeEntity?: ActiveEntityState;
  mouseDown: boolean;
}

export function Reticle({ activeEntity, mouseDown }: IReticleProps) {
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
