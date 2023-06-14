import { forwardRef, useCallback, useEffect, useState } from "react";
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
import { NametagsEnableMessage, NametagsEnableMessageType } from "../../../../engine/player/nametags.common";
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
import { manageMuteRequest, MicExceptionDialog, useMuteButton } from "../../components/MuteButtonProvider";
import { inputFocused } from "../../../utils/common";
import { useDisableInput } from "../../../hooks/useDisableInput";
import { useWorldNavigator } from "../../../hooks/useWorldNavigator";
import { useActionBar } from "../../../hooks/useActionBar";

export function HotbarControls() {
  const actionBarItems = useActionBar();

  return (
    <Hotbar>
      {actionBarItems.map((item, index) => (
        <HotbarSlot key={item.id} imageSrc={item.thumbnail} shortcutKey={index + 1} label={item.label} />
      ))}
    </Hotbar>
  );
}

const MuteButton = forwardRef<HTMLButtonElement, { activeCall?: GroupCall; showToast: (text: string) => void }>(
  ({ activeCall, showToast }, ref) => {
    const { mute, requestStream, handleMute, micException, setMicException } = useMuteButton(activeCall);

    return (
      <>
        <MicExceptionDialog micException={micException} setMicException={setMicException} />
        <Tooltip content={mute ? "Unmute" : "Mute"}>
          <IconButton
            variant="world"
            label="Mic"
            iconSrc={mute ? MicOffIC : MicIC}
            onClick={() => {
              showToast(!mute ? "Microphone Muted" : "Microphone Unmuted");
              handleMute(async () => manageMuteRequest(requestStream, setMicException));
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
  const { navigateExitWorld } = useWorldNavigator(session);

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
      if (inputFocused()) return;

      if (e.altKey && e.code === "KeyL") {
        navigateExitWorld();
      }
    },
    [enterXR, isWebXRSupported]
  );

  useDisableInput(shortcutUI || showActiveMembers);

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
          <MuteButton showToast={showToast} activeCall={activeCall} />
          <Text variant="b3" color="world" weight="bold">
            M
          </Text>
        </div>
      )}
      <div className="flex flex-column items-center">
        <Tooltip content="Disconnect">
          <IconButton variant="danger" label="Disconnect" iconSrc={CallCrossIC} onClick={navigateExitWorld} />
        </Tooltip>
        <Text variant="b3" color="world" weight="bold">
          Alt + L
        </Text>
      </div>
    </div>
  );
}
