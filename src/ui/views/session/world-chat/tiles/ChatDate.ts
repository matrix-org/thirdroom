import { TemplateView, DateTile, Builder } from "@thirdroom/hydrogen-view-sdk";

export class ChatDate extends TemplateView<DateTile> {
  constructor(vm: DateTile) {
    super(vm);
  }

  render(t: Builder<DateTile>, vm: DateTile) {
    return t.span({ className: "inline-flex" }, "");
  }

  onClick() {}
}
