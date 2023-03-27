import { useEffect, useState } from "react";
import { Room } from "@thirdroom/hydrogen-view-sdk";
import classNames from "classnames";
import { useAtom, useAtomValue } from "jotai";
import { useKBar, VisualState } from "kbar";

import { WorldChat } from "../world-chat/WorldChat";
import { Stats } from "../stats/Stats";
import { Text } from "../../../atoms/text/Text";
import { useKeyDown } from "../../../hooks/useKeyDown";
import { useEvent } from "../../../hooks/useEvent";
import "./WorldView.css";
import { EditorView } from "../editor/EditorView";
import { Nametags } from "../nametags/Nametags";
import { useMainThreadContext } from "../../../hooks/useMainThread";
import { getModule, registerMessageHandler } from "../../../../engine/module/module.common";
import { useToast } from "../../../hooks/useToast";
import { useHydrogen } from "../../../hooks/useHydrogen";
import { IMainThreadContext } from "../../../../engine/MainThread";
import { createDisposables } from "../../../../engine/utils/createDisposables";
import { ObjectCapReachedMessage, ObjectCapReachedMessageType } from "../../../../plugins/spawnables/spawnables.common";
import { useCalls } from "../../../hooks/useCalls";
import { useRoomCall } from "../../../hooks/useRoomCall";
import { useWebXRSession } from "../../../hooks/useWebXRSession";
import { worldChatVisibilityAtom } from "../../../state/worldChatVisibility";
import { overlayVisibilityAtom } from "../../../state/overlayVisibility";
import { worldAtom } from "../../../state/world";
import { CameraRigModule } from "../../../../plugins/camera/CameraRig.main";
import { HotbarControls, WorldControls } from "./WorldControls";
import { WorldOnboarding } from "./WorldOnboarding";
import { useLocalStorage } from "../../../hooks/useLocalStorage";
import { WorldInteraction } from "./WorldInteraction";
import {
  EnterWebXRAction,
  MembersDialogAction,
  MuteButtonAction,
  ShortcutDialogAction,
  useToggleEditorAction,
  useTogglePhysicsDebugAction,
  useToggleNamesAction,
  useToggleStatsAction,
} from "../cmd-panel/actions";
import { inputFocused } from "../../../utils/common";
import { useDisableInput } from "../../../hooks/useDisableInput";

const SHOW_NAMES_STORE = "showNames";
interface WorldViewProps {
  world: Room;
}

export function WorldView({ world }: WorldViewProps) {
  const mainThread = useMainThreadContext();
  const { session } = useHydrogen(true);
  const calls = useCalls(session);
  const activeCall = useRoomCall(calls, world.id);
  const isWorldEntered = useAtomValue(worldAtom).entered;
  const [worldChatVisible, setWorldChatVisibility] = useAtom(worldChatVisibilityAtom);
  const [overlayVisible, setOverlayVisibility] = useAtom(overlayVisibilityAtom);
  const [editorEnabled, setEditorEnabled] = useState(false);
  const [statsEnabled, setStatsEnabled] = useState(false);

  const { toastShown, toastContent, showToast } = useToast();

  const camRigModule = getModule(mainThread, CameraRigModule);
  const [showNames, setShowNames] = useLocalStorage(SHOW_NAMES_STORE, true);
  const { isWebXRSupported, enterXR, isPresenting } = useWebXRSession();

  const { kbarVisible } = useKBar((state) => ({ kbarVisible: state.visualState !== VisualState.hidden }));
  useDisableInput(kbarVisible);

  useToggleNamesAction(showNames, setShowNames, showToast);
  useToggleEditorAction(setEditorEnabled);
  useTogglePhysicsDebugAction();
  useToggleStatsAction(setStatsEnabled);

  useEffect(() => {
    const onObjectCapReached = (ctx: IMainThreadContext, message: ObjectCapReachedMessage) => {
      showToast("Maximum number of objects reached.");
    };

    const disposables = createDisposables([
      registerMessageHandler(mainThread, ObjectCapReachedMessageType, onObjectCapReached),
    ]);
    return () => {
      disposables();
    };
  }, [mainThread, showToast]);

  useKeyDown(
    (e) => {
      if (e.key === "Escape" && camRigModule.orbiting) {
        return;
      }

      if (e.key === "Escape") {
        if (worldChatVisible) {
          mainThread.canvas?.requestPointerLock();
          setWorldChatVisibility(false);
          return;
        }

        if (inputFocused()) return;

        if (editorEnabled) {
          mainThread.canvas?.requestPointerLock();
          setEditorEnabled(false);
          return;
        }

        if (overlayVisible) {
          mainThread.canvas?.requestPointerLock();
          setOverlayVisibility(false);
          return;
        } else {
          document.exitPointerLock();
          setOverlayVisibility(true);
          return;
        }
      }

      if (inputFocused()) return;

      if (e.key === "Enter" && !overlayVisible && !worldChatVisible) {
        if (document.activeElement !== document.body) return;
        document.exitPointerLock();
        setWorldChatVisibility(true);
        return;
      }
    },
    [worldChatVisible, overlayVisible, editorEnabled]
  );

  useEvent(
    "click",
    (e) => {
      if (isWorldEntered === false) return;

      if (!camRigModule.orbiting) mainThread.canvas?.requestPointerLock();

      if (worldChatVisible) setWorldChatVisibility(false);
      if (overlayVisible) setOverlayVisibility(false);
    },
    mainThread.canvas,
    [isWorldEntered, worldChatVisible, setWorldChatVisibility, overlayVisible, setOverlayVisibility]
  );

  useEffect(() => {
    mainThread.canvas.requestPointerLock();
  }, [mainThread]);

  if (isPresenting) return null;

  return (
    <div className="WorldView">
      <MuteButtonAction activeCall={activeCall} showToast={showToast} />
      <MembersDialogAction world={world} />
      <ShortcutDialogAction />
      {isWebXRSupported && <EnterWebXRAction enter={enterXR} />}

      <WorldOnboarding world={world} />
      <Stats statsEnabled={statsEnabled} />
      <div className={classNames("WorldView__chat flex", { "WorldView__chat--open": worldChatVisible })}>
        {!("isBeingCreated" in world) && <WorldChat open={worldChatVisible} room={world} />}
      </div>
      {world && (
        <>
          {!worldChatVisible && <HotbarControls />}
          <WorldControls
            className="WorldView__controls"
            session={session}
            world={world}
            activeCall={activeCall}
            showToast={showToast}
            isWebXRSupported={isWebXRSupported}
            enterXR={enterXR}
            showNames={showNames}
            setShowNames={setShowNames}
          />
        </>
      )}
      {world && editorEnabled && <EditorView />}
      {!("isBeingCreated" in world) && <Nametags room={world} show={showNames && !overlayVisible} />}

      {!overlayVisible && <WorldInteraction session={session} world={world} activeCall={activeCall} />}

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
