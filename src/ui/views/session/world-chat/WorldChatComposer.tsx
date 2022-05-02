import { MatrixClient, Room } from "@thirdroom/matrix-js-sdk";

import "./WorldChatComposer.css";
import { Icon } from "../../../atoms/icon/Icon";
import MessageIC from "../../../../../res/ic/message.svg";

interface IWorldChatComposer {
  client: MatrixClient;
  room: Room;
}

export function WorldChatComposer({ client, room }: IWorldChatComposer) {
  const handleSubmit = (ev: React.FormEvent) => {
    ev.preventDefault();
    const target = ev.target as typeof ev.target & {
      message: { value: string };
    };
    const message = target.message.value.trim();
    if (message === "") return;
    target.message.value = "";

    // TODO: Send message
    console.log(message);
  };

  return (
    <div className="WorldChatComposer flex items-center">
      <Icon color="world" src={MessageIC} size="sm" />
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
