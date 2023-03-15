import { forwardRef, useCallback, useEffect, useRef, useState } from "react";
import { GroupCall, Room, Session } from "@thirdroom/hydrogen-view-sdk";
import classNames from "classnames";

import { IconButton } from "../../../atoms/button/IconButton";
import { Tooltip } from "../../../atoms/tooltip/Tooltip";
import { Hotbar, HotbarSlot } from "../../components/hotbar/Hotbar";
import PeopleIC from "../../../../../res/ic/peoples.svg";
import SubtitlesIC from "../../../../../res/ic/subtitles.svg";
import SubtitlesOffIC from "../../../../../res/ic/subtitles-off.svg";
import MicIC from "../../../../../res/ic/mic.svg";
import MicOffIC from "../../../../../res/ic/mic-off.svg";
import CallCrossIC from "../../../../../res/ic/call-cross.svg";
import CrossIC from "../../../../../res/ic/cross.svg";
import HelpIC from "../../../../../res/ic/help.svg";
import XRIC from "../../../../../res/ic/xr.svg";
import { Text } from "../../../atoms/text/Text";
import { usePermissionState } from "../../../hooks/usePermissionState";
import { useMicrophoneState } from "../../../hooks/useMicrophoneState";
import { useHydrogen } from "../../../hooks/useHydrogen";
import { exceptionToString, RequestException, useStreamRequest } from "../../../hooks/useStreamRequest";
import { AlertDialog } from "../dialogs/AlertDialog";
import { useCallMute } from "../../../hooks/useCallMute";
import { useWorldAction } from "../../../hooks/useWorldAction";
import { NametagsEnableMessage, NametagsEnableMessageType } from "../../../../plugins/nametags/nametags.common";
import { Thread } from "../../../../engine/module/module.common";
import { useMainThreadContext } from "../../../hooks/useMainThread";
import { HeaderTitle } from "../../../atoms/header/HeaderTitle";
import { Header } from "../../../atoms/header/Header";
import { Dialog } from "../../../atoms/dialog/Dialog";
import { Scroll } from "../../../atoms/scroll/Scroll";
import { ShortcutUI } from "./ShortcutUI";
import { MemberListDialog } from "../dialogs/MemberListDialog";
import { setLocalStorageItem } from "../../../hooks/useLocalStorage";
import { useKeyDown } from "../../../hooks/useKeyDown";

export function HotbarControls() {
  return (
    <Hotbar>
      {[
        { imageSrc: "/image/small-crate-icon.png" },
        { imageSrc: "/image/medium-crate-icon.png" },
        { imageSrc: "/image/large-crate-icon.png" },
        { imageSrc: "/image/mirror-ball-icon.png" },
        { imageSrc: "/image/black-mirror-ball-icon.png" },
        { imageSrc: "/image/emissive-ball-icon.png" },
      ].map((slot, index) => (
        <HotbarSlot key={index} imageSrc={slot.imageSrc} shortcutKey={index + 1} label="Spawn Object" />
      ))}
    </Hotbar>
  );
}

const MuteButton = forwardRef<HTMLButtonElement, { activeCall?: GroupCall; showToast: (text: string) => void }>(
  ({ activeCall, showToast }, ref) => {
    const { platform } = useHydrogen(true);
    const micPermission = usePermissionState("microphone");
    const requestStream = useStreamRequest(platform, micPermission);
    const [micException, setMicException] = useState<RequestException>();
    const [microphone, setMicrophone] = useMicrophoneState();
    const { mute: callMute, handleMute } = useCallMute(activeCall);
    if (callMute === microphone) {
      setMicrophone(!microphone);
    }

    return (
      <>
        {micException && (
          <AlertDialog
            open={!!micException}
            title="Microphone"
            content={<Text variant="b2">{exceptionToString(micException)}</Text>}
            requestClose={() => setMicException(undefined)}
          />
        )}
        <Tooltip content={callMute ? "Unmute" : "Mute"}>
          <IconButton
            variant="world"
            label="Mic"
            iconSrc={callMute ? MicOffIC : MicIC}
            onClick={() => {
              showToast(!callMute ? "Microphone Muted" : "Microphone Unmuted");
              handleMute(async () => {
                const [stream, exception] = await requestStream(true, false);
                if (stream) return stream;
                setMicException(exception);
                return undefined;
              });
            }}
            ref={ref}
          />
        </Tooltip>
      </>
    );
  }
);

export function WorldControls({
  className,
  session,
  activeCall,
  world,
  showToast,
  isWebXRSupported,
  enterXR,
  showNames,
  setShowNames,
}: {
  className?: string;
  session: Session;
  activeCall?: GroupCall;
  world: Room;
  showToast: (text: string) => void;
  isWebXRSupported: boolean;
  enterXR: () => void;
  showNames: boolean;
  setShowNames: setLocalStorageItem<boolean>;
}) {
  const mainThread = useMainThreadContext();
  const { exitWorld } = useWorldAction(session);
  const muteBtnRef = useRef<HTMLButtonElement | null>(null);

  const [showActiveMembers, setShowActiveMembers] = useState<boolean>(false);
  const [shortcutUI, setShortcutUI] = useState(false);

  const toggleShowActiveMembers = () => setShowActiveMembers((state) => !state);
  const toggleShortcutUI = () => setShortcutUI((state) => !state);
  const toggleShowNames = useCallback(() => {
    const enabled = !showNames;
    setShowNames(enabled);
    mainThread.sendMessage<NametagsEnableMessageType>(Thread.Game, { type: NametagsEnableMessage, enabled });
    showToast(enabled ? "Show Names" : "Hide Names");
  }, [mainThread, showNames, showToast, setShowNames]);

  useEffect(() => {
    mainThread.sendMessage<NametagsEnableMessageType>(Thread.Game, {
      type: NametagsEnableMessage,
      enabled: showNames,
    });
  }, [mainThread, showNames]);

  useKeyDown(
    (e) => {
      const inputFocused = document.activeElement?.tagName.toLowerCase() === "input";
      if (inputFocused) return;

      if (e.altKey && e.code === "KeyL") {
        exitWorld();
      }
      if (e.altKey && e.code === "KeyX" && isWebXRSupported) {
        enterXR();
      }
      if (e.code === "KeyM" && muteBtnRef.current !== null) {
        muteBtnRef.current.click();
      }

      if (e.code === "KeyN") {
        toggleShowNames();
      }
      if (e.code === "KeyP") {
        document.exitPointerLock();
        toggleShowActiveMembers();
      }
      if (e.code === "Slash") {
        e.preventDefault();
        toggleShortcutUI();
      }
    },
    [enterXR, isWebXRSupported]
  );

  return (
    <div className={classNames(className, "flex")}>
      <div className="flex flex-column items-center">
        <Tooltip content={shortcutUI ? "Hide Help" : "Show Help"}>
          <IconButton variant="world" label="help" iconSrc={HelpIC} onClick={toggleShortcutUI} />
        </Tooltip>
        <Text variant="b3" color="world" weight="bold">
          /
        </Text>
        <Dialog open={shortcutUI} onOpenChange={setShortcutUI}>
          <Header
            left={<HeaderTitle size="lg">Controls</HeaderTitle>}
            right={<IconButton iconSrc={CrossIC} onClick={toggleShortcutUI} label="Close" />}
          />
          <div className="flex" style={{ height: "600px" }}>
            <Scroll type="hover">
              <ShortcutUI />
            </Scroll>
          </div>
        </Dialog>
      </div>
      {isWebXRSupported && (
        <div className="flex flex-column items-center">
          <Tooltip content="Enter XR">
            <IconButton variant="world" label="Enter XR" iconSrc={XRIC} onClick={enterXR} />
          </Tooltip>
          <Text variant="b3" color="world" weight="bold">
            Alt + X
          </Text>
        </div>
      )}
      <div className="flex flex-column items-center">
        <Tooltip content={showActiveMembers ? "Hide Members" : "Show Members"}>
          <IconButton variant="world" label="activeMembers" iconSrc={PeopleIC} onClick={toggleShowActiveMembers} />
        </Tooltip>
        <Text variant="b3" color="world" weight="bold">
          P
        </Text>
        {!("isBeingCreated" in world) && (
          <Dialog open={showActiveMembers} onOpenChange={setShowActiveMembers}>
            <MemberListDialog room={world} requestClose={() => setShowActiveMembers(false)} />
          </Dialog>
        )}
      </div>
      <div className="flex flex-column items-center">
        <Tooltip content={showNames ? "Hide Names" : "Show Names"}>
          <IconButton
            variant="world"
            label="Toggle Names"
            iconSrc={showNames ? SubtitlesIC : SubtitlesOffIC}
            onClick={toggleShowNames}
          />
        </Tooltip>
        <Text variant="b3" color="world" weight="bold">
          N
        </Text>
      </div>
      {activeCall && (
        <div className="flex flex-column items-center">
          <MuteButton
            showToast={showToast}
            activeCall={activeCall}
            ref={(ref) => {
              muteBtnRef.current = ref;
            }}
          />
          <Text variant="b3" color="world" weight="bold">
            M
          </Text>
        </div>
      )}
      <div className="flex flex-column items-center">
        <Tooltip content="Disconnect">
          <IconButton variant="danger" label="Disconnect" iconSrc={CallCrossIC} onClick={exitWorld} />
        </Tooltip>
        <Text variant="b3" color="world" weight="bold">
          Alt + L
        </Text>
      </div>
    </div>
  );
}
