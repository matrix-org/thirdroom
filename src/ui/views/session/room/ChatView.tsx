import React from "react";
import './ChatView.css';
import {
  RoomViewModel as ChatViewModel,
  RoomView as ChatViewConstructor,
} from 'hydrogen-view-sdk';

interface IChatView {
  vm: typeof ChatViewModel,
  roomId: string,
}

export function ChatView({
  vm,
  roomId,
}: IChatView) {
  React.useEffect(() => {
    const chatView = new ChatViewConstructor(vm);
    const chatViewHtml = chatView.mount();

    const chatContainer = document.getElementById('ChatView');
    chatContainer?.append(chatViewHtml);

    return () => {
      chatView.unmount();
      if (chatContainer?.hasChildNodes()) {
        chatContainer?.removeChild(chatContainer?.childNodes[0]);
      }
    }
  }, [roomId]);

  return (
    <div className="ChatView" id="ChatView">
    </div>
  );
}
