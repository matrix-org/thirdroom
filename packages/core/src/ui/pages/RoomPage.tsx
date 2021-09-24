import React, { useCallback, useEffect, useState } from "react";
import { Link, useParams, useHistory, useLocation } from "react-router-dom";
import { ErrorMessage } from "../input/ErrorMessage";
import { useRoom } from "../matrix/useRoom";
import { useScene } from "../matrix/useScene";
import {
  ChangeSceneForm,
  ChangeSceneFormFields,
} from "../forms/ChangeSceneForm";
import { useRoomProfile } from "../matrix/useRoomProfile";
import { useGroupCall } from "../matrix/useGroupCall";
import { Button } from "../input/Button";
import { useWorld } from "../../world/useWorld";
import { GroupCall } from "@robertlong/matrix-js-sdk/lib/webrtc/groupCall";

enum RoomView {
  Init = "init",
  Setup = "setup",
  Room = "room",
}

function parseRoomIdParam(roomIdParam: string) {
  if (roomIdParam.startsWith("!")) {
    return roomIdParam;
  }

  return `#${roomIdParam}`;
}

export function RoomPage() {
  const history = useHistory();
  const { roomId: roomIdParam } = useParams<{ roomId: string }>();
  const { state } = useLocation<{ autoEnter: boolean }>();
  const roomId = parseRoomIdParam(roomIdParam);
  const { loading, error, room } = useRoom(roomId);
  const { sceneUrl, uploadAndChangeScene } = useScene(room);
  const { avatarUrl } = useRoomProfile(room);
  const {
    loading: groupCallLoading,
    entered,
    groupCall,
    error: groupCallLoadingError,
    enter,
  } = useGroupCall(room);

  const [groupCallError, setGroupCallError] = useState<Error | undefined>();

  const onChangeRoom = useCallback((roomId) => {
    history.push(`/room/${roomId.replace("#", "")}`, { autoEnter: true });
  }, []);

  const onChangeScene = useCallback(
    (data: ChangeSceneFormFields) => {
      if (data.scene.length > 0) {
        uploadAndChangeScene(data.scene[0]);
      }
    },
    [uploadAndChangeScene]
  );

  useEffect(() => {
    if (room && state && state.autoEnter) {
      enter();
    }
  }, [room, state]);

  const view = () => {
    if (loading || groupCallLoading) {
      return <div>Loading...</div>;
    }

    if (error || groupCallLoadingError || groupCallError) {
      return (
        <ErrorMessage
          error={error || groupCallLoadingError || groupCallError}
        />
      );
    }

    if (groupCall && entered) {
      return <Viewport groupCall={groupCall} onChangeRoom={onChangeRoom} sceneUrl={sceneUrl} />;
    } else {
      return (
		<div className="create-room-container">
			<div className="container-content">
				<p>
					<b>Scene Url:</b> {sceneUrl}
				</p>
				<p>
					<b>Avatar Url:</b> {avatarUrl}
				</p>
				<ChangeSceneForm onSubmit={onChangeScene} />
				<Button type="button" onClick={enter}>
					Enter Room
				</Button>
			</div>
		</div>
      );
    }
  };

  return (
	<div>
		{!entered && <h1>Room</h1>}
		{view()}
		{!entered && <Link to="/">Back to dashboard</Link>}
	</div>
  );
}
interface ViewportProps {
  groupCall: GroupCall;
  sceneUrl?: string;
  onChangeRoom: (roomId: string) => void
}

function Viewport({ groupCall, onChangeRoom, sceneUrl }: ViewportProps) {
  const canvasRef = useWorld(groupCall, onChangeRoom, sceneUrl);

  return (
    <div style={{ width: "100vw", height: "100vh", backgroundColor: "#000" }}>
      <canvas ref={canvasRef} />
    </div>
  );
}
