import { addComponent, addEntity, defineQuery, exitQuery, hasComponent } from "bitecs";

import { SkipRenderLerp } from "../component/transform";
import { GameState } from "../GameTypes";
import { disposeResource } from "../resource/resource.game";
import { addRemoteSceneComponent } from "../scene/scene.game";
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
  RemoteSkin,
  RemoteTilesRenderer,
} from "../resource/schema";

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

export function createNodeEntity(ctx: GameState): number {
  const eid = addEntity(ctx.world);
  addRemoteSceneComponent(ctx, eid);
  return eid;
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

  const remoteNode = ctx.resourceManager.createResource(NodeResource, props || {}, eid);
  addComponent(ctx.world, RemoteNodeComponent, eid);

  // always skip lerp for first few frames of existence
  addComponent(ctx.world, SkipRenderLerp, eid);
  remoteNode.skipLerp = 10;

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
