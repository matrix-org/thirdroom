import { GroupCall, Member, Room } from "@thirdroom/hydrogen-view-sdk";
import { vec2 } from "gl-matrix";
import { useEffect, useState } from "react";
import classNames from "classnames";

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
import { useHydrogen } from "../../../hooks/useHydrogen";
import { useWorld } from "../../../hooks/useRoomIdFromAlias";
import { Avatar } from "../../../atoms/avatar/Avatar";
import { getAvatarHttpUrl, getIdentifierColorNumber } from "../../../utils/avatar";

const opacityRange = (a: number) => range(30, 10, 0, 1, a);
const scaleRange = (a: number) => range(30, 5, 0.1, 1, a);

type SpeakingRoomMember = Member & { volumeDetector: { isSpeaking: boolean } };

function Nametag({ room, nametag, groupCall }: { room: Room; nametag: [string, vec2, number]; groupCall: GroupCall }) {
  const { joined } = useRoomMembers(room) ?? {};

  const { platform, session } = useHydrogen(true);
  const [name, [left, top], dist] = nametag;
  const opacity = opacityRange(dist);
  const scale = scaleRange(dist);
  const member = joined?.find((m) => m.userId === name);

  const memberCall = member
    ? Array.from(new Map(groupCall.members).values()).find((m) => m.userId === member?.userId && m.isConnected)
    : undefined;

  const avatarUrl = member?.avatarUrl;
  const userId = member?.userId || name;

  const volumeDetector =
    (memberCall && (memberCall as SpeakingRoomMember).volumeDetector) ||
    (memberCall?.remoteMedia?.userMedia &&
      ((memberCall as SpeakingRoomMember).volumeDetector = (platform.mediaDevices as any).createVolumeMeasurer(
        memberCall?.remoteMedia?.userMedia,
        () => {}
      )));

  const speaking = volumeDetector?.isSpeaking;

  return (
    <div
      key={name}
      style={{
        position: "absolute",
        transform: `translate(${left}px, ${top}px) scale(${scale})`,
        opacity: `${opacity}`,
      }}
      className="Nametag"
    >
      <div className="Nametag--inner Text-b1">
        <Avatar
          size="xxs"
          shape="circle"
          name={member?.displayName?.toUpperCase() || name.replace("@", "").toUpperCase()}
          imageSrc={avatarUrl ? getAvatarHttpUrl(avatarUrl, 25, platform, session.mediaRepository) : undefined}
          bgColor={`var(--usercolor${getIdentifierColorNumber(userId)})`}
          className={classNames("", { ["Nametag--image"]: avatarUrl, ["Speaking"]: speaking })}
        />
        {member?.displayName || name}
      </div>
    </div>
  );
}

export function Nametags({ room, enabled }: { room: Room; enabled: boolean }) {
  const engine = useMainThreadContext();
  const [nametags, setNametags] = useState<[string, vec2, number][]>([]);

  engine.sendMessage<NametagsEnableMessageType>(Thread.Game, { type: NametagsEnableMessage, enabled });

  useEffect(() => {
    const onNametagsMessage = (ctx: IMainThreadContext, message: NametagsMessageType) => {
      setNametags(message.nametags);
    };
    registerMessageHandler(engine, NametagsMessage, onNametagsMessage);
  }, [engine, nametags]);

  const { session } = useHydrogen(true);
  const [, world] = useWorld();

  let groupCall: GroupCall | undefined;
  if (world) {
    for (const [, call] of Array.from(session.callHandler.calls)) {
      if (call.roomId === world.id) {
        groupCall = call;
        break;
      }
    }
  }

  return (
    <div>
      {enabled &&
        groupCall &&
        nametags.length &&
        nametags.map((nametag) => (
          <Nametag key={nametag[0]} room={room} nametag={nametag} groupCall={groupCall as GroupCall} />
        ))}
    </div>
  );
}
