import { GroupCall, Member, Room } from "@thirdroom/hydrogen-view-sdk";
import { useCallback, useEffect, useRef, useState } from "react";
import classNames from "classnames";

import "./Nametags.css";
import { getModule } from "../../../../engine/module/module.common";
import { range } from "../../../../engine/utils/interpolation";
import { useMainThreadContext } from "../../../hooks/useMainThread";
import { useRoomMembers } from "../../../hooks/useRoomMembers";
import { useHydrogen } from "../../../hooks/useHydrogen";
import { useWorld } from "../../../hooks/useRoomIdFromAlias";
import { Avatar } from "../../../atoms/avatar/Avatar";
import { getAvatarHttpUrl, getIdentifierColorNumber } from "../../../utils/avatar";
import { AudioModule } from "../../../../engine/audio/audio.main";
import { getReadObjectBufferView } from "../../../../engine/allocator/ObjectBufferView";
import { LocalNametag } from "../../../../engine/nametag/nametag.main";

// src: https://css-tricks.com/using-requestanimationframe-with-react-hooks/
const useAnimationFrame = (callback: Function, enabled = true) => {
  const requestRef = useRef<number>();
  const previousTimeRef = useRef<number>();

  const animate = useCallback(
    (time: number) => {
      if (previousTimeRef.current != undefined) {
        const deltaTime = time - previousTimeRef.current;
        callback(deltaTime);
      }
      previousTimeRef.current = time;
      requestRef.current = requestAnimationFrame(animate);
    },
    [callback]
  );

  useEffect(() => {
    if (enabled) {
      requestRef.current = requestAnimationFrame(animate);
      return () => cancelAnimationFrame(requestRef.current || 0);
    }
  }, [enabled, animate]);
};

const opacityRange = (a: number) => range(30, 10, 0, 1, a);
const scaleRange = (a: number) => range(40, 0, 0.01, 1, a);

type SpeakingRoomMember = Member & { volumeDetector: { isSpeaking: boolean } };

interface NametagProps {
  room: Room;
  nametag: LocalNametag;
  groupCall: GroupCall;
}

function Nametag({ room, nametag, groupCall }: NametagProps) {
  const { joined } = useRoomMembers(room) ?? {};

  const containerRef = useRef<HTMLDivElement>(null);
  const [speaking, setSpeaking] = useState<boolean>(false);

  const member = joined?.find((m) => m.userId === nametag.name);

  const memberCall = member
    ? Array.from(new Map(groupCall.members).values()).find((m) => m.userId === member?.userId && m.isConnected)
    : undefined;

  const avatarUrl = member?.avatarUrl;
  const userId = member?.userId || nametag.name;

  const { platform, session } = useHydrogen(true);
  const volumeDetector =
    (memberCall && (memberCall as SpeakingRoomMember).volumeDetector) ||
    (memberCall?.remoteMedia?.userMedia &&
      ((memberCall as SpeakingRoomMember).volumeDetector = (platform.mediaDevices as any).createVolumeMeasurer(
        memberCall?.remoteMedia?.userMedia,
        () => {}
      )));

  useAnimationFrame(() => {
    if (containerRef.current) {
      const nametagView = getReadObjectBufferView(nametag.tripleBuffer);
      const screenX = nametagView.screenX[0];
      const screenY = nametagView.screenY[0];
      const distanceFromCamera = nametagView.distanceFromCamera[0];
      const inFrustum = nametagView.inFrustum[0];

      const el = containerRef.current;

      if (inFrustum) {
        const opacity = opacityRange(distanceFromCamera);
        const scale = scaleRange(distanceFromCamera);
        el.style.transform = `translate(${screenX}px, ${screenY}px) scale(${scale})`;
        el.style.opacity = `${opacity}`;
      } else {
        el.style.opacity = "0";
      }

      setSpeaking(volumeDetector?.isSpeaking);
    }
  });

  return (
    <div className="Nametag" ref={containerRef}>
      <div className="Nametag--inner Text-b1">
        <Avatar
          size="xxs"
          shape="circle"
          name={member?.displayName?.toUpperCase() || nametag.name.replace("@", "").toUpperCase()}
          imageSrc={avatarUrl ? getAvatarHttpUrl(avatarUrl, 25, platform, session.mediaRepository) : undefined}
          bgColor={`var(--usercolor${getIdentifierColorNumber(userId)})`}
          className={classNames("", { ["Nametag--image"]: avatarUrl, ["Speaking"]: speaking })}
        />
        {member?.displayName || nametag.name}
      </div>
    </div>
  );
}

export function Nametags({ room, show }: { room: Room; show: boolean }) {
  const engine = useMainThreadContext();

  const [nametags, setNametags] = useState<LocalNametag[]>([]);

  const onNametagsChanged = useCallback((nametags: LocalNametag[]) => {
    setNametags([...nametags]);
  }, []);

  useEffect(() => {
    const audioModule = getModule(engine, AudioModule);

    audioModule.eventEmitter.addListener("nametags-changed", onNametagsChanged);

    return () => {
      audioModule.eventEmitter.removeListener("nametags-changed", onNametagsChanged);
    };
  }, [engine, onNametagsChanged]);

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
      {show &&
        groupCall &&
        nametags.map((nametag) => (
          <Nametag key={nametag.resourceId} room={room} nametag={nametag} groupCall={groupCall as GroupCall} />
        ))}
    </div>
  );
}
