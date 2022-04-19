import { ComposerViewModel } from "@thirdroom/hydrogen-view-sdk";

import "./ComposerView.css";
import { Icon } from "../../../atoms/icon/Icon";
import MessageIC from "../../../../../res/ic/message.svg";

interface IComposerView {
  composerViewModel: ComposerViewModel;
}

export function ComposerView({ composerViewModel }: IComposerView) {
  const handleSubmit = (ev: React.FormEvent) => {
    ev.preventDefault();
    const target = ev.target as typeof ev.target & {
      message: { value: string };
    };
    const message = target.message.value.trim();
    if (message === "") return;
    target.message.value = "";
    composerViewModel.sendMessage(message);
  };

  return (
    <div className="ComposerView flex items-center">
      <Icon color="white" src={MessageIC} size="sm" />
      <form className="grow" onSubmit={handleSubmit}>
        <input
          className="Text Text-b2 Text-regular"
          name="message"
          type="text"
          placeholder="Press Enter to chat"
          autoComplete="off"
        />
      </form>
    </div>
  );
}
