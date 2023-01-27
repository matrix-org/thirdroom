import { useCallback, useEffect, useRef, useState, forwardRef } from "react";
import { GroupCall, Room, RoomStatus } from "@thirdroom/hydrogen-view-sdk";
import classNames from "classnames";

import { WorldChat } from "../world-chat/WorldChat";
import { Stats } from "../stats/Stats";
import { Text } from "../../../atoms/text/Text";
import { IconButton } from "../../../atoms/button/IconButton";
import { useStore } from "../../../hooks/useStore";
import { useKeyDown } from "../../../hooks/useKeyDown";
import { usePointerLockChange } from "../../../hooks/usePointerLockChange";
import { useEvent } from "../../../hooks/useEvent";
import PeopleIC from "../../../../../res/ic/peoples.svg";
import SubtitlesIC from "../../../../../res/ic/subtitles.svg";
import SubtitlesOffIC from "../../../../../res/ic/subtitles-off.svg";
import MicIC from "../../../../../res/ic/mic.svg";
import MicOffIC from "../../../../../res/ic/mic-off.svg";
import CrossIC from "../../../../../res/ic/cross.svg";
import CallCrossIC from "../../../../../res/ic/call-cross.svg";
import HelpIC from "../../../../../res/ic/help.svg";
import XRIC from "../../../../../res/ic/xr.svg";
import "./WorldView.css";
import { EditorView } from "../editor/EditorView";
import { useCallMute } from "../../../hooks/useCallMute";
import { Tooltip } from "../../../atoms/tooltip/Tooltip";
import { Reticle } from "../reticle/Reticle";
import { EntityTooltip, IPortalProcess } from "../entity-tooltip/EntityTooltip";
import { Nametags } from "../nametags/Nametags";
import { Dialog } from "../../../atoms/dialog/Dialog";
import { MemberListDialog } from "../dialogs/MemberListDialog";
import { useMainThreadContext } from "../../../hooks/useMainThread";
import { registerMessageHandler, Thread } from "../../../../engine/module/module.common";
import { NametagsEnableMessage, NametagsEnableMessageType } from "../../../../plugins/nametags/nametags.common";
import { useToast } from "../../../hooks/useToast";
import { usePermissionState } from "../../../hooks/usePermissionState";
import { useMicrophoneState } from "../../../hooks/useMicrophoneState";
import { useHydrogen } from "../../../hooks/useHydrogen";
import { exceptionToString, RequestException, useStreamRequest } from "../../../hooks/useStreamRequest";
import { AlertDialog } from "../dialogs/AlertDialog";
import { OnboardingModal } from "./OnboardingModal";
import { useOnboarding } from "../../../hooks/useOnboarding";
import { Header } from "../../../atoms/header/Header";
import { HeaderTitle } from "../../../atoms/header/HeaderTitle";
import { ShortcutUI } from "./ShortcutUI";
import { Scroll } from "../../../atoms/scroll/Scroll";
import { IMainThreadContext } from "../../../../engine/MainThread";
import { useMouseDown } from "../../../hooks/useMouseDown";
import {
  InteractableAction,
  InteractionMessage,
  InteractionMessageType,
} from "../../../../plugins/interaction/interaction.common";
import { ExitedWorldMessage, ThirdRoomMessageType } from "../../../../plugins/thirdroom/thirdroom.common";
import { createDisposables } from "../../../../engine/utils/createDisposables";
import { aliasToRoomId, parsedMatrixUriToString, parseMatrixUri } from "../../../utils/matrixUtils";
import { Hotbar, HotbarSlot } from "../../components/hotbar/Hotbar";
import { ObjectCapReachedMessage, ObjectCapReachedMessageType } from "../../../../plugins/spawnables/spawnables.common";
import { useWorldAction } from "../../../hooks/useWorldAction";
import { useCalls } from "../../../hooks/useCalls";
import { useRoomCall } from "../../../hooks/useRoomCall";
import { useIsMounted } from "../../../hooks/useIsMounted";
import { InteractableType } from "../../../../engine/resource/schema";
import { useWebXRSession } from "../../../hooks/useWebXRSession";
import { useMemoizedState } from "../../../hooks/useMemoizedState";

export interface ActiveEntityState {
  interactableType: InteractableType;
  name: string;
  held: boolean;
  peerId?: string;
  ownerId?: string;
}

const SHOW_NAMES_STORE = "showNames";

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

interface WorldViewProps {
  world: Room;
}

export function WorldView({ world }: WorldViewProps) {
  const mainThread = useMainThreadContext();
  const { session } = useHydrogen(true);
  const calls = useCalls(session);
  const activeCall = useRoomCall(calls, world.id);
  const { enterWorld, exitWorld } = useWorldAction(session);
  const { selectWorld } = useStore((state) => state.overlayWorld);
  const isEnteredWorld = useStore((state) => state.world.entered);
  const { isOpen: isChatOpen, openWorldChat, closeWorldChat } = useStore((state) => state.worldChat);
  const setIsPointerLock = useStore((state) => state.pointerLock.setIsPointerLock);
  const { isOpen: isOverlayOpen, openOverlay, closeOverlay } = useStore((state) => state.overlay);
  const [editorEnabled, setEditorEnabled] = useState(false);
  const [statsEnabled, setStatsEnabled] = useState(false);
  const [shortcutUI, setShortcutUI] = useState(false);
  const isMounted = useIsMounted();

  const { onboarding, finishOnboarding } = useOnboarding(isEnteredWorld ? world?.id : undefined);

  const muteBtnRef = useRef<HTMLButtonElement | null>(null);
  const { toastShown, toastContent, showToast } = useToast();

  const engine = useMainThreadContext();

  const [showNames, setShowNames] = useState<boolean>(() => {
    const store = localStorage.getItem(SHOW_NAMES_STORE);
    if (!store) return true;
    const json = JSON.parse(store);
    return json.showNames;
  });

  useEffect(() => {
    localStorage.setItem(SHOW_NAMES_STORE, JSON.stringify({ showNames }));

    engine.sendMessage<NametagsEnableMessageType>(Thread.Game, {
      type: NametagsEnableMessage,
      enabled: showNames,
    });
  }, [engine, showNames]);

  const [showActiveMembers, setShowActiveMembers] = useState<boolean>(false);

  const toggleShowNames = useCallback(() => {
    const enabled = !showNames;
    setShowNames(enabled);
    engine.sendMessage<NametagsEnableMessageType>(Thread.Game, { type: NametagsEnableMessage, enabled });
    showToast(enabled ? "Show Names" : "Hide Names");
  }, [setShowNames, showNames, showToast, engine]);

  const toggleShowActiveMembers = () => setShowActiveMembers((state) => !state);
  const toggleShortcutUI = () => setShortcutUI((state) => !state);
  const [activeEntity, setActiveEntity] = useMemoizedState<ActiveEntityState | undefined>();
  const [portalProcess, setPortalProcess] = useState<IPortalProcess>({});
  const mouseDown = useMouseDown(mainThread.canvas);

  const { isWebXRSupported, enterXR, isPresenting } = useWebXRSession();

  useEffect(() => {
    let unSubStatusObserver: () => void | undefined;

    const onInteraction = async (ctx: IMainThreadContext, message: InteractionMessage) => {
      const interactableType = message.interactableType;

      if (!interactableType || message.action === InteractableAction.Unfocus) {
        setActiveEntity(undefined);
      } else if (
        message.interactableType === InteractableType.Grabbable ||
        message.interactableType === InteractableType.Interactable
      ) {
        setActiveEntity({
          interactableType,
          name: message.name || "Object",
          held: message.held || false,
          ownerId: message.ownerId,
        });
      } else if (message.interactableType === InteractableType.Player) {
        if (message.action === InteractableAction.Grab) {
          setShowActiveMembers(true);
          document.exitPointerLock();
        } else {
          setActiveEntity({
            interactableType,
            name: (message.peerId && activeCall?.members.get(message.peerId)?.member.displayName) || "Player",
            peerId: message.peerId,
            held: false,
          });
        }
      } else if (message.interactableType === InteractableType.Portal) {
        if (message.action === InteractableAction.Grab) {
          try {
            setPortalProcess({});
            if (!message.uri) throw Error("Portal does not have valid matrix id/alias");

            const parsedUri = parseMatrixUri(message.uri);
            if (parsedUri instanceof URL) {
              window.location.href = parsedUri.href;
              return;
            }

            const roomIdOrAlias = parsedUri.mxid1;
            const roomId = roomIdOrAlias.startsWith("#")
              ? aliasToRoomId(session.rooms, parsedUri.mxid1)
              : parsedUri.mxid1;

            if (roomId && session.rooms.get(roomId)) {
              selectWorld(roomId);
              enterWorld(roomId);
              return;
            }

            setPortalProcess({ joining: true });
            const rId = await session.joinRoom(roomIdOrAlias);
            if (!isMounted()) return;
            setPortalProcess({});
            const roomStatusObserver = await session.observeRoomStatus(rId);
            unSubStatusObserver = roomStatusObserver.subscribe((roomStatus) => {
              if (roomStatus !== RoomStatus.Joined) return;
              selectWorld(rId);
              enterWorld(rId);
            });
          } catch (err) {
            if (!isMounted()) return;
            setPortalProcess({ error: err as Error });
          }
        } else {
          setActiveEntity({
            interactableType,
            name: (message.uri && parsedMatrixUriToString(parseMatrixUri(message.uri))) || "Portal",
            held: false,
          });
        }
      }
    };

    const onExitedWorld = (ctx: IMainThreadContext, message: ExitedWorldMessage) => {
      setActiveEntity(undefined);
    };

    const onObjectCapReached = (ctx: IMainThreadContext, message: ObjectCapReachedMessage) => {
      showToast("Maximum number of objects reached.");
    };

    const disposables = createDisposables([
      registerMessageHandler(engine, InteractionMessageType, onInteraction),
      registerMessageHandler(engine, ObjectCapReachedMessageType, onObjectCapReached),
      registerMessageHandler(engine, ThirdRoomMessageType.ExitedWorld, onExitedWorld),
    ]);
    return () => {
      unSubStatusObserver?.();
      disposables();
    };
  }, [activeCall, engine, showToast, enterWorld, selectWorld, isMounted, session, setActiveEntity]);

  useKeyDown(
    (e) => {
      if (isEnteredWorld === false) return;
      if (onboarding) return;

      const isEscape = e.key === "Escape";
      const isTyping = document.activeElement?.tagName.toLowerCase() === "input";

      if (isEscape && showActiveMembers) {
        mainThread.canvas?.requestPointerLock();
        setShowActiveMembers(false);
        return;
      }
      if (isEscape && shortcutUI) {
        mainThread.canvas?.requestPointerLock();
        setShortcutUI(false);
        return;
      }
      if (isEscape && isChatOpen) {
        mainThread.canvas?.requestPointerLock();
        closeWorldChat();
        return;
      }
      if (isEscape && isOverlayOpen) {
        mainThread.canvas?.requestPointerLock();
        closeOverlay();
        return;
      }
      if (isEscape && isOverlayOpen === false) {
        document.exitPointerLock();
        openOverlay();
        return;
      }
      if (e.key === "Enter" && isOverlayOpen === false && isChatOpen === false) {
        if (document.activeElement !== document.body) return;
        document.exitPointerLock();
        openWorldChat();
        return;
      }

      if (isTyping || isChatOpen || showActiveMembers || shortcutUI) return;

      if (e.altKey && e.code === "KeyL") {
        exitWorld();
      }
      if (e.altKey && e.code === "KeyX" && isWebXRSupported) {
        enterXR();
      }
      if (e.code === "KeyM" && muteBtnRef.current !== null) {
        muteBtnRef.current.click();
      }
      if (e.code === "Backquote") {
        setEditorEnabled((enabled) => !enabled);
      }
      if (e.code === "KeyS" && e.shiftKey && e.ctrlKey) {
        setStatsEnabled((enabled) => !enabled);
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
    [
      isEnteredWorld,
      isChatOpen,
      isOverlayOpen,
      showNames,
      showActiveMembers,
      shortcutUI,
      onboarding,
      openWorldChat,
      closeWorldChat,
      openOverlay,
      closeOverlay,
      enterXR,
      isWebXRSupported,
    ]
  );

  useEvent(
    "click",
    (e) => {
      const isChatOpen = useStore.getState().worldChat.isOpen;
      const isOverlayOpen = useStore.getState().overlay.isOpen;
      const isEnteredWorld = useStore.getState().world.entered;
      if (isEnteredWorld === false) return;

      mainThread.canvas?.requestPointerLock();
      if (isChatOpen) closeWorldChat();
      if (isOverlayOpen) closeOverlay();
    },
    mainThread.canvas,
    []
  );

  useEffect(() => {
    mainThread.canvas.requestPointerLock();
  }, [mainThread]);

  useEffect(() => {
    if (onboarding) document.exitPointerLock();
  }, [onboarding]);

  const onFinishOnboarding = useCallback(() => {
    finishOnboarding();
    mainThread.canvas?.requestPointerLock();
  }, [mainThread.canvas, finishOnboarding]);

  usePointerLockChange(mainThread.canvas, setIsPointerLock, []);

  if (isPresenting) return null;

  return (
    <div className="WorldView">
      <OnboardingModal open={onboarding} world={world} requestClose={onFinishOnboarding} />
      <Stats statsEnabled={statsEnabled} />
      <div className={classNames("WorldView__chat flex", { "WorldView__chat--open": isChatOpen })}>
        {!("isBeingCreated" in world) && <WorldChat open={isChatOpen} room={world} />}
      </div>
      {world && (
        <>
          {!isChatOpen && (
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
          )}
          <div className="WorldView__controls flex">
            <div className="flex flex-column items-center">
              <Tooltip content={shortcutUI ? "Hide Help" : "Show Help"}>
                <IconButton variant="world" label="help" iconSrc={HelpIC} onClick={toggleShortcutUI} />
              </Tooltip>
              <Text variant="b3" color="world" weight="bold">
                /
              </Text>
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
                <IconButton
                  variant="world"
                  label="activeMembers"
                  iconSrc={PeopleIC}
                  onClick={toggleShowActiveMembers}
                />
              </Tooltip>
              <Text variant="b3" color="world" weight="bold">
                P
              </Text>
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
        </>
      )}
      {world && editorEnabled && <EditorView />}
      {!("isBeingCreated" in world) && <Nametags room={world} show={showNames && !isOverlayOpen} />}
      {!("isBeingCreated" in world) && (
        <>
          <Dialog open={showActiveMembers} onOpenChange={setShowActiveMembers}>
            <MemberListDialog room={world} requestClose={() => setShowActiveMembers(false)} />
          </Dialog>
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
        </>
      )}
      {!isOverlayOpen && showNames && activeEntity && (
        <EntityTooltip activeEntity={activeEntity} portalProcess={portalProcess} />
      )}
      {!isOverlayOpen && <Reticle activeEntity={activeEntity} mouseDown={mouseDown} />}
      <div className="WorldView__toast-container">
        <div className={classNames("WorldView__toast", { "WorldView__toast--shown": toastShown })}>
          <Text variant="b2" color="world" weight="semi-bold">
            {toastContent}
          </Text>
        </div>
      </div>
    </div>
  );
}
