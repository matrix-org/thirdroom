import { Room } from "@thirdroom/hydrogen-view-sdk";
import { vec2 } from "gl-matrix";
import { useEffect, useState } from "react";

import { IMainThreadContext } from "../../../../engine/MainThread";
import { registerMessageHandler, Thread } from "../../../../engine/module/module.common";
import { range } from "../../../../engine/utils/interpolation";
import {
  NametagsEnableMessage,
  NametagsEnableMessageType,
  NametagsMessage,
  NametagsMessageType,
} from "../../../../plugins/nametags/nametags.common";
import { useMainThreadContext } from "../../../hooks/useMainThread";
import { useRoomMembers } from "../../../hooks/useRoomMembers";

import "./Nametag.css";

const DIST_HIDE = 10;
const DIST_SHOW = 8;

export function Nametags({ room, enabled }: { room: Room; enabled: boolean }) {
  const ctx = useMainThreadContext();
  const [nametags, setNametags] = useState<[string, vec2, number][]>([]);

  ctx.sendMessage<NametagsEnableMessageType>(Thread.Game, { type: NametagsEnableMessage, enabled });

  useEffect(() => {
    const onNametagsMessage = (ctx: IMainThreadContext, message: NametagsMessageType) => {
      setNametags(message.nametags);
    };
    return registerMessageHandler(ctx, NametagsMessage, onNametagsMessage);
  }, [ctx]);

  const { joined } = useRoomMembers(room) ?? {};

  const Nametag = (nametag: [string, vec2, number]) => {
    const [name, [left, top], dist] = nametag;
    const opacity = range(DIST_HIDE, DIST_SHOW, 0, 1, dist);
    const member = joined?.find((m) => m.userId === name);
    return (
      <div
        key={name}
        style={{
          position: "absolute",
          top: `${top}px`,
          left: `${left}px`,
          opacity: `${opacity}`,
        }}
        className="Nametag"
      >
        <div>{member?.displayName || name}</div>
      </div>
    );
  };

  return <div>{enabled && nametags.map(Nametag)}</div>;
}
