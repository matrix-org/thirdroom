import React, { useCallback, useContext, useState } from "react";
import { useParams, useHistory, useLocation } from "react-router-dom";
import { ErrorMessage } from "../input/ErrorMessage";
import { useRoom } from "../matrix/useRoom";
import { useScene } from "../matrix/useScene";
import { useRoomProfile } from "../matrix/useRoomProfile";
import { useGroupCall } from "../matrix/useGroupCall";
import { Button } from "../input/Button";
import { useWorld } from "../../world/useWorld";
import { GroupCall } from "@robertlong/matrix-js-sdk/lib/webrtc/groupCall";
import { Room } from "@robertlong/matrix-js-sdk";
import { ClientContext } from "../matrix";
import { RoomSettingsModal } from "../modals/RoomSettingsModal";
import { ProfileModal } from "../modals";

enum ModalId {
  RoomSettings,
  Profile,
}

export function RoomPage() {
  const { roomId: maybeRoomId } = useParams<{ roomId: string }>();
  const { hash } = useLocation();
  const roomId = maybeRoomId || hash;
  const { loading, error, room } = useRoom(roomId);
  const { sceneUrl } = useScene(room);
  const {
    loading: groupCallLoading,
    entered,
    groupCall,
    error: groupCallLoadingError,
    enter,
  } = useGroupCall(room);

  if (error || groupCallLoadingError) {
    return <ErrorMessage error={error || groupCallLoadingError} />;
  }

  if (loading || groupCallLoading || !room || !groupCall || !sceneUrl) {
    return <div>Loading...</div>;
  }

  return (
    <RoomView
      room={room}
      groupCall={groupCall}
      sceneUrl={sceneUrl}
      entered={entered}
      onEnter={enter}
    />
  );
}

interface RoomViewProps {
  room: Room;
  groupCall: GroupCall;
  entered: boolean;
  onEnter: () => void;
  sceneUrl: string;
}

function RoomView({
  room,
  groupCall,
  entered,
  onEnter,
  sceneUrl,
}: RoomViewProps) {
  const history = useHistory();
  const { logout } = useContext(ClientContext);

  const onChangeRoom = useCallback((roomId) => {
    history.push(`/room/${roomId}`);
  }, []);

  const canvasRef = useWorld(groupCall, onChangeRoom, sceneUrl);

  const [modalId, setModalId] = useState<ModalId | undefined>();

  const onLogout = useCallback(() => {
    logout();
    history.push("/");
  }, []);

  return (
    <div>
      <div style={{ width: "100vw", height: "100vh", backgroundColor: "#000" }}>
        <canvas ref={canvasRef} />
        {!entered && (
          <div className="create-room-container">
            <div className="container-content">
              <Button onClick={() => setModalId(ModalId.RoomSettings)}>
                Room Settings
              </Button>
              <Button onClick={() => setModalId(ModalId.Profile)}>
                Profile
              </Button>
              <Button onClick={onLogout}>Logout</Button>
              <Button className="enter-room" type="button" onClick={onEnter}>
                Enter Room
              </Button>
            </div>
          </div>
        )}
      </div>
      {modalId === ModalId.RoomSettings && (
        <RoomSettingsModal
          room={room}
          isOpen
          onRequestClose={() => setModalId(undefined)}
        />
      )}
      {modalId === ModalId.Profile && (
        <ProfileModal isOpen onRequestClose={() => setModalId(undefined)} />
      )}
    </div>
  );
}
