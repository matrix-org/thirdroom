import RAPIER from "@dimforge/rapier3d-compat";
import { addComponent, defineQuery, removeComponent } from "bitecs";
import { mat4, quat, vec3 } from "gl-matrix";

import { getReadObjectBufferView } from "../../engine/allocator/ObjectBufferView";
import { ourPlayerQuery } from "../../engine/player/Player";
import { setFromLocalMatrix } from "../../engine/component/transform";
import { GameContext } from "../../engine/GameTypes";
import { getModule } from "../../engine/module/module.common";
import { grabShapeCastCollisionGroups } from "../../engine/physics/CollisionGroups";
import { PhysicsModule } from "../../engine/physics/physics.game";
import { RemoteNode } from "../../engine/resource/RemoteResources";
import { getRemoteResource, tryGetRemoteResource } from "../../engine/resource/resource.game";
import { getRotationNoAlloc } from "../../engine/utils/getRotationNoAlloc";
import { RendererModule } from "../../engine/renderer/renderer.game";

export enum RaycastShape {
  Line,
  Arc,
}

export interface XRRaycaster {
  hand: XRHandedness;
  action: string;
  arcSegments?: number;
  ray: RAPIER.Ray;
  maxToi: number;
  solid: boolean;
  filterFlags?: number;
  filterGroups?: number;
  filterExcludeCollider?: RAPIER.Collider;
  filterExcludeRigidBody?: RAPIER.RigidBody;
  filterPredicate?: (collider: RAPIER.Collider) => boolean;
  hitEid?: number;
  hitToi?: number;
}

export const XRRaycaster: Map<number, XRRaycaster> = new Map();

const interactionRaycasterQuery = defineQuery([RemoteNode, XRRaycaster]);

const _rayPosePosition = vec3.create();
const _rayPoseRotation = quat.create();
const _rayDirection = vec3.create();

export function XRInteractionSystem(ctx: GameContext) {
  const { xrInputSourcesByHand } = getModule(ctx, RendererModule);
  const { physicsWorld, handleToEid } = getModule(ctx, PhysicsModule);

  const entities = interactionRaycasterQuery(ctx.world);

  for (let i = 0; i < entities.length; i++) {
    const eid = entities[i];
    const rayNode = tryGetRemoteResource<RemoteNode>(ctx, eid);
    const raycaster = XRRaycaster.get(eid);

    if (!rayNode || !raycaster) {
      continue;
    }

    const inputSource = xrInputSourcesByHand.get(raycaster.hand);

    if (!inputSource) {
      continue;
    }

    const controllerPoses = getReadObjectBufferView(inputSource.controllerPoses);

    setFromLocalMatrix(rayNode, controllerPoses.rayPose);

    mat4.getTranslation(_rayPosePosition, controllerPoses.rayPose);
    const origin = raycaster.ray.origin;
    origin.x = _rayPosePosition[0];
    origin.y = _rayPosePosition[1];
    origin.z = _rayPosePosition[1];

    getRotationNoAlloc(_rayPoseRotation, controllerPoses.rayPose);
    vec3.transformQuat(_rayDirection, vec3.set(_rayDirection, 0, 0, 1), _rayPoseRotation);
    const dir = raycaster.ray.dir;
    dir.x = _rayDirection[0];
    dir.y = _rayDirection[1];
    dir.z = _rayDirection[2];

    const raycastHit = physicsWorld.castRay(
      raycaster.ray,
      raycaster.maxToi,
      raycaster.solid,
      raycaster.filterFlags,
      raycaster.filterGroups,
      raycaster.filterExcludeCollider,
      raycaster.filterExcludeRigidBody,
      raycaster.filterPredicate
    );

    if (raycastHit) {
      const eid = handleToEid.get(raycastHit.collider.handle);
      raycaster.hitEid = eid;
      raycaster.hitToi = raycastHit.toi;
    } else {
      raycaster.hitEid = undefined;
      raycaster.hitToi = undefined;
    }
  }
}

export function addXRRaycaster(ctx: GameContext, eid: number, hand: XRHandedness) {
  addComponent(ctx.world, XRRaycaster, eid);
  const ourPlayer = ourPlayerQuery(ctx.world)[0];
  const node = getRemoteResource<RemoteNode>(ctx, ourPlayer);
  XRRaycaster.set(eid, {
    hand,
    maxToi: 10,
    solid: true,
    action: "",
    ray: new RAPIER.Ray(new RAPIER.Vector3(0, 0, 0), new RAPIER.Vector3(0, 0, 0)),
    filterGroups: grabShapeCastCollisionGroups,
    filterExcludeRigidBody: node?.physicsBody?.body,
  });
}

export function removeXRRaycaster(ctx: GameContext, eid: number) {
  removeComponent(ctx.world, XRRaycaster, eid);
  XRRaycaster.delete(eid);
}
