import { Room } from "@thirdroom/hydrogen-view-sdk";
import { vec2 } from "gl-matrix";
import { useEffect, useState } from "react";

import { IMainThreadContext } from "../../../../engine/MainThread";
import { registerMessageHandler } from "../../../../engine/module/module.common";
import { range } from "../../../../engine/utils/interpolation";
import { NametagsMessage, NametagsMessageType } from "../../../../plugins/nametags/nametags.common";
import { useKeyDown } from "../../../hooks/useKeyDown";
import { useMainThreadContext } from "../../../hooks/useMainThread";
import { useRoomMembers } from "../../../hooks/useRoomMembers";

import "./Nametag.css";

const DIST_HIDE = 10;
const DIST_SHOW = 8;

export function Nametags({ room }: { room: Room }) {
  const ctx = useMainThreadContext();
  const [nametags, setNametags] = useState<[string, vec2, number][]>([]);
  const [showNametags, setShowNametags] = useState<boolean>(false);

  useEffect(() => {
    const onNametagsMessage = (ctx: IMainThreadContext, message: NametagsMessageType) => {
      setNametags(message.nametags);
    };
    return registerMessageHandler(ctx, NametagsMessage, onNametagsMessage);
  }, [ctx]);

  useKeyDown(
    (e) => {
      if (e.code === "KeyN") {
        setShowNametags(!showNametags);
      }
    },
    [showNametags]
  );

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

  return <div>{showNametags && nametags.map(Nametag)}</div>;
}
