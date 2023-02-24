import { GameState } from "../GameTypes";
import { IRemoteResourceClass, RemoteResourceConstructor } from "../resource/RemoteResourceClass";
import { getRemoteResources } from "../resource/resource.game";
import {
  readFloat32ArrayInto,
  readSharedArrayBuffer,
  readString,
  readUint8Array,
  WASMModuleContext,
  writeFloat32Array,
} from "./WASMModuleContext";
import {
  RemoteAccessor,
  RemoteBuffer,
  RemoteBufferView,
  RemoteInteractable,
  RemoteLight,
  RemoteMaterial,
  RemoteMesh,
  RemoteMeshPrimitive,
  RemoteNode,
  RemoteScene,
  RemoteTexture,
} from "../resource/RemoteResources";
import { addChild, removeChild } from "../component/transform";
import {
  AccessorComponentType,
  AccessorType,
  InteractableType,
  LightType,
  MaterialType,
  MeshPrimitiveAttributeIndex,
  MeshPrimitiveMode,
  ResourceType,
} from "../resource/schema";
import { moveCursorView, readUint32, writeUint32 } from "../allocator/CursorView";
import { AccessorComponentTypeToTypedArray, AccessorTypeToElementSize } from "../accessor/accessor.common";

function getScriptResource<T extends RemoteResourceConstructor>(
  wasmCtx: WASMModuleContext,
  resourceConstructor: T,
  resourceId: number
): InstanceType<T> | undefined {
  const { resourceIds, resourceMap } = wasmCtx.resourceManager;
  const { name, resourceType } = resourceConstructor.resourceDef;

  if (!resourceIds.has(resourceId)) {
    console.error(`WebSG: missing or unpermitted use of ${name}: ${resourceId}`);
    return undefined;
  }

  const resource = resourceMap.get(resourceId) as InstanceType<T> | undefined;

  if (!resource) {
    console.error(`WebSG: missing ${name}: ${resourceId}`);
    return undefined;
  }

  if (resource.resourceType !== resourceType) {
    console.error(`WebSG: id does not point to a ${name}: ${resourceId}`);
    return undefined;
  }

  return resource;
}

function getScriptResourceByName<T extends RemoteResourceConstructor>(
  ctx: GameState,
  wasmCtx: WASMModuleContext,
  resourceConstructor: T,
  name: string
): InstanceType<T> | undefined {
  const resources = getRemoteResources(ctx, resourceConstructor as IRemoteResourceClass<T["resourceDef"]>);

  const resourceIds = wasmCtx.resourceManager.resourceIds;

  for (let i = 0; i < resources.length; i++) {
    const resource = resources[i];

    if (resource.name === name && resourceIds.has(resource.eid)) {
      return resource as InstanceType<T>;
    }
  }

  return undefined;
}

function getScriptResourceByNamePtr<T extends RemoteResourceConstructor>(
  ctx: GameState,
  wasmCtx: WASMModuleContext,
  resourceConstructor: T,
  namePtr: number,
  byteLength: number
): InstanceType<T> | undefined {
  const name = readString(wasmCtx, namePtr, byteLength);
  return getScriptResourceByName(ctx, wasmCtx, resourceConstructor, name);
}

function getScriptResourceRef<T extends RemoteResourceConstructor>(
  wasmCtx: WASMModuleContext,
  resourceConstructor: T,
  refResource: InstanceType<T> | undefined
): number {
  if (!refResource) {
    return 0;
  }

  const resourceId = refResource.eid;

  if (!wasmCtx.resourceManager.resourceIds.has(resourceId)) {
    console.error(`WebSG: missing or unpermitted use of ${resourceConstructor.name}: ${resourceId}`);
    return 0;
  }

  return resourceId;
}

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

interface MeshPrimitiveProps {
  attributes: { [key: number]: RemoteAccessor };
  indices?: RemoteAccessor;
  material?: RemoteMaterial;
  mode: MeshPrimitiveMode;
}

// TODO: ResourceManager should have a resourceMap that corresponds to just its owned resources
// TODO: ResourceManager should have a resourceByType that corresponds to just its owned resources
// TODO: Force disposal of all entities belonging to the wasmCtx when environment unloads
// TODO: When do we update local / world matrices?
// TODO: the mesh.primitives array is allocated whenever we request it but it's now immutable

export function createWebSGModule(ctx: GameState, wasmCtx: WASMModuleContext) {
  return {
    get_environment_scene() {
      return ctx.worldResource.environment?.publicScene.eid || 0;
    },
    set_environment_scene(sceneId: number) {
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
    create_scene() {
      try {
        return new RemoteScene(wasmCtx.resourceManager).eid;
      } catch (error) {
        console.error("WebSG: Error creating scene:", error);
        return 0;
      }
    },
    scene_find_by_name(namePtr: number, byteLength: number) {
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
    create_node() {
      try {
        return new RemoteNode(wasmCtx.resourceManager).eid;
      } catch (error) {
        console.error("WebSG: Error creating node:", error);
        return 0;
      }
    },
    node_find_by_name(namePtr: number, byteLength: number) {
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
    node_get_position(nodeId: number, positionPtr: number) {
      const node = getScriptResource(wasmCtx, RemoteNode, nodeId);

      if (!node) {
        return -1;
      }

      writeFloat32Array(wasmCtx, positionPtr, node.position);

      return 0;
    },
    node_set_position(nodeId: number, positionPtr: number) {
      const node = getScriptResource(wasmCtx, RemoteNode, nodeId);

      if (!node) {
        return -1;
      }

      readFloat32ArrayInto(wasmCtx, positionPtr, node.position);

      return 0;
    },
    node_get_quaternion(nodeId: number, quaternionPtr: number) {
      const node = getScriptResource(wasmCtx, RemoteNode, nodeId);

      if (!node) {
        return -1;
      }

      writeFloat32Array(wasmCtx, quaternionPtr, node.quaternion);

      return 0;
    },
    node_set_quaternion(nodeId: number, quaternionPtr: number) {
      const node = getScriptResource(wasmCtx, RemoteNode, nodeId);

      if (!node) {
        return -1;
      }

      readFloat32ArrayInto(wasmCtx, quaternionPtr, node.quaternion);

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
    node_get_local_matrix(nodeId: number, localMatrixPtr: number) {
      const node = getScriptResource(wasmCtx, RemoteNode, nodeId);

      if (!node) {
        return -1;
      }

      writeFloat32Array(wasmCtx, localMatrixPtr, node.localMatrix);

      return 0;
    },
    node_set_local_matrix(nodeId: number, localMatrixPtr: number) {
      const node = getScriptResource(wasmCtx, RemoteNode, nodeId);

      if (!node) {
        return -1;
      }

      readFloat32ArrayInto(wasmCtx, localMatrixPtr, node.localMatrix);

      return 0;
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
    create_mesh(primitivesPtr: number, primitiveCount: number) {
      try {
        const primitiveProps: MeshPrimitiveProps[] = [];
        const MESH_PRIMITIVE_PROPS_BYTE_LENGTH = 20;

        for (let primitiveIndex = 0; primitiveIndex < primitiveCount; primitiveIndex++) {
          moveCursorView(wasmCtx.cursorView, primitivesPtr + primitiveIndex * MESH_PRIMITIVE_PROPS_BYTE_LENGTH);

          const mode = readUint32(wasmCtx.cursorView);

          if (MeshPrimitiveMode[mode] === undefined) {
            console.error(`WebSG: invalid mesh primitive mode: ${mode}`);
            return -1;
          }

          const indicesAccessorId = readUint32(wasmCtx.cursorView);

          let indices: RemoteAccessor | undefined;

          if (indicesAccessorId) {
            indices = getScriptResource(wasmCtx, RemoteAccessor, indicesAccessorId);

            if (!indices) {
              return -1;
            }
          }

          const materialId = readUint32(wasmCtx.cursorView);

          let material: RemoteMaterial | undefined;

          if (materialId) {
            material = getScriptResource(wasmCtx, RemoteMaterial, materialId);

            if (!material) {
              return -1;
            }
          }

          const attributeCount = readUint32(wasmCtx.cursorView);
          const attributesPtr = readUint32(wasmCtx.cursorView);
          const MESH_PRIMITIVE_ATTRIBUTE_BYTE_LENGTH = 8;

          const attributes: { [key: number]: RemoteAccessor } = {};

          for (let attributeIndex = 0; attributeIndex < attributeCount; attributeIndex++) {
            moveCursorView(wasmCtx.cursorView, attributesPtr + attributeIndex * MESH_PRIMITIVE_ATTRIBUTE_BYTE_LENGTH);
            const attributeKey = readUint32(wasmCtx.cursorView);

            if (MeshPrimitiveAttributeIndex[attributeKey] === undefined) {
              console.error(`WebSG: invalid mesh primitive key: ${attributeKey}`);
              return -1;
            }

            const attributeAccessorId = readUint32(wasmCtx.cursorView);

            const accessor = getScriptResource(wasmCtx, RemoteAccessor, attributeAccessorId);

            if (accessor === undefined) {
              return -1;
            }

            attributes[attributeKey] = accessor;
          }

          primitiveProps.push({
            mode,
            indices,
            material,
            attributes,
          });
        }

        const primitives: RemoteMeshPrimitive[] = [];

        // Create all the resources after parsing props to try to avoid leaking resources on error.

        for (let i = 0; i < primitiveProps.length; i++) {
          const props = primitiveProps[i];
          primitives.push(new RemoteMeshPrimitive(wasmCtx.resourceManager, props));
        }

        const mesh = new RemoteMesh(wasmCtx.resourceManager, { primitives });

        return mesh.eid;
      } catch (error) {
        console.error(`WebSG: error creating mesh:`, error);
        return 0;
      }
    },
    mesh_find_by_name(namePtr: number, byteLength: number) {
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
    create_accessor_from(dataPtr: number, byteLength: number, propsPtr: number) {
      try {
        const data = readSharedArrayBuffer(wasmCtx, dataPtr, byteLength);
        moveCursorView(wasmCtx.cursorView, propsPtr);
        const type = readUint32(wasmCtx.cursorView);

        if (AccessorType[type] === undefined) {
          console.error(`WebSG: invalid accessor type: ${type}`);
          return 0;
        }

        const componentType = readUint32(wasmCtx.cursorView);

        if (AccessorComponentType[componentType] === undefined) {
          console.error(`WebSG: invalid accessor component type: ${componentType}`);
          return 0;
        }

        const count = readUint32(wasmCtx.cursorView);
        const normalized = !!readUint32(wasmCtx.cursorView);
        const dynamic = !!readUint32(wasmCtx.cursorView);
        // TODO: read min/max props

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
    accessor_find_by_name(namePtr: number, byteLength: number) {
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
    create_material(type: number) {
      if (MaterialType[type] === undefined) {
        console.error("WebSG: Invalid material type.");
        return -1;
      }

      const material = new RemoteMaterial(wasmCtx.resourceManager, { type });

      return material.eid;
    },
    material_find_by_name(namePtr: number, byteLength: number) {
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
    create_light(type: number) {
      if (LightType[type] === undefined) {
        console.error("WebSG: Invalid light type.");
        return -1;
      }

      const light = new RemoteLight(wasmCtx.resourceManager, { type });

      return light.eid;
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
    add_interactable(nodeId: number, type: number) {
      const node = getScriptResource(wasmCtx, RemoteNode, nodeId);

      if (!node) {
        return -1;
      }

      if (node.interactable) {
        console.error("WebSG: node is already interactable.");
        return -1;
      }

      if (type !== InteractableType.Interactable) {
        console.error("WebSG: Invalid interactable type.");
        return -1;
      }

      node.interactable = new RemoteInteractable(wasmCtx.resourceManager, { type });

      return 0;
    },
    remove_interactable(nodeId: number) {
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
    has_interactable(nodeId: number) {
      const node = getScriptResource(wasmCtx, RemoteNode, nodeId);
      return node?.interactable ? 1 : 0;
    },
    get_interactable(nodeId: number, interactablePtr: number) {
      const node = getScriptResource(wasmCtx, RemoteNode, nodeId);

      if (!node) {
        return -1;
      }

      const interactable = node.interactable;

      if (!interactable) {
        return -1;
      }

      moveCursorView(wasmCtx.cursorView, interactablePtr);
      writeUint32(wasmCtx.cursorView, interactable.type); // Note we might be exposing other interactable types here
      writeUint32(wasmCtx.cursorView, interactable.pressed ? 1 : 0);
      writeUint32(wasmCtx.cursorView, interactable.held ? 1 : 0);
      writeUint32(wasmCtx.cursorView, interactable.released ? 1 : 0);

      return 0;
    },
    get_interactable_pressed(nodeId: number, interactablePtr: number) {
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
    get_interactable_held(nodeId: number, interactablePtr: number) {
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
    get_interactable_released(nodeId: number, interactablePtr: number) {
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
  };
}
