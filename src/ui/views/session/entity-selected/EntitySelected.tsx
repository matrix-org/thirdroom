import { useEffect, useMemo, useRef, useState } from "react";

import MouseIC from "../../../../../res/ic/mouse-left.svg";
import { Icon } from "../../../atoms/icon/Icon";
import { Text } from "../../../atoms/text/Text";
import { useCalls } from "../../../hooks/useCalls";
import { useHydrogen } from "../../../hooks/useHydrogen";
import { useWorld } from "../../../hooks/useRoomIdFromAlias";
import { EntityData } from "../reticle/Reticle";

import "./EntitySelected.css";

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

  if (!entity || !entity.entityId) return null;
  return (
    <div>
      <div className="EntitySelected">
        <Text weight="bold" color="world">
          {isPeer ? getUsername(entity?.peerId) : entity?.prefab}
        </Text>
        {isPeer ? (
          <div className="flex flex-column gap-xxs">
            <Text variant="b3" color="world">
              {entity?.peerId}
            </Text>
            <Text variant="b3" color="world">
              <span className="EntitySelected__boxedKey">E</span>
              <span> More Info</span>
            </Text>
          </div>
        ) : (
          <div className="flex flex-column gap-xxs">
            <Text variant="b3" color="world">
              {entity?.ownerId}
            </Text>
            <Text variant="b3" color="world">
              <span className="EntitySelected__boxedKey">{!entity?.peerId && "E"}</span> /
              <Icon src={MouseIC} size="sm" className="EntitySelected__mouseIcon" color="world" />
              <span> Grab</span>
            </Text>
          </div>
        )}
      </div>
    </div>
  );
}
