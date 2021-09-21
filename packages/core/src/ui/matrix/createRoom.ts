import { MatrixClient, Room } from "@robertlong/matrix-js-sdk";
import { Preset } from "@robertlong/matrix-js-sdk/lib/@types/partials";
import { fetchRoom } from "./fetchRoom";

export enum RoomAccess {
  InviteOnly = "invite_only",
  RegisteredUsers = "registered_users",
  Guests = "guests",
}

interface CreateRoomOptions {
  name: string;
  alias?: string;
  scene?: File | Blob;
  roomAccess: RoomAccess;
}

export async function createRoom(
  client: MatrixClient,
  { name, alias, scene, roomAccess }: CreateRoomOptions
): Promise<Room> {
  let sceneUrl: string | undefined;

  if (scene) {
    sceneUrl = await client.uploadContent(scene);
  }

  const { room_id } = await client.createRoom({
    name,
    room_alias_name: alias, //TODO: Fix room aliases
    preset:
      roomAccess === RoomAccess.InviteOnly
        ? Preset.PrivateChat
        : Preset.PublicChat,
  });

  const room = await fetchRoom(client, room_id);

  if (sceneUrl) {
    await client.sendStateEvent(
      room_id,
      "me.robertlong.scene",
      {
        sceneUrl,
      },
      ""
    );
  }

  // TODO: Set default scene url

  return room;
}
