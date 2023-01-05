import { TextTile, Builder, BaseMessageTile } from "@thirdroom/hydrogen-view-sdk";

import { linkifyText } from "../../../../utils/common";
import { ChatBaseMessage } from "./ChatBaseMessage";

import "./ChatMessage.css";

export class ChatMessage extends ChatBaseMessage {
  constructor(vm: TextTile) {
    super(vm);
  }

  renderBody<T extends Builder<BaseMessageTile>>(t: T, vm: TextTile): Element {
    const isEmote = vm._getContent()?.msgtype === "m.emote";
    let body = isEmote ? `* ${vm.displayName} ` : "";
    body += vm._getPlainBody?.();
    return t.div(
      { className: "ChatMessage__body flex" },
      t.p({ className: "Text Text-b2 Text--surface Text--regular" }, linkifyText(body) || "*** EMPTY MESSAGE ***")
    );
  }
  onClick() {}
}
