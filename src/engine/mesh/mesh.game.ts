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
import { createResource } from "../resource/resource.game";
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
} from "./mesh.common";

export type MeshPrimitiveBufferView = ObjectBufferView<typeof meshPrimitiveSchema, ArrayBuffer>;

export interface RemoteMeshPrimitive {
  resourceId: number;
  meshPrimitiveBufferView: MeshPrimitiveBufferView;
  meshPrimitiveTripleBuffer: MeshPrimitiveTripleBuffer;
  get material(): RemoteMaterial | undefined;
  set material(value: RemoteMaterial | undefined);
}

export interface RemoteMesh {
  resourceId: number;
  primitives: RemoteMeshPrimitive[];
}

export interface MeshPrimitiveProps {
  attributes: { [key: string]: RemoteAccessor<any, any> };
  indices?: RemoteAccessor<any, any>;
  material?: RemoteMaterial;
  mode?: number;
}

export function createRemoteMesh(ctx: GameState, primitives: MeshPrimitiveProps | MeshPrimitiveProps[]): RemoteMesh {
  const arr = Array.isArray(primitives) ? primitives : [primitives];

  const remoteMeshPrimitives = arr.map((primitive) => createRemoteMeshPrimitive(ctx, primitive));

  const initialProps: MeshResourceProps = {
    primitives: remoteMeshPrimitives.map((primitive) => primitive.resourceId),
  };

  const resourceId = createResource<SharedMeshResource>(ctx, Thread.Render, MeshResourceType, { initialProps });

  return {
    resourceId,
    primitives: remoteMeshPrimitives,
  };
}

function createRemoteMeshPrimitive(ctx: GameState, props: MeshPrimitiveProps): RemoteMeshPrimitive {
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

  const resourceId = createResource<SharedMeshPrimitiveResource>(ctx, Thread.Render, MeshPrimitiveResourceType, {
    initialProps,
    meshPrimitiveTripleBuffer,
  });

  let _material: RemoteMaterial | undefined = props.material;

  const remoteMeshPrimitive: RemoteMeshPrimitive = {
    resourceId,
    meshPrimitiveBufferView,
    meshPrimitiveTripleBuffer,
    get material(): RemoteMaterial | undefined {
      return _material;
    },
    set material(value: RemoteMaterial | undefined) {
      _material = value;
      meshPrimitiveBufferView.material[0] = value?.resourceId || 0;
    },
  };

  rendererModule.meshPrimitives.push(remoteMeshPrimitive);

  return remoteMeshPrimitive;
}

export function updateRemoteMeshPrimitives(meshPrimitives: RemoteMeshPrimitive[]) {
  for (let i = 0; i < meshPrimitives.length; i++) {
    const meshPrimitive = meshPrimitives[i];
    commitToObjectTripleBuffer(meshPrimitive.meshPrimitiveTripleBuffer, meshPrimitive.meshPrimitiveBufferView);
  }
}
