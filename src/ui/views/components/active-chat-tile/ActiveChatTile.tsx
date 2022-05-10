import { ReactNode } from "react";
import classNames from "classnames";

import { Text } from "../../../atoms/text/Text";
import { IconButton } from "../../../atoms/button/IconButton";
import CrossCircleIC from "../../../../../res/ic/cross-circle.svg";

import "./ActiveChatTile.css";

interface IActiveChatTile {
  roomId: string;
  avatar: ReactNode;
  title: string;
  isActive: boolean;
  onClick: (roomId: string) => void;
  onClose: (roomId: string) => void;
}

export function ActiveChatTile({ roomId, avatar, title, isActive, onClick, onClose }: IActiveChatTile) {
  const activeChatClass = classNames("ActiveChatTile", { ["ActiveChatTile--active"]: isActive }, "flex items-center");

  return (
    <div className={activeChatClass}>
      <button className="grow flex items-center" type="button" onClick={() => onClick(roomId)}>
        <div className="shrink-0">{avatar}</div>
        <Text
          className="ActiveChatTile__title truncate"
          type="span"
          color={isActive ? "on-primary" : "surface"}
          weight="medium"
        >
          {title}
        </Text>
      </button>
      <div className="ActiveChatTile__options shrink-0">
        <IconButton
          variant={isActive ? "on-primary" : "surface-low"}
          size="sm"
          iconSrc={CrossCircleIC}
          label="Close"
          onClick={() => onClose(roomId)}
        />
      </div>
    </div>
  );
}
