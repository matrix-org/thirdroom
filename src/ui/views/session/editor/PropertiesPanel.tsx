import classNames from "classnames";

import "./PropertiesPanel.css";
import { useEditorSelection } from "../../../hooks/useEditorSelection";
import { ComponentContainer } from "./ComponentContainer";
import { Text } from "../../../atoms/text/Text";

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
      {entities.length === 0 ? (
        <div>
          <Text color="surface-low">Nothing Selected</Text>
        </div>
      ) : (
        components.map((id) => <ComponentContainer key={id} id={id} />)
      )}
    </div>
  );
}
