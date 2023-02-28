import { ReactNode, useMemo, memo, FocusEventHandler, KeyboardEventHandler, useRef } from "react";
import classNames from "classnames";

import "./PropertiesPanel.css";

import { Text } from "../../../atoms/text/Text";
import { VectorInput } from "../../components/property-panel/VectorInput";
import { EditorHeader } from "../../components/editor-header/EditorHeader";
import { ColorInput } from "../../components/property-panel/ColorInput";
import { Checkbox } from "../../../atoms/checkbox/Checkbox";
import { getLocalResources, MainNode, MainTexture } from "../../../../engine/resource/resource.main";
import { useMainThreadContext } from "../../../hooks/useMainThread";
import { setProperty, setTextureProperty } from "../../../../engine/editor/editor.main";
import { setEulerFromQuaternion, setQuaternionFromEuler } from "../../../../engine/component/math";
import { Icon } from "../../../atoms/icon/Icon";
import CircleIC from "../../../../../res/ic/circle.svg";
import { PropTypeType, ResourcePropDef, Schema } from "../../../../engine/resource/ResourceDefinition";
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

const EPSILON = 0.00001;
const floatApproxEqual = (a: number, b: number): boolean => {
  return Math.abs(a - b) < EPSILON;
};

const compareFloat32Array = (a1: Float32Array, a2: Float32Array): boolean =>
  a1.length === a2.length && a1.every((item, index) => floatApproxEqual(item, a2[index]));

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

type SetProp<Value> = (propName: string, value: Value) => void;
interface BasePropertyProps<T, PropDef> {
  propName: string;
  value: T;
  setProp: SetProp<T>;
  propDef: PropDef;
}

const BoolProperty = memo<BasePropertyProps<boolean, ResourcePropDef<"bool", boolean, true, false, unknown, unknown>>>(
  ({ propName, value, setProp, propDef }) => {
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
  (prevProps, nextProps) => prevProps.value === nextProps.value
);

const U32Property = memo<BasePropertyProps<number, ResourcePropDef<"u32", number, true, false, unknown, unknown>>>(
  ({ propName, value, setProp, propDef }) => {
    return (
      <PropertyContainer key={propName} name={propName}>
        <NumericInput
          inputSize="sm"
          type="u32"
          value={value}
          onChange={(value) => setProp(propName, value)}
          disabled={!propDef.mutable}
          outlined
        />
      </PropertyContainer>
    );
  },
  (prevProps, nextProps) => prevProps.value === nextProps.value
);

const F32Property = memo<BasePropertyProps<number, ResourcePropDef<"f32", number, true, false, unknown, unknown>>>(
  ({ propName, value, setProp, propDef }) => {
    return (
      <PropertyContainer key={propName} name={propName}>
        <NumericInput
          inputSize="sm"
          type="f32"
          value={value}
          onChange={(value) => setProp(propName, value)}
          disabled={!propDef.mutable}
          outlined
        />
      </PropertyContainer>
    );
  },
  (prevProps, nextProps) => prevProps.value === nextProps.value
);

const Vec2Property = memo<
  BasePropertyProps<Float32Array, ResourcePropDef<"vec2", ArrayLike<number>, true, false, unknown, unknown>>
>(
  ({ propName, value, propDef, setProp }) => {
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
  (prevProps, nextProps) => compareFloat32Array(prevProps.value, nextProps.value)
);

const Vec3Property = memo<
  BasePropertyProps<Float32Array, ResourcePropDef<"vec3", ArrayLike<number>, true, false, unknown, unknown>>
>(
  ({ propName, value, propDef, setProp }) => {
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
  (prevProps, nextProps) => compareFloat32Array(prevProps.value, nextProps.value)
);

const QuatProperty = memo<
  BasePropertyProps<Float32Array, ResourcePropDef<"quat", ArrayLike<number>, true, false, unknown, unknown>>
>(
  ({ propName, value, propDef, setProp }) => {
    return (
      <PropertyContainer key={propName} name={propName}>
        <VectorInput
          value={getEulerRotation(value)}
          type="vec3"
          onChange={(value) => {
            setProp(propName, getQuaternionRotation(value));
          }}
          disabled={!propDef.mutable}
        />
      </PropertyContainer>
    );
  },
  (prevProps, nextProps) => compareFloat32Array(prevProps.value, nextProps.value)
);

const RgbProperty = memo<
  BasePropertyProps<Float32Array, ResourcePropDef<"rgb", ArrayLike<number>, true, false, unknown, unknown>>
>(
  ({ propName, value, propDef, setProp }) => {
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
  (prevProps, nextProps) => compareFloat32Array(prevProps.value, nextProps.value)
);

const RgbaProperty = memo<
  BasePropertyProps<Float32Array, ResourcePropDef<"rgba", ArrayLike<number>, true, false, unknown, unknown>>
>(
  ({ propName, value, propDef, setProp }) => {
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
  (prevProps, nextProps) => compareFloat32Array(prevProps.value, nextProps.value)
);

const BitmaskProperty = memo<
  BasePropertyProps<number, ResourcePropDef<"bitmask", number, true, false, unknown, unknown>>
>(
  ({ propName, value, setProp, propDef }) => {
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
  (prevProps, nextProps) => prevProps.value === nextProps.value
);

const StringProperty = memo<
  BasePropertyProps<string, ResourcePropDef<"string", string, true, false, unknown, unknown>>
>(
  ({ propName, value, setProp, propDef }) => {
    const inputRef = useRef<HTMLInputElement>(null);
    if (inputRef.current && inputRef.current.value !== value) {
      inputRef.current.value = value;
    }

    const handleBlur: FocusEventHandler<HTMLInputElement> = (evt) => {
      const newValue = evt.currentTarget.value.trim();
      if (newValue !== "" && value !== newValue) {
        setProp(propName, newValue);
      }
    };

    const handleKeyDown: KeyboardEventHandler<HTMLInputElement> = (evt) => {
      const newValue = evt.currentTarget.value.trim();
      console.log(newValue, value, evt.key);
      if (newValue !== "" && value !== newValue) {
        if (evt.key === "Enter") setProp(propName, newValue);
        if (evt.key === "Escape") evt.currentTarget.value = value;
      }
    };

    return (
      <PropertyContainer key={propName} name={propName}>
        <Input
          ref={inputRef}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          inputSize="sm"
          defaultValue={value}
          disabled={!propDef.mutable}
          outlined
        />
      </PropertyContainer>
    );
  },
  (prevProps, nextProps) => prevProps.value === nextProps.value
);

export function getPropComponents(ctx: IMainThreadContext, resource: MainNode) {
  function setProp<T>(propName: string, value: T) {
    setProperty(ctx, resource.eid, propName, value);
  }

  const schema = resource.resourceDef.schema;

  type ComponentSchema<T extends PropTypeType, S extends Schema> = {
    [K in keyof T]?: (propName: keyof S, propDef: T[K]) => ReactNode;
  };
  const PropComponents: ComponentSchema<PropTypeType, typeof schema> = {
    bool: (propName, propDef) => {
      const value = resource[propName];
      if (typeof value !== "boolean") return null;
      return <BoolProperty key={propName} propName={propName} value={value} setProp={setProp} propDef={propDef} />;
    },
    u32: (propName, propDef) => {
      const value = resource[propName];
      if (typeof value !== "number") return null;
      return <U32Property key={propName} propName={propName} value={value} setProp={setProp} propDef={propDef} />;
    },
    f32: (propName, propDef) => {
      const value = resource[propName];
      if (typeof value !== "number") return null;
      return <F32Property key={propName} propName={propName} value={value} setProp={setProp} propDef={propDef} />;
    },
    vec2: (propName, propDef) => {
      const value = resource[propName];
      if (!ArrayBuffer.isView(value)) return null;
      return <Vec2Property key={propName} value={value} propName={propName} setProp={setProp} propDef={propDef} />;
    },
    vec3: (propName, propDef) => {
      const value = resource[propName];
      if (!ArrayBuffer.isView(value)) return null;
      return <Vec3Property key={propName} value={value} propName={propName} setProp={setProp} propDef={propDef} />;
    },
    quat: (propName, propDef) => {
      const value = resource[propName];
      if (!ArrayBuffer.isView(value)) return null;
      return (
        <QuatProperty
          key={propName}
          value={value}
          propName={propName === "quaternion" ? "Rotation" : propName}
          setProp={setProp}
          propDef={propDef}
        />
      );
    },
    rgb: (propName, propDef) => {
      const value = resource[propName];
      if (!ArrayBuffer.isView(value)) return null;
      return <RgbProperty key={propName} value={value} propName={propName} setProp={setProp} propDef={propDef} />;
    },
    rgba: (propName, propDef) => {
      const value = resource[propName];
      if (!ArrayBuffer.isView(value)) return null;
      return <RgbaProperty key={propName} value={value} propName={propName} setProp={setProp} propDef={propDef} />;
    },
    bitmask: (propName, propDef) => {
      const value = resource[propName];
      if (typeof value !== "number") return null;
      return <BitmaskProperty key={propName} value={value} propName={propName} setProp={setProp} propDef={propDef} />;
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
      return <StringProperty key={propName} value={value} propName={propName} setProp={setProp} propDef={propDef} />;
    },
    arrayBuffer: (propName, propDef) => {
      return (
        <PropertyContainer key={propName} name={propName}>
          <Input inputSize="sm" value={`size: ${propDef.size}`} disabled outlined readOnly />
        </PropertyContainer>
      );
    },
    ref: (propName, propDef) => {
      const value = resource[propName];
      if (typeof value !== "object") return null;
      if (!(value instanceof MainTexture)) return null;

      const options = getLocalResources(ctx, MainTexture).map((res) => ({
        value: res,
        label: res.name,
      }));
      return (
        <PropertyContainer key={propName} name={propName}>
          <SelectInput
            value={value}
            onChange={(changed) => setTextureProperty(ctx, resource.eid, propName, changed.eid)}
            options={options}
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
}

export function PropertiesPanel({ className, resource }: PropertiesPanelProps) {
  const ctx = useMainThreadContext();

  const resourceDef = resource.resourceDef;
  const schema = resourceDef.schema;

  const PropComponents = useMemo(() => getPropComponents(ctx, resource), [ctx, resource]);

  const properties = Object.entries(schema).map(([propName, propDef]) =>
    PropComponents[propDef.type]?.(propName as any, propDef as any)
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
