import { FormEvent } from "react";
import { ComposerViewModel } from "@thirdroom/hydrogen-view-sdk";

import "./WorldChatComposer.css";

interface IWorldChatComposer {
  composerViewModel: ComposerViewModel;
}

export function WorldChatComposer({ composerViewModel }: IWorldChatComposer) {
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
    <form className="WorldChatComposer grow" onSubmit={handleSubmit}>
      <input
        className="Text Text-b2 Text--world Text-regular"
        name="message"
        type="text"
        placeholder=""
        autoComplete="off"
        autoFocus
      />
    </form>
  );
}
