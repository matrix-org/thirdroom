import { Text } from "../../../atoms/text/Text";
import { Icon } from "../../../atoms/icon/Icon";
import PeoplesIC from "../../../../../res/ic/peoples.svg";

import "./WorldPreviewCard.css";

export interface IWorldPreviewCard {
  title: string;
  desc?: string;
  memberCount?: number | string;
  options?: React.ReactNode;
}

export function WorldPreviewCard({ title, desc, memberCount, options }: IWorldPreviewCard) {
  return (
    <div className="WorldPreviewCard flex items-center">
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
        <div className="WorldPreviewCard__memberCount flex items-center">
          <Icon size="sm" src={PeoplesIC} />
          <Text variant="b3" weight="bold" type="span">
            {memberCount}
          </Text>
        </div>
      )}
      {options && <div className="shrink-0">{options}</div>}
    </div>
  );
}
