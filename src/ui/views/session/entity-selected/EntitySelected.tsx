import { useEffect, useMemo, useState } from "react";

import MouseIC from "../../../../../res/ic/mouse-left.svg";
import { Icon } from "../../../atoms/icon/Icon";
import { Text } from "../../../atoms/text/Text";
import { useCalls } from "../../../hooks/useCalls";
import { useHydrogen } from "../../../hooks/useHydrogen";
import { useWorld } from "../../../hooks/useRoomIdFromAlias";
import { ParsedMatrixURI } from "../../../utils/matrixUtils";
import { EntityData } from "../reticle/Reticle";

import "./EntitySelected.css";

function getMatrixUriPath(parsedUri: ParsedMatrixURI | URL): string {
  return parsedUri instanceof URL ? parsedUri.href : parsedUri.mxid1;
}

export function EntitySelected({ entity }: { entity: EntityData | undefined }) {
  const [isPortal, setIsPortal] = useState<boolean>();
  const [isPeer, setIsPeer] = useState<boolean>();
  const [isHeld, setIsHeld] = useState<boolean>(false);

  useEffect(() => {
    if (entity?.entityId) {
      const peer = entity?.peerId !== undefined;
      setIsPeer(peer);
      setIsHeld(entity?.held || false);
      setIsPortal(entity?.parsedUri ? true : false);
    }
  }, [entity]);

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
        {!isPortal && isPeer && (
          <>
            <Text weight="bold" color="world">
              {getUsername(entity?.peerId)}
            </Text>
            <div className="flex flex-column gap-xxs">
              <Text variant="b3" color="world">
                {entity?.peerId}
              </Text>
              <Text variant="b3" color="world">
                <span className="EntitySelected__boxedKey">E</span>
                <span> More Info</span>
              </Text>
            </div>
          </>
        )}
        {!isPortal && !isPeer && (
          <>
            <Text weight="bold" color="world">
              {entity?.prefab}
            </Text>
            <div className="flex flex-column gap-xxs">
              <Text variant="b3" color="world">
                {entity.ownerId && getUsername(entity?.ownerId)}
              </Text>
              {isHeld ? (
                <>
                  <Text variant="b3" color="world">
                    <span className="EntitySelected__boxedKey">E</span>
                    <span> Drop</span>
                  </Text>
                  <Text variant="b3" color="world">
                    <Icon src={MouseIC} size="sm" className="EntitySelected__mouseIcon" color="world" />
                    <span> Throw</span>
                  </Text>
                </>
              ) : (
                <Text variant="b3" color="world">
                  <span className="EntitySelected__boxedKey">E</span> /
                  <Icon src={MouseIC} size="sm" className="EntitySelected__mouseIcon" color="world" />
                  <span> Grab</span>
                </Text>
              )}
            </div>
          </>
        )}
        {isPortal && (
          <>
            <Text weight="bold" color="world">
              Portal
            </Text>
            <div className="flex flex-column gap-xxs">
              <Text variant="b3" color="world">
                {getMatrixUriPath(entity.parsedUri!)}
              </Text>
              <Text variant="b3" color="world">
                <span className="EntitySelected__boxedKey">E</span> /
                <Icon src={MouseIC} size="sm" className="EntitySelected__mouseIcon" color="world" />
                <span> Enter World</span>
              </Text>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
