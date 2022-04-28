import { TemplateView, RoomMemberTile, Builder } from "@thirdroom/hydrogen-view-sdk";
import "./AnnouncementView.css";

export class AnnouncementView extends TemplateView<RoomMemberTile> {
  constructor(vm: RoomMemberTile) {
    super(vm);
  }

  render(t: Builder<RoomMemberTile>, vm: RoomMemberTile): Element {
    return t.li(
      { className: "WorldChat__AnnouncementView" },
      t.div({ className: "Text Text-b2 Text--world Text--regular" }, vm.announcement)
    );
  }

  onClick() {}
}
