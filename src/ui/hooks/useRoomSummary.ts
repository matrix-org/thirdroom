import { useEffect, useState } from "react";

export function getRoomSummary(roomIdOrAlias: string, signal?: AbortSignal) {
  return fetch(
    `https://matrix-client.matrix.org/_matrix/client/unstable/im.nheko.summary/rooms/${encodeURIComponent(
      roomIdOrAlias
    )}/summary`,
    { signal }
  );
}

export interface SummaryData {
  roomId: string;
  avatarUrl?: string;
  name: string;
  topic?: string;
  alias?: string;
  roomType?: string;
  memberCount: number;
}

export function useRoomSummary(roomIdOrAlias: string) {
  const [summary, setSummary] = useState<SummaryData>();

  useEffect(() => {
    let controller: AbortController | undefined;
    const run = async () => {
      controller = new AbortController();
      const response = await getRoomSummary(roomIdOrAlias, controller.signal);
      const data = await response.json();
      if (data.errcode) {
        return;
      }
      setSummary({
        roomId: data.room_id,
        avatarUrl: data.avatar_url,
        name: data.name,
        topic: data.topic,
        alias: data.canonical_alias,
        roomType: data.room_type,
        memberCount: data.num_joined_members,
      });
    };
    if (roomIdOrAlias) run();
    return () => {
      controller?.abort();
    };
  }, [roomIdOrAlias]);

  return summary;
}
