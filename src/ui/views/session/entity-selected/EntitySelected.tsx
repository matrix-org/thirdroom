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

  return (
    <div
      className={classNames("EntitySelected Text Text-b2 Text--world Text--regular", {
        "EntitySelected--hide": !entity || !entity.entityId,
      })}
    >
      <div>
        {entity && entity.peerId ? entity.peerId : entity && entity.prefab && `${entity.prefab}-${entity.networkId}`}
        {lastRef.current && lastRef.current.peerId
          ? lastRef.current.peerId
          : lastRef.current && lastRef.current.prefab && `${lastRef.current.prefab}-${lastRef.current.networkId}`}
      </div>
    </div>
  );
}
