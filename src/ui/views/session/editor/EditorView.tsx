import { useCallback, useEffect, useState } from "react";

import { EditorEventType } from "../../../../engine/editor/types";
import {
  ComponentInfo,
  ComponentPropertyInfo,
  ComponentPropertyType,
  ComponentPropertyValue,
} from "../../../../engine/component/types";
import { useEngine } from "../../../hooks/useEngine";

function useEditor(): boolean {
  const engine = useEngine();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    function onEditorLoaded() {
      console.log("editorLoaded");
      setLoading(false);
    }

    engine.addListener(EditorEventType.EditorLoaded, onEditorLoaded);
    engine.loadEditor();

    console.log("loadEditor");

    return () => {
      console.log("disposeEditor");
      engine.disposeEditor();
      engine.removeListener(EditorEventType.EditorLoaded, onEditorLoaded);
    };
  }, [engine]);

  return loading;
}

function useSelection(): { entities: number[]; components: number[] } {
  const engine = useEngine();
  const [selection, setSelection] = useState(engine.getSelection());

  useEffect(() => {
    engine.setState(engine.getSelection());
    engine.addListener(EditorEventType.SelectionChanged, setSelection);

    return () => {
      engine.removeListener(EditorEventType.SelectionChanged, setSelection);
    };
  }, [engine]);

  return selection;
}

function useComponent(componentId: number): (ComponentInfo & { removeComponent(): void }) | undefined {
  const engine = useEngine();
  const [componentInfo, setComponentInfo] = useState(() => engine.getComponentInfo(componentId));

  useEffect(() => {
    function onComponentInfoChanged(componentId: number, componentInfo: ComponentInfo) {
      if (componentId === componentId) {
        setComponentInfo(componentInfo);
      }
    }

    engine.addListener(EditorEventType.ComponentInfoChanged, onComponentInfoChanged);

    setComponentInfo(engine.getComponentInfo(componentId));

    return () => {
      engine.removeListener(EditorEventType.ComponentInfoChanged, onComponentInfoChanged);
    };
  }, [engine, componentId]);

  const removeComponent = useCallback(() => {
    engine.removeComponent(componentId);
  }, [engine, componentId]);

  if (!componentInfo) {
    return;
  }

  return { ...componentInfo, removeComponent };
}

interface ComponentPropertyInputProps<T extends ComponentPropertyType> {
  value: ComponentPropertyValue<T> | undefined;
  onChange(value: ComponentPropertyValue<T>): void;
}

function useComponentProperty<T extends ComponentPropertyType>(propId: number): ComponentPropertyInputProps<T> {
  const engine = useEngine();
  const [value, setValue] = useState(() => engine.getComponentProperty<T>(propId));

  const onChange = useCallback(
    (value: ComponentPropertyValue<T>) => {
      engine.setComponentProperty(propId, value);
      setValue(value);
    },
    [engine, propId]
  );

  useEffect(() => {
    function onComponentPropertyChanged(changedPropId: number, nextValue: ComponentPropertyValue<T>) {
      if (changedPropId === propId) {
        setValue(nextValue);
      }
    }

    engine.addListener(EditorEventType.ComponentPropertyChanged, onComponentPropertyChanged);

    setValue(engine.getComponentProperty(propId));

    return () => {
      engine.removeListener(EditorEventType.ComponentPropertyChanged, onComponentPropertyChanged);
    };
  }, [engine, propId]);

  return { value, onChange };
}

interface Vector3InputProps {
  name: string;
  value: Float32Array | undefined;
  onChange: (value: Float32Array) => void;
}

export function Vector3Input({ name, value, onChange }: Vector3InputProps) {
  const [x, y, z] = value || new Float32Array(3);

  return (
    <div>
      <div>{name}:</div>
      <div>
        <span>X:</span>
        <input
          type="text"
          value={x}
          onChange={(e) => onChange(new Float32Array([parseFloat(e.target.value) || 0, y, z]))}
        />
      </div>
      <div>
        <span>Y:</span>
        <input
          type="text"
          value={y}
          onChange={(e) => onChange(new Float32Array([x, parseFloat(e.target.value) || 0, z]))}
        />
      </div>
      <div>
        <span>Z:</span>
        <input
          type="text"
          value={z}
          onChange={(e) => onChange(new Float32Array([x, y, parseFloat(e.target.value) || 0]))}
        />
      </div>
    </div>
  );
}

export function ComponentPropertyContainer({ id, name, type }: ComponentPropertyInfo) {
  const props = useComponentProperty<typeof type>(id);

  if (type === ComponentPropertyType.vec3) {
    return <Vector3Input name={name} {...props} />;
  } else {
    return <div>{name}</div>;
  }
}

export function ComponentContainer({ id }: { id: number }) {
  const component = useComponent(id);

  if (!component) {
    return null;
  }

  const { name, props, removeComponent } = component;

  return (
    <div>
      <div>
        {name} <button onClick={removeComponent}>Remove</button>
      </div>
      <div>
        {props.map((prop) => (
          <ComponentPropertyContainer key={prop.id} {...prop} />
        ))}
      </div>
    </div>
  );
}

export function PropertiesPanel() {
  const { entities, components } = useSelection();

  return (
    <div>
      {entities.length > 0 && `Selected Entities: ${entities.join(", ")}`}
      {components.map((id) => (
        <ComponentContainer key={id} id={id} />
      ))}
    </div>
  );
}

export function EditorView() {
  const loading = useEditor();
  return <div className="EditorView">{loading ? <div>Loading...</div> : <PropertiesPanel />}</div>;
}
