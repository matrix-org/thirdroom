import classNames from "classnames";

import "./PropertiesPanel.css";
import { useEditorSelection } from "../../../hooks/useEditorSelection";
import { ComponentContainer } from "./ComponentContainer";
import { Text } from "../../../atoms/text/Text";

interface PropertiesPanelProps {
  className?: string;
}

export function PropertiesPanel({ className }: PropertiesPanelProps) {
  const { components } = useEditorSelection();

  return (
    <div className={classNames("PropertiesPanel gap-xs", className)}>
      <Text className="shrink-0" weight="bold">
        Properties:
      </Text>
      {components.map((id) => (
        <ComponentContainer key={id} id={id} />
      ))}
    </div>
  );
}
