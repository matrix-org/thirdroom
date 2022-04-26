import { TemplateView, TextTile, Builder, TileView } from "@thirdroom/hydrogen-view-sdk";

import "./ChatMessage.css";

export class ChatMessage extends TemplateView<TextTile> implements TileView {
  constructor(vm: TextTile) {
    super(vm);
  }

  render(t: Builder<TextTile>, vm: TextTile): Element {
    return t.li({ className: "ChatMessage flex" }, [
      t.div({ className: "ChatMessage__avatar shrink-0" }, ""),
      t.div({ className: "ChatMessage__content grow" }, [
        t.p({ className: "ChatMessage__sender Text Text-b2 Text--surface Text--bold truncate" }, vm.displayName),
        t.p({ className: "Text Text-b2 Text--surface Text--regular" }, vm._getPlainBody?.() || "*** EMPTY MESSAGE ***"),
      ]),
    ]);
  }
  onClick() {}
}
