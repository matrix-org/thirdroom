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
    <div>
      <h1>Dashboard</h1>
      <nav>
        <Link to="/create">Create Room</Link> <Link to="/profile">Profile</Link>{" "}
        <Button onClick={logout}>Logout</Button>
      </nav>
      <div>
        <input onChange={(e) => setRoomId(e.target.value)} value={roomId}/>
        <button type="button" onClick={onNavigate}>Go</button>
      </div>
      <h2>Recent Rooms:</h2>
      <ul>
        {rooms.map((room) => (
          <li key={room.roomId}>
            <Link to={`/room/${room.roomId}`}>{room.name}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
