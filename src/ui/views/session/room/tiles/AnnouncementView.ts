import { TemplateView } from "hydrogen-view-sdk";
import "./AnnouncementView.css";

export class AnnouncementView extends TemplateView {
  constructor(vm: any) {
    super(vm);
  }

  render(t: any) {
    return t.li(
      { className: "AnnouncementView" },
      t.div({ className: "Text Text-b2 Text--regular" }, (vm: any) => vm.announcement)
    );
  }

  onClick() {}
}
