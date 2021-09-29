import React, { useCallback, useContext, useState } from "react";
import { Link, useHistory } from "react-router-dom";
import { Button } from "../input/Button";
import { ClientContext } from "../matrix/ClientContext";
import { useRoomList } from "../matrix/useRoomList";

export function DashboardPage() {
  const { logout } = useContext(ClientContext);
  const rooms = useRoomList();
  const history = useHistory();

  const [roomId, setRoomId] = useState("");

  const onNavigate = useCallback(() => {
    history.push(`/room/${roomId}`);
  }, [roomId]);

  return (
    <div className="app home-page">
      <div className="dashboard-actions">
        <div>
          <h1>Dashboard</h1>
          <nav>
            <Link to="/create">Create Room</Link> <Link to="/profile">Profile</Link>{" "}
            <Button onClick={logout}>Logout</Button>
          </nav>
        </div>
        <div>
          <input onChange={(e) => setRoomId(e.target.value)} value={roomId}/>
          <button type="button" onClick={onNavigate}>Go</button>
        </div>
      </div>
      <div className="recent-rooms">
        <h2>Recent Rooms:</h2>
        <ul className="rooms-container">
          {rooms.map((room) => (
            <Link to={`/room/${room.roomId}`}>
              <div className="room-link-container">
                <div className="room-link-thumb"/>
                <div className="room-link-title-container">
                <li key={room.roomId}>
                  {room.name}
                </li>
                </div>
              </div>
            </Link>
          ))}
        </ul>
      </div>
    </div>
  );
}
