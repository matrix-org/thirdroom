import classNames from "classnames";
import { ReactNode } from "react";

import { Icon } from "../../../atoms/icon/Icon";
import PeoplesIC from "../../../../../res/ic/peoples.svg";
import { Text } from "../../../atoms/text/Text";

import "./RoomPreviewCard.css";

interface RoomPreviewCardProps {
  className?: string;
  avatar?: ReactNode;
  name?: string | ReactNode;
  desc?: string | ReactNode;
  memberCount?: number;
  options?: ReactNode;
}

export function RoomPreviewCard({ className, avatar, name, desc, memberCount, options }: RoomPreviewCardProps) {
  return (
    <div className={classNames("RoomPreviewCard", "flex items-center gap-xs", className)}>
      <div className="shrink-0 flex">{avatar}</div>
      <div className="grow flex items-center gap-md">
        <div className="grow">
          {name && (
            <Text variant="b2" className="truncate" weight="medium">
              {name}
            </Text>
          )}
          {memberCount && (
            <div className="flex items-center gap-xxs">
              <Icon size="sm" src={PeoplesIC} />
              <Text variant="b3" weight="bold">
                {memberCount}
              </Text>
            </div>
          )}
          {desc && (
            <Text className="truncate" variant="b3">
              {desc}
            </Text>
          )}
        </div>
        {options && <div className="shrink-0">{options}</div>}
      </div>
    </div>
  );
}
