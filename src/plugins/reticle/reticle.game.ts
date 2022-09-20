import RAPIER from "@dimforge/rapier3d-compat";
import { defineComponent, defineQuery, exitQuery, addComponent, removeComponent, enterQuery } from "bitecs";
import { vec3, quat, mat4 } from "gl-matrix";
import { Quaternion, Vector3 } from "three";

import { Transform } from "../../engine/component/transform";
import { GameState } from "../../engine/GameTypes";
import { getModule, Thread } from "../../engine/module/module.common";
import { getPeerIdIndexFromNetworkId, Networked, NetworkModule } from "../../engine/network/network.game";
import { PhysicsModule } from "../../engine/physics/physics.game";
import { Prefab } from "../../engine/prefab/prefab.game";
import { PortalComponent } from "../portals/portals.game";
import { ReticleFocusMessage } from "./reticle.common";

const FocusComponent = defineComponent();
const focusQuery = defineQuery([FocusComponent]);
const enterFocusQuery = enterQuery(focusQuery);
const exitFocusQuery = exitQuery(focusQuery);

const MAX_FOCUS_DISTANCE = 3.3;

const _source = vec3.create();
const _target = vec3.create();
const _cameraWorldQuat = quat.create();

const shapeCastPosition = new Vector3();
const shapeCastRotation = new Quaternion();

const colliderShape = new RAPIER.Ball(0.01);

const collisionGroups = 0x000f_0f00;

const _s = new Vector3();
const _t = new Vector3();

export function ReticleFocusSystem(ctx: GameState) {
  const network = getModule(ctx, NetworkModule);
  const physics = getModule(ctx, PhysicsModule);

  // raycast outward from camera
  const cameraMatrix = Transform.worldMatrix[ctx.activeCamera];
  mat4.getRotation(_cameraWorldQuat, cameraMatrix);

  const target = vec3.set(_target, 0, 0, -1);
  vec3.transformQuat(target, target, _cameraWorldQuat);
  vec3.scale(target, target, MAX_FOCUS_DISTANCE);

  const source = mat4.getTranslation(_source, cameraMatrix);

  const s: Vector3 = _s.fromArray(source);
  const t: Vector3 = _t.fromArray(target);

  shapeCastPosition.copy(s);

  const hit = physics.physicsWorld.castShape(
    shapeCastPosition,
    shapeCastRotation,
    t,
    colliderShape,
    1.0,
    collisionGroups
  );

  let eid;
  let peerId;
  let ownerId;
  if (hit !== null) {
    eid = physics.handleToEid.get(hit.colliderHandle);
    if (!eid) {
      console.warn(`Could not find entity for physics handle ${hit.colliderHandle}`);
    } else if (eid !== focusQuery(ctx.world)[0]) {
      focusQuery(ctx.world).forEach((eid) => removeComponent(ctx.world, FocusComponent, eid));
      addComponent(ctx.world, FocusComponent, eid);

      peerId = network.entityIdToPeerId.get(eid);

      const ownerIdIndex = getPeerIdIndexFromNetworkId(Networked.networkId[eid]);
      ownerId = network.indexToPeerId.get(ownerIdIndex);
    }
  } else {
    // clear focus
    focusQuery(ctx.world).forEach((eid) => removeComponent(ctx.world, FocusComponent, eid));
  }

  const entered = enterFocusQuery(ctx.world);
  if (entered[0])
    ctx.sendMessage(Thread.Main, {
      type: ReticleFocusMessage,
      focused: true,
      entityId: eid,
      networkId: eid ? Networked.networkId[eid] : undefined,
      prefab: eid ? Prefab.get(eid) : undefined,
      ownerId,
      peerId,
      roomId: eid && PortalComponent.has(eid) && PortalComponent.get(eid)!.roomId,
    });

  const exited = exitFocusQuery(ctx.world);
  if (exited[0] && focusQuery(ctx.world).length === 0)
    ctx.sendMessage(Thread.Main, { type: ReticleFocusMessage, focused: false });
}
