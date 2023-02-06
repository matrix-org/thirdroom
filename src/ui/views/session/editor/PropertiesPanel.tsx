import { ReactNode, useState } from "react";
import classNames from "classnames";

import "./PropertiesPanel.css";

import { Text } from "../../../atoms/text/Text";
import { VectorInput } from "../../components/property-panel/VectorInput";
import { EditorHeader } from "../../components/editor-header/EditorHeader";
import { LocalResourceTypes } from "../../../../engine/resource/ResourceDefinition";
import { ColorInput, ColorPicker, ColorPreview } from "../../components/property-panel/ColorInput";
import { Checkbox } from "../../../atoms/checkbox/Checkbox";

interface PropertyContainerProps {
  className?: string;
  name: string;
  children: ReactNode;
}
export function PropertyContainer({ className, name, children }: PropertyContainerProps) {
  return (
    <div className={classNames("PropertyContainer flex items-center gap-xs", className)}>
      <div className="PropertyContainer__title grow flex items-center">
        <Text className="truncate" variant="b2" weight="medium">
          {name}
        </Text>
      </div>
      <div className="PropertyContainer__children shrink-0 flex items-center flex-wrap">{children}</div>
    </div>
  );
}

interface PropertiesPanelProps<Resource extends LocalResourceTypes> {
  className?: string;
  resource: Resource;
}

export function PropertiesPanel<R extends LocalResourceTypes>({ className, resource }: PropertiesPanelProps<R>) {
  const [v3, setV3] = useState(new Float32Array(3));
  const [rgba, setRGBA] = useState({ r: 0, g: 0, b: 0, a: 1 });

  return (
    <div className={classNames("PropertiesPanel flex flex-column", className)}>
      <EditorHeader className="shrink-0 flex items-center" style={{ padding: "0 var(--sp-xs)" }}>
        <Text variant="b2" weight="semi-bold">
          Node
        </Text>
      </EditorHeader>
      <div className="grow">
        <PropertyContainer name="Translation">
          <VectorInput value={resource.position} type="vec3" onChange={() => false} disabled />
        </PropertyContainer>

        <PropertyContainer name="Rotation">
          <VectorInput value={v3} type="vec3" onChange={setV3} disabled />
        </PropertyContainer>

        <PropertyContainer name="Scale">
          <VectorInput value={resource.scale} type="vec3" onChange={() => false} disabled />
        </PropertyContainer>

        <PropertyContainer name="Color">
          <ColorInput
            value={rgba}
            type="rgba"
            onChange={setRGBA}
            picker={
              <ColorPicker type="rgba" value={rgba} onChange={setRGBA}>
                <ColorPreview label="Pick Color" color={rgba} disabled />
              </ColorPicker>
            }
          />
        </PropertyContainer>

        <PropertyContainer name="Visible">
          <Checkbox disabled />
        </PropertyContainer>

        <PropertyContainer name="Enable">
          <Checkbox disabled />
        </PropertyContainer>

        <PropertyContainer name="Static">
          <Checkbox disabled />
        </PropertyContainer>
      </div>
    </div>
  );
}
