import { MatrixClient, Room } from "@robertlong/matrix-js-sdk";

export async function fetchRoom(
  client: MatrixClient,
  roomIdOrAlias: string,
  timeout: number = 5000
): Promise<Room> {
  const { roomId } = await client.joinRoom(roomIdOrAlias);

  return new Promise((resolve, reject) => {
    let timeoutId: any;

    function onRoom(room: Room) {
      if (room && room.roomId === roomId) {
        clearTimeout(timeoutId);
        client.removeListener("Room", onRoom);
        resolve(room);
      }
    }

    const room = client.getRoom(roomId);

    if (room) {
      resolve(room);
    }

    client.on("Room", onRoom);

    if (timeout) {
      timeoutId = setTimeout(() => {
        client.removeListener("Room", onRoom);
        reject(new Error("Fetching room timed out."));
      }, timeout);
    }
  });
}
