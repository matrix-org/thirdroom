import { FormEvent } from "react";
import { ComposerViewModel } from "@thirdroom/hydrogen-view-sdk";

import { IconButton } from "../../../atoms/button/IconButton";
import SendIC from "../../../../../res/ic/send.svg";
import "./ChatComposer.css";

interface ChatComposerProps {
  composerViewModel: ComposerViewModel;
}

export function ChatComposer({ composerViewModel }: ChatComposerProps) {
  const handleSubmit = (ev: FormEvent) => {
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
    <div className="ChatComposer flex">
      <form className="grow flex items-center" onSubmit={handleSubmit}>
        <input
          className="Text Text-b1 Text--surface Text--regular grow"
          name="message"
          type="text"
          placeholder="Send a message..."
          autoComplete="off"
          autoFocus
        />
        <IconButton iconSrc={SendIC} label="Send Message" type="submit" />
      </form>
    </div>
  );
}
