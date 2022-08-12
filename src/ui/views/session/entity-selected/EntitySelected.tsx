import classNames from "classnames";
import { useEffect, useRef } from "react";

import MouseIC from "../../../../../res/ic/mouse.svg";
import { Icon } from "../../../atoms/icon/Icon";
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
    else if (e && e.prefab) return e.prefab;
  };

  return (
    <div
      hidden={!entity || !entity.entityId}
      className={classNames("EntitySelected Text Text-b2 Text--world Text--regular")}
    >
      <div className="Text--bold">{displayName(entity?.prefab || entity?.prefab ? entity : lastRef.current)}</div>
      <div className="Text Text-b3 Text--world Text--regular">
        <span hidden={!!entity?.peerId}>
          <span className="BoxedKey">{!entity?.peerId && "E"}</span> /
          <Icon src={MouseIC} className="MouseIcon Icon--world" />
        </span>
        {!entity?.peerId && entity?.prefab && " Grab"}
      </div>
    </div>
  );
}
