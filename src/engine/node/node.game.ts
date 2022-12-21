import { addComponent, defineQuery, exitQuery } from "bitecs";

import { Transform } from "../component/transform";
import { GameState } from "../GameTypes";
import { disposeResource } from "../resource/resource.game";
import { NodeResource, RemoteNode } from "../resource/schema";
import { InitialResourceProps, IRemoteResourceManager } from "../resource/ResourceDefinition";

export const RemoteNodeComponent: Map<number, RemoteNode> = new Map();

export function addRemoteNodeComponent(
  ctx: GameState,
  eid: number,
  props: Omit<InitialResourceProps<typeof NodeResource>, "eid"> = {},
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

  remoteNode = resourceManager.createResource(NodeResource, { ...props, eid });

  addComponent(ctx.world, RemoteNodeComponent, eid);
  RemoteNodeComponent.set(eid, remoteNode);

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
