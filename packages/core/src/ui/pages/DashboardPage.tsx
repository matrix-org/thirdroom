import React, {
  PropsWithChildren,
  useCallback,
  useContext,
  useState,
} from "react";
import { Link, useHistory } from "react-router-dom";
import { Button } from "../input/Button";
import { ClientContext } from "../matrix/ClientContext";
import { useRoomList } from "../matrix/useRoomList";
import { CreateRoomModal, ProfileModal } from "../modals";
import { ModalProps, useModal } from "../modals/Modal";

enum ModalId {
  CreateRoom,
  Profile,
}

export function DashboardPage({ children }: PropsWithChildren<{}>) {
  const { logout } = useContext(ClientContext);
  const rooms = useRoomList();
  const history = useHistory();

  const [roomId, setRoomId] = useState("");

  const onNavigate = useCallback(() => {
    history.push(`/room/${roomId}`);
  }, [roomId]);

  const [modalId, setModalId] = useState<ModalId | undefined>();

  return (
    <div className="app home-page">
      <div className="dashboard-actions">
        <div>
          <h1>Dashboard</h1>
          <nav>
            <Button onClick={() => setModalId(ModalId.CreateRoom)}>
              Create Room
            </Button>{" "}
            <Button onClick={() => setModalId(ModalId.Profile)}>Profile</Button>{" "}
            <Button onClick={logout}>Logout</Button>
          </nav>
        </div>
        <div>
          <input onChange={(e) => setRoomId(e.target.value)} value={roomId} />
          <button type="button" onClick={onNavigate}>
            Go
          </button>
        </div>
      </div>
      <div className="recent-rooms">
        <h2>Recent Rooms:</h2>
        <ul className="rooms-container">
          {rooms.map((room) => (
            <Link
              key={room.roomId}
              to={`/room/${room.getCanonicalAlias() || room.roomId}`}
            >
              <div className="room-link-container">
                <div className="room-link-thumb" />
                <div className="room-link-title-container">
                  <li key={room.roomId}>{room.name}</li>
                </div>
              </div>
            </Link>
          ))}
        </ul>
      </div>
      {modalId === ModalId.CreateRoom && (
        <CreateRoomModal isOpen onRequestClose={() => setModalId(undefined)} />
      )}
      {modalId === ModalId.Profile && (
        <ProfileModal isOpen onRequestClose={() => setModalId(undefined)} />
      )}
    </div>
  );
}
