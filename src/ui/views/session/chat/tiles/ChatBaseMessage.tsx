import classNames from "classnames";
import { TemplateView, BaseMessageTile, TileView, Builder } from "@thirdroom/hydrogen-view-sdk";

import "./ChatBaseMessage.css";

export abstract class ChatBaseMessage extends TemplateView<BaseMessageTile> implements TileView {
  constructor(vm: BaseMessageTile) {
    super(vm);
  }

  render(t: Builder<BaseMessageTile>, vm: BaseMessageTile): Element {
    const isEmote = vm._getContent()?.msgtype === "m.emote";
    const contentOnly = vm.isContinuation;
    return t.li(
      {
        className: classNames(
          "ChatBaseMessage",
          { "ChatBaseMessage--contentOnly": contentOnly && !isEmote },
          { "ChatBaseMessage--emote": isEmote },
          "flex"
        ),
      },
      [
        contentOnly && !isEmote ? "" : this.renderAvatar(t, vm),
        t.div({ className: "ChatBaseMessage__content grow" }, [
          contentOnly || isEmote
            ? ""
            : t.p(
                { className: "ChatBaseMessage__sender Text Text-b2 Text--surface Text--bold truncate" },
                vm.displayName
              ),
          t.div({ className: "ChatBaseMessage__body" }, this.renderBody?.(t, vm) || ""),
        ]),
      ]
    );
  }

  renderAvatar(t: Builder<BaseMessageTile>, vm: BaseMessageTile): Element {
    const isEmote = vm._getContent()?.msgtype === "m.emote";
    const avatarUrl = vm.avatarUrl(40);
    const { avatarColorNumber, avatarLetter, avatarTitle } = vm;

    const className = classNames(`ChatBaseMessage__avatar ChatBaseMessage__avatar-${avatarColorNumber} shrink-0`, {
      "ChatBaseMessage__avatar--sm": isEmote,
    });

    const child = avatarUrl
      ? t.img({ src: avatarUrl })
      : t.span({ className: "Text Text-b2 Text--medium" }, avatarLetter);

    return t.div({ className, "aria-label": avatarTitle }, child);
  }

  onClick() {}
  abstract renderBody<T extends Builder<BaseMessageTile>>(t: T, vm: BaseMessageTile): Element;
}
