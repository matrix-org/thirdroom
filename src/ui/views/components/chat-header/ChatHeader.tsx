import classNames from "classnames";
import { ReactNode } from "react";

import { Text } from "../../../atoms/text/Text";
import "./ChatHeader.css";

interface IChatHeader {
  className?: string;
  avatar: ReactNode;
  title: string;
  options: ReactNode;
}

export function ChatHeader({ className, avatar, title, options }: IChatHeader) {
  return (
    <header className={classNames("ChatHeader flex items-center", className)}>
      <div className="shrink-0 flex">{avatar}</div>
      <div className="ChatHeader__title grow">
        <Text className="truncate">{title}</Text>
      </div>
      <div className="ChatHeader__options shrink-0 flex">{options}</div>
    </header>
  );
}
