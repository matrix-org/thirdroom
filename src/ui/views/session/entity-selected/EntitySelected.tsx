import classNames from "classnames";
import { useEffect, useMemo, useRef, useState } from "react";

import MouseIC from "../../../../../res/ic/mouse-left.svg";
import { Icon } from "../../../atoms/icon/Icon";
import { useCalls } from "../../../hooks/useCalls";
import { useHydrogen } from "../../../hooks/useHydrogen";
import { useWorld } from "../../../hooks/useRoomIdFromAlias";
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
      const peer = entity?.peerId !== undefined;
      setIsPeer(peer);
    }
  }, [entity, isPeer]);

  const { session } = useHydrogen(true);
  const [, world] = useWorld();

  const calls = useCalls(session);
  const activeCall = useMemo(() => {
    const roomCalls = Array.from(calls).flatMap(([_callId, call]) => (call.roomId === world?.id ? call : []));
    return roomCalls.length ? roomCalls[0] : undefined;
  }, [calls, world]);

  const getUsername = (peerId: string | undefined) => {
    if (activeCall) {
      const m = Array.from(new Map(activeCall.members).values()).find((m) => m.member.userId === peerId);
      return m?.member.displayName || peerId?.split(":")[0]?.split("@")[1];
    }
  };

  return (
    <div>
      {entity && entity.entityId && !isPeer && (
        <div className={classNames("EntitySelected Text Text-b2 Text--world Text--regular")}>
          <span>
            <div className="Text Text--bold Text-b1">{entity?.prefab}</div>
            <div className="Text Text-b3 Text--world Text--regular">{entity?.ownerId}</div>
            <div className="Text Text-b3 Text--world Text--regular">
              <span className="BoxedKey">{!entity?.peerId && "E"}</span> /
              <Icon src={MouseIC} className="MouseIcon Icon--world" />
              <span className="Text Text-b3"> Grab</span>
            </div>
          </span>
        </div>
      )}
      {entity && entity.entityId && isPeer && (
        <div className={classNames("EntitySelected Text Text-b2 Text--world Text--regular")}>
          <span>
            <div className="Text Text--bold Text-b1">{getUsername(entity?.peerId)}</div>
            <div className="Text Text-b3 Text--world Text--regular">{entity?.peerId}</div>
            <Icon src={MouseIC} className="MouseIcon Icon--world" />
            <span className="Text Text-b3"> More Info</span>
          </span>
        </div>
      )}
    </div>
  );
}
