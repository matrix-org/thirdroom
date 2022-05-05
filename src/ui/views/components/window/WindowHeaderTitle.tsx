import { Text } from "../../../atoms/text/Text";
import "./WindowHeaderTitle.css";

interface WindowHeaderTitleProps {
  icon?: React.ReactNode;
  children: string;
}

export function WindowHeaderTitle({ icon, children }: WindowHeaderTitleProps) {
  return (
    <div className="WindowHeaderTitle flex items-center">
      {icon}
      <Text className="truncate" weight="bold">
        {children}
      </Text>
    </div>
  );
}
