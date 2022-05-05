import classNames from "classnames";

import "./PropertiesPanel.css";
import { useEditorSelection } from "../../../hooks/useEditorSelection";
import { ComponentContainer } from "./ComponentContainer";
import { Text } from "../../../atoms/text/Text";
import { Label } from "../../../atoms/text/Label";

interface PropertiesPanelProps {
  className?: string;
}

export function PropertiesPanel({ className }: PropertiesPanelProps) {
  const { entities, components } = useEditorSelection();

  return (
    <div className={classNames("PropertiesPanel gap-xs", className)}>
      <Text className="shrink-0" weight="bold">
        Properties:
      </Text>
      {entities.length > 0 && (
        <div className="flex items-center gap-xs">
          <Label>Selected Entities:</Label>
          <Text variant="b3">{entities.join(", ")}</Text>
        </div>
      )}
      {components.map((id) => (
        <ComponentContainer key={id} id={id} />
      ))}
    </div>
  );
}
