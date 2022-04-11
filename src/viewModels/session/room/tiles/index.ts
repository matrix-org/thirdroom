import { GapTile, TextTile, RoomMemberTile, EncryptedEventTile, SimpleTile } from "hydrogen-view-sdk";

import type { TimelineEntry, Options as TileConstructorOptions, TileConstructor } from "hydrogen-view-sdk";

export type TileConstructor = new (
  entry: typeof TimelineEntry,
  options: typeof TileConstructorOptions
) => typeof SimpleTile;

export function tileClassForEntry(entry: typeof TimelineEntry): TileConstructor | undefined {
  if (entry.isGap) {
    return GapTile;
  } else if (entry.eventType) {
    switch (entry.eventType) {
      case "m.room.message": {
        if (entry.isRedacted) {
          return undefined;
        }
        const content = entry.content;
        const msgtype = content && content.msgtype;
        switch (msgtype) {
          case "m.text":
          case "m.notice":
          case "m.emote":
            return TextTile;
          default:
            // unknown msgtype not rendered
            return undefined;
        }
      }
      case "m.room.member":
        return RoomMemberTile;
      case "m.room.encrypted":
        if (entry.isRedacted) {
          return undefined;
        }
        return EncryptedEventTile;
      default:
        // unknown type not rendered
        return undefined;
    }
  }
}
