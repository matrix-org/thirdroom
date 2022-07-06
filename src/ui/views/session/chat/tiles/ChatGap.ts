import { TemplateView, GapTile, Builder, TileView } from "@thirdroom/hydrogen-view-sdk";

import "./ChatGap.css";
export class ChatGap extends TemplateView<GapTile> implements TileView {
  constructor(vm: GapTile) {
    super(vm);
  }

  render(t: Builder<GapTile>, vm: GapTile) {
    return t.li(
      { className: "ChatGap flex justify-center" },
      t.p({ className: "ChatGap__content Text Text-b2 Text--surface Text--semi-bold" }, [
        (vm) => (vm.isLoading ? "Loading more messages..." : "Not loading!"),
        (vm) => (vm.error ? vm.error : ""),
      ])
    );
  }

  /* This is called by the parent ListView, which just has 1 listener for the whole list */
  onClick() {}
}
