import { addComponent, defineQuery, exitQuery } from "bitecs";

import { GameState } from "../GameTypes";
import {
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
} from "../resource/resource.game";
import { IRemoteResourceManager } from "../resource/ResourceDefinition";
import { RemoteSceneComponent } from "../scene/scene.game";
import { RemoteNodeComponent } from "./RemoteNodeComponent";

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
  nametag?: RemoteNametag;
  isStatic?: boolean;
}

export function addRemoteNodeComponent(
  ctx: GameState,
  eid: number,
  props: NodeProps = {},
  resourceManager: IRemoteResourceManager = ctx.resourceManager
): RemoteNode {
  let remoteNode = RemoteNodeComponent.get(eid);

  // if entity already has the component should we apply props and return object?
  if (remoteNode) {
    if (props?.name) remoteNode.name = props.name;
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
    if (props?.isStatic) remoteNode.isStatic = props.isStatic;

    return remoteNode;
  }

  remoteNode = new RemoteNode(resourceManager, { ...props, eid });

  addComponent(ctx.world, RemoteNodeComponent, eid);
  RemoteNodeComponent.set(eid, remoteNode);

  return remoteNode;
}

const remoteNodeQuery = defineQuery([RemoteNodeComponent]);
const remoteNodeExitQuery = exitQuery(remoteNodeQuery);

const remoteSceneQuery = defineQuery([RemoteSceneComponent]);
const remoteSceneExitQuery = exitQuery(remoteSceneQuery);

export function RemoteNodeSystem(ctx: GameState) {
  const disposedNodeEntities = remoteNodeExitQuery(ctx.world);

  for (let i = 0; i < disposedNodeEntities.length; i++) {
    const eid = disposedNodeEntities[i];

    const remoteNode = RemoteNodeComponent.get(eid);

    if (remoteNode) {
      remoteNode.removeRef();
      RemoteNodeComponent.delete(eid);
    }
  }

  const disposedSceneEntities = remoteSceneExitQuery(ctx.world);

  for (let i = 0; i < disposedSceneEntities.length; i++) {
    const eid = disposedSceneEntities[i];

    const remoteScene = RemoteSceneComponent.get(eid);

    if (remoteScene) {
      remoteScene.removeRef();
      RemoteSceneComponent.delete(eid);
    }
  }
}
