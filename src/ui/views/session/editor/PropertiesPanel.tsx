import { ReactNode, useMemo } from "react";
import classNames from "classnames";

import "./PropertiesPanel.css";

import { Text } from "../../../atoms/text/Text";
import { VectorInput } from "../../components/property-panel/VectorInput";
import { EditorHeader } from "../../components/editor-header/EditorHeader";
import { ColorInput } from "../../components/property-panel/ColorInput";
import { Checkbox } from "../../../atoms/checkbox/Checkbox";
import { getLocalResources, MainNode } from "../../../../engine/resource/resource.main";
import { useMainThreadContext } from "../../../hooks/useMainThread";
import { setProperty, setRefArrayProperty, setRefProperty } from "../../../../engine/editor/editor.main";
import { setEulerFromQuaternion, setQuaternionFromEuler } from "../../../../engine/component/math";
import { Icon } from "../../../atoms/icon/Icon";
import CircleIC from "../../../../../res/ic/circle.svg";
import { PropTypeType, Schema } from "../../../../engine/resource/ResourceDefinition";
import { IMainThreadContext } from "../../../../engine/MainThread";
import { Scroll } from "../../../atoms/scroll/Scroll";
import { SelectInput } from "../../components/property-panel/SelectInput";
import { Input } from "../../../atoms/input/Input";
import { Label } from "../../../atoms/text/Label";
import {
  userToEngineChannel,
  engineToUserChannel,
  userToEngineAlpha,
  engineToUserAlpha,
  convertRGB,
  convertRGBA,
} from "../../../utils/common";
import { IconButton } from "../../../atoms/button/IconButton";
import { MultiSelectInput } from "../../components/property-panel/MultiSelectInput";
import { NumericInput } from "../../../atoms/input/NumericInput";

function getEulerRotation(quaternion: Float32Array) {
  const rotation = new Float32Array(3);
  if (quaternion) setEulerFromQuaternion(rotation, quaternion);
  return rotation;
}
function getQuaternionRotation(rotation: Float32Array) {
  const quat = new Float32Array(4);
  setQuaternionFromEuler(quat, rotation);
  return quat;
}

const resourceToOption = (res: MainNode) => ({
  value: res,
  label: "name" in res ? res.name : "Unnamed",
});

interface PropertyContainerProps {
  className?: string;
  name: string;
  children: ReactNode;
}
export function PropertyContainer({ className, name, children }: PropertyContainerProps) {
  return (
    <div className={classNames("PropertyContainer flex flex-column gap-xxs", className)}>
      <div className="PropertyContainer__title grow flex items-center">
        <Label className="truncate">{name}</Label>
      </div>
      <div className="PropertyContainer__children shrink-0 flex items-center flex-wrap">{children}</div>
    </div>
  );
}

export function getPropComponents(ctx: IMainThreadContext, resource: MainNode) {
  function setProp<T>(propName: string, value: T) {
    setProperty(ctx, resource.eid, propName, value);
  }

  const schema = resource.resourceDef.schema;

  type ComponentSchema<T extends PropTypeType, S extends Schema> = {
    [K in keyof T]?: (propName: keyof S, propDef: T[K], goToRef: (resourceId: number) => void) => ReactNode;
  };
  const PropComponents: ComponentSchema<PropTypeType, typeof schema> = {
    bool: (propName, propDef) => {
      const value = resource[propName];
      if (typeof value !== "boolean") return null;
      return (
        <PropertyContainer key={propName} name={propName}>
          <Checkbox
            checked={value ?? propDef.default}
            onCheckedChange={(checked) => setProp(propName, checked)}
            disabled={!propDef.mutable}
          />
        </PropertyContainer>
      );
    },
    u32: (propName, propDef) => {
      const value = resource[propName];
      if (typeof value !== "number") return null;
      return (
        <PropertyContainer key={propName} name={propName}>
          <Input inputSize="sm" value={value} disabled outlined readOnly />
        </PropertyContainer>
      );
    },
    f32: (propName, propDef) => {
      const value = resource[propName];
      if (typeof value !== "number") return null;
      return (
        <PropertyContainer key={propName} name={propName}>
          <Input inputSize="sm" value={value} disabled outlined readOnly />
        </PropertyContainer>
      );
    },
    vec2: (propName, propDef) => {
      const value = resource[propName];
      if (!ArrayBuffer.isView(value)) return null;
      return (
        <PropertyContainer key={propName} name={propName}>
          <VectorInput
            value={value ?? propDef.default}
            type="vec2"
            onChange={(value) => setProp(propName, value)}
            disabled={!propDef.mutable}
          />
        </PropertyContainer>
      );
    },
    vec3: (propName, propDef) => {
      const value = resource[propName];
      if (!ArrayBuffer.isView(value)) return null;
      return (
        <PropertyContainer key={propName} name={propName}>
          <VectorInput
            value={value ?? propDef.default}
            type="vec3"
            onChange={(value) => setProp(propName, value)}
            disabled={!propDef.mutable}
          />
        </PropertyContainer>
      );
    },
    quat: (propName, propDef) => {
      const value = resource[propName];
      if (!ArrayBuffer.isView(value)) return null;
      return (
        <PropertyContainer key={propName} name={propName === "quaternion" ? "Rotation" : propName}>
          <VectorInput
            value={getEulerRotation(resource.quaternion ?? propDef.default)}
            type="vec3"
            onChange={(value) => {
              setProp(propName, getQuaternionRotation(value));
            }}
            disabled={!propDef.mutable}
          />
        </PropertyContainer>
      );
    },
    rgb: (propName, propDef) => {
      const value = resource[propName];
      if (!ArrayBuffer.isView(value)) return null;
      return (
        <PropertyContainer key={propName} name={propName}>
          <ColorInput
            type="rgb"
            value={convertRGB(value ?? propDef.default, engineToUserChannel)}
            onChange={(value) => setProp(propName, convertRGB(value, userToEngineChannel))}
            disabled={!propDef.mutable}
          />
        </PropertyContainer>
      );
    },
    rgba: (propName, propDef) => {
      const value = resource[propName];
      if (!ArrayBuffer.isView(value)) return null;
      return (
        <PropertyContainer key={propName} name={propName}>
          <ColorInput
            type="rgba"
            value={convertRGBA(value ?? propDef.default, engineToUserChannel, engineToUserAlpha)}
            onChange={(value) => setProp(propName, convertRGBA(value, userToEngineChannel, userToEngineAlpha))}
            disabled={!propDef.mutable}
          />
        </PropertyContainer>
      );
    },
    bitmask: (propName, propDef) => {
      const value = resource[propName];
      if (typeof value !== "number") return null;
      return (
        <PropertyContainer key={propName} name={propName}>
          <NumericInput
            type="u32"
            inputSize="sm"
            min={0}
            // TODO: what is max={} for bitmask input?
            value={value}
            onChange={(value) => setProp(propName, value)}
            disabled={!propDef.mutable}
            outlined
          />
        </PropertyContainer>
      );
    },
    enum: (propName, propDef) => {
      const value = resource[propName];
      if (typeof value !== "number") return null;
      const enumType = propDef.enumType as Record<string, string>;
      const options = Object.keys(enumType)
        .filter((key) => !isNaN(parseInt(key)))
        .map((item) => ({
          label: enumType[item],
          value: parseInt(item),
        }));

      return (
        <PropertyContainer key={propName} name={propName}>
          <SelectInput
            value={value}
            options={options}
            onChange={(value) => setProp(propName, value)}
            disabled={!propDef.mutable}
          />
        </PropertyContainer>
      );
    },
    string: (propName, propDef) => {
      const value = resource[propName];
      if (typeof value !== "string") return null;
      return (
        <PropertyContainer key={propName} name={propName}>
          <Input inputSize="sm" value={value} disabled outlined readOnly />
        </PropertyContainer>
      );
    },
    arrayBuffer: (propName, propDef) => {
      return (
        <PropertyContainer key={propName} name={propName}>
          <Input inputSize="sm" value={`size: ${propDef.size}`} disabled outlined readOnly />
        </PropertyContainer>
      );
    },
    ref: (propName, propDef, goToRef) => {
      const value = resource[propName];
      if (Array.isArray(value) || ArrayBuffer.isView(value) || typeof value !== "object") return null;

      const options = (getLocalResources(ctx, value.resourceDef) as MainNode[]).map(resourceToOption);
      return (
        <PropertyContainer key={propName} name={propName}>
          <SelectInput
            before={
              <>
                <IconButton size="sm" iconSrc={CircleIC} label="Select Resource" onClick={() => goToRef(value.eid)} />
                <div className="PropertiesPanel__input-divider" />
              </>
            }
            value={value}
            onChange={(changed) => setRefProperty(ctx, resource.eid, propName, changed.eid)}
            options={options}
            disabled={!propDef.mutable}
          />
        </PropertyContainer>
      );
    },
    refArray: (propName, propDef, goToRef) => {
      const value = resource[propName];
      if (typeof propDef.resourceDef !== "object") return null;
      if (!Array.isArray(value)) return null;

      const selected = value.map(resourceToOption);
      const options = (getLocalResources(ctx, propDef.resourceDef) as MainNode[]).map(resourceToOption);

      return (
        <PropertyContainer key={propName} name={propName}>
          <MultiSelectInput
            options={options}
            selected={selected}
            onSelectedChange={(changed) =>
              setRefArrayProperty(
                ctx,
                resource.eid,
                propName,
                changed.map((op) => op.value.eid)
              )
            }
            onSelectedOptionClick={(option) => goToRef(option.value.eid)}
            disabled={!propDef.mutable}
          />
        </PropertyContainer>
      );
    },
  };
  return PropComponents;
}

interface PropertiesPanelProps {
  className?: string;
  resource: MainNode;
  goToRef: (resourceId: number) => void;
}

export function PropertiesPanel({ className, resource, goToRef }: PropertiesPanelProps) {
  const ctx = useMainThreadContext();

  const resourceDef = resource.resourceDef;
  const schema = resourceDef.schema;

  const PropComponents = useMemo(() => getPropComponents(ctx, resource), [ctx, resource]);

  const properties = Object.entries(schema).map(([propName, propDef]) =>
    propDef.editor ? PropComponents[propDef.type]?.(propName as any, propDef as any, goToRef) : null
  );

  return (
    <div className={classNames("PropertiesPanel flex flex-column", className)}>
      <EditorHeader className="shrink-0 flex items-center gap-xxs" style={{ padding: "0 var(--sp-xs)" }}>
        <Icon color="surface" size="sm" src={CircleIC} />
        <Text variant="b2" weight="semi-bold">
          {resource.name ?? "Unnamed"}
        </Text>
      </EditorHeader>
      <div className="grow">
        <Scroll type="scroll">{properties}</Scroll>
      </div>
    </div>
  );
}
