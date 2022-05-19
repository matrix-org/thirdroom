import classNames from "classnames";

import "./PropertiesPanel.css";
import { useEditorSelection } from "../../../hooks/useEditorSelection";
import { ComponentContainer } from "./ComponentContainer";
import { Text } from "../../../atoms/text/Text";

interface PropertiesPanelProps {
  className?: string;
}

export function PropertiesPanel({ className }: PropertiesPanelProps) {
  const { selectedEntities, activeEntityComponents } = useEditorSelection();

  return (
    <div className={classNames("PropertiesPanel gap-xs", className)}>
      <Text className="shrink-0" weight="bold">
        Properties:
      </Text>
      {selectedEntities.length === 0 || activeEntityComponents === undefined || activeEntityComponents.length === 0 ? (
        <div>
          <Text color="surface-low">Nothing Selected</Text>
        </div>
      ) : (
        activeEntityComponents.map((id) => <ComponentContainer key={id} id={id} />)
      )}
    </div>
  );
}
