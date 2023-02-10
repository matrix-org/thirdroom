import { ReactNode } from "react";
import classNames from "classnames";

import "./PropertiesPanel.css";

import { Text } from "../../../atoms/text/Text";
import { VectorInput } from "../../components/property-panel/VectorInput";
import { EditorHeader } from "../../components/editor-header/EditorHeader";
import { ColorInput } from "../../components/property-panel/ColorInput";
import { Checkbox } from "../../../atoms/checkbox/Checkbox";
import { MainNode } from "../../../../engine/resource/resource.main";
import { useMainThreadContext } from "../../../hooks/useMainThread";
import { setProperty } from "../../../../engine/editor/editor.main";
import { setEulerFromQuaternion, setQuaternionFromEuler } from "../../../../engine/component/transform";
import { Icon } from "../../../atoms/icon/Icon";
import CircleIC from "../../../../../res/ic/circle.svg";

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

interface PropertiesPanelProps {
  className?: string;
  resource: MainNode;
}

export function PropertiesPanel({ className, resource }: PropertiesPanelProps) {
  const ctx = useMainThreadContext();
  const rotation = new Float32Array(3);
  if (resource.quaternion) setEulerFromQuaternion(rotation, resource.quaternion);

  return (
    <div className={classNames("PropertiesPanel flex flex-column", className)}>
      <EditorHeader className="shrink-0 flex items-center gap-xxs" style={{ padding: "0 var(--sp-xs)" }}>
        <Icon color="surface" size="sm" src={CircleIC} />
        <Text variant="b2" weight="semi-bold">
          {resource.name ?? "Unnamed"}
        </Text>
      </EditorHeader>
      <div className="grow">
        {resource.position && (
          <PropertyContainer name="Translation">
            <VectorInput
              value={resource.position}
              type="vec3"
              onChange={(value) => setProperty(ctx, resource.eid, "position", value)}
            />
          </PropertyContainer>
        )}

        {resource.quaternion && (
          <PropertyContainer name="Rotation">
            <VectorInput
              value={rotation}
              type="vec3"
              onChange={(value) => {
                const quat = new Float32Array(4);
                setQuaternionFromEuler(quat, value);
                setProperty(ctx, resource.eid, "quaternion", quat);
              }}
            />
          </PropertyContainer>
        )}

        {resource.scale && (
          <PropertyContainer name="Scale">
            <VectorInput
              value={resource.scale}
              type="vec3"
              onChange={(value) => setProperty(ctx, resource.eid, "scale", value)}
            />
          </PropertyContainer>
        )}

        {"color" in resource && (
          <PropertyContainer name="Color">
            <ColorInput
              type="rgb"
              value={resource.color as Float32Array}
              onChange={(value) => setProperty(ctx, resource.eid, "color", value)}
              disabled={true}
            />
          </PropertyContainer>
        )}

        {typeof resource.visible === "boolean" && (
          <PropertyContainer name="Visible">
            <Checkbox
              checked={resource.visible}
              onCheckedChange={(checked) => setProperty(ctx, resource.eid, "visible", checked)}
            />
          </PropertyContainer>
        )}

        {typeof resource.enabled === "boolean" && (
          <PropertyContainer name="Enable">
            <Checkbox
              checked={resource.enabled}
              onCheckedChange={(checked) => setProperty(ctx, resource.eid, "enabled", checked)}
            />
          </PropertyContainer>
        )}

        {typeof resource.isStatic === "boolean" && (
          <PropertyContainer name="Static">
            <Checkbox
              checked={resource.isStatic}
              onCheckedChange={(checked) => setProperty(ctx, resource.eid, "isStatic", checked)}
            />
          </PropertyContainer>
        )}
      </div>
    </div>
  );
}
