import { useState } from "react";
import { MatrixClient, Room } from "@thirdroom/matrix-js-sdk";

import "./WorldChat.css";
import { WorldChatTimeline } from "./WorldChatTimeline";
import { WorldChatComposer } from "./WorldChatComposer";
import { Text } from "../../../atoms/text/Text";

interface IWorldChat {
  open: boolean;
  client: MatrixClient;
  room: Room;
}

export function WorldChat({ client, room, open }: IWorldChat) {
  const [{ error, loading }] = useState<{ error?: Error; loading: boolean }>({ error: undefined, loading: false });

  if (!open) {
    return null;
  }

  return (
    <div className="WorldChat flex flex-column" id="WorldChat">
      {error ? (
        <div className="grow flex justify-center items-center">
          <Text>{error.message}</Text>
        </div>
      ) : loading ? (
        <div className="grow flex justify-center items-center">
          <Text>loading...</Text>
        </div>
      ) : (
        <>
          <WorldChatTimeline client={client} room={room} />
          <WorldChatComposer client={client} room={room} />
        </>
      )}
    </div>
  );
}
