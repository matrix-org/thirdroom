import { TemplateView, RoomMemberTile, Builder } from "hydrogen-view-sdk";
import "./AnnouncementView.css";

export class AnnouncementView extends TemplateView<RoomMemberTile> {
  constructor(vm: RoomMemberTile) {
    super(vm);
  }

  render(t: Builder<RoomMemberTile>, vm: RoomMemberTile): Element {
    return t.li(
      { className: "AnnouncementView" },
      t.div({ className: "Text Text-b2 Text--regular" }, () => vm.announcement)
    );
  }

  onClick() {}
}
