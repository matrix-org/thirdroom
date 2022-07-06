import { TemplateView, GapTile, Builder, TileView } from "@thirdroom/hydrogen-view-sdk";

import "./WorldChatGap.css";
export class WorldChatGap extends TemplateView<GapTile> implements TileView {
  constructor(vm: GapTile) {
    super(vm);
  }

  render(t: Builder<GapTile>, vm: GapTile) {
    return t.li(
      { className: "WorldChatGap flex item-center" },
      t.p({ className: "Text Text-b2 Text--world Text--semi-bold" }, [
        (vm) => (vm.isLoading ? "Loading more messages..." : "Not loading!"),
        (vm) => (vm.error ? vm.error : ""),
      ])
    );
  }

  onClick() {}
}
