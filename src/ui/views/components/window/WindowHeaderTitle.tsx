import { Text } from "../../../atoms/text/Text";
import { Icon } from "../../../atoms/icon/Icon";
import "./WindowHeaderTitle.css";

interface WindowHeaderTitleProps {
  iconSrc?: string;
  children: string;
}

export function WindowHeaderTitle({ iconSrc, children }: WindowHeaderTitleProps) {
  return (
    <div className="WindowHeaderTitle flex items-center">
      {iconSrc && <Icon className="shrink-0" src={iconSrc} color="surface" />}
      <Text className="truncate" weight="bold">
        {children}
      </Text>
    </div>
  );
}
