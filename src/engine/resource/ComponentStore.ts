import { addComponent, hasComponent, removeComponent } from "bitecs";

import { RemoteResourceManager } from "../GameTypes";
import { GLTFComponentPropertyStorageType } from "../gltf/GLTF";
import { TypedArray32 } from "../utils/typedarray";
import { ComponentPropStorageType } from "./schema";

export type ComponentPropStore =
  | Int32Array
  | Uint32Array
  | Float32Array
  | Int32Array[]
  | Uint32Array[]
  | Float32Array[];

export const GLTFComponentPropertyStorageTypeToEnum: Record<
  GLTFComponentPropertyStorageType,
  ComponentPropStorageType
> = {
  i32: ComponentPropStorageType.i32,
  u32: ComponentPropStorageType.u32,
  f32: ComponentPropStorageType.f32,
};

export interface ComponentStore {
  name: string;
  buffer: ArrayBuffer;
  byteOffset: number;
  props: ComponentPropStore[];
  propsByName: Map<string, ComponentPropStore>;
  add(eid: number): void;
  remove(eid: number): void;
  has(eid: number): boolean;
}

function getTypedArrayForStorageType(storageType: GLTFComponentPropertyStorageType) {
  switch (storageType) {
    case "i32":
      return Int32Array;
    case "u32":
      return Uint32Array;
    case "f32":
      return Float32Array;
    default:
      throw new Error(`Unknown storage type ${storageType}`);
  }
}

export function setComponentStore(
  resourceManager: RemoteResourceManager,
  componentId: number,
  buffer: ArrayBuffer,
  byteOffset: number
) {
  const componentDefinition = resourceManager.componentDefinitions.get(componentId);

  if (!componentDefinition) {
    throw new Error(`Component ${componentId} does not exist`);
  }

  const world = resourceManager.ctx.world;

  const componentStore: ComponentStore = {
    name: componentDefinition.name,
    buffer,
    byteOffset,
    props: [],
    propsByName: new Map(),
    add(eid) {
      addComponent(world, this, eid);

      if (!componentDefinition.props) {
        return;
      }

      for (let i = 0; i < this.props.length; i++) {
        const propDef = componentDefinition.props[i];
        const propStore = this.props[i];
        const defaultValue = propDef.defaultValue;
        const nodeIndex = resourceManager.nodeIdToComponentStoreIndex.get(eid) || 0;

        if (propDef.size > 1) {
          if (defaultValue === undefined) {
            (propStore[nodeIndex] as TypedArray32).fill(0);
          } else {
            (propStore[nodeIndex] as TypedArray32).set(defaultValue as number[]);
          }
        } else {
          if (defaultValue === undefined) {
            propStore[nodeIndex] = 0;
          } else {
            propStore[nodeIndex] = defaultValue as number;
          }
        }
      }
    },
    remove(eid) {
      removeComponent(world, this, eid);
    },
    has(eid) {
      return hasComponent(world, this, eid);
    },
  };

  if (componentDefinition.props) {
    let curByteOffset = byteOffset;

    for (const propDef of componentDefinition.props) {
      let propStore: ComponentPropStore;

      const typedArrayConstructor = getTypedArrayForStorageType(propDef.storageType);

      if (propDef.size > 1) {
        const arrPropStore = [];

        for (let i = 0; i < resourceManager.componentStoreSize; i++) {
          arrPropStore.push(new typedArrayConstructor(buffer, curByteOffset, propDef.size));
          curByteOffset += arrPropStore[i].byteLength;
        }

        propStore = arrPropStore as ComponentPropStore;
      } else {
        propStore = new typedArrayConstructor(buffer, curByteOffset, resourceManager.componentStoreSize);
      }

      componentStore.props.push(propStore);
      componentStore.propsByName.set(propDef.name, propStore);
    }
  }

  resourceManager.componentStores.set(componentId, componentStore);
}
