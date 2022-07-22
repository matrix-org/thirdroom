import classNames from "classnames";

import "./PropertiesPanel.css";

import { Text } from "../../../atoms/text/Text";

interface PropertiesPanelProps {
  className?: string;
}

export function PropertiesPanel({ className }: PropertiesPanelProps) {
  return (
    <div className={classNames("PropertiesPanel gap-xs", className)}>
      <Text className="shrink-0" weight="bold">
        Properties:
      </Text>
      {/* <ComponentContainer /> */}
    </div>
  );
}
