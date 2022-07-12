import { RemoteAccessor } from "../accessor/accessor.game";
import {
  commitToObjectTripleBuffer,
  createObjectBufferView,
  createObjectTripleBuffer,
  ObjectBufferView,
} from "../allocator/ObjectBufferView";
import { GameState } from "../GameTypes";
import { RemoteMaterial } from "../material/material.game";
import { getModule, Thread } from "../module/module.common";
import { RendererModule } from "../renderer/renderer.game";
import { addResourceRef, createResource, disposeResource } from "../resource/resource.game";
import {
  SharedMeshResource,
  MeshResourceType,
  MeshResourceProps,
  PrimitiveResourceProps,
  meshPrimitiveSchema,
  MeshPrimitiveMode,
  SharedMeshPrimitiveResource,
  MeshPrimitiveResourceType,
  MeshPrimitiveTripleBuffer,
  InstancedMeshResourceType,
  SharedInstancedMeshResource,
} from "./mesh.common";

export type MeshPrimitiveBufferView = ObjectBufferView<typeof meshPrimitiveSchema, ArrayBuffer>;

export interface RemoteMeshPrimitive {
  name: string;
  resourceId: number;
  meshPrimitiveBufferView: MeshPrimitiveBufferView;
  meshPrimitiveTripleBuffer: MeshPrimitiveTripleBuffer;
  attributes: { [key: string]: RemoteAccessor<any, any> };
  indices?: RemoteAccessor<any, any>;
  mode?: number;
  get material(): RemoteMaterial | undefined;
  set material(value: RemoteMaterial | undefined);
}

export interface RemoteMesh {
  name: string;
  resourceId: number;
  primitives: RemoteMeshPrimitive[];
}

export interface RemoteMeshProps {
  name?: string;
  primitives: MeshPrimitiveProps[];
}

export interface MeshPrimitiveProps {
  attributes: { [key: string]: RemoteAccessor<any, any> };
  indices?: RemoteAccessor<any, any>;
  material?: RemoteMaterial;
  mode?: number;
}

export interface RemoteInstancedMesh {
  name: string;
  resourceId: number;
  attributes: { [key: string]: RemoteAccessor<any, any> };
}

export interface RemoteInstancedMeshProps {
  name?: string;
  attributes: { [key: string]: RemoteAccessor<any, any> };
}

const DEFAULT_MESH_NAME = "Mesh";
const DEFAULT_INSTANCED_MESH_NAME = "Instanced Mesh";

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
      },
    }
  );

  return {
    name,
    resourceId,
    primitives: remoteMeshPrimitives,
  };
}

function createRemoteMeshPrimitive(ctx: GameState, name: string, props: MeshPrimitiveProps): RemoteMeshPrimitive {
  const rendererModule = getModule(ctx, RendererModule);

  const meshPrimitiveBufferView = createObjectBufferView(meshPrimitiveSchema, ArrayBuffer);

  const initialProps: PrimitiveResourceProps = {
    attributes: Object.fromEntries(
      Object.entries(props.attributes).map(([name, accessor]: [string, RemoteAccessor<any, any>]) => [
        name,
        accessor.resourceId,
      ])
    ),
    indices: props.indices ? props.indices.resourceId : undefined,
    mode: props.mode === undefined ? MeshPrimitiveMode.TRIANGLES : props.mode,
  };

  meshPrimitiveBufferView.material[0] = props.material?.resourceId || 0;

  const meshPrimitiveTripleBuffer = createObjectTripleBuffer(meshPrimitiveSchema, ctx.gameToMainTripleBufferFlags);

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
  };

  rendererModule.meshPrimitives.push(remoteMeshPrimitive);

  return remoteMeshPrimitive;
}

export function createRemoteInstancedMesh(ctx: GameState, props: RemoteInstancedMeshProps): RemoteInstancedMesh {
  const name = props.name || DEFAULT_INSTANCED_MESH_NAME;

  const attributes = props.attributes;

  const sharedResource: SharedInstancedMeshResource = {
    attributes: Object.fromEntries(
      Object.entries(attributes).map(([name, accessor]: [string, RemoteAccessor<any, any>]) => [
        name,
        accessor.resourceId,
      ])
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

export function updateRemoteMeshPrimitives(meshPrimitives: RemoteMeshPrimitive[]) {
  for (let i = 0; i < meshPrimitives.length; i++) {
    const meshPrimitive = meshPrimitives[i];
    commitToObjectTripleBuffer(meshPrimitive.meshPrimitiveTripleBuffer, meshPrimitive.meshPrimitiveBufferView);
  }
}
