import { SimpleTile, TileViewConstructor } from "@thirdroom/hydrogen-view-sdk";

import { ChatGap } from "./ChatGap";
import { ChatMessage } from "./ChatMessage";
import { ChatAnnouncement } from "./ChatAnnouncement";
import { ChatImage } from "./ChatImage";

export function viewClassForTile(vm: SimpleTile): TileViewConstructor<any> {
  switch (vm.shape) {
    case "gap":
      return ChatGap;
    case "announcement":
      return ChatAnnouncement;
    case "message":
    case "message-status":
      return ChatMessage;
    case "image":
      return ChatImage;
    default:
      throw new Error(
        `Tiles of shape "${vm.shape}" are not supported, check the tileClassForEntry function in the view model`
      );
  }
}
