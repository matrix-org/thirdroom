import RAPIER from "@dimforge/rapier3d-compat";
import { addEntity } from "bitecs";
import { vec2 } from "gl-matrix";
import { BufferGeometry, BoxGeometry, SphereGeometry } from "three";

import { addInteractableComponent } from "../../plugins/interaction/interaction.game";
import { createRemoteAccessor, RemoteAccessor } from "../accessor/accessor.game";
import {
  commitToObjectTripleBuffer,
  createObjectBufferView,
  createObjectTripleBuffer,
  ObjectBufferView,
} from "../allocator/ObjectBufferView";
import { addTransformComponent } from "../component/transform";
import { GameState } from "../GameTypes";
import { getModule, Thread } from "../module/module.common";
import { addRemoteNodeComponent, RemoteNode } from "../node/node.game";
import { dynamicObjectCollisionGroups } from "../physics/CollisionGroups";
import { PhysicsModule, addRigidBody } from "../physics/physics.game";
import { RendererModule } from "../renderer/renderer.game";
import { addResourceRef, createResource, disposeResource } from "../resource/resource.game";
import {
  AccessorComponentType,
  AccessorType,
  BufferResource,
  BufferViewResource,
  MaterialResource,
  MaterialType,
  MeshPrimitiveMode,
  RemoteMaterial,
  RemoteTexture,
  RemoteMesh as ScriptRemoteMesh,
  RemoteMeshPrimitive as ScriptRemoteMeshPrimitive,
  InteractableType,
} from "../resource/schema";
import {
  SharedMeshResource,
  MeshResourceType,
  MeshResourceProps,
  PrimitiveResourceProps,
  meshPrimitiveSchema,
  SharedMeshPrimitiveResource,
  MeshPrimitiveResourceType,
  MeshPrimitiveTripleBuffer,
  InstancedMeshResourceType,
  SharedInstancedMeshResource,
  MeshPrimitiveAttribute,
  SharedLightMapResource,
  LightMapResourceType,
  SharedSkinnedMeshResource,
  SkinnedMeshResourceType,
} from "./mesh.common";

export type MeshPrimitiveBufferView = ObjectBufferView<typeof meshPrimitiveSchema, ArrayBuffer>;

export interface RemoteMeshPrimitive {
  name: string;
  resourceId: number;
  meshPrimitiveBufferView: MeshPrimitiveBufferView;
  meshPrimitiveTripleBuffer: MeshPrimitiveTripleBuffer;
  attributes: { [key: string]: RemoteAccessor<any> };
  indices?: RemoteAccessor<any>;
  mode?: number;
  get material(): RemoteMaterial | undefined;
  set material(value: RemoteMaterial | undefined);
  get scriptMeshPrimitive(): ScriptRemoteMeshPrimitive | undefined;
  set scriptMeshPrimitive(scriptMeshPrimitive: ScriptRemoteMeshPrimitive | undefined);
}

export interface RemoteMesh {
  name: string;
  resourceId: number;
  primitives: RemoteMeshPrimitive[];
  get scriptMesh(): ScriptRemoteMesh | undefined;
  set scriptMesh(value: ScriptRemoteMesh | undefined);
}

export interface RemoteMeshProps {
  name?: string;
  primitives: MeshPrimitiveProps[];
  scriptMesh?: ScriptRemoteMesh;
}

export interface MeshPrimitiveProps {
  attributes: { [key: string]: RemoteAccessor<any> };
  indices?: RemoteAccessor<any>;
  material?: RemoteMaterial;
  mode?: number;
  scriptMeshPrimitive?: ScriptRemoteMeshPrimitive;
}

export interface RemoteInstancedMesh {
  name: string;
  resourceId: number;
  attributes: { [key: string]: RemoteAccessor<any> };
}

export interface RemoteInstancedMeshProps {
  name?: string;
  attributes: { [key: string]: RemoteAccessor<any> };
}

export interface RemoteSkinnedMesh {
  name: string;
  resourceId: number;
  joints: RemoteNode[];
  inverseBindMatrices?: RemoteAccessor<any>;
}

export interface RemoteSkinnedMeshProps {
  name?: string;
  joints: RemoteNode[];
  inverseBindMatrices?: RemoteAccessor<any>;
}

export interface RemoteLightMap {
  name: string;
  resourceId: number;
  texture: RemoteTexture;
}

export interface RemoteLightMapProps {
  name?: string;
  texture: RemoteTexture;
  offset?: vec2;
  scale?: vec2;
  intensity?: number;
}

const DEFAULT_MESH_NAME = "Mesh";
const DEFAULT_INSTANCED_MESH_NAME = "Instanced Mesh";
const DEFAULT_LIGHT_MAP_NAME = "Light Map";
const DEFAULT_SKINNED_MESH_NAME = "Skinned Mesh";

export function createRemoteMesh(ctx: GameState, props: RemoteMeshProps): RemoteMesh {
  const name = props.name || DEFAULT_MESH_NAME;

  const remoteMeshPrimitives = props.primitives.map((primitive, index) =>
    createRemoteMeshPrimitive(ctx, `${name}.primitive[${index}]`, primitive)
  );

  for (const primitive of remoteMeshPrimitives) {
    addResourceRef(ctx, primitive.resourceId);
  }

  const initialProps: MeshResourceProps = {
    primitives: remoteMeshPrimitives.map((primitive) => primitive.resourceId),
  };

  let _scriptMesh: ScriptRemoteMesh | undefined = props?.scriptMesh;

  if (_scriptMesh) {
    addResourceRef(ctx, _scriptMesh.resourceId);
  }

  const resourceId = createResource<SharedMeshResource>(
    ctx,
    Thread.Render,
    MeshResourceType,
    { initialProps },
    {
      name,
      dispose() {
        for (const primitive of remoteMeshPrimitives) {
          disposeResource(ctx, primitive.resourceId);
        }

        if (_scriptMesh) {
          disposeResource(ctx, _scriptMesh.resourceId);
        }
      },
    }
  );

  return {
    name,
    resourceId,
    primitives: remoteMeshPrimitives,
    get scriptMesh(): ScriptRemoteMesh | undefined {
      return _scriptMesh;
    },
    set scriptMesh(scriptMesh: ScriptRemoteMesh | undefined) {
      if (scriptMesh) {
        addResourceRef(ctx, scriptMesh.resourceId);
      }

      if (_scriptMesh) {
        disposeResource(ctx, _scriptMesh.resourceId);
      }

      _scriptMesh = scriptMesh;
    },
  };
}

function createRemoteMeshPrimitive(ctx: GameState, name: string, props: MeshPrimitiveProps): RemoteMeshPrimitive {
  const rendererModule = getModule(ctx, RendererModule);

  const meshPrimitiveBufferView = createObjectBufferView(meshPrimitiveSchema, ArrayBuffer);

  const initialProps: PrimitiveResourceProps = {
    attributes: Object.fromEntries(
      Object.entries(props.attributes).map(([name, accessor]: [string, RemoteAccessor<any>]) => [
        name,
        accessor.resourceId,
      ])
    ),
    indices: props.indices ? props.indices.resourceId : undefined,
    mode: props.mode === undefined ? MeshPrimitiveMode.TRIANGLES : props.mode,
  };

  meshPrimitiveBufferView.material[0] = props.material?.resourceId || 0;

  const meshPrimitiveTripleBuffer = createObjectTripleBuffer(meshPrimitiveSchema, ctx.gameToRenderTripleBufferFlags);

  if (props.indices) {
    addResourceRef(ctx, props.indices.resourceId);
  }

  for (const key in props.attributes) {
    addResourceRef(ctx, props.attributes[key].resourceId);
  }

  let _material: RemoteMaterial | undefined = props.material;

  if (_material) {
    addResourceRef(ctx, _material.resourceId);
  }

  let _scriptMeshPrimitive: ScriptRemoteMeshPrimitive | undefined = props?.scriptMeshPrimitive;

  if (_scriptMeshPrimitive) {
    addResourceRef(ctx, _scriptMeshPrimitive.resourceId);
  }

  const resourceId = createResource<SharedMeshPrimitiveResource>(
    ctx,
    Thread.Render,
    MeshPrimitiveResourceType,
    {
      initialProps,
      meshPrimitiveTripleBuffer,
    },
    {
      name,
      dispose() {
        if (props.indices) {
          disposeResource(ctx, props.indices.resourceId);
        }

        for (const key in props.attributes) {
          disposeResource(ctx, props.attributes[key].resourceId);
        }

        if (_material) {
          disposeResource(ctx, _material.resourceId);
        }

        if (_scriptMeshPrimitive) {
          disposeResource(ctx, _scriptMeshPrimitive.resourceId);
        }

        const index = rendererModule.meshPrimitives.findIndex((primitive) => primitive.resourceId === resourceId);

        if (index !== -1) {
          rendererModule.meshPrimitives.splice(index, 1);
        }
      },
    }
  );

  const remoteMeshPrimitive: RemoteMeshPrimitive = {
    name,
    resourceId,
    attributes: props.attributes,
    indices: props.indices,
    mode: props.mode,
    meshPrimitiveBufferView,
    meshPrimitiveTripleBuffer,
    get material(): RemoteMaterial | undefined {
      return _material;
    },
    set material(material: RemoteMaterial | undefined) {
      if (material) {
        addResourceRef(ctx, material.resourceId);
      }

      if (_material) {
        disposeResource(ctx, _material.resourceId);
      }

      _material = material;
      meshPrimitiveBufferView.material[0] = material?.resourceId || 0;
    },
    get scriptMeshPrimitive(): ScriptRemoteMeshPrimitive | undefined {
      return _scriptMeshPrimitive;
    },
    set scriptMeshPrimitive(scriptMeshPrimitive: ScriptRemoteMeshPrimitive | undefined) {
      if (scriptMeshPrimitive) {
        addResourceRef(ctx, scriptMeshPrimitive.resourceId);
      }

      if (_scriptMeshPrimitive) {
        disposeResource(ctx, _scriptMeshPrimitive.resourceId);
      }

      _scriptMeshPrimitive = scriptMeshPrimitive;
    },
  };

  rendererModule.meshPrimitives.push(remoteMeshPrimitive);

  return remoteMeshPrimitive;
}

export function createRemoteInstancedMesh(ctx: GameState, props: RemoteInstancedMeshProps): RemoteInstancedMesh {
  const name = props.name || DEFAULT_INSTANCED_MESH_NAME;

  const attributes = props.attributes;

  const sharedResource: SharedInstancedMeshResource = {
    attributes: Object.fromEntries(
      Object.entries(attributes).map(([name, accessor]: [string, RemoteAccessor<any>]) => [name, accessor.resourceId])
    ),
  };

  for (const key in attributes) {
    addResourceRef(ctx, attributes[key].resourceId);
  }

  const resourceId = createResource<SharedInstancedMeshResource>(
    ctx,
    Thread.Render,
    InstancedMeshResourceType,
    sharedResource,
    {
      name,
      dispose() {
        for (const key in attributes) {
          disposeResource(ctx, attributes[key].resourceId);
        }
      },
    }
  );

  return {
    name,
    resourceId,
    attributes,
  };
}

export function createRemoteSkinnedMesh(ctx: GameState, props: RemoteSkinnedMeshProps): RemoteSkinnedMesh {
  const name = props.name || DEFAULT_SKINNED_MESH_NAME;
  const joints = props.joints;
  const inverseBindMatrices = props.inverseBindMatrices;

  const sharedResource: SharedSkinnedMeshResource = {
    joints: joints.map((j) => j.rendererResourceId),
    inverseBindMatrices: props.inverseBindMatrices?.resourceId,
  };

  const resourceId = createResource<SharedSkinnedMeshResource>(
    ctx,
    Thread.Render,
    SkinnedMeshResourceType,
    sharedResource,
    {
      name,
      dispose() {
        if (props.inverseBindMatrices) disposeResource(ctx, props.inverseBindMatrices.resourceId);
      },
    }
  );

  return {
    name,
    resourceId,
    joints,
    inverseBindMatrices,
  };
}

export function createRemoteLightMap(ctx: GameState, props: RemoteLightMapProps): RemoteLightMap {
  const name = props.name || DEFAULT_LIGHT_MAP_NAME;

  const textureResourceId = props.texture.resourceId;

  const sharedResource: SharedLightMapResource = {
    texture: textureResourceId,
    offset: props.offset || [0, 0],
    scale: props.scale || [1, 1],
    intensity: props.intensity === undefined ? 1 : props.intensity,
  };

  addResourceRef(ctx, textureResourceId);

  const resourceId = createResource<SharedLightMapResource>(ctx, Thread.Render, LightMapResourceType, sharedResource, {
    name,
    dispose() {
      disposeResource(ctx, textureResourceId);
    },
  });

  return {
    name,
    resourceId,
    texture: props.texture,
  };
}

export function updateRemoteMeshPrimitives(meshPrimitives: RemoteMeshPrimitive[]) {
  for (let i = 0; i < meshPrimitives.length; i++) {
    const meshPrimitive = meshPrimitives[i];
    commitToObjectTripleBuffer(meshPrimitive.meshPrimitiveTripleBuffer, meshPrimitive.meshPrimitiveBufferView);
  }
}

export const createMesh = (ctx: GameState, geometry: BufferGeometry, material?: RemoteMaterial): RemoteMesh => {
  const indicesArr = geometry.index!.array as Uint16Array;
  const posArr = geometry.attributes.position.array as Float32Array;
  const normArr = geometry.attributes.normal.array as Float32Array;
  const uvArr = geometry.attributes.uv.array as Float32Array;

  const data = new SharedArrayBuffer(indicesArr.byteLength + posArr.byteLength + normArr.byteLength + uvArr.byteLength);

  const indices = new Uint16Array(data, 0, indicesArr.length);
  indices.set(indicesArr);
  const position = new Float32Array(data, indices.byteLength, posArr.length);
  position.set(posArr);
  const normal = new Float32Array(data, position.byteOffset + position.byteLength, normArr.length);
  normal.set(normArr);
  const uv = new Float32Array(data, normal.byteOffset + normal.byteLength, uvArr.length);
  uv.set(uvArr);

  const bufferView = ctx.resourceManager.createResource(BufferViewResource, {
    buffer: ctx.resourceManager.createResource(BufferResource, {
      data,
    }),
    byteLength: data.byteLength,
  });

  const remoteMesh = createRemoteMesh(ctx, {
    primitives: [
      {
        indices: createRemoteAccessor(ctx, {
          type: AccessorType.SCALAR,
          componentType: AccessorComponentType.Uint16,
          bufferView,
          count: indices.length,
        }),
        attributes: {
          [MeshPrimitiveAttribute.POSITION]: createRemoteAccessor(ctx, {
            type: AccessorType.VEC3,
            componentType: AccessorComponentType.Float32,
            bufferView,
            byteOffset: position.byteOffset,
            count: position.length / 3,
          }),
          [MeshPrimitiveAttribute.NORMAL]: createRemoteAccessor(ctx, {
            type: AccessorType.VEC3,
            componentType: AccessorComponentType.Float32,
            bufferView,
            byteOffset: normal.byteOffset,
            count: normal.length / 3,
            normalized: true,
          }),
          [MeshPrimitiveAttribute.TEXCOORD_0]: createRemoteAccessor(ctx, {
            type: AccessorType.VEC2,
            componentType: AccessorComponentType.Float32,
            bufferView,
            byteOffset: uv.byteOffset,
            count: uv.length / 2,
          }),
        },
        material:
          material ||
          ctx.resourceManager.createResource(MaterialResource, {
            type: MaterialType.Standard,
            baseColorFactor: [Math.random(), Math.random(), Math.random(), 1.0],
            roughnessFactor: 0.8,
            metallicFactor: 0.8,
          }),
      },
    ],
  });

  return remoteMesh;
};

export const createCubeMesh = (ctx: GameState, size: number, material?: RemoteMaterial) => {
  const geometry = new BoxGeometry(size, size, size);
  return createMesh(ctx, geometry, material);
};

export const createSphereMesh = (ctx: GameState, radius: number, material?: RemoteMaterial) => {
  const geometry = new SphereGeometry(radius / 2);
  return createMesh(ctx, geometry, material);
};

export const createPhysicsCube = (ctx: GameState, size: number, material?: RemoteMaterial, remote = false) => {
  const physics = getModule(ctx, PhysicsModule);
  const { physicsWorld } = physics;
  const { world } = ctx;

  const eid = addEntity(world);
  addTransformComponent(world, eid);

  ctx.resourceManager.createResource(MaterialResource, {
    type: MaterialType.Standard,
    baseColorFactor: [Math.random(), Math.random(), Math.random(), 1.0],
    roughnessFactor: 0.8,
    metallicFactor: 0.8,
  });

  addRemoteNodeComponent(ctx, eid, {
    mesh: createCubeMesh(ctx, size, material),
  });

  const rigidBodyDesc = remote ? RAPIER.RigidBodyDesc.newKinematicPositionBased() : RAPIER.RigidBodyDesc.newDynamic();
  const rigidBody = physicsWorld.createRigidBody(rigidBodyDesc);

  const colliderDesc = RAPIER.ColliderDesc.cuboid(size / 2, size / 2, size / 2)
    .setActiveEvents(RAPIER.ActiveEvents.CONTACT_EVENTS)
    .setCollisionGroups(dynamicObjectCollisionGroups);

  physicsWorld.createCollider(colliderDesc, rigidBody.handle);

  addRigidBody(ctx, eid, rigidBody);

  addInteractableComponent(ctx, physics, eid, InteractableType.Grabbable);

  return eid;
};

export const createSimpleCube = (ctx: GameState, size: number, material?: RemoteMaterial) => {
  const { world } = ctx;
  const eid = addEntity(world);
  addTransformComponent(world, eid);

  ctx.resourceManager.createResource(MaterialResource, {
    type: MaterialType.Standard,
    baseColorFactor: [Math.random(), Math.random(), Math.random(), 1.0],
    roughnessFactor: 0.8,
    metallicFactor: 0.8,
  });

  addRemoteNodeComponent(ctx, eid, {
    mesh: createCubeMesh(ctx, size, material),
  });

  return eid;
};
