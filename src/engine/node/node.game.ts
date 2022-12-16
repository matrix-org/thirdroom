import { addComponent, addEntity, defineQuery, exitQuery, hasComponent } from "bitecs";

import { Transform } from "../component/transform";
import { GameState } from "../GameTypes";
import { disposeResource } from "../resource/resource.game";
import { RemoteSceneComponent } from "../scene/scene.game";
import {
  NodeResource,
  RemoteAudioEmitter,
  RemoteCamera,
  RemoteInstancedMesh,
  RemoteLight,
  RemoteLightMap,
  RemoteMesh,
  RemoteNametag,
  RemoteNode,
  RemoteReflectionProbe,
  RemoteScene,
  RemoteSkin,
  RemoteTilesRenderer,
} from "../resource/schema";
import { defineRemoteResourceClass } from "../resource/RemoteResourceClass";
import { InitialResourceProps, IRemoteResourceManager } from "../resource/ResourceDefinition";
import { TripleBuffer } from "../allocator/TripleBuffer";

interface NodeProps {
  name?: string;
  mesh?: RemoteMesh;
  instancedMesh?: RemoteInstancedMesh;
  lightMap?: RemoteLightMap;
  skin?: RemoteSkin;
  light?: RemoteLight;
  reflectionProbe?: RemoteReflectionProbe;
  camera?: RemoteCamera;
  audioEmitter?: RemoteAudioEmitter;
  tilesRenderer?: RemoteTilesRenderer;
  static?: boolean;
  layers?: number;
  nametag?: RemoteNametag;
}

export const RemoteNodeComponent: Map<number, RemoteNode> = new Map();

export class GameNodeResource extends defineRemoteResourceClass<typeof NodeResource>(NodeResource) {
  constructor(
    manager: IRemoteResourceManager,
    ctx: GameState,
    buffer: ArrayBuffer,
    ptr: number,
    tripleBuffer: TripleBuffer,
    props?: InitialResourceProps<typeof NodeResource>
  ) {
    super(manager, ctx, buffer, ptr, tripleBuffer, props);
    this.__props["id"][0] = props?.id || addEntity(ctx.world);
  }
}

export function addRemoteNodeComponent(ctx: GameState, eid: number, props?: NodeProps): RemoteNode {
  // if entity already has the component should we apply props and return object?
  if (hasComponent(ctx.world, RemoteNodeComponent, eid)) {
    const remoteNode = RemoteNodeComponent.get(eid)!;
    if (props?.mesh) remoteNode.mesh = props.mesh;
    if (props?.instancedMesh) remoteNode.instancedMesh = props.instancedMesh;
    if (props?.lightMap) remoteNode.lightMap = props.lightMap;
    if (props?.skin) remoteNode.skin = props.skin;
    if (props?.light) remoteNode.light = props.light;
    if (props?.reflectionProbe) remoteNode.reflectionProbe = props.reflectionProbe;
    if (props?.camera) remoteNode.camera = props.camera;
    if (props?.audioEmitter) remoteNode.audioEmitter = props.audioEmitter;
    if (props?.tilesRenderer) remoteNode.tilesRenderer = props.tilesRenderer;
    if (props?.nametag) remoteNode.nametag = props.nametag;

    return remoteNode;
  }

  const remoteNode = ctx.resourceManager.createResource(NodeResource, { ...props, id: eid });
  addComponent(ctx.world, RemoteNodeComponent, eid);
  RemoteNodeComponent.set(eid, remoteNode);
  return remoteNode;
}

const remoteNodeQuery = defineQuery([RemoteNodeComponent]);
const remoteNodeExitQuery = exitQuery(remoteNodeQuery);

export function RemoteNodeSystem(ctx: GameState) {
  const disposedEntities = remoteNodeExitQuery(ctx.world);

  for (let i = 0; i < disposedEntities.length; i++) {
    const eid = disposedEntities[i];

    const remoteNode = RemoteNodeComponent.get(eid);

    if (remoteNode) {
      disposeResource(ctx, remoteNode.resourceId);
      RemoteNodeComponent.delete(eid);
    }
  }
}

export function TransformToRemoteNodeSystem(ctx: GameState) {
  const entities = remoteNodeQuery(ctx.world);

  for (let i = 0; i < entities.length; i++) {
    const eid = entities[i];
    const remoteNode = RemoteNodeComponent.get(eid);

    if (remoteNode) {
      remoteNode.__props["parentScene"][0] = RemoteSceneComponent.get(Transform.parent[eid])?.resourceId || 0;
      remoteNode.__props["parent"][0] = RemoteNodeComponent.get(Transform.parent[eid])?.resourceId || 0;
      remoteNode.__props["firstChild"][0] = RemoteNodeComponent.get(Transform.firstChild[eid])?.resourceId || 0;
      remoteNode.__props["prevSibling"][0] = RemoteNodeComponent.get(Transform.prevSibling[eid])?.resourceId || 0;
      remoteNode.__props["nextSibling"][0] = RemoteNodeComponent.get(Transform.nextSibling[eid])?.resourceId || 0;
      remoteNode.position.set(Transform.position[eid]);
      remoteNode.quaternion.set(Transform.quaternion[eid]);
      remoteNode.scale.set(Transform.scale[eid]);
      remoteNode.localMatrix.set(Transform.localMatrix[eid]);
      remoteNode.worldMatrix.set(Transform.worldMatrix[eid]);
      remoteNode.isStatic = !!Transform.static[eid];
    }
  }
}

export function RemoteNodeToTransformSystem(ctx: GameState) {
  const entities = remoteNodeQuery(ctx.world);

  for (let i = 0; i < entities.length; i++) {
    const eid = entities[i];
    const remoteNode = RemoteNodeComponent.get(eid);

    if (remoteNode) {
      Transform.parent[eid] = (remoteNode.parentScene as RemoteScene | undefined)?.id || remoteNode.parent?.id;
      Transform.firstChild[eid] = remoteNode.firstChild?.id;
      Transform.prevSibling[eid] = remoteNode.prevSibling?.id;
      Transform.nextSibling[eid] = remoteNode.nextSibling?.id;
      Transform.position[eid].set(remoteNode.position);
      Transform.quaternion[eid].set(remoteNode.quaternion);
      Transform.scale[eid].set(remoteNode.scale);
      Transform.localMatrix[eid].set(remoteNode.localMatrix);
      Transform.worldMatrix[eid].set(remoteNode.worldMatrix);
      Transform.static[eid] = remoteNode.isStatic ? 1 : 0;
    }
  }
}
