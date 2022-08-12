import classNames from "classnames";
import { useEffect, useRef, useState } from "react";

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

  const [isPeer, setIsPeer] = useState<boolean>();

  useEffect(() => {
    if (entity?.entityId) {
      const peer = !!entity?.peerId;
      setIsPeer(peer);
    }
  }, [entity, isPeer]);

  const getUsername = (s: string | undefined) => (s ? s.split("@")[1]?.split(":")[0] : "");

  return (
    <div
      hidden={!entity || !entity.entityId}
      className={classNames("EntitySelected Text Text-b2 Text--world Text--regular")}
    >
      <span hidden={isPeer}>
        <div className="Text Text--bold Text-b1">{entity?.prefab}</div>
        <div className="Text Text-b3 Text--world Text--regular">
          <span className="BoxedKey">{!entity?.peerId && "E"}</span> /
          <Icon src={MouseIC} className="MouseIcon Icon--world" />
          <span className="Text Text-b3"> Grab</span>
        </div>
      </span>
      <span hidden={!isPeer}>
        <div className="Text Text--bold Text-b1">{getUsername(entity?.peerId)}</div>
        <div className="Text Text-b3 Text--world Text--regular">{entity?.peerId}</div>
        <Icon src={MouseIC} className="MouseIcon Icon--world" />
        <span className="Text Text-b3"> More Info</span>
      </span>
    </div>
  );
}
