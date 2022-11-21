import { useEffect, useState } from "react";

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
      const response = await fetch(
        `https://matrix-client.matrix.org/_matrix/client/unstable/im.nheko.summary/rooms/${encodeURIComponent(
          roomIdOrAlias
        )}/summary`,
        {
          signal: controller.signal,
        }
      );
      const data = await response.json();
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