import { addComponent, defineQuery, exitQuery } from "bitecs";
import { mat4, quat, vec3 } from "gl-matrix";

import { Transform } from "../component/transform";
import { GameState } from "../GameTypes";
import {
  disposeResource,
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

export const RemoteNodeComponent: Map<number, RemoteNode> = new Map();

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

  addComponent(ctx.world, Transform, eid);
  vec3.set(Transform.position[eid], 0, 0, 0);
  vec3.set(Transform.scale[eid], 1, 1, 1);
  quat.identity(Transform.quaternion[eid]);
  mat4.identity(Transform.localMatrix[eid]);
  Transform.isStatic[eid] = 0;
  mat4.identity(Transform.worldMatrix[eid]);
  Transform.worldMatrixNeedsUpdate[eid] = 1;
  Transform.parent[eid] = 0;
  Transform.firstChild[eid] = 0;
  Transform.nextSibling[eid] = 0;
  Transform.prevSibling[eid] = 0;

  // always skip lerp for first few frames of existence
  Transform.skipLerp[eid] = 10;

  return remoteNode;
}

const remoteNodeQuery = defineQuery([RemoteNodeComponent]);
const remoteNodeExitQuery = exitQuery(remoteNodeQuery);

export function RemoteNodeSystem(ctx: GameState) {
  const entities = remoteNodeQuery(ctx.world);

  for (let i = 0; i < entities.length; i++) {
    const eid = entities[i];
    const remoteNode = RemoteNodeComponent.get(eid)!;
    remoteNode.skipLerp = Transform.skipLerp[eid];
    remoteNode.worldMatrix.set(Transform.worldMatrix[eid]);
  }

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
