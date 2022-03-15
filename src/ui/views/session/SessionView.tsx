import React, { useEffect, useRef, useState } from "react";
import './SessionView.css';

import { SessionViewModel } from '../../../viewModels/session/SessionViewModel';
import { RoomViewModel } from '../../../viewModels/session/room/RoomViewModel';

import { LeftPanelView } from './leftpanel/LeftPanelView';
import { RoomPreview } from "./room/RoomPreview";
import { RoomLoading } from "./room/RoomLoading";
import { RoomView } from './room/RoomView';

import { useVMProp } from '../../hooks/useVMProp';
import { useEngine } from "../../hooks/useEngine";

import defaultSceneUrl from "../../../../res/gltf/OutdoorFestival/OutdoorFestival.glb?url";

interface ISessionView {
  vm: SessionViewModel,
};

export function SessionView({ vm }: ISessionView) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [sceneUrl, setSceneUrl] = useState<string | undefined>();
  const { enterWorld, exitWorld } = useEngine(canvasRef, sceneUrl);

  return (
    <>
      <canvas className="SessionView__viewport" ref={canvasRef} />
      <div className="SessionView flex">
        <LeftPanelView vm={vm.leftPanelViewModel} />
        <MiddleView vm={vm} enterWorld={enterWorld} exitWorld={exitWorld} setSceneUrl={setSceneUrl} />
      </div>
    </>
  );
}

function MiddleView({ vm, enterWorld, exitWorld, setSceneUrl }: { vm: SessionViewModel, enterWorld: () => void, exitWorld: () => void, setSceneUrl: (sceneUrl: string | undefined) => any }) {
  const activeRoomId = useVMProp(vm, 'activeRoomId');

  if (!activeRoomId) return <p>select room from left panel</p>;
  if (vm.isActiveRoomInvite) return <p>invite</p>;
  return <RoomViewWrapper vm={vm.roomViewModel!} roomId={activeRoomId} enterWorld={enterWorld} exitWorld={exitWorld} setSceneUrl={setSceneUrl}  />;
}

function RoomViewWrapper({ vm, roomId, enterWorld, exitWorld, setSceneUrl }: { vm: RoomViewModel, roomId: string, enterWorld: () => void, exitWorld: () => void, setSceneUrl: (sceneUrl: string | undefined) => any }) {
  const roomFlow = useVMProp(vm, 'roomFlow');

  const prevRoomFlowRef = useRef<string>();

  useEffect(() => {
    setSceneUrl(defaultSceneUrl);

    if (prevRoomFlowRef.current !== "loaded" && vm.roomFlow === "loaded") {
      enterWorld();
    } else if (prevRoomFlowRef.current === "loaded" && vm.roomFlow !== "loaded") {
      exitWorld();
    }

    prevRoomFlowRef.current = vm.roomFlow;
  }, [vm.roomFlow]);

  return (
    <>
      {vm.roomFlow === 'preview' && <RoomPreview vm={vm} roomId={roomId} />}
      {vm.roomFlow === 'load' && <RoomLoading vm={vm} />}
      {vm.roomFlow === 'loaded' && <RoomView vm={vm} roomId={roomId} />}
    </>
  );
}

