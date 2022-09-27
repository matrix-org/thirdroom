import { ReactNode } from "react";

import { Text } from "../../../atoms/text/Text";
import { Icon } from "../../../atoms/icon/Icon";
import PeoplesIC from "../../../../../res/ic/peoples.svg";

import "./WorldPreviewCard.css";

export interface IWorldPreviewCard {
  title: string;
  desc?: string;
  content?: ReactNode;
  memberCount?: number | string;
  onMembersClick?: () => void;
  options?: ReactNode;
}

export function WorldPreviewCard({ title, desc, content, memberCount, onMembersClick, options }: IWorldPreviewCard) {
  return (
    <div className="WorldPreviewCard flex flex-column gap-sm">
      <div className="flex items-center gap-md">
        <div className="WorldPreviewCard__content grow">
          <Text className="truncate" variant="s1" weight="semi-bold">
            {title}
          </Text>
          {desc && (
            <Text className="" variant="b3" color="surface-low">
              {desc}
            </Text>
          )}
        </div>

        {memberCount !== undefined && (
          <div
            role={onMembersClick ? "button" : undefined}
            tabIndex={onMembersClick ? 0 : -1}
            onClick={onMembersClick}
            className="WorldPreviewCard__memberCount flex items-center"
            style={{ cursor: onMembersClick ? "pointer" : "inherit" }}
          >
            <Icon size="sm" src={PeoplesIC} />
            <Text variant="b3" weight="bold" type="span">
              {memberCount}
            </Text>
          </div>
        )}
        {options && <div className="shrink-0">{options}</div>}
      </div>
      {content && <div>{content}</div>}
    </div>
  );
}
