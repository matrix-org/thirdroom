import { addComponent, defineComponent, removeComponent } from "bitecs";

import { RemoteAccessor } from "../accessor/accessor.game";
import { GameState } from "../GameTypes";
import { RemoteMaterial } from "../material/material.game";
import { Thread } from "../module/module.common";
import { createResource } from "../resource/resource.game";
import { MeshResourceProps, MeshResourceType } from "./mesh.common";

interface RemoteMesh {
  resourceId: number;
}

interface PrimitiveProps {
  attributes: { [key: string]: RemoteAccessor<any, any> };
  indices?: RemoteAccessor<any, any>;
  material?: RemoteMaterial;
  mode?: number;
  targets?: number[] | Float32Array;
}

export function createRemoteMesh(
  ctx: GameState,
  primitives: PrimitiveProps | PrimitiveProps[],
  weights?: number[] | Float32Array
): RemoteMesh {
  const arr = Array.isArray(primitives) ? primitives : [primitives];

  const initialProps = {
    primitives: arr.map((primitive) => ({
      attributes: Object.fromEntries(
        Object.entries(primitive).map(([name, accessor]: [string, RemoteAccessor<any, any>]) => [
          name,
          accessor.resourceId,
        ])
      ),
      indices: primitive.indices ? primitive.indices.resourceId : undefined,
      material: primitive.material ? primitive.material.resourceId : undefined,
      mode: primitive.mode,
      targets: primitive.targets,
    })),
    weights,
  };

  const resourceId = createResource<MeshResourceProps>(ctx, Thread.Render, MeshResourceType, initialProps);

  return {
    resourceId,
  };
}

export const RemoteMeshComponent = defineComponent<Map<number, RemoteMesh>>(new Map());

export function addRemoteMeshComponent(ctx: GameState, eid: number, mesh: RemoteMesh) {
  addComponent(ctx.world, RemoteMeshComponent, eid);
  RemoteMeshComponent.set(eid, mesh);
}

export function removeRemoteMeshComponent(ctx: GameState, eid: number) {
  removeComponent(ctx.world, RemoteMeshComponent, eid);
  RemoteMeshComponent.delete(eid);
}
