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
import { Avatar } from "../../../atoms/avatar/Avatar";
import { getAvatarHttpUrl, getIdentifierColorNumber } from "../../../utils/avatar";

const DIST_HIDE = 50;
const DIST_SHOW = 10;

const MIN_OPACITY = 0.2;
const MAX_OPACITY = 1;

const SPEAKING_OPACITY = 0.75;
const SILENT_OPACITY = 0.4;

type SpeakingRoomMember = Member & { volumeDetector: { isSpeaking: boolean } };

function Nametag({ room, nametag, groupCall }: { room: Room; nametag: [string, vec2, number]; groupCall: GroupCall }) {
  const engine = useMainThreadContext();
  const { joined } = useRoomMembers(room) ?? {};

  const { platform, session } = useHydrogen(true);
  const [name, [left, top], dist] = nametag;
  const opacity = range(DIST_HIDE, DIST_SHOW, MIN_OPACITY, MAX_OPACITY, dist);
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
        transform: `translate(${left}px, ${top}px)`,
        opacity: `${opacity}`,
      }}
      className="Nametag"
    >
      <div className="Nametag--inner Text-b3">
        <Avatar
          size="xxs"
          shape="circle"
          name={member?.displayName?.toUpperCase() || name.replace("@", "").toUpperCase()}
          imageSrc={avatarUrl ? getAvatarHttpUrl(avatarUrl, 25, platform, session.mediaRepository) : undefined}
          bgColor={`var(--usercolor${getIdentifierColorNumber(userId)})`}
          className={avatarUrl ? "Nametag--image" : ""}
        />
        {member?.displayName || name}
        <span>
          <object
            style={{ opacity: `${speaking ? SPEAKING_OPACITY : SILENT_OPACITY}` }}
            className="Icon"
            type="image/svg+xml"
            data={isPeerMuted(engine, name) ? VolumeOffIC : speaking ? VolumeUpIC : VolumeMuteIC}
          />
        </span>
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
    return registerMessageHandler(engine, NametagsMessage, onNametagsMessage);
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
        nametags.map((nametag) => (
          <Nametag key={nametag[0]} room={room} nametag={nametag} groupCall={groupCall as GroupCall} />
        ))}
    </div>
  );
}
