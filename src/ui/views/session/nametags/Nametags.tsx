import { GroupCall, Member, Room } from "@thirdroom/hydrogen-view-sdk";
import { vec2 } from "gl-matrix";
import { useEffect, useState } from "react";

import "./Nametag.css";
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
import VolumeMuteIC from "../../../../../res/ic/volume-mute.svg";
import VolumeOffIC from "../../../../../res/ic/volume-off.svg";
import VolumeUpIC from "../../../../../res/ic/volume-up.svg";
import { useHydrogen } from "../../../hooks/useHydrogen";
import { useWorld } from "../../../hooks/useRoomIdFromAlias";
import { isPeerMuted } from "../../../../engine/network/network.main";

const DIST_HIDE = 10;
const DIST_SHOW = 8;

const MIN_OPACITY = 0;
const MAX_OPACITY = 1;

type SpeakingRoomMember = Member & { volumeDetector: any };

export function Nametags({ room, enabled }: { room: Room; enabled: boolean }) {
  const engine = useMainThreadContext();
  const [nametags, setNametags] = useState<[string, vec2, number][]>([]);

  engine.sendMessage<NametagsEnableMessageType>(Thread.Game, { type: NametagsEnableMessage, enabled });

  useEffect(() => {
    const onNametagsMessage = (ctx: IMainThreadContext, message: NametagsMessageType) => {
      setNametags(message.nametags);
    };
    return registerMessageHandler(engine, NametagsMessage, onNametagsMessage);
  }, [engine]);

  const { joined } = useRoomMembers(room) ?? {};

  const { platform, session } = useHydrogen(true);
  const [, world] = useWorld();

  let groupCall: GroupCall;
  if (world) {
    for (const [, call] of Array.from(session.callHandler.calls)) {
      if (call.roomId === world.id) {
        groupCall = call;
        break;
      }
    }
  }

  const Nametag = (nametag: [string, vec2, number]) => {
    const [name, [left, top], dist] = nametag;
    const opacity = range(DIST_HIDE, DIST_SHOW, MIN_OPACITY, MAX_OPACITY, dist);
    const member = joined?.find((m) => m.userId === name);

    const memberCall = member
      ? Array.from(new Map(groupCall.members).values()).find((m) => m.userId === member?.userId && m.isConnected)
      : undefined;

    const volumeDetector =
      (memberCall as SpeakingRoomMember).volumeDetector ||
      ((memberCall as SpeakingRoomMember).volumeDetector = (platform.mediaDevices as any).createVolumeMeasurer(
        memberCall?.remoteMedia?.userMedia,
        () => {}
      ));

    const speaking = volumeDetector.isSpeaking;

    return (
      <div
        key={name}
        style={{
          position: "absolute",
          transform: `translate(${left}px, ${top}px)`,
          opacity: `${opacity}`,
        }}
        className="Nametag"
      >
        <div className="Nametag--inner">
          {member?.displayName || name}
          <span>
            <object
              className="Icon"
              type="image/svg+xml"
              data={isPeerMuted(engine, name) ? VolumeOffIC : speaking ? VolumeUpIC : VolumeMuteIC}
            />
          </span>
        </div>
      </div>
    );
  };

  return <div>{enabled && nametags.map(Nametag)}</div>;
}
