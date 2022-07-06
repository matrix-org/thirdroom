import { TextTile, Builder, BaseMessageTile } from "@thirdroom/hydrogen-view-sdk";

import { ChatBaseMessage } from "./ChatBaseMessage";

import "./ChatMessage.css";

export class ChatMessage extends ChatBaseMessage {
  constructor(vm: TextTile) {
    super(vm);
  }

  renderBody<T extends Builder<BaseMessageTile>>(t: T, vm: TextTile): Element {
    return t.div(
      { className: "ChatMessage__body flex" },
      t.p({ className: "Text Text-b2 Text--surface Text--regular" }, vm._getPlainBody?.() || "*** EMPTY MESSAGE ***")
    );
  }
  onClick() {}
}
