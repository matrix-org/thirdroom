import { TemplateView, TextTile, Builder, TileView } from "@thirdroom/hydrogen-view-sdk";
import classNames from "classnames";

import { linkifyText } from "../../../../utils/common";
import "./TextMessageView.css";

export class TextMessageView extends TemplateView<TextTile> implements TileView {
  constructor(vm: TextTile) {
    super(vm);
  }

  render(t: Builder<TextTile>, vm: TextTile): Element {
    const isEmote = vm._getContent()?.msgtype === "m.emote";

    let body = isEmote ? `* ${vm.displayName} ` : "";
    body += vm._getPlainBody?.();

    return t.li(
      { className: classNames("WorldChat__TextMessageView", { "WorldChat__TextMessageView--emote": isEmote }) },
      t.div({ className: "Text Text-b2 Text--world Text--regular" }, [
        isEmote
          ? ""
          : t.span(
              { className: "WorldChat__TextMessageView-sender Text Text-b2 Text--world Text--semi-bold" },
              `${vm.displayName}:`
            ),
        t.span(linkifyText(body) || "*** EMPTY MESSAGE ***"),
      ])
    );
  }
  onClick() {}
}
