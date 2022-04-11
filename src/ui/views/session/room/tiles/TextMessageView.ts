import { TemplateView } from "hydrogen-view-sdk";
import "./TextMessageView.css";

export class TextMessageView extends TemplateView {
  constructor(vm: any) {
    super(vm);
  }

  render(t: any, vm: any) {
    return t.li(
      { className: "TextMessageView" },
      t.div({ className: "Text Text-b2 Text--regular" }, [
        t.span({ className: "TextMessageView__sender Text--semi-bold" }, vm.displayName),
        () => vm._getPlainBody?.() || "*** EMPTY MESSAGE ***",
      ])
    );
  }
  onClick() {}
}
