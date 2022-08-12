import classNames from "classnames";
import { useEffect, useRef } from "react";

import { EntityData } from "../reticle/Reticle";

import "./EntitySelected.css";

function usePrevious(value: any) {
  const ref = useRef();
  useEffect(() => {
    ref.current = value;
  }, [value]);
  return ref.current;
}
export default usePrevious;

export function EntitySelected({ entity }: { entity: EntityData | undefined }) {
  const lastRef = useRef<EntityData>();
  useEffect(() => {
    lastRef.current = entity;
  }, [entity]);

  const displayName = (e: EntityData | undefined) => {
    if (e && e.peerId) return e.peerId;
    else if (e && e.prefab && e.networkId) return e.prefab + "-" + e.networkId;
  };

  return (
    <div
      className={classNames("EntitySelected Text Text-b2 Text--world Text--regular", {
        "EntitySelected--hide": !entity || !entity.entityId,
      })}
    >
      <div>{displayName(entity || lastRef.current)}</div>
    </div>
  );
}
