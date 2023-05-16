import { TemplateView, DateTile, Builder } from "@thirdroom/hydrogen-view-sdk";

import "./ChatDate.css";

export class ChatDate extends TemplateView<DateTile> {
  constructor(vm: DateTile) {
    super(vm);
  }

  render(t: Builder<DateTile>, vm: DateTile) {
    return t.p(
      { className: "ChatDate Text Text-b2 Text--surface Text--semi-bold" },
      t.time({ dateTime: vm.machineReadableDate }, vm.relativeDate)
    );
  }

  onClick() {}
}
