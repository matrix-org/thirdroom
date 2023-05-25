import {
  defineQuery,
  hasComponent,
  IComponent,
  QueryModifier as IQueryModifier,
  Not,
  IWorld,
  removeQuery,
} from "bitecs";
import { BoxGeometry } from "three";
import { mat4, vec2, vec3, vec4, quat } from "gl-matrix";
import RAPIER from "@dimforge/rapier3d-compat";

import { Collision, GameState } from "../GameTypes";
import {
  getScriptResource,
  getScriptResourceByNamePtr,
  getScriptResourceRef,
  readEnum,
  readFloat32ArrayInto,
  readFloatList,
  readList,
  readRefMap,
  readResourceRef,
  readSharedArrayBuffer,
  readString,
  readStringFromCursorView,
  readStringLen,
  readUint8Array,
  WASMModuleContext,
  writeFloat32Array,
  writeNumberArray,
  writeString,
} from "./WASMModuleContext";
import {
  RemoteAccessor,
  RemoteBuffer,
  RemoteBufferView,
  RemoteCamera,
  RemoteCollider,
  RemoteImage,
  RemoteInteractable,
  RemoteLight,
  RemoteMaterial,
  RemoteMesh,
  RemoteMeshPrimitive,
  RemoteNode,
  RemotePhysicsBody,
  RemoteScene,
  RemoteSkin,
  RemoteTexture,
  RemoteUIButton,
  RemoteUICanvas,
  RemoteUIElement,
  RemoteUIText,
  removeObjectFromWorld,
} from "../resource/RemoteResources";
import { addChild, removeChild, traverse } from "../component/transform";
import {
  AccessorComponentType,
  AccessorType,
  ColliderType,
  ElementType,
  ElementPositionType,
  InteractableType,
  LightType,
  MaterialType,
  MeshPrimitiveAttributeIndex,
  MeshPrimitiveMode,
  PhysicsBodyType,
  ResourceType,
  FlexAlign,
  FlexDirection,
  FlexWrap,
  FlexJustify,
  QueryModifier,
} from "../resource/schema";
import {
  moveCursorView,
  readFloat32,
  readFloat32Array,
  readUint32,
  readUint32Array,
  readUint32List,
  rewindCursorView,
  skipUint32,
  writeInt32,
  writeUint32,
} from "../allocator/CursorView";
import { AccessorComponentTypeToTypedArray, AccessorTypeToElementSize } from "../accessor/accessor.common";
import {
  addNodePhysicsBody,
  PhysicsModule,
  registerCollisionHandler,
  removeRigidBody,
  RigidBody,
} from "../physics/physics.game";
import { getModule } from "../module/module.common";
import { createMesh } from "../mesh/mesh.game";
import { addInteractableComponent } from "../../plugins/interaction/interaction.game";
import { addUIElementChild, initNodeUICanvas, removeUIElementChild } from "../ui/ui.game";
import { startOrbit, stopOrbit } from "../../plugins/camera/CameraRig.game";
import { GLTFComponentPropertyStorageTypeToEnum, setComponentStore } from "../resource/ComponentStore";
import { getPrimaryInputSourceNode } from "../input/input.game";
import { getRotationNoAlloc } from "../utils/getRotationNoAlloc";

function getScriptChildCount(wasmCtx: WASMModuleContext, node: RemoteNode | RemoteScene): number {
  const resourceIds = wasmCtx.resourceManager.resourceIds;

  let count = 0;
  let cursor = node.resourceType === ResourceType.Node ? node.firstChild : node.firstNode;

  while (cursor) {
    // Only count the resources owned by the script.
    if (resourceIds.has(cursor.eid)) {
      count++;
    }

    cursor = cursor.nextSibling;
  }

  return count;
}

function getScriptChildren(
  wasmCtx: WASMModuleContext,
  node: RemoteNode | RemoteScene,
  nodeArrPtr: number,
  maxCount: number
): number {
  const resourceIds = wasmCtx.resourceManager.resourceIds;
  const U32Heap = wasmCtx.U32Heap;

  let i = 0;
  let cursor = node.resourceType === ResourceType.Node ? node.firstChild : node.firstNode;

  while (cursor && i < maxCount) {
    // Only write the resources owned by the script.
    if (resourceIds.has(cursor.eid)) {
      U32Heap[nodeArrPtr / 4 + i] = cursor.eid;
      i++;
    }

    cursor = cursor.nextSibling;
  }

  // Return the number of ids written into the array
  return i;
}

function scriptGetChildAt(wasmCtx: WASMModuleContext, parent: RemoteNode | RemoteScene, index: number): number {
  const resourceIds = wasmCtx.resourceManager.resourceIds;

  let i = 0;
  let cursor = parent.resourceType === ResourceType.Node ? parent.firstChild : parent.firstNode;

  while (cursor && i < index) {
    // Only count the resources owned by the script.
    if (resourceIds.has(cursor.eid)) {
      i++;
    }

    cursor = cursor.nextSibling;
  }

  if (i === index && cursor && resourceIds.has(cursor.eid)) {
    return cursor.eid;
  }

  return 0;
}

function getScriptUIElementChildCount(wasmCtx: WASMModuleContext, element: RemoteUIElement): number {
  const resourceIds = wasmCtx.resourceManager.resourceIds;

  let count = 0;
  let cursor = element.firstChild;

  while (cursor) {
    // Only count the resources owned by the script.
    if (resourceIds.has(cursor.eid)) {
      count++;
    }

    cursor = cursor.nextSibling;
  }

  return count;
}

function getScriptUIElementChildren(
  wasmCtx: WASMModuleContext,
  element: RemoteUIElement,
  elArrPtr: number,
  maxCount: number
): number {
  const resourceIds = wasmCtx.resourceManager.resourceIds;
  const U32Heap = wasmCtx.U32Heap;

  let i = 0;
  let cursor = element.firstChild;

  while (cursor && i < maxCount) {
    // Only write the resources owned by the script.
    if (resourceIds.has(cursor.eid)) {
      U32Heap[elArrPtr / 4 + i] = cursor.eid;
      i++;
    }

    cursor = cursor.nextSibling;
  }

  // Return the number of ids written into the array
  return i;
}

function scriptGetUIElementChildAt(wasmCtx: WASMModuleContext, parent: RemoteUIElement, index: number): number {
  const resourceIds = wasmCtx.resourceManager.resourceIds;

  let i = 0;
  let cursor = parent.firstChild;

  while (cursor && i < index) {
    // Only count the resources owned by the script.
    if (resourceIds.has(cursor.eid)) {
      i++;
    }

    cursor = cursor.nextSibling;
  }

  if (i === index && cursor && resourceIds.has(cursor.eid)) {
    return cursor.eid;
  }

  return 0;
}

function readExtensionsAndExtras<T extends { [key: string]: unknown }>(
  wasmCtx: WASMModuleContext,
  parseExtension: (name: string) => T | undefined = () => undefined
) {
  const itemsPtr = readUint32(wasmCtx.cursorView);
  const count = readUint32(wasmCtx.cursorView);
  // TODO: Implement glTF extras in WebSG API
  skipUint32(wasmCtx.cursorView); // Skip extras pointer

  const extensions = {};

  if (count > 0) {
    const rewind = rewindCursorView(wasmCtx.cursorView);

    moveCursorView(wasmCtx.cursorView, itemsPtr);

    for (let i = 0; i < count; i++) {
      const name = readStringFromCursorView(wasmCtx);
      const extensionPtr = readUint32(wasmCtx.cursorView);
      const itemRewind = rewindCursorView(wasmCtx.cursorView);
      moveCursorView(wasmCtx.cursorView, extensionPtr);
      Object.assign(extensions, parseExtension(name));
      itemRewind();
    }

    rewind();
  }

  return extensions as Partial<T>;
}

// MaterialTextureInfoProps
function readBaseTextureInfo(
  wasmCtx: WASMModuleContext
): [RemoteTexture, vec2 | undefined, number | undefined, vec2 | undefined] {
  const { offset, rotation, scale } = readExtensionsAndExtras(wasmCtx, (name) => {
    if (name == "KHR_textures_transform") {
      readExtensionsAndExtras(wasmCtx);
      const offset = readFloat32Array(wasmCtx.cursorView, 2);
      const rotation = readFloat32(wasmCtx.cursorView);
      const scale = readFloat32Array(wasmCtx.cursorView, 2);
      readUint32(wasmCtx.cursorView); // texCoord (currently unused);
      return { offset, rotation, scale };
    }
  });

  const texture = readResourceRef(wasmCtx, RemoteTexture);

  if (!texture) {
    throw new Error("Failed to read texture");
  }

  skipUint32(wasmCtx.cursorView); // skip texCoord

  return [texture, offset, rotation, scale];
}

function readTextureInfo(
  wasmCtx: WASMModuleContext
): [RemoteTexture | undefined, vec2 | undefined, number | undefined, vec2 | undefined] {
  const textureInfoPtr = readUint32(wasmCtx.cursorView);

  if (textureInfoPtr === 0) {
    return [undefined, undefined, undefined, undefined];
  } else {
    const rewind = rewindCursorView(wasmCtx.cursorView);
    moveCursorView(wasmCtx.cursorView, textureInfoPtr);
    const [texture, offset, rotation, scale] = readBaseTextureInfo(wasmCtx);
    rewind();
    return [texture, offset, rotation, scale];
  }
}

function readNormalTextureInfo(
  wasmCtx: WASMModuleContext
): [RemoteTexture | undefined, number | undefined, vec2 | undefined, number | undefined, vec2 | undefined] {
  const textureInfoPtr = readUint32(wasmCtx.cursorView);

  if (textureInfoPtr === 0) {
    return [undefined, undefined, undefined, undefined, undefined];
  } else {
    const rewind = rewindCursorView(wasmCtx.cursorView);
    moveCursorView(wasmCtx.cursorView, textureInfoPtr);
    const [texture, offset, rotation, scale] = readBaseTextureInfo(wasmCtx);
    const normalScale = readFloat32(wasmCtx.cursorView);
    rewind();
    return [texture, normalScale, offset, rotation, scale];
  }
}

function readOcclusionTextureInfo(
  wasmCtx: WASMModuleContext
): [RemoteTexture | undefined, number | undefined, vec2 | undefined, number | undefined, vec2 | undefined] {
  const textureInfoPtr = readUint32(wasmCtx.cursorView);

  if (textureInfoPtr === 0) {
    return [undefined, undefined, undefined, undefined, undefined];
  } else {
    const rewind = rewindCursorView(wasmCtx.cursorView);
    moveCursorView(wasmCtx.cursorView, textureInfoPtr);
    const [texture, offset, rotation, scale] = readBaseTextureInfo(wasmCtx);
    const occlusionStrength = readFloat32(wasmCtx.cursorView);
    rewind();
    return [texture, occlusionStrength, offset, rotation, scale];
  }
}

interface PBRMetallicRoughnessProps {
  baseColorFactor?: vec4;
  baseColorTexture?: RemoteTexture;
  baseColorTextureOffset?: vec2;
  baseColorTextureRotation?: number;
  baseColorTextureScale?: vec2;
  metallicFactor?: number;
  roughnessFactor?: number;
  metallicRoughnessTexture?: RemoteTexture;
  metallicRoughnessTextureOffset?: vec2;
  metallicRoughnessTextureRotation?: number;
  metallicRoughnessTextureScale?: vec2;
}

function readPBRMetallicRoughness(wasmCtx: WASMModuleContext): PBRMetallicRoughnessProps {
  const pbrMetallicRoughnessPtr = readUint32(wasmCtx.cursorView);

  if (pbrMetallicRoughnessPtr === 0) {
    return {};
  } else {
    const rewind = rewindCursorView(wasmCtx.cursorView);
    moveCursorView(wasmCtx.cursorView, pbrMetallicRoughnessPtr);
    readExtensionsAndExtras(wasmCtx); // pbrMetallicRoughness extensions
    const baseColorFactor = readFloat32Array(wasmCtx.cursorView, 4);
    const [baseColorTexture, baseColorTextureOffset, baseColorTextureRotation, baseColorTextureScale] =
      readTextureInfo(wasmCtx);
    const metallicFactor = readFloat32(wasmCtx.cursorView);
    const roughnessFactor = readFloat32(wasmCtx.cursorView);
    const [
      metallicRoughnessTexture,
      metallicRoughnessTextureOffset,
      metallicRoughnessTextureRotation,
      metallicRoughnessTextureScale,
    ] = readTextureInfo(wasmCtx);

    rewind();

    return {
      baseColorFactor,
      baseColorTexture,
      baseColorTextureOffset,
      baseColorTextureRotation,
      baseColorTextureScale,
      metallicFactor,
      roughnessFactor,
      metallicRoughnessTexture,
      metallicRoughnessTextureOffset,
      metallicRoughnessTextureRotation,
      metallicRoughnessTextureScale,
    };
  }
}

interface MeshPrimitiveProps {
  attributes: { [key: number]: RemoteAccessor };
  indices?: RemoteAccessor;
  material?: RemoteMaterial;
  mode: MeshPrimitiveMode;
}

const tempRapierVec3 = new RAPIER.Vector3(0, 0, 0);

const tempVec3 = vec3.create();
const tempDirection = vec3.create();
const tempQuat = quat.create();

// TODO: ResourceManager should have a resourceMap that corresponds to just its owned resources
// TODO: ResourceManager should have a resourceByType that corresponds to just its owned resources
// TODO: Force disposal of all entities belonging to the wasmCtx when environment unloads
// TODO: When do we update local / world matrices?
// TODO: the mesh.primitives array is allocated whenever we request it but it's now immutable

export function createWebSGModule(ctx: GameState, wasmCtx: WASMModuleContext) {
  const physics = getModule(ctx, PhysicsModule);

  const disposeCollisionHandler = registerCollisionHandler(
    ctx,
    (nodeA: number, nodeB: number, _handleA: number, _handleB: number, started: boolean) => {
      const resourceManager = wasmCtx.resourceManager;
      const resourceIds = resourceManager.resourceIds;
      const collisionListeners = resourceManager.collisionListeners;

      if (resourceIds.has(nodeA) && resourceIds.has(nodeB)) {
        const collision: Collision = {
          nodeA,
          nodeB,
          started,
        };

        for (let i = 0; i < collisionListeners.length; i++) {
          const listener = collisionListeners[i];
          listener.collisions.push(collision);
        }
      }
    }
  );

  const websgWASMModule = {
    world_get_environment() {
      return ctx.worldResource.environment?.publicScene.eid || 0;
    },
    world_set_environment(sceneId: number) {
      if (!ctx.worldResource.environment) {
        console.error(`WebSG: environment not set`);
        return -1;
      }

      const scene = getScriptResource(wasmCtx, RemoteScene, sceneId);

      if (scene) {
        ctx.worldResource.environment.publicScene = scene;
        return 0;
      } else {
        return -1;
      }
    },
    world_create_query(queryPtr: number) {
      try {
        const resourceManager = wasmCtx.resourceManager;
        const components: (IComponent | IQueryModifier<IWorld>)[] = [];
        moveCursorView(wasmCtx.cursorView, queryPtr);
        readList(wasmCtx, () => {
          const componentIds = readUint32List(wasmCtx.cursorView);
          const modifier = readEnum(wasmCtx, QueryModifier, "QueryModifier");

          for (let i = 0; i < componentIds.length; i++) {
            const componentId = componentIds[i];
            const component = resourceManager.componentStores.get(componentId);
            if (component) {
              if (modifier == QueryModifier.All) {
                components.push(component);
              } else if (modifier == QueryModifier.None) {
                components.push(Not(component));
              } else if (modifier == QueryModifier.Any) {
                throw new Error(`WebSG: QueryModifier.Any not supported`);
              }
            } else {
              console.error(`WebSG: component not registered`);
            }
          }
        });
        const query = defineQuery(components);
        const queryId = resourceManager.nextQueryId++;
        resourceManager.registeredQueries.set(queryId, query);
        return queryId;
      } catch (e) {
        console.error(e);
        return -1;
      }
    },
    query_get_results_count(queryId: number) {
      const query = wasmCtx.resourceManager.registeredQueries.get(queryId);

      if (query) {
        return query(ctx.world).length;
      } else {
        console.error(`WebSG: query not registered`);
        return -1;
      }
    },
    query_get_results(queryId: number, resultsPtr: number, maxCount: number) {
      const query = wasmCtx.resourceManager.registeredQueries.get(queryId);

      if (query) {
        const results = query(ctx.world);

        if (results.length > maxCount) {
          console.error(`WebSG: query results array larger than maxCount`);
          return -1;
        }

        writeNumberArray(wasmCtx, resultsPtr, results);

        return results.length;
      } else {
        console.error(`WebSG: query not registered`);
        return -1;
      }
    },
    world_find_component_definition_by_name(namePtr: number, byteLength: number) {
      const name = readString(wasmCtx, namePtr, byteLength);
      const componentId = wasmCtx.resourceManager.componentIdsByName.get(name);

      if (componentId) {
        return componentId;
      } else {
        console.error(`WebSG: component ${name} not registered`);
        return 0;
      }
    },
    component_definition_get_name_length(componentId: number) {
      const component = wasmCtx.resourceManager.componentDefinitions.get(componentId);

      if (component) {
        return component.name.length;
      } else {
        console.error(`WebSG: component not registered`);
        return -1;
      }
    },
    component_definition_get_name(componentId: number, namePtr: number, maxByteLength: number) {
      const component = wasmCtx.resourceManager.componentDefinitions.get(componentId);

      if (component) {
        return writeString(wasmCtx, namePtr, component.name, maxByteLength);
      } else {
        console.error(`WebSG: component not registered`);
        return -1;
      }
    },
    component_definition_get_prop_count(componentId: number) {
      const component = wasmCtx.resourceManager.componentDefinitions.get(componentId);

      if (component) {
        return component.props?.length || 0;
      } else {
        console.error(`WebSG: component not registered`);
        return -1;
      }
    },
    component_definition_get_prop_name_length(componentId: number, propIdx: number) {
      const component = wasmCtx.resourceManager.componentDefinitions.get(componentId);

      if (component) {
        const prop = component.props ? component.props[propIdx] : undefined;

        if (!prop) {
          console.error(`WebSG: invalid prop index`);
          return -1;
        }

        return prop.name.length;
      } else {
        console.error(`WebSG: component not registered`);
        return -1;
      }
    },
    component_definition_get_prop_name(
      componentId: number,
      propIdx: number,
      propTypePtr: number,
      maxByteLength: number
    ) {
      const component = wasmCtx.resourceManager.componentDefinitions.get(componentId);

      if (component) {
        const prop = component.props ? component.props[propIdx] : undefined;

        if (!prop) {
          console.error(`WebSG: invalid prop index`);
          return -1;
        }

        return writeString(wasmCtx, propTypePtr, prop.name, maxByteLength);
      } else {
        console.error(`WebSG: component not registered`);
        return -1;
      }
    },
    component_definition_get_prop_type_length(componentId: number, propIdx: number) {
      const component = wasmCtx.resourceManager.componentDefinitions.get(componentId);

      if (component) {
        const prop = component.props ? component.props[propIdx] : undefined;

        if (!prop) {
          console.error(`WebSG: invalid prop index`);
          return -1;
        }

        return prop.type.length;
      } else {
        console.error(`WebSG: component not registered`);
        return -1;
      }
    },
    component_definition_get_prop_type(
      componentId: number,
      propIdx: number,
      propTypePtr: number,
      maxByteLength: number
    ) {
      const component = wasmCtx.resourceManager.componentDefinitions.get(componentId);

      if (component) {
        const prop = component.props ? component.props[propIdx] : undefined;

        if (!prop) {
          console.error(`WebSG: invalid prop index`);
          return -1;
        }

        return writeString(wasmCtx, propTypePtr, prop.type, maxByteLength);
      } else {
        console.error(`WebSG: component not registered`);
        return -1;
      }
    },
    component_definition_get_ref_type_length(componentId: number, propIdx: number) {
      const component = wasmCtx.resourceManager.componentDefinitions.get(componentId);

      if (component) {
        const prop = component.props ? component.props[propIdx] : undefined;

        if (!prop) {
          console.error(`WebSG: invalid prop index`);
          return -1;
        }

        return prop.refType ? prop.refType.length : 0;
      } else {
        console.error(`WebSG: component not registered`);
        return -1;
      }
    },
    component_definition_get_ref_type(componentId: number, propIdx: number, refTypePtr: number, maxByteLength: number) {
      const component = wasmCtx.resourceManager.componentDefinitions.get(componentId);

      if (component) {
        const prop = component.props ? component.props[propIdx] : undefined;

        if (!prop) {
          console.error(`WebSG: invalid prop index`);
          return -1;
        }

        if (prop.refType) {
          return writeString(wasmCtx, refTypePtr, prop.refType, maxByteLength);
        } else {
          return 0;
        }
      } else {
        console.error(`WebSG: component not registered`);
        return -1;
      }
    },
    component_definition_get_prop_storage_type(componentId: number, propIdx: number) {
      const component = wasmCtx.resourceManager.componentDefinitions.get(componentId);

      if (component) {
        const prop = component.props ? component.props[propIdx] : undefined;

        if (!prop) {
          console.error(`WebSG: invalid prop index`);
          return -1;
        }

        const storageType = GLTFComponentPropertyStorageTypeToEnum[prop.storageType];

        if (storageType === undefined) {
          console.error(`WebSG: invalid storage type`);
          return -1;
        }

        return storageType;
      } else {
        console.error(`WebSG: component not registered`);
        return -1;
      }
    },
    component_definition_get_prop_size(componentId: number, propIdx: number) {
      const component = wasmCtx.resourceManager.componentDefinitions.get(componentId);

      if (component) {
        const prop = component.props ? component.props[propIdx] : undefined;

        if (!prop) {
          console.error(`WebSG: invalid prop index`);
          return -1;
        }

        return prop.size;
      } else {
        console.error(`WebSG: component not registered`);
        return -1;
      }
    },
    world_get_component_store_size() {
      return wasmCtx.resourceManager.componentStoreSize;
    },
    world_set_component_store_size(size: number) {
      if (size > wasmCtx.resourceManager.maxEntities) {
        console.error("WebSG: component store size larger than maxEntities");
        return -1;
      }

      wasmCtx.resourceManager.componentStoreSize = size;

      return 0;
    },
    world_set_component_store(componentId: number, storePtr: number) {
      try {
        setComponentStore(wasmCtx.resourceManager, componentId, wasmCtx.memory.buffer, storePtr);
      } catch (error) {
        console.error(error);
        return -1;
      }

      return 0;
    },
    world_get_component_store(componentId: number) {
      const componentStore = wasmCtx.resourceManager.componentStores.get(componentId);

      if (!componentStore) {
        console.error(`WebSG: component store not set`);
        return -1;
      }

      return componentStore.byteOffset;
    },
    node_add_component(nodeId: number, componentId: number) {
      const componentStore = wasmCtx.resourceManager.componentStores.get(componentId);

      if (!componentStore) {
        console.error(`WebSG: component not registered`);
        return -1;
      }

      const node = getScriptResource(wasmCtx, RemoteNode, nodeId);

      if (!node) {
        return -1;
      }

      try {
        componentStore.add(node.eid);
        return 0;
      } catch (error) {
        console.error(`WebSG: Error adding component: ${error}`);
        return -1;
      }
    },
    node_remove_component(nodeId: number, componentId: number) {
      const componentStore = wasmCtx.resourceManager.componentStores.get(componentId);

      if (!componentStore) {
        console.error(`WebSG: component not registered`);
        return -1;
      }

      const node = getScriptResource(wasmCtx, RemoteNode, nodeId);

      if (!node) {
        return -1;
      }

      componentStore.remove(node.eid);

      return 0;
    },
    node_has_component(nodeId: number, componentId: number) {
      const componentStore = wasmCtx.resourceManager.componentStores.get(componentId);

      if (!componentStore) {
        console.error(`WebSG: component not registered`);
        return -1;
      }

      const node = getScriptResource(wasmCtx, RemoteNode, nodeId);

      if (!node) {
        return -1;
      }

      return componentStore.has(node.eid) ? 1 : 0;
    },
    node_get_component_store_index(nodeId: number) {
      const node = getScriptResource(wasmCtx, RemoteNode, nodeId);

      if (!node) {
        return -1;
      }

      return wasmCtx.resourceManager.nodeIdToComponentStoreIndex.get(node.eid) || 0;
    },
    node_dispose(nodeId: number) {
      const node = getScriptResource(wasmCtx, RemoteNode, nodeId);

      if (!node) {
        return -1;
      }

      // TODO: add to queue and drain at the end of the frame
      removeObjectFromWorld(ctx, node);

      return 0;
    },
    world_create_scene(propsPtr: number) {
      try {
        moveCursorView(wasmCtx.cursorView, propsPtr);
        const name = readStringFromCursorView(wasmCtx);
        readExtensionsAndExtras(wasmCtx);
        return new RemoteScene(wasmCtx.resourceManager, {
          name,
        }).eid;
      } catch (error) {
        console.error("WebSG: Error creating scene:", error);
        return 0;
      }
    },
    world_find_scene_by_name(namePtr: number, byteLength: number) {
      const scene = getScriptResourceByNamePtr(ctx, wasmCtx, RemoteScene, namePtr, byteLength);
      return scene ? scene.eid : 0;
    },
    scene_add_node(sceneId: number, nodeId: number) {
      const scene = getScriptResource(wasmCtx, RemoteScene, sceneId);

      if (!scene) {
        return -1;
      }

      const node = getScriptResource(wasmCtx, RemoteNode, nodeId);

      if (!node) {
        return -1;
      }

      addChild(scene, node);

      return 0;
    },
    scene_remove_node(sceneId: number, nodeId: number) {
      const scene = getScriptResource(wasmCtx, RemoteScene, sceneId);

      if (!scene) {
        return -1;
      }

      const node = getScriptResource(wasmCtx, RemoteNode, nodeId);

      if (!node) {
        return -1;
      }

      removeChild(scene, node);

      return 0;
    },
    scene_get_node_count(sceneId: number) {
      const scene = getScriptResource(wasmCtx, RemoteScene, sceneId);

      if (!scene) {
        return -1;
      }

      return getScriptChildCount(wasmCtx, scene);
    },
    scene_get_nodes(sceneId: number, nodeArrPtr: number, maxCount: number) {
      const scene = getScriptResource(wasmCtx, RemoteScene, sceneId);

      if (!scene) {
        return -1;
      }

      return getScriptChildren(wasmCtx, scene, nodeArrPtr, maxCount);
    },
    scene_get_node(sceneId: number, index: number) {
      const scene = getScriptResource(wasmCtx, RemoteScene, sceneId);

      if (!scene) {
        return 0; // This function returns a u32 so errors returned as 0 / null eid
      }

      return scriptGetChildAt(wasmCtx, scene, index);
    },
    world_create_node(propsPtr: number) {
      try {
        moveCursorView(wasmCtx.cursorView, propsPtr);

        const name = readStringFromCursorView(wasmCtx);
        const { uiCanvas, collider } = readExtensionsAndExtras(wasmCtx, (name) => {
          let uiCanvas: RemoteUICanvas | undefined;
          let collider: RemoteCollider | undefined;

          if (name === "OMI_collider") {
            readExtensionsAndExtras(wasmCtx);
            collider = readResourceRef(wasmCtx, RemoteCollider);
          }

          if (name === "MX_ui") {
            readExtensionsAndExtras(wasmCtx);
            uiCanvas = readResourceRef(wasmCtx, RemoteUICanvas);
          }

          return { uiCanvas, collider };
        });
        const camera = readResourceRef(wasmCtx, RemoteCamera);
        const skin = readResourceRef(wasmCtx, RemoteSkin);
        const mesh = readResourceRef(wasmCtx, RemoteMesh);
        const quaternion = readFloat32Array(wasmCtx.cursorView, 4); // rotation
        const scale = readFloat32Array(wasmCtx.cursorView, 3);
        const position = readFloat32Array(wasmCtx.cursorView, 3); // translation
        readFloatList(wasmCtx); // weights (currently unused)

        const node = new RemoteNode(wasmCtx.resourceManager, {
          camera,
          skin,
          mesh,
          collider,
          quaternion,
          scale,
          position,
          name,
          uiCanvas,
        });

        if (uiCanvas) {
          initNodeUICanvas(ctx, physics, node);
        }

        return node.eid;
      } catch (error) {
        console.error("WebSG: Error creating node:", error);
        return 0;
      }
    },
    world_find_node_by_name(namePtr: number, byteLength: number) {
      const node = getScriptResourceByNamePtr(ctx, wasmCtx, RemoteNode, namePtr, byteLength);
      return node ? node.eid : 0;
    },
    node_add_child(nodeId: number, childId: number) {
      const node = getScriptResource(wasmCtx, RemoteNode, nodeId);

      if (!node) {
        return -1;
      }

      const child = getScriptResource(wasmCtx, RemoteNode, childId);

      if (!child) {
        return -1;
      }

      addChild(node, child);

      return 0;
    },
    node_remove_child(nodeId: number, childId: number) {
      const node = getScriptResource(wasmCtx, RemoteNode, nodeId);

      if (!node) {
        return -1;
      }

      const child = getScriptResource(wasmCtx, RemoteNode, childId);

      if (!child) {
        return -1;
      }

      removeChild(node, child);

      return 0;
    },
    node_get_child_count(nodeId: number) {
      const node = getScriptResource(wasmCtx, RemoteNode, nodeId);

      if (!node) {
        return -1;
      }

      return getScriptChildCount(wasmCtx, node);
    },
    node_get_children(nodeId: number, childArrPtr: number, maxCount: number) {
      const node = getScriptResource(wasmCtx, RemoteNode, nodeId);

      if (!node) {
        return -1;
      }

      return getScriptChildren(wasmCtx, node, childArrPtr, maxCount);
    },
    node_get_child(nodeId: number, index: number) {
      const node = getScriptResource(wasmCtx, RemoteNode, nodeId);

      if (!node) {
        return 0; // This function returns a u32 so errors returned as 0 / null eid
      }

      return scriptGetChildAt(wasmCtx, node, index);
    },
    node_get_parent(nodeId: number) {
      const node = getScriptResource(wasmCtx, RemoteNode, nodeId);

      if (!node) {
        return 0; // This function returns a u32 so errors returned as 0 / null eid
      }

      const parent = node.parent;

      if (!parent) {
        return 0;
      }

      if (!wasmCtx.resourceManager.resourceIds.has(parent.eid)) {
        return 0;
      }

      return parent.eid;
    },
    node_get_parent_scene(nodeId: number) {
      const node = getScriptResource(wasmCtx, RemoteNode, nodeId);

      if (!node) {
        return 0; // This function returns a u32 so errors returned as 0 / null eid
      }

      const parentScene = node.parentScene;

      if (!parentScene) {
        return 0;
      }

      if (!wasmCtx.resourceManager.resourceIds.has(parentScene.eid)) {
        return 0;
      }

      return parentScene.eid;
    },
    node_get_translation_element(nodeId: number, index: number) {
      const node = getScriptResource(wasmCtx, RemoteNode, nodeId);

      if (!node) {
        return -1;
      }

      return node.position[index];
    },
    node_set_translation_element(nodeId: number, index: number, value: number) {
      const node = getScriptResource(wasmCtx, RemoteNode, nodeId);

      if (!node) {
        return -1;
      }

      node.position[index] = value;

      return 0;
    },
    node_get_translation(nodeId: number, translationPtr: number) {
      const node = getScriptResource(wasmCtx, RemoteNode, nodeId);

      if (!node) {
        return -1;
      }

      writeFloat32Array(wasmCtx, translationPtr, node.position);

      return 0;
    },
    node_set_translation(nodeId: number, translationPtr: number) {
      const node = getScriptResource(wasmCtx, RemoteNode, nodeId);

      if (!node) {
        return -1;
      }

      readFloat32ArrayInto(wasmCtx, translationPtr, node.position);

      return 0;
    },
    node_get_rotation_element(nodeId: number, index: number) {
      const node = getScriptResource(wasmCtx, RemoteNode, nodeId);

      if (!node) {
        return -1;
      }

      return node.quaternion[index];
    },
    node_set_rotation_element(nodeId: number, index: number, value: number) {
      const node = getScriptResource(wasmCtx, RemoteNode, nodeId);

      if (!node) {
        return -1;
      }

      node.quaternion[index] = value;

      return 0;
    },
    node_get_rotation(nodeId: number, rotationPtr: number) {
      const node = getScriptResource(wasmCtx, RemoteNode, nodeId);

      if (!node) {
        return -1;
      }

      writeFloat32Array(wasmCtx, rotationPtr, node.quaternion);

      return 0;
    },
    node_set_rotation(nodeId: number, rotationPtr: number) {
      const node = getScriptResource(wasmCtx, RemoteNode, nodeId);

      if (!node) {
        return -1;
      }

      readFloat32ArrayInto(wasmCtx, rotationPtr, node.quaternion);

      return 0;
    },
    node_get_scale_element(nodeId: number, index: number) {
      const node = getScriptResource(wasmCtx, RemoteNode, nodeId);

      if (!node) {
        return -1;
      }

      return node.scale[index];
    },
    node_set_scale_element(nodeId: number, index: number, value: number) {
      const node = getScriptResource(wasmCtx, RemoteNode, nodeId);

      if (!node) {
        return -1;
      }

      node.scale[index] = value;

      return 0;
    },
    node_get_scale(nodeId: number, scalePtr: number) {
      const node = getScriptResource(wasmCtx, RemoteNode, nodeId);

      if (!node) {
        return -1;
      }

      writeFloat32Array(wasmCtx, scalePtr, node.scale);

      return 0;
    },
    node_set_scale(nodeId: number, scalePtr: number) {
      const node = getScriptResource(wasmCtx, RemoteNode, nodeId);

      if (!node) {
        return -1;
      }

      readFloat32ArrayInto(wasmCtx, scalePtr, node.scale);

      return 0;
    },
    node_get_matrix_element(nodeId: number, index: number) {
      const node = getScriptResource(wasmCtx, RemoteNode, nodeId);

      if (!node) {
        return -1;
      }

      return node.localMatrix[index];
    },
    node_set_matrix_element(nodeId: number, index: number, value: number) {
      const node = getScriptResource(wasmCtx, RemoteNode, nodeId);

      if (!node) {
        return -1;
      }

      node.localMatrix[index] = value;

      return 0;
    },
    node_get_matrix(nodeId: number, matrixPtr: number) {
      const node = getScriptResource(wasmCtx, RemoteNode, nodeId);

      if (!node) {
        return -1;
      }

      writeFloat32Array(wasmCtx, matrixPtr, node.localMatrix);

      return 0;
    },
    node_set_matrix(nodeId: number, matrixPtr: number) {
      const node = getScriptResource(wasmCtx, RemoteNode, nodeId);

      if (!node) {
        return -1;
      }

      readFloat32ArrayInto(wasmCtx, matrixPtr, node.localMatrix);

      return 0;
    },
    node_get_world_matrix_element(nodeId: number, index: number) {
      const node = getScriptResource(wasmCtx, RemoteNode, nodeId);

      if (!node) {
        return -1;
      }

      return node.worldMatrix[index];
    },
    node_get_world_matrix(nodeId: number, worldMatrixPtr: number) {
      const node = getScriptResource(wasmCtx, RemoteNode, nodeId);

      if (!node) {
        return -1;
      }

      writeFloat32Array(wasmCtx, worldMatrixPtr, node.worldMatrix);

      return 0;
    },
    node_get_visible(nodeId: number) {
      const node = getScriptResource(wasmCtx, RemoteNode, nodeId);
      return node && node.visible ? 1 : 0;
    },
    node_set_visible(nodeId: number, visible: number) {
      const node = getScriptResource(wasmCtx, RemoteNode, nodeId);

      if (!node) {
        return -1;
      }

      node.visible = !!visible;

      return 0;
    },
    node_get_is_static(nodeId: number) {
      const node = getScriptResource(wasmCtx, RemoteNode, nodeId);
      return node && node.isStatic ? 1 : 0;
    },
    node_set_is_static(nodeId: number, isStatic: number) {
      const node = getScriptResource(wasmCtx, RemoteNode, nodeId);

      if (!node) {
        return -1;
      }

      node.isStatic = !!isStatic;

      return 0;
    },
    node_set_is_static_recursive(nodeId: number, isStatic: number) {
      const node = getScriptResource(wasmCtx, RemoteNode, nodeId);

      if (!node) {
        return -1;
      }

      traverse(node, (child) => {
        child.isStatic = !!isStatic;
      });

      return 0;
    },
    node_get_mesh(nodeId: number) {
      const node = getScriptResource(wasmCtx, RemoteNode, nodeId);

      if (!node) {
        return 0; // This function returns a u32 so errors returned as 0
      }

      return getScriptResourceRef(wasmCtx, RemoteMesh, node.mesh);
    },
    node_set_mesh(nodeId: number, meshId: number) {
      const node = getScriptResource(wasmCtx, RemoteNode, nodeId);

      if (!node) {
        return -1;
      }

      const mesh = getScriptResource(wasmCtx, RemoteMesh, meshId);

      if (!mesh) {
        return -1;
      }

      node.mesh = mesh;

      return 0;
    },
    node_get_light(nodeId: number) {
      const node = getScriptResource(wasmCtx, RemoteNode, nodeId);

      if (!node) {
        return 0; // This function returns a u32 so errors returned as 0
      }

      return getScriptResourceRef(wasmCtx, RemoteLight, node.light);
    },
    node_set_light(nodeId: number, lightId: number) {
      const node = getScriptResource(wasmCtx, RemoteNode, nodeId);

      if (!node) {
        return -1;
      }

      const light = getScriptResource(wasmCtx, RemoteLight, lightId);

      if (!light) {
        return -1;
      }

      node.light = light;

      return 0;
    },
    node_get_collider(nodeId: number) {
      const node = getScriptResource(wasmCtx, RemoteNode, nodeId);

      if (!node) {
        return 0; // This function returns a u32 so errors returned as 0
      }

      return getScriptResourceRef(wasmCtx, RemoteCollider, node.collider);
    },
    node_set_collider(nodeId: number, colliderId: number) {
      const node = getScriptResource(wasmCtx, RemoteNode, nodeId);

      if (!node) {
        return -1;
      }

      const collider = getScriptResource(wasmCtx, RemoteCollider, colliderId);

      if (!collider) {
        return -1;
      }

      node.collider = collider;

      return 0;
    },
    node_start_orbit(nodeId: number, propsPtr: number) {
      moveCursorView(wasmCtx.cursorView, propsPtr);
      const pitch = readFloat32(wasmCtx.cursorView);
      const yaw = readFloat32(wasmCtx.cursorView);
      const zoom = readFloat32(wasmCtx.cursorView);

      const node = getScriptResource(wasmCtx, RemoteNode, nodeId);

      if (!node) {
        return -1;
      }

      startOrbit(ctx, node, { pitch, yaw, zoom });

      return 1;
    },
    node_set_forward_direction(nodeId: number, directionPtr: number) {
      const node = getScriptResource(wasmCtx, RemoteNode, nodeId);

      if (!node) {
        return -1;
      }

      readFloat32ArrayInto(wasmCtx, directionPtr, tempVec3 as Float32Array);
      vec3.normalize(tempVec3, tempVec3);

      vec3.set(tempDirection, 0, 0, -1);
      vec3.transformQuat(tempDirection, tempDirection, node.quaternion);

      quat.rotationTo(tempQuat, tempDirection, tempVec3);
      quat.multiply(node.quaternion, node.quaternion, tempQuat);

      return 0;
    },
    world_stop_orbit() {
      stopOrbit(ctx);
      return 1;
    },
    world_create_mesh(propsPtr: number) {
      try {
        moveCursorView(wasmCtx.cursorView, propsPtr);
        const name = readStringFromCursorView(wasmCtx);
        readExtensionsAndExtras(wasmCtx);
        readFloatList(wasmCtx); // Weights (currently unused)

        const primitiveProps: MeshPrimitiveProps[] = readList(wasmCtx, () => {
          readExtensionsAndExtras(wasmCtx);
          const attributes = readRefMap(
            wasmCtx,
            MeshPrimitiveAttributeIndex,
            "MeshPrimitiveAttributeIndex",
            RemoteAccessor
          );
          const indices = readResourceRef(wasmCtx, RemoteAccessor);
          const material = readResourceRef(wasmCtx, RemoteMaterial);
          const mode = readUint32(wasmCtx.cursorView);
          readRefMap(wasmCtx, MeshPrimitiveAttributeIndex, "MeshPrimitiveAttributeIndex", RemoteAccessor); // targets (currently unused)

          if (MeshPrimitiveMode[mode] === undefined) {
            throw new Error(`WebSG: invalid mesh primitive mode: ${mode}`);
          }

          return {
            mode,
            indices,
            material,
            attributes,
          };
        });

        const primitives: RemoteMeshPrimitive[] = [];

        // Create all the resources after parsing props to try to avoid leaking resources on error.

        for (let i = 0; i < primitiveProps.length; i++) {
          const props = primitiveProps[i];
          primitives.push(new RemoteMeshPrimitive(wasmCtx.resourceManager, props));
        }

        const mesh = new RemoteMesh(wasmCtx.resourceManager, { name, primitives });

        return mesh.eid;
      } catch (error) {
        console.error(`WebSG: error creating mesh:`, error);
        return 0;
      }
    },
    world_create_box_mesh(propsPtr: number) {
      moveCursorView(wasmCtx.cursorView, propsPtr);
      const size = readFloat32Array(wasmCtx.cursorView, 3);
      const segments = readUint32Array(wasmCtx.cursorView, 3);
      const materialId = readUint32(wasmCtx.cursorView);

      const geometry = new BoxGeometry(size[0], size[1], size[2], segments[0], segments[1], segments[2]);

      let material: RemoteMaterial | undefined = undefined;

      if (materialId) {
        material = getScriptResource(wasmCtx, RemoteMaterial, materialId);

        if (!material) {
          return -1;
        }
      }

      const mesh = createMesh(ctx, geometry, material, wasmCtx.resourceManager);

      return mesh.eid;
    },
    world_find_mesh_by_name(namePtr: number, byteLength: number) {
      const mesh = getScriptResourceByNamePtr(ctx, wasmCtx, RemoteMesh, namePtr, byteLength);
      return mesh ? mesh.eid : 0;
    },
    mesh_get_primitive_count(meshId: number) {
      const mesh = getScriptResource(wasmCtx, RemoteMesh, meshId);
      return mesh ? mesh.primitives.length : -1;
    },
    mesh_get_primitive_attribute(meshId: number, index: number, attribute: MeshPrimitiveAttributeIndex) {
      const mesh = getScriptResource(wasmCtx, RemoteMesh, meshId);
      return mesh?.primitives[index]?.attributes[attribute]?.eid || 0;
    },
    mesh_get_primitive_indices(meshId: number, index: number) {
      const mesh = getScriptResource(wasmCtx, RemoteMesh, meshId);
      return mesh?.primitives[index]?.indices?.eid || 0;
    },
    mesh_get_primitive_material(meshId: number, index: number) {
      const mesh = getScriptResource(wasmCtx, RemoteMesh, meshId);
      return mesh?.primitives[index]?.material?.eid || 0;
    },
    mesh_set_primitive_material(meshId: number, index: number, materialId: number) {
      const mesh = getScriptResource(wasmCtx, RemoteMesh, meshId);

      const primitive = mesh?.primitives[index];

      if (!primitive) {
        return -1;
      }

      const material = getScriptResource(wasmCtx, RemoteMaterial, materialId);

      if (!material) {
        return -1;
      }

      primitive.material = material;

      return 0;
    },
    mesh_get_primitive_mode(meshId: number, index: number) {
      const mesh = getScriptResource(wasmCtx, RemoteMesh, meshId);
      return mesh?.primitives[index]?.mode || 0;
    },
    mesh_set_primitive_draw_range(meshId: number, index: number, start: number, count: number) {
      const mesh = getScriptResource(wasmCtx, RemoteMesh, meshId);
      const meshPrimitive = mesh?.primitives[index];

      if (!meshPrimitive) {
        console.error(`WebSG: couldn't find mesh primitive: ${index} on mesh ${meshId}`);
        return -1;
      }

      meshPrimitive.drawStart = start;
      meshPrimitive.drawCount = count;

      return 0;
    },
    mesh_set_primitive_hologram_material_enabled(meshId: number, index: number, enabled: number) {
      const mesh = getScriptResource(wasmCtx, RemoteMesh, meshId);

      const primitive = mesh?.primitives[index];

      if (!primitive) {
        return -1;
      }

      primitive.hologramMaterialEnabled = !!enabled;

      return 0;
    },
    world_create_accessor_from(dataPtr: number, byteLength: number, propsPtr: number) {
      try {
        const data = readSharedArrayBuffer(wasmCtx, dataPtr, byteLength);
        moveCursorView(wasmCtx.cursorView, propsPtr);
        const type = readEnum(wasmCtx, AccessorType, "AccessorType");
        const componentType = readEnum(wasmCtx, AccessorComponentType, "AccessorComponentType");
        const count = readUint32(wasmCtx.cursorView);
        const normalized = !!readUint32(wasmCtx.cursorView);
        const dynamic = !!readUint32(wasmCtx.cursorView);
        readFloatList(wasmCtx); // min (currently unused)
        readFloatList(wasmCtx); // max (currently unused)

        const buffer = new RemoteBuffer(wasmCtx.resourceManager, { data });
        const bufferView = new RemoteBufferView(wasmCtx.resourceManager, { buffer, byteLength });
        const accessor = new RemoteAccessor(wasmCtx.resourceManager, {
          bufferView,
          type,
          componentType,
          count,
          normalized,
          dynamic,
        });

        return accessor.eid;
      } catch (error) {
        console.error(`WebSG: error creating accessor:`, error);
        return 0;
      }
    },
    world_find_accessor_by_name(namePtr: number, byteLength: number) {
      const accessor = getScriptResourceByNamePtr(ctx, wasmCtx, RemoteAccessor, namePtr, byteLength);
      return accessor ? accessor.eid : 0;
    },
    accessor_update_with(accessorId: number, dataPtr: number, byteLength: number) {
      const accessor = getScriptResource(wasmCtx, RemoteAccessor, accessorId);

      if (!accessor) {
        return -1;
      }

      if (!accessor.dynamic) {
        console.error("WebSG: cannot update non-dynamic accessor.");
        return -1;
      }

      if (accessor.sparse) {
        console.error("WebSG: cannot update sparse accessor.");
        return -1;
      }

      const bufferView = accessor.bufferView;

      if (!bufferView) {
        console.error("WebSG: cannot update accessor without bufferView.");
        return -1;
      }

      try {
        const elementCount = accessor.count;
        const elementSize = AccessorTypeToElementSize[accessor.type];
        const arrConstructor = AccessorComponentTypeToTypedArray[accessor.componentType];
        const componentByteLength = arrConstructor.BYTES_PER_ELEMENT;
        const elementByteLength = componentByteLength * elementSize;
        const buffer = bufferView.buffer.data;
        const byteOffset = accessor.byteOffset + bufferView.byteOffset;
        const byteStride = bufferView.byteStride;

        if (byteStride && byteStride !== elementByteLength) {
          console.error("WebSG: cannot update accessor with byteStride.");
          return -1;
        }

        // TODO: This creates garbage. See if we can keep around read/write views for dynamic accessors.
        const readView = readUint8Array(wasmCtx, dataPtr, byteLength);
        const writeView = new Uint8Array(buffer, byteOffset, elementCount * elementByteLength);
        writeView.set(readView);
        accessor.version++;

        return 0;
      } catch (error) {
        console.error(`WebSG: error updating accessor:`, error);
        return -1;
      }
    },
    world_create_material(propsPtr: number) {
      try {
        moveCursorView(wasmCtx.cursorView, propsPtr);
        const name = readStringFromCursorView(wasmCtx);
        const extensions = readExtensionsAndExtras(wasmCtx);

        const {
          baseColorFactor,
          baseColorTexture,
          baseColorTextureOffset,
          baseColorTextureRotation,
          baseColorTextureScale,
          metallicFactor,
          roughnessFactor,
          metallicRoughnessTexture,
          metallicRoughnessTextureOffset,
          metallicRoughnessTextureRotation,
          metallicRoughnessTextureScale,
        } = readPBRMetallicRoughness(wasmCtx);

        if ("KHR_materials_unlit" in extensions) {
          const material = new RemoteMaterial(wasmCtx.resourceManager, {
            type: MaterialType.Unlit,
            name,
            baseColorFactor,
            baseColorTexture,
            baseColorTextureOffset,
            baseColorTextureRotation,
            baseColorTextureScale,
          });

          return material.eid;
        }

        const [normalTexture, normalScale, normalTextureOffset, normalTextureRotation, normalTextureScale] =
          readNormalTextureInfo(wasmCtx);
        const [
          occlusionTexture,
          occlusionTextureStrength,
          occlusionTextureOffset,
          occlusionTextureRotation,
          occlusionTextureScale,
        ] = readOcclusionTextureInfo(wasmCtx);
        const [emissiveTexture, emissiveTextureOffset, emissiveTextureRotation, emissiveTextureScale] =
          readTextureInfo(wasmCtx);
        const emissiveFactor = readFloat32Array(wasmCtx.cursorView, 3);
        const alphaMode = readUint32(wasmCtx.cursorView);
        const alphaCutoff = readFloat32(wasmCtx.cursorView);
        const doubleSided = !!readUint32(wasmCtx.cursorView);

        const material = new RemoteMaterial(wasmCtx.resourceManager, {
          type: MaterialType.Standard,
          name,
          baseColorFactor,
          baseColorTexture,
          metallicFactor,
          roughnessFactor,
          metallicRoughnessTexture,
          metallicRoughnessTextureOffset,
          metallicRoughnessTextureRotation,
          metallicRoughnessTextureScale,
          normalTexture,
          normalScale,
          normalTextureOffset,
          normalTextureRotation,
          normalTextureScale,
          occlusionTexture,
          occlusionTextureStrength,
          occlusionTextureOffset,
          occlusionTextureRotation,
          occlusionTextureScale,
          emissiveFactor,
          emissiveTexture,
          emissiveTextureOffset,
          emissiveTextureRotation,
          emissiveTextureScale,
          alphaMode,
          alphaCutoff,
          doubleSided,
        });

        return material.eid;
      } catch (error) {
        console.error(`WebSG: error creating material:`, error);
        return 0;
      }
    },
    world_find_material_by_name(namePtr: number, byteLength: number) {
      const material = getScriptResourceByNamePtr(ctx, wasmCtx, RemoteMaterial, namePtr, byteLength);
      return material ? material.eid : 0;
    },
    material_get_base_color_factor(materialId: number, colorPtr: number) {
      const material = getScriptResource(wasmCtx, RemoteMaterial, materialId);

      if (!material) {
        return -1;
      }

      writeFloat32Array(wasmCtx, colorPtr, material.baseColorFactor);

      return 0;
    },
    material_set_base_color_factor(materialId: number, colorPtr: number) {
      const material = getScriptResource(wasmCtx, RemoteMaterial, materialId);

      if (!material) {
        return -1;
      }

      readFloat32ArrayInto(wasmCtx, colorPtr, material.baseColorFactor);

      return 0;
    },
    material_get_base_color_factor_element(materialId: number, index: number) {
      const material = getScriptResource(wasmCtx, RemoteMaterial, materialId);

      if (!material) {
        return -1;
      }

      return material.baseColorFactor[index];
    },
    material_set_base_color_factor_element(materialId: number, index: number, value: number) {
      const material = getScriptResource(wasmCtx, RemoteMaterial, materialId);

      if (!material) {
        return -1;
      }

      material.baseColorFactor[index] = value;

      return 0;
    },
    material_get_metallic_factor(materialId: number) {
      const material = getScriptResource(wasmCtx, RemoteMaterial, materialId);
      return material?.metallicFactor || 0;
    },
    material_set_metallic_factor(materialId: number, metallicFactor: number) {
      const material = getScriptResource(wasmCtx, RemoteMaterial, materialId);

      if (!material) {
        return -1;
      }

      material.metallicFactor = metallicFactor;

      return 0;
    },
    material_get_roughness_factor(materialId: number) {
      const material = getScriptResource(wasmCtx, RemoteMaterial, materialId);
      return material?.roughnessFactor || 0;
    },
    material_set_roughness_factor(materialId: number, roughnessFactor: number) {
      const material = getScriptResource(wasmCtx, RemoteMaterial, materialId);

      if (!material) {
        return -1;
      }

      material.roughnessFactor = roughnessFactor;

      return 0;
    },
    material_get_emissive_factor(materialId: number, colorPtr: number) {
      const material = getScriptResource(wasmCtx, RemoteMaterial, materialId);

      if (!material) {
        return -1;
      }

      writeFloat32Array(wasmCtx, colorPtr, material.emissiveFactor);

      return 0;
    },
    material_set_emissive_factor(materialId: number, colorPtr: number) {
      const material = getScriptResource(wasmCtx, RemoteMaterial, materialId);

      if (!material) {
        return -1;
      }

      readFloat32ArrayInto(wasmCtx, colorPtr, material.emissiveFactor);

      return 0;
    },
    material_get_emissive_factor_element(materialId: number, index: number) {
      const material = getScriptResource(wasmCtx, RemoteMaterial, materialId);

      if (!material) {
        return -1;
      }

      return material.emissiveFactor[index];
    },
    material_set_emissive_factor_element(materialId: number, index: number, value: number) {
      const material = getScriptResource(wasmCtx, RemoteMaterial, materialId);

      if (!material) {
        return -1;
      }

      material.emissiveFactor[index] = value;

      return 0;
    },
    material_get_base_color_texture(materialId: number) {
      const material = getScriptResource(wasmCtx, RemoteMaterial, materialId);

      if (!material) {
        return 0; // This function returns a u32 so errors returned as 0
      }

      return getScriptResourceRef(wasmCtx, RemoteTexture, material.baseColorTexture);
    },
    material_set_base_color_texture(materialId: number, textureId: number) {
      const material = getScriptResource(wasmCtx, RemoteMaterial, materialId);

      if (!material) {
        return -1;
      }

      const baseColorTexture = getScriptResource(wasmCtx, RemoteTexture, textureId);

      if (!baseColorTexture) {
        return -1;
      }

      material.baseColorTexture = baseColorTexture;

      return 0;
    },
    world_find_texture_by_name(namePtr: number, byteLength: number) {
      const texture = getScriptResourceByNamePtr(ctx, wasmCtx, RemoteTexture, namePtr, byteLength);
      return texture ? texture.eid : 0;
    },
    world_find_image_by_name(namePtr: number, byteLength: number) {
      const texture = getScriptResourceByNamePtr(ctx, wasmCtx, RemoteImage, namePtr, byteLength);
      return texture ? texture.eid : 0;
    },
    world_create_light(propsPtr: number) {
      try {
        moveCursorView(wasmCtx.cursorView, propsPtr);
        const name = readStringFromCursorView(wasmCtx);
        readExtensionsAndExtras(wasmCtx);
        const color = readFloat32Array(wasmCtx.cursorView, 3);
        const intensity = readFloat32(wasmCtx.cursorView);
        const type = readEnum(wasmCtx, LightType, "LightType");
        const range = readFloat32(wasmCtx.cursorView);
        readExtensionsAndExtras(wasmCtx); // Spot extensions
        const innerConeAngle = readFloat32(wasmCtx.cursorView);
        const outerConeAngle = readFloat32(wasmCtx.cursorView);

        const light = new RemoteLight(wasmCtx.resourceManager, {
          name,
          type,
          color,
          intensity,
          range,
          innerConeAngle,
          outerConeAngle,
        });

        return light.eid;
      } catch (error) {
        console.error(`WebSG: error creating light:`, error);
        return 0;
      }
    },
    world_find_light_by_name(namePtr: number, byteLength: number) {
      const light = getScriptResourceByNamePtr(ctx, wasmCtx, RemoteLight, namePtr, byteLength);
      return light ? light.eid : 0;
    },
    light_get_color(lightId: number, colorPtr: number) {
      const light = getScriptResource(wasmCtx, RemoteLight, lightId);

      if (!light) {
        return -1;
      }

      writeFloat32Array(wasmCtx, colorPtr, light.color);

      return 0;
    },
    light_set_color(lightId: number, colorPtr: number) {
      const light = getScriptResource(wasmCtx, RemoteLight, lightId);

      if (!light) {
        return -1;
      }

      readFloat32ArrayInto(wasmCtx, colorPtr, light.color);

      return 0;
    },
    light_get_color_element(lightId: number, index: number) {
      const light = getScriptResource(wasmCtx, RemoteLight, lightId);

      if (!light) {
        return -1;
      }

      return light.color[index];
    },
    light_set_color_element(lightId: number, index: number, value: number) {
      const light = getScriptResource(wasmCtx, RemoteLight, lightId);

      if (!light) {
        return -1;
      }

      light.color[index] = value;

      return 0;
    },
    light_get_intensity(lightId: number) {
      const light = getScriptResource(wasmCtx, RemoteLight, lightId);
      return light?.intensity || 0;
    },
    light_set_intensity(lightId: number, intensity: number) {
      const light = getScriptResource(wasmCtx, RemoteLight, lightId);

      if (!light) {
        return -1;
      }

      light.intensity = intensity;

      return 0;
    },
    node_add_interactable(nodeId: number, propsPtr: number) {
      try {
        const node = getScriptResource(wasmCtx, RemoteNode, nodeId);

        if (!node) {
          return -1;
        }

        if (node.interactable) {
          console.error("WebSG: node is already interactable.");
          return -1;
        }

        moveCursorView(wasmCtx.cursorView, propsPtr);
        readExtensionsAndExtras(wasmCtx);
        const type = readEnum(wasmCtx, InteractableType, "InteractableType");

        const validTypes = [InteractableType.Interactable, InteractableType.Grabbable];

        if (!validTypes.includes(type)) {
          console.error("WebSG: Invalid interactable type.");
          return -1;
        }

        node.interactable = new RemoteInteractable(wasmCtx.resourceManager, { type });
        addInteractableComponent(ctx, physics, node, type);

        return 0;
      } catch (error) {
        console.error(`WebSG: error adding interactable:`, error);
        return -1;
      }
    },
    node_remove_interactable(nodeId: number) {
      const node = getScriptResource(wasmCtx, RemoteNode, nodeId);

      if (!node) {
        return -1;
      }

      if (!node.interactable) {
        console.error("WebSG: node is not interactable.");
        return -1;
      }

      node.interactable = undefined;

      return 0;
    },
    node_has_interactable(nodeId: number) {
      const node = getScriptResource(wasmCtx, RemoteNode, nodeId);
      return node?.interactable ? 1 : 0;
    },
    node_get_interactable_pressed(nodeId: number) {
      const node = getScriptResource(wasmCtx, RemoteNode, nodeId);

      if (!node) {
        return -1;
      }

      const interactable = node.interactable;

      if (!interactable) {
        return -1;
      }

      return interactable.pressed ? 1 : 0;
    },
    node_get_interactable_held(nodeId: number) {
      const node = getScriptResource(wasmCtx, RemoteNode, nodeId);

      if (!node) {
        return -1;
      }

      const interactable = node.interactable;

      if (!interactable) {
        return -1;
      }

      return interactable.held ? 1 : 0;
    },
    node_get_interactable_released(nodeId: number) {
      const node = getScriptResource(wasmCtx, RemoteNode, nodeId);

      if (!node) {
        return -1;
      }

      const interactable = node.interactable;

      if (!interactable) {
        return -1;
      }

      return interactable.released ? 1 : 0;
    },
    world_create_collider(propsPtr: number) {
      try {
        moveCursorView(wasmCtx.cursorView, propsPtr);
        const name = readStringFromCursorView(wasmCtx);
        readExtensionsAndExtras(wasmCtx);
        const type = readEnum(wasmCtx, ColliderType, "ColliderType");

        // TODO: Add more checks for valid props per type
        const isTrigger = !!readUint32(wasmCtx.cursorView);
        const size = readFloat32Array(wasmCtx.cursorView, 3);
        const radius = readFloat32(wasmCtx.cursorView);
        const height = readFloat32(wasmCtx.cursorView);
        const mesh = readResourceRef(wasmCtx, RemoteMesh);

        const collider = new RemoteCollider(wasmCtx.resourceManager, {
          name,
          type,
          isTrigger,
          size,
          radius,
          height,
          mesh,
        });

        return collider.eid;
      } catch (error) {
        console.error(`WebSG: error creating collider:`, error);
        return -1;
      }
    },
    world_find_collider_by_name(namePtr: number, byteLength: number) {
      const collider = getScriptResourceByNamePtr(ctx, wasmCtx, RemoteCollider, namePtr, byteLength);
      return collider ? collider.eid : 0;
    },
    node_add_physics_body(nodeId: number, propsPtr: number) {
      try {
        const node = getScriptResource(wasmCtx, RemoteNode, nodeId);

        if (!node) {
          return -1;
        }

        if (hasComponent(ctx.world, RigidBody, node.eid)) {
          console.error("WebSG: node already has a rigid body.");
          return -1;
        }

        moveCursorView(wasmCtx.cursorView, propsPtr);
        readExtensionsAndExtras(wasmCtx);
        const type = readEnum(wasmCtx, PhysicsBodyType, "PhysicsBodyType");
        const mass = readFloat32(wasmCtx.cursorView);
        const linearVelocity = readFloat32Array(wasmCtx.cursorView, 3);
        const angularVelocity = readFloat32Array(wasmCtx.cursorView, 3);
        const inertiaTensor = readFloat32Array(wasmCtx.cursorView, 9);

        node.physicsBody = new RemotePhysicsBody(wasmCtx.resourceManager, {
          type,
          mass,
          linearVelocity,
          angularVelocity,
          inertiaTensor,
        });

        addNodePhysicsBody(ctx, node);

        return 0;
      } catch (error) {
        console.error(`WebSG: error adding physics body:`, error);
        return -1;
      }
    },
    node_remove_physics_body(nodeId: number) {
      const node = getScriptResource(wasmCtx, RemoteNode, nodeId);

      if (!node) {
        return -1;
      }

      node.physicsBody = undefined;
      removeRigidBody(ctx.world, node.eid);

      return 0;
    },
    node_has_physics_body(nodeId: number) {
      const node = getScriptResource(wasmCtx, RemoteNode, nodeId);
      return node && hasComponent(ctx.world, RigidBody, node.eid) ? 1 : 0;
    },
    physics_body_apply_impulse(nodeId: number, impulsePtr: number) {
      const node = getScriptResource(wasmCtx, RemoteNode, nodeId);

      if (!node) {
        return -1;
      }

      moveCursorView(wasmCtx.cursorView, impulsePtr);
      tempRapierVec3.x = readFloat32(wasmCtx.cursorView);
      tempRapierVec3.y = readFloat32(wasmCtx.cursorView);
      tempRapierVec3.z = readFloat32(wasmCtx.cursorView);

      const body = RigidBody.store.get(node.eid);

      if (!body) {
        return -1;
      }

      body.applyImpulse(tempRapierVec3, true);

      return 0;
    },
    world_create_collision_listener() {
      const resourceManager = wasmCtx.resourceManager;
      const id = resourceManager.nextCollisionListenerId++;
      resourceManager.collisionListeners.push({
        id,
        collisions: [],
      });
      return id;
    },
    collision_listener_dispose(listenerId: number) {
      const resourceManager = wasmCtx.resourceManager;
      const index = resourceManager.collisionListeners.findIndex((l) => l.id === listenerId);
      if (index === -1) {
        console.error(`WebSG: collision listener ${listenerId} not found.`);
        return -1;
      }
      resourceManager.collisionListeners.splice(index, 1);
      return 0;
    },
    collisions_listener_get_collision_count(listenerId: number) {
      const resourceManager = wasmCtx.resourceManager;
      const listener = resourceManager.collisionListeners.find((l) => l.id === listenerId);
      if (!listener) {
        console.error(`WebSG: collision listener ${listenerId} not found.`);
        return -1;
      }
      return listener.collisions.length;
    },
    collisions_listener_get_collisions(listenerId: number, collisionsPtr: number, maxCollisions: number) {
      const resourceManager = wasmCtx.resourceManager;
      const listener = resourceManager.collisionListeners.find((l) => l.id === listenerId);

      if (!listener) {
        console.error(`WebSG: collision listener ${listenerId} not found.`);
        return -1;
      }

      const collisions = listener.collisions;

      if (collisions.length > maxCollisions) {
        console.error(`WebSG: collision listener ${listenerId} has more collisions than maxCollisions.`);
        return -1;
      }

      moveCursorView(wasmCtx.cursorView, collisionsPtr);

      for (let i = 0; i < collisions.length; i++) {
        const collision = collisions[i];
        writeUint32(wasmCtx.cursorView, collision.nodeA);
        writeUint32(wasmCtx.cursorView, collision.nodeB);
        writeInt32(wasmCtx.cursorView, collision.started ? 1 : 0);
      }

      const count = collisions.length;

      collisions.length = 0;

      return count;
    },
    // UI Canvas
    world_create_ui_canvas(propsPtr: number) {
      try {
        moveCursorView(wasmCtx.cursorView, propsPtr);
        const name = readStringFromCursorView(wasmCtx);
        readExtensionsAndExtras(wasmCtx);
        const root = readResourceRef(wasmCtx, RemoteUIElement);
        const size = readFloat32Array(wasmCtx.cursorView, 2);
        const width = readFloat32(wasmCtx.cursorView);
        const height = readFloat32(wasmCtx.cursorView);

        const uiCanvas = new RemoteUICanvas(wasmCtx.resourceManager, {
          name,
          root,
          size,
          width,
          height,
        });

        return uiCanvas.eid;
      } catch (error) {
        console.error(`WebSG: error creating ui canvas:`, error);
        return -1;
      }
    },
    world_find_ui_canvas_by_name(namePtr: number, byteLength: number) {
      const uiCanvas = getScriptResourceByNamePtr(ctx, wasmCtx, RemoteUICanvas, namePtr, byteLength);
      return uiCanvas ? uiCanvas.eid : 0;
    },
    node_set_ui_canvas(nodeId: number, canvasId: number) {
      const node = getScriptResource(wasmCtx, RemoteNode, nodeId);
      const canvas = getScriptResource(wasmCtx, RemoteUICanvas, canvasId);

      if (!canvas || !node) {
        return -1;
      }

      node.uiCanvas = canvas;
      initNodeUICanvas(ctx, physics, node);

      return 0;
    },
    node_get_ui_canvas(nodeId: number) {
      const node = getScriptResource(wasmCtx, RemoteNode, nodeId);
      return node?.uiCanvas?.eid ?? 0;
    },
    ui_canvas_get_root(canvasId: number) {
      const canvas = getScriptResource(wasmCtx, RemoteUICanvas, canvasId);

      if (!canvas) {
        return 0; // This function returns a u32 so errors returned as 0 / null eid
      }

      const root = canvas.root;

      if (!root) {
        return 0;
      }

      if (!wasmCtx.resourceManager.resourceIds.has(root.eid)) {
        return 0;
      }

      return root.eid;
    },
    ui_canvas_set_root(canvasId: number, rootId: number) {
      const canvas = getScriptResource(wasmCtx, RemoteUICanvas, canvasId);

      if (!canvas) {
        return -1;
      }

      const flex = getScriptResource(wasmCtx, RemoteUIElement, rootId);

      if (!flex) {
        return -1;
      }

      canvas.root = flex;

      return 0;
    },
    ui_canvas_get_size(uiCanvasId: number, sizePtr: number) {
      const uiCanvas = getScriptResource(wasmCtx, RemoteUICanvas, uiCanvasId);

      if (!uiCanvas) {
        return -1;
      }

      writeFloat32Array(wasmCtx, sizePtr, uiCanvas.size);

      return 0;
    },
    ui_canvas_set_size(uiCanvasId: number, sizePtr: number) {
      const uiCanvas = getScriptResource(wasmCtx, RemoteUICanvas, uiCanvasId);

      if (!uiCanvas) {
        return -1;
      }

      readFloat32ArrayInto(wasmCtx, sizePtr, uiCanvas.size);

      return 0;
    },
    ui_canvas_get_size_element(uiCanvasId: number, index: number) {
      const uiCanvas = getScriptResource(wasmCtx, RemoteUICanvas, uiCanvasId);

      if (!uiCanvas) {
        return -1;
      }

      return uiCanvas.size[index];
    },
    ui_canvas_set_size_element(uiCanvasId: number, index: number, value: number) {
      const uiCanvas = getScriptResource(wasmCtx, RemoteUICanvas, uiCanvasId);

      if (!uiCanvas) {
        return -1;
      }

      uiCanvas.size[index] = value;

      return 0;
    },
    ui_canvas_get_width(canvasId: number) {
      const canvas = getScriptResource(wasmCtx, RemoteUICanvas, canvasId);

      if (!canvas) {
        return -1;
      }

      return canvas.width;
    },
    ui_canvas_set_width(canvasId: number, width: number) {
      const canvas = getScriptResource(wasmCtx, RemoteUICanvas, canvasId);

      if (!canvas) {
        return -1;
      }

      canvas.width = width;

      return 0;
    },
    ui_canvas_get_height(canvasId: number) {
      const canvas = getScriptResource(wasmCtx, RemoteUICanvas, canvasId);

      if (!canvas) {
        return -1;
      }

      return canvas.height;
    },
    ui_canvas_set_height(canvasId: number, height: number) {
      const canvas = getScriptResource(wasmCtx, RemoteUICanvas, canvasId);

      if (!canvas) {
        return -1;
      }

      canvas.height = height;

      return 0;
    },
    ui_canvas_redraw(canvasId: number) {
      const canvas = getScriptResource(wasmCtx, RemoteUICanvas, canvasId);

      if (!canvas) {
        return -1;
      }

      canvas.redraw++;

      return 0;
    },

    // UI Element

    world_create_ui_element(propsPtr: number) {
      moveCursorView(wasmCtx.cursorView, propsPtr);
      const name = readStringFromCursorView(wasmCtx);
      readExtensionsAndExtras(wasmCtx);
      const type = readEnum(wasmCtx, ElementType, "ElementType");
      const position = readFloat32Array(wasmCtx.cursorView, 4);
      const positionType = readEnum(wasmCtx, ElementPositionType, "PositionType");
      const alignContent = readEnum(wasmCtx, FlexAlign, "FlexAlign");
      const alignItems = readEnum(wasmCtx, FlexAlign, "FlexAlign");
      const alignSelf = readEnum(wasmCtx, FlexAlign, "FlexAlign");
      const flexDirection = readEnum(wasmCtx, FlexDirection, "FlexDirection");
      const flexWrap = readEnum(wasmCtx, FlexWrap, "FlexWrap");
      const flexBasis = readFloat32(wasmCtx.cursorView);
      const flexGrow = readFloat32(wasmCtx.cursorView);
      const flexShrink = readFloat32(wasmCtx.cursorView);
      const justifyContent = readEnum(wasmCtx, FlexJustify, "FlexJustify");
      const width = readFloat32(wasmCtx.cursorView);
      const height = readFloat32(wasmCtx.cursorView);
      const minWidth = readFloat32(wasmCtx.cursorView);
      const minHeight = readFloat32(wasmCtx.cursorView);
      const maxWidth = readFloat32(wasmCtx.cursorView);
      const maxHeight = readFloat32(wasmCtx.cursorView);
      const backgroundColor = readFloat32Array(wasmCtx.cursorView, 4);
      const borderColor = readFloat32Array(wasmCtx.cursorView, 4);
      const padding = readFloat32Array(wasmCtx.cursorView, 4);
      const margin = readFloat32Array(wasmCtx.cursorView, 4);
      const borderWidth = readFloat32Array(wasmCtx.cursorView, 4);
      const borderRadius = readFloat32Array(wasmCtx.cursorView, 4);
      const buttonPtr = readUint32(wasmCtx.cursorView);
      const textPtr = readUint32(wasmCtx.cursorView);

      let button: RemoteUIButton | undefined = undefined;

      if (type === ElementType.Button) {
        const rewind = rewindCursorView(wasmCtx.cursorView);
        moveCursorView(wasmCtx.cursorView, buttonPtr);

        readExtensionsAndExtras(wasmCtx);
        const label = readStringLen(wasmCtx);

        button = new RemoteUIButton(wasmCtx.resourceManager, {
          label,
        });

        addInteractableComponent(ctx, physics, button, InteractableType.UI);

        rewind();
      }

      skipUint32(wasmCtx.cursorView); // Button ptr

      let text: RemoteUIText | undefined = undefined;

      if (type === ElementType.Text || type === ElementType.Button) {
        const rewind = rewindCursorView(wasmCtx.cursorView);
        moveCursorView(wasmCtx.cursorView, textPtr);
        readExtensionsAndExtras(wasmCtx);
        const value = readStringLen(wasmCtx);
        const fontFamily = readStringLen(wasmCtx);
        const fontWeight = readStringLen(wasmCtx);
        const fontStyle = readStringLen(wasmCtx);
        const fontSize = readFloat32(wasmCtx.cursorView);
        const color = readFloat32Array(wasmCtx.cursorView, 4);

        text = new RemoteUIText(wasmCtx.resourceManager, {
          value,
          fontFamily,
          fontWeight,
          fontStyle,
          fontSize,
          color,
        });

        rewind();
      }

      try {
        const uiElement = new RemoteUIElement(wasmCtx.resourceManager, {
          name,
          type,
          position,
          positionType,
          alignContent,
          alignItems,
          alignSelf,
          flexDirection,
          flexWrap,
          flexBasis,
          flexGrow,
          flexShrink,
          justifyContent,
          width,
          height,
          minWidth,
          minHeight,
          maxWidth,
          maxHeight,
          backgroundColor,
          borderColor,
          padding,
          margin,
          borderWidth,
          borderRadius,
          button,
          text,
        });
        return uiElement.eid;
      } catch (e) {
        console.error("WebSG: error creating ui flex", e);
        return -1;
      }
    },
    world_find_ui_element_by_name(namePtr: number, byteLength: number) {
      const uiElement = getScriptResourceByNamePtr(ctx, wasmCtx, RemoteUIElement, namePtr, byteLength);
      return uiElement ? uiElement.eid : 0;
    },
    ui_element_get_position(lightId: number, positionPtr: number) {
      const uiElement = getScriptResource(wasmCtx, RemoteUIElement, lightId);

      if (!uiElement) {
        return -1;
      }

      writeFloat32Array(wasmCtx, positionPtr, uiElement.position);

      return 0;
    },
    ui_element_set_position(uiElementId: number, positionPtr: number) {
      const uiElement = getScriptResource(wasmCtx, RemoteUIElement, uiElementId);

      if (!uiElement) {
        return -1;
      }

      readFloat32ArrayInto(wasmCtx, positionPtr, uiElement.position);

      return 0;
    },
    ui_element_get_position_element(uiElementId: number, index: number) {
      const uiElement = getScriptResource(wasmCtx, RemoteUIElement, uiElementId);

      if (!uiElement) {
        return -1;
      }

      return uiElement.position[index];
    },
    ui_element_set_position_element(uiElementId: number, index: number, value: number) {
      const uiElement = getScriptResource(wasmCtx, RemoteUIElement, uiElementId);

      if (!uiElement) {
        return -1;
      }

      uiElement.position[index] = value;

      return 0;
    },
    ui_element_get_position_type(uiElementId: number) {
      const uiElement = getScriptResource(wasmCtx, RemoteUIElement, uiElementId);

      if (!uiElement) {
        return -1;
      }

      return uiElement.positionType;
    },
    ui_element_set_position_type(uiElementId: number, positionType: number) {
      const uiElement = getScriptResource(wasmCtx, RemoteUIElement, uiElementId);

      if (!uiElement) {
        return -1;
      }

      if (ElementPositionType[positionType] === undefined) {
        console.error(`WebSG: invalid position type ${positionType}`);
        return -1;
      }

      uiElement.positionType = positionType;

      return 0;
    },
    ui_element_get_align_content(uiElementId: number) {
      const uiElement = getScriptResource(wasmCtx, RemoteUIElement, uiElementId);

      if (!uiElement) {
        return -1;
      }

      return uiElement.alignContent;
    },
    ui_element_set_align_content(uiElementId: number, alignContent: number) {
      const uiElement = getScriptResource(wasmCtx, RemoteUIElement, uiElementId);

      if (!uiElement) {
        return -1;
      }

      if (FlexAlign[alignContent] === undefined) {
        console.error(`WebSG: invalid flex alignment ${alignContent}`);
        return -1;
      }

      uiElement.alignContent = alignContent;

      return 0;
    },
    ui_element_get_align_items(uiElementId: number) {
      const uiElement = getScriptResource(wasmCtx, RemoteUIElement, uiElementId);

      if (!uiElement) {
        return -1;
      }

      return uiElement.alignItems;
    },
    ui_element_set_align_items(uiElementId: number, alignItems: number) {
      const uiElement = getScriptResource(wasmCtx, RemoteUIElement, uiElementId);

      if (!uiElement) {
        return -1;
      }

      if (FlexAlign[alignItems] === undefined) {
        console.error(`WebSG: invalid flex alignment ${alignItems}`);
        return -1;
      }

      uiElement.alignItems = alignItems;

      return 0;
    },
    ui_element_get_align_self(uiElementId: number) {
      const uiElement = getScriptResource(wasmCtx, RemoteUIElement, uiElementId);

      if (!uiElement) {
        return -1;
      }

      return uiElement.alignSelf;
    },
    ui_element_set_align_self(uiElementId: number, alignSelf: number) {
      const uiElement = getScriptResource(wasmCtx, RemoteUIElement, uiElementId);

      if (!uiElement) {
        return -1;
      }

      if (FlexAlign[alignSelf] === undefined) {
        console.error(`WebSG: invalid flex alignment ${alignSelf}`);
        return -1;
      }

      uiElement.alignSelf = alignSelf;

      return 0;
    },
    ui_element_get_flex_direction(uiElementId: number) {
      const uiElement = getScriptResource(wasmCtx, RemoteUIElement, uiElementId);

      if (!uiElement) {
        return -1;
      }

      return uiElement.flexDirection;
    },
    ui_element_set_flex_direction(uiElementId: number, flexDirection: number) {
      const uiElement = getScriptResource(wasmCtx, RemoteUIElement, uiElementId);

      if (!uiElement) {
        return -1;
      }

      if (FlexDirection[flexDirection] === undefined) {
        console.error(`WebSG: invalid flex direction ${flexDirection}`);
        return -1;
      }

      uiElement.flexDirection = flexDirection;

      return 0;
    },
    ui_element_get_flex_wrap(uiElementId: number) {
      const uiElement = getScriptResource(wasmCtx, RemoteUIElement, uiElementId);

      if (!uiElement) {
        return -1;
      }

      return uiElement.flexWrap;
    },
    ui_element_set_flex_wrap(uiElementId: number, flexWrap: number) {
      const uiElement = getScriptResource(wasmCtx, RemoteUIElement, uiElementId);

      if (!uiElement) {
        return -1;
      }

      if (FlexWrap[flexWrap] === undefined) {
        console.error(`WebSG: invalid flex direction ${flexWrap}`);
        return -1;
      }

      uiElement.flexWrap = flexWrap;

      return 0;
    },
    ui_element_get_flex_basis(uiElementId: number) {
      const uiElement = getScriptResource(wasmCtx, RemoteUIElement, uiElementId);

      if (!uiElement) {
        return -1;
      }

      return uiElement.flexBasis;
    },
    ui_element_set_flex_basis(uiElementId: number, flexBasis: number) {
      const uiElement = getScriptResource(wasmCtx, RemoteUIElement, uiElementId);

      if (!uiElement) {
        return -1;
      }

      uiElement.flexBasis = flexBasis;

      return 0;
    },
    ui_element_get_flex_grow(uiElementId: number) {
      const uiElement = getScriptResource(wasmCtx, RemoteUIElement, uiElementId);

      if (!uiElement) {
        return -1;
      }

      return uiElement.flexGrow;
    },
    ui_element_set_flex_grow(uiElementId: number, flexGrow: number) {
      const uiElement = getScriptResource(wasmCtx, RemoteUIElement, uiElementId);

      if (!uiElement) {
        return -1;
      }

      uiElement.flexGrow = flexGrow;

      return 0;
    },
    ui_element_get_flex_shrink(uiElementId: number) {
      const uiElement = getScriptResource(wasmCtx, RemoteUIElement, uiElementId);

      if (!uiElement) {
        return -1;
      }

      return uiElement.flexShrink;
    },
    ui_element_set_flex_shrink(uiElementId: number, flexShrink: number) {
      const uiElement = getScriptResource(wasmCtx, RemoteUIElement, uiElementId);

      if (!uiElement) {
        return -1;
      }

      uiElement.flexShrink = flexShrink;

      return 0;
    },
    ui_element_get_justify_content(uiElementId: number) {
      const uiElement = getScriptResource(wasmCtx, RemoteUIElement, uiElementId);

      if (!uiElement) {
        return -1;
      }

      return uiElement.justifyContent;
    },
    ui_element_set_justify_content(uiElementId: number, justifyContent: number) {
      const uiElement = getScriptResource(wasmCtx, RemoteUIElement, uiElementId);

      if (!uiElement) {
        return -1;
      }

      if (FlexJustify[justifyContent] === undefined) {
        console.error(`WebSG: invalid flex direction ${justifyContent}`);
        return -1;
      }

      uiElement.justifyContent = justifyContent;

      return 0;
    },
    ui_element_get_width(uiElementId: number) {
      const uiElement = getScriptResource(wasmCtx, RemoteUIElement, uiElementId);

      if (!uiElement) {
        return -1;
      }

      return uiElement.width;
    },
    ui_element_set_width(uiElementId: number, width: number) {
      const uiElement = getScriptResource(wasmCtx, RemoteUIElement, uiElementId);

      if (!uiElement) {
        return -1;
      }

      uiElement.width = width;

      return 0;
    },
    ui_element_get_height(uiElementId: number) {
      const uiElement = getScriptResource(wasmCtx, RemoteUIElement, uiElementId);

      if (!uiElement) {
        return -1;
      }

      return uiElement.height;
    },
    ui_element_set_height(uiElementId: number, height: number) {
      const uiElement = getScriptResource(wasmCtx, RemoteUIElement, uiElementId);

      if (!uiElement) {
        return -1;
      }

      uiElement.height = height;

      return 0;
    },
    ui_element_get_min_width(uiElementId: number) {
      const uiElement = getScriptResource(wasmCtx, RemoteUIElement, uiElementId);

      if (!uiElement) {
        return -1;
      }

      return uiElement.minWidth;
    },
    ui_element_set_min_width(uiElementId: number, minWidth: number) {
      const uiElement = getScriptResource(wasmCtx, RemoteUIElement, uiElementId);

      if (!uiElement) {
        return -1;
      }

      uiElement.minWidth = minWidth;

      return 0;
    },
    ui_element_get_min_height(uiElementId: number) {
      const uiElement = getScriptResource(wasmCtx, RemoteUIElement, uiElementId);

      if (!uiElement) {
        return -1;
      }

      return uiElement.minHeight;
    },
    ui_element_set_min_height(uiElementId: number, minHeight: number) {
      const uiElement = getScriptResource(wasmCtx, RemoteUIElement, uiElementId);

      if (!uiElement) {
        return -1;
      }

      uiElement.minHeight = minHeight;

      return 0;
    },
    ui_element_get_max_width(uiElementId: number) {
      const uiElement = getScriptResource(wasmCtx, RemoteUIElement, uiElementId);

      if (!uiElement) {
        return -1;
      }

      return uiElement.maxWidth;
    },
    ui_element_set_max_width(uiElementId: number, maxWidth: number) {
      const uiElement = getScriptResource(wasmCtx, RemoteUIElement, uiElementId);

      if (!uiElement) {
        return -1;
      }

      uiElement.maxWidth = maxWidth;

      return 0;
    },
    ui_element_get_max_height(uiElementId: number) {
      const uiElement = getScriptResource(wasmCtx, RemoteUIElement, uiElementId);

      if (!uiElement) {
        return -1;
      }

      return uiElement.maxHeight;
    },
    ui_element_set_max_height(uiElementId: number, maxHeight: number) {
      const uiElement = getScriptResource(wasmCtx, RemoteUIElement, uiElementId);

      if (!uiElement) {
        return -1;
      }

      uiElement.maxHeight = maxHeight;

      return 0;
    },
    ui_element_get_background_color(uiElementId: number, colorPtr: number) {
      const uiElement = getScriptResource(wasmCtx, RemoteUIElement, uiElementId);

      if (!uiElement) {
        return -1;
      }

      writeFloat32Array(wasmCtx, colorPtr, uiElement.backgroundColor);

      return 0;
    },
    ui_element_set_background_color(uiElementId: number, colorPtr: number) {
      const uiElement = getScriptResource(wasmCtx, RemoteUIElement, uiElementId);

      if (!uiElement) {
        return -1;
      }

      readFloat32ArrayInto(wasmCtx, colorPtr, uiElement.backgroundColor);

      return 0;
    },
    ui_element_get_background_color_element(uiElementId: number, index: number) {
      const uiElement = getScriptResource(wasmCtx, RemoteUIElement, uiElementId);

      if (!uiElement) {
        return -1;
      }

      return uiElement.backgroundColor[index];
    },
    ui_element_set_background_color_element(uiElementId: number, index: number, value: number) {
      const uiElement = getScriptResource(wasmCtx, RemoteUIElement, uiElementId);

      if (!uiElement) {
        return -1;
      }

      uiElement.backgroundColor[index] = value;

      return 0;
    },
    ui_element_get_border_color(lightId: number, colorPtr: number) {
      const uiElement = getScriptResource(wasmCtx, RemoteUIElement, lightId);

      if (!uiElement) {
        return -1;
      }

      writeFloat32Array(wasmCtx, colorPtr, uiElement.borderColor);

      return 0;
    },
    ui_element_set_border_color(uiElementId: number, colorPtr: number) {
      const uiElement = getScriptResource(wasmCtx, RemoteUIElement, uiElementId);

      if (!uiElement) {
        return -1;
      }

      readFloat32ArrayInto(wasmCtx, colorPtr, uiElement.borderColor);

      return 0;
    },
    ui_element_get_border_color_element(uiElementId: number, index: number) {
      const uiElement = getScriptResource(wasmCtx, RemoteUIElement, uiElementId);

      if (!uiElement) {
        return -1;
      }

      return uiElement.borderColor[index];
    },
    ui_element_set_border_color_element(uiElementId: number, index: number, value: number) {
      const uiElement = getScriptResource(wasmCtx, RemoteUIElement, uiElementId);

      if (!uiElement) {
        return -1;
      }

      uiElement.borderColor[index] = value;

      return 0;
    },
    ui_element_get_padding(lightId: number, paddingPtr: number) {
      const uiElement = getScriptResource(wasmCtx, RemoteUIElement, lightId);

      if (!uiElement) {
        return -1;
      }

      writeFloat32Array(wasmCtx, paddingPtr, uiElement.padding);

      return 0;
    },
    ui_element_set_padding(uiElementId: number, paddingPtr: number) {
      const uiElement = getScriptResource(wasmCtx, RemoteUIElement, uiElementId);

      if (!uiElement) {
        return -1;
      }

      readFloat32ArrayInto(wasmCtx, paddingPtr, uiElement.padding);

      return 0;
    },
    ui_element_get_padding_element(uiElementId: number, index: number) {
      const uiElement = getScriptResource(wasmCtx, RemoteUIElement, uiElementId);

      if (!uiElement) {
        return -1;
      }

      return uiElement.padding[index];
    },
    ui_element_set_padding_element(uiElementId: number, index: number, value: number) {
      const uiElement = getScriptResource(wasmCtx, RemoteUIElement, uiElementId);

      if (!uiElement) {
        return -1;
      }

      uiElement.padding[index] = value;

      return 0;
    },
    ui_element_get_margin(lightId: number, marginPtr: number) {
      const uiElement = getScriptResource(wasmCtx, RemoteUIElement, lightId);

      if (!uiElement) {
        return -1;
      }

      writeFloat32Array(wasmCtx, marginPtr, uiElement.margin);

      return 0;
    },
    ui_element_set_margin(uiElementId: number, marginPtr: number) {
      const uiElement = getScriptResource(wasmCtx, RemoteUIElement, uiElementId);

      if (!uiElement) {
        return -1;
      }

      readFloat32ArrayInto(wasmCtx, marginPtr, uiElement.margin);

      return 0;
    },
    ui_element_get_margin_element(uiElementId: number, index: number) {
      const uiElement = getScriptResource(wasmCtx, RemoteUIElement, uiElementId);

      if (!uiElement) {
        return -1;
      }

      return uiElement.margin[index];
    },
    ui_element_set_margin_element(uiElementId: number, index: number, value: number) {
      const uiElement = getScriptResource(wasmCtx, RemoteUIElement, uiElementId);

      if (!uiElement) {
        return -1;
      }

      uiElement.margin[index] = value;

      return 0;
    },
    ui_element_get_border_width(lightId: number, borderWidth: number) {
      const uiElement = getScriptResource(wasmCtx, RemoteUIElement, lightId);

      if (!uiElement) {
        return -1;
      }

      writeFloat32Array(wasmCtx, borderWidth, uiElement.borderWidth);

      return 0;
    },
    ui_element_set_border_width(uiElementId: number, borderWidth: number) {
      const uiElement = getScriptResource(wasmCtx, RemoteUIElement, uiElementId);

      if (!uiElement) {
        return -1;
      }

      readFloat32ArrayInto(wasmCtx, borderWidth, uiElement.borderWidth);

      return 0;
    },
    ui_element_get_border_width_element(uiElementId: number, index: number) {
      const uiElement = getScriptResource(wasmCtx, RemoteUIElement, uiElementId);

      if (!uiElement) {
        return -1;
      }

      return uiElement.borderWidth[index];
    },
    ui_element_set_border_width_element(uiElementId: number, index: number, value: number) {
      const uiElement = getScriptResource(wasmCtx, RemoteUIElement, uiElementId);

      if (!uiElement) {
        return -1;
      }

      uiElement.borderWidth[index] = value;

      return 0;
    },
    ui_element_get_border_radius(lightId: number, borderRadius: number) {
      const uiElement = getScriptResource(wasmCtx, RemoteUIElement, lightId);

      if (!uiElement) {
        return -1;
      }

      writeFloat32Array(wasmCtx, borderRadius, uiElement.borderRadius);

      return 0;
    },
    ui_element_set_border_radius(uiElementId: number, borderRadius: number) {
      const uiElement = getScriptResource(wasmCtx, RemoteUIElement, uiElementId);

      if (!uiElement) {
        return -1;
      }

      readFloat32ArrayInto(wasmCtx, borderRadius, uiElement.borderRadius);

      return 0;
    },
    ui_element_get_border_radius_element(uiElementId: number, index: number) {
      const uiElement = getScriptResource(wasmCtx, RemoteUIElement, uiElementId);

      if (!uiElement) {
        return -1;
      }

      return uiElement.borderRadius[index];
    },
    ui_element_set_border_radius_element(uiElementId: number, index: number, value: number) {
      const uiElement = getScriptResource(wasmCtx, RemoteUIElement, uiElementId);

      if (!uiElement) {
        return -1;
      }

      uiElement.borderRadius[index] = value;

      return 0;
    },
    ui_element_get_element_type(uiElementId: number) {
      const uiElement = getScriptResource(wasmCtx, RemoteUIElement, uiElementId);

      if (!uiElement) {
        return -1;
      }

      return uiElement.type;
    },
    ui_element_add_child(uiElementId: number, childId: number) {
      const flex = getScriptResource(wasmCtx, RemoteUIElement, uiElementId);

      if (!flex) {
        return -1;
      }

      const child = getScriptResource(wasmCtx, RemoteUIElement, childId);

      if (!child) {
        return -1;
      }

      addUIElementChild(flex, child);

      return 0;
    },
    ui_element_remove_child(uiElementId: number, childId: number) {
      const uiElement = getScriptResource(wasmCtx, RemoteUIElement, uiElementId);

      if (!uiElement) {
        return -1;
      }

      const child = getScriptResource(wasmCtx, RemoteUIElement, childId);

      if (!child) {
        return -1;
      }

      removeUIElementChild(uiElement, child);

      return 0;
    },
    ui_element_get_child_count(uiElementId: number) {
      const uiElement = getScriptResource(wasmCtx, RemoteUIElement, uiElementId);

      if (!uiElement) {
        return -1;
      }

      return getScriptUIElementChildCount(wasmCtx, uiElement);
    },
    ui_element_get_children(uiElementId: number, childArrPtr: number, maxCount: number) {
      const uiElement = getScriptResource(wasmCtx, RemoteUIElement, uiElementId);

      if (!uiElement) {
        return -1;
      }

      return getScriptUIElementChildren(wasmCtx, uiElement, childArrPtr, maxCount);
    },
    ui_element_get_child(uiElementId: number, index: number) {
      const uiElement = getScriptResource(wasmCtx, RemoteUIElement, uiElementId);

      if (!uiElement) {
        return 0; // This function returns a u32 so errors returned as 0 / null eid
      }

      return scriptGetUIElementChildAt(wasmCtx, uiElement, index);
    },
    ui_element_get_parent(uiElementId: number) {
      const uiElement = getScriptResource(wasmCtx, RemoteUIElement, uiElementId);

      if (!uiElement) {
        return 0; // This function returns a u32 so errors returned as 0 / null eid
      }

      const parent = uiElement.parent;

      if (!parent) {
        return 0;
      }

      if (!wasmCtx.resourceManager.resourceIds.has(parent.eid)) {
        return 0;
      }

      return parent.eid;
    },

    // UI Button
    ui_button_get_label_length(uiElementId: number) {
      const el = getScriptResource(wasmCtx, RemoteUIElement, uiElementId);

      if (!el) {
        return -1;
      }

      if (!el.button) {
        return -1;
      }

      return el.button.label.length;
    },
    ui_button_get_label(uiElementId: number, labelPtr: number, length: number) {
      const el = getScriptResource(wasmCtx, RemoteUIElement, uiElementId);

      if (!el) {
        return -1;
      }

      if (!el.button) {
        return -1;
      }

      writeString(wasmCtx, labelPtr, el.button.label, length);

      return 0;
    },
    ui_button_set_label(uiElementId: number, labelPtr: number, length: number) {
      const el = getScriptResource(wasmCtx, RemoteUIElement, uiElementId);

      if (!el) {
        return -1;
      }

      if (!el.button) {
        return -1;
      }

      el.button.label = readString(wasmCtx, labelPtr, length);

      return 0;
    },
    ui_button_get_pressed(uiElementId: number) {
      const el = getScriptResource(wasmCtx, RemoteUIElement, uiElementId);

      if (!el) {
        return -1;
      }

      if (!el.button) {
        return -1;
      }

      const interactable = el.button.interactable;

      if (!interactable) {
        return -1;
      }

      return interactable.pressed ? 1 : 0;
    },
    ui_button_get_held(uiElementId: number) {
      const el = getScriptResource(wasmCtx, RemoteUIElement, uiElementId);

      if (!el) {
        return -1;
      }

      if (!el.button) {
        return -1;
      }

      const interactable = el.button.interactable;

      if (!interactable) {
        return -1;
      }

      return interactable.held ? 1 : 0;
    },
    ui_button_get_released(uiElementId: number) {
      const el = getScriptResource(wasmCtx, RemoteUIElement, uiElementId);

      if (!el) {
        return -1;
      }

      if (!el.button) {
        return -1;
      }

      const interactable = el.button.interactable;

      if (!interactable) {
        return -1;
      }

      return interactable.released ? 1 : 0;
    },

    // UI Text

    ui_text_get_value_length(uiElementId: number) {
      const el = getScriptResource(wasmCtx, RemoteUIElement, uiElementId);

      if (!el) {
        return -1;
      }

      if (!el.text) {
        return -1;
      }

      return el.text.value.length;
    },
    ui_text_get_value(uiElementId: number, valuePtr: number, length: number) {
      const el = getScriptResource(wasmCtx, RemoteUIElement, uiElementId);

      if (!el) {
        return -1;
      }

      if (!el.text) {
        return -1;
      }

      writeString(wasmCtx, valuePtr, el.text.value, length);

      return 0;
    },
    ui_text_set_value(uiElementId: number, valuePtr: number, length: number) {
      const el = getScriptResource(wasmCtx, RemoteUIElement, uiElementId);

      if (!el) {
        console.error(`WebSG ui_text_set_value: ui element not found ${uiElementId}`);
        return -1;
      }

      if (!el.text) {
        console.error(`WebSG ui_text_set_value: ui element is not a text element ${uiElementId}`);
        return -1;
      }

      el.text.value = readString(wasmCtx, valuePtr, length);

      return 0;
    },
    ui_text_get_font_family_length(uiElementId: number) {
      const el = getScriptResource(wasmCtx, RemoteUIElement, uiElementId);

      if (!el) {
        return -1;
      }

      if (!el.text) {
        return -1;
      }

      return el.text.fontFamily.length;
    },
    ui_text_get_font_family(uiElementId: number, fontFamilyPtr: number, length: number) {
      const el = getScriptResource(wasmCtx, RemoteUIElement, uiElementId);

      if (!el) {
        return -1;
      }

      if (!el.text) {
        return -1;
      }

      writeString(wasmCtx, fontFamilyPtr, el.text.fontFamily, length);

      return 0;
    },
    ui_text_set_font_family(uiElementId: number, fontFamilyPtr: number, length: number) {
      const el = getScriptResource(wasmCtx, RemoteUIElement, uiElementId);

      if (!el) {
        return -1;
      }

      if (!el.text) {
        return -1;
      }

      const fontFamily = readString(wasmCtx, fontFamilyPtr, length);

      if (!fontFamily) {
        return -1;
      }

      el.text.fontFamily = fontFamily;

      return 0;
    },
    ui_text_get_font_style_length(uiElementId: number) {
      const el = getScriptResource(wasmCtx, RemoteUIElement, uiElementId);

      if (!el) {
        return -1;
      }

      if (!el.text) {
        return -1;
      }

      return el.text.fontStyle.length;
    },
    ui_text_get_font_style(uiElementId: number, fontStylePtr: number, length: number) {
      const el = getScriptResource(wasmCtx, RemoteUIElement, uiElementId);

      if (!el) {
        return -1;
      }

      if (!el.text) {
        return -1;
      }

      writeString(wasmCtx, fontStylePtr, el.text.fontStyle, length);

      return 0;
    },
    ui_text_set_font_style(uiElementId: number, fontStylePtr: number, length: number) {
      const el = getScriptResource(wasmCtx, RemoteUIElement, uiElementId);

      if (!el) {
        return -1;
      }

      if (!el.text) {
        return -1;
      }

      const fontStyle = readString(wasmCtx, fontStylePtr, length);

      if (!fontStyle) {
        return -1;
      }

      el.text.fontStyle = fontStyle;

      return 0;
    },
    ui_text_get_font_weight_length(uiElementId: number) {
      const el = getScriptResource(wasmCtx, RemoteUIElement, uiElementId);

      if (!el) {
        return -1;
      }

      if (!el.text) {
        return -1;
      }

      return el.text.fontWeight.length;
    },
    ui_text_get_font_weight(uiElementId: number, fontWeightPtr: number, length: number) {
      const el = getScriptResource(wasmCtx, RemoteUIElement, uiElementId);

      if (!el) {
        return -1;
      }

      if (!el.text) {
        return -1;
      }

      writeString(wasmCtx, fontWeightPtr, el.text.fontWeight, length);

      return 0;
    },
    ui_text_set_font_weight(uiElementId: number, fontWeightPtr: number, length: number) {
      const el = getScriptResource(wasmCtx, RemoteUIElement, uiElementId);

      if (!el) {
        return -1;
      }

      if (!el.text) {
        return -1;
      }

      const fontWeight = readString(wasmCtx, fontWeightPtr, length);

      if (!fontWeight) {
        return -1;
      }

      el.text.fontWeight = fontWeight;

      return 0;
    },
    ui_text_get_font_size(uiElementId: number) {
      const el = getScriptResource(wasmCtx, RemoteUIElement, uiElementId);

      if (!el) {
        return -1;
      }

      if (!el.text) {
        return -1;
      }

      return el.text.fontSize;
    },
    ui_text_set_font_size(uiElementId: number, fontSize: number) {
      const el = getScriptResource(wasmCtx, RemoteUIElement, uiElementId);

      if (!el) {
        return -1;
      }

      if (!el.text) {
        return -1;
      }

      el.text.fontSize = fontSize;

      return 0;
    },
    ui_text_get_color(uiElementId: number, colorPtr: number) {
      const el = getScriptResource(wasmCtx, RemoteUIElement, uiElementId);

      if (!el) {
        return -1;
      }

      if (!el.text) {
        return -1;
      }

      writeFloat32Array(wasmCtx, colorPtr, el.text.color);

      return 0;
    },
    ui_text_set_color(uiElementId: number, colorPtr: number) {
      const el = getScriptResource(wasmCtx, RemoteUIElement, uiElementId);

      if (!el) {
        return -1;
      }

      if (!el.text) {
        return -1;
      }

      readFloat32ArrayInto(wasmCtx, colorPtr, el.text.color);

      return 0;
    },
    ui_text_get_color_element(uiElementId: number, index: number) {
      const uiElement = getScriptResource(wasmCtx, RemoteUIElement, uiElementId);

      if (!uiElement) {
        return -1;
      }

      if (!uiElement.text) {
        return -1;
      }

      return uiElement.text.color[index];
    },
    ui_text_set_color_element(uiElementId: number, index: number, value: number) {
      const uiElement = getScriptResource(wasmCtx, RemoteUIElement, uiElementId);

      if (!uiElement) {
        return -1;
      }

      if (!uiElement.text) {
        return -1;
      }

      uiElement.text.color[index] = value;

      return 0;
    },
    get_primary_input_source_origin_element(index: number) {
      const node = getPrimaryInputSourceNode(ctx);
      mat4.getTranslation(tempVec3, node.worldMatrix);
      return tempVec3[index] || 0;
    },
    get_primary_input_source_direction_element(index: number) {
      const node = getPrimaryInputSourceNode(ctx);
      getRotationNoAlloc(tempQuat, node.worldMatrix);
      vec3.set(tempVec3, 0, 0, -1);
      vec3.transformQuat(tempVec3, tempVec3, tempQuat);
      return tempVec3[index] || 0;
    },
  };

  const disposeWebSGWASMModule = () => {
    for (const query of wasmCtx.resourceManager.registeredQueries.values()) {
      removeQuery(ctx.world, query);
    }

    disposeCollisionHandler();
  };

  return [websgWASMModule, disposeWebSGWASMModule] as const;
}
