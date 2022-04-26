import { TemplateView, RoomMemberTile, Builder } from "@thirdroom/hydrogen-view-sdk";
import "./ChatAnnouncement.css";

export class ChatAnnouncement extends TemplateView<RoomMemberTile> {
  constructor(vm: RoomMemberTile) {
    super(vm);
  }

  render(t: Builder<RoomMemberTile>, vm: RoomMemberTile): Element {
    return t.li(
      { className: "ChatAnnouncement flex" },
      t.div(
        { className: "ChatAnnouncement__content" },
        t.p({ className: "Text Text-b2 Text--surface-low Text--regular" }, vm.announcement)
      )
    );
  }

  onClick() {}
}
