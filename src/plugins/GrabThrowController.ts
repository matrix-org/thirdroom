import RAPIER from "@dimforge/rapier3d-compat";
import { defineComponent, Types, defineQuery, removeComponent, addComponent } from "bitecs";
import { vec3, mat4, quat } from "gl-matrix";
import { Quaternion, Vector3 } from "three";

import { Transform } from "../engine/component/transform";
import { NOOP } from "../engine/config.common";
import { GameState } from "../engine/GameTypes";
import {
  enableActionMap,
  ActionMap,
  ActionType,
  BindingType,
  ButtonActionState,
} from "../engine/input/ActionMappingSystem";
import { InputModule } from "../engine/input/input.game";
import { defineModule, getModule, Thread } from "../engine/module/module.common";
import { getPeerIdIndexFromNetworkId, Networked, NetworkModule } from "../engine/network/network.game";
import { takeOwnership } from "../engine/network/ownership.game";
import { PhysicsModule, RigidBody } from "../engine/physics/physics.game";
import { Prefab } from "../engine/prefab/prefab.game";

type GrabThrow = {};

export const GrabThrowModule = defineModule<GameState, GrabThrow>({
  name: "grab-throw",
  create() {
    return {};
  },
  init(ctx) {
    enableActionMap(ctx, GrabThrowActionMap);
  },
});

export const EntityGrabbedMessage = "entity-grabbed";

export const GrabThrowActionMap: ActionMap = {
  id: "grab-throw",
  actions: [
    {
      id: "grab",
      path: "Grab",
      type: ActionType.Button,
      bindings: [
        {
          type: BindingType.Button,
          path: "Mouse/Left",
        },
      ],
    },
    {
      id: "grab2",
      path: "Grab2",
      type: ActionType.Button,
      bindings: [
        {
          type: BindingType.Button,
          path: "Keyboard/KeyE",
        },
      ],
    },
    {
      id: "throw",
      path: "Throw",
      type: ActionType.Button,
      bindings: [
        {
          type: BindingType.Button,
          path: "Mouse/Right",
        },
      ],
    },
    {
      id: "throw2",
      path: "Throw2",
      type: ActionType.Button,
      bindings: [
        {
          type: BindingType.Button,
          path: "Mouse/Left",
        },
      ],
    },
  ],
};

const GrabComponent = defineComponent({
  handle1: Types.ui32,
  handle2: Types.ui32,
  joint: [Types.f32, 3],
});
const grabQuery = defineQuery([GrabComponent]);

const HELD_DISTANCE = 2.5;
const GRAB_DISTANCE = 3.3;
const GRAB_MOVE_SPEED = 10;
const THROW_FORCE = 10;

const _direction = vec3.create();
const _source = vec3.create();
const _target = vec3.create();

const _impulse = new RAPIER.Vector3(0, 0, 0);

const _cameraWorldQuat = quat.create();

const shapeCastPosition = new Vector3();
const shapeCastRotation = new Quaternion();

const colliderShape = new RAPIER.Ball(0.01);

const collisionGroups = 0x00f0_000f;

const _s = new Vector3();
const _t = new Vector3();

export function GrabThrowSystem(ctx: GameState) {
  const physics = getModule(ctx, PhysicsModule);
  const input = getModule(ctx, InputModule);
  const network = getModule(ctx, NetworkModule);

  let heldEntity = grabQuery(ctx.world)[0];

  const grabBtn = input.actions.get("Grab") as ButtonActionState;
  const grabBtn2 = input.actions.get("Grab2") as ButtonActionState;
  const throwBtn = input.actions.get("Throw") as ButtonActionState;
  const throwBtn2 = input.actions.get("Throw2") as ButtonActionState;

  const grabPressed = grabBtn.pressed || grabBtn2.pressed;
  const throwPressed = throwBtn.pressed || throwBtn2.pressed;

  let peerId;
  let ownerId;
  if (heldEntity) {
    for (const [p, e] of network.peerIdToEntityId.entries()) {
      if (heldEntity === e) {
        peerId = p;
        break;
      }
    }

    const ownerIdIndex = getPeerIdIndexFromNetworkId(Networked.networkId[heldEntity]);
    for (const [p, i] of network.peerIdToIndex.entries()) {
      if (ownerIdIndex === i) {
        ownerId = p;
        break;
      }
    }
  }

  // if holding and entity and throw is pressed
  if (heldEntity && throwPressed) {
    removeComponent(ctx.world, GrabComponent, heldEntity);

    mat4.getRotation(_cameraWorldQuat, Transform.worldMatrix[ctx.activeCamera]);
    const direction = vec3.set(_direction, 0, 0, -1);
    vec3.transformQuat(direction, direction, _cameraWorldQuat);
    vec3.scale(direction, direction, THROW_FORCE);

    // fire!
    _impulse.x = direction[0];
    _impulse.y = direction[1];
    _impulse.z = direction[2];
    RigidBody.store.get(heldEntity)?.applyImpulse(_impulse, true);

    notifyUiEntityReleased(ctx, heldEntity, peerId, ownerId);

    // if holding an entity and grab is pressed again
  } else if (grabPressed && heldEntity) {
    // release
    removeComponent(ctx.world, GrabComponent, heldEntity);

    notifyUiEntityReleased(ctx, heldEntity, peerId, ownerId);

    // if grab is pressed
  } else if (grabPressed) {
    // raycast outward from camera
    const cameraMatrix = Transform.worldMatrix[ctx.activeCamera];
    mat4.getRotation(_cameraWorldQuat, cameraMatrix);

    const target = vec3.set(_target, 0, 0, -1);
    vec3.transformQuat(target, target, _cameraWorldQuat);
    vec3.scale(target, target, GRAB_DISTANCE);

    const source = mat4.getTranslation(_source, cameraMatrix);

    const s: Vector3 = _s.fromArray(source);
    const t: Vector3 = _t.fromArray(target);

    shapeCastPosition.copy(s);

    // const ray = new RAPIER.Ray(s, t);
    // const solid = true;
    // const maxToi = 4.0;
    // const raycastHit = physics.physicsWorld.castRay(ray, maxToi, solid, collisionGroups);

    const shapecastHit = physics.physicsWorld.castShape(
      shapeCastPosition,
      shapeCastRotation,
      t,
      colliderShape,
      1.0,
      collisionGroups
    );

    if (shapecastHit !== null) {
      // const hitPoint = ray.pointAt(hit.toi); // ray.origin + ray.dir * toi
      const eid = physics.handleToEid.get(shapecastHit.colliderHandle);
      if (!eid) {
        console.warn(`Could not find entity for physics handle ${shapecastHit.colliderHandle}`);
      } else {
        // GrabComponent.joint[eid].set([hitPoint.x, hitPoint.y, hitPoint.z]);
        const newEid = takeOwnership(ctx, eid);
        if (newEid !== NOOP) {
          addComponent(ctx.world, GrabComponent, newEid);
          notifyUiEntityGrabbed(ctx, newEid, network.peerId, network.peerId);
          heldEntity = newEid;
        } else {
          addComponent(ctx.world, GrabComponent, eid);
          notifyUiEntityGrabbed(ctx, eid, ownerId, peerId);
        }
      }
    }
  }

  // if still holding entity, move towards the held point
  heldEntity = grabQuery(ctx.world)[0];
  if (heldEntity) {
    const heldPosition = Transform.position[heldEntity];

    const target = _target;
    mat4.getTranslation(target, Transform.worldMatrix[ctx.activeCamera]);

    mat4.getRotation(_cameraWorldQuat, Transform.worldMatrix[ctx.activeCamera]);
    const direction = vec3.set(_direction, 0, 0, 1);
    vec3.transformQuat(direction, direction, _cameraWorldQuat);
    vec3.scale(direction, direction, HELD_DISTANCE);

    vec3.sub(target, target, direction);

    vec3.sub(target, target, heldPosition);

    vec3.scale(target, target, GRAB_MOVE_SPEED);

    const body = RigidBody.store.get(heldEntity);
    if (body) {
      _impulse.x = target[0];
      _impulse.y = target[1];
      _impulse.z = target[2];
      body.setLinvel(_impulse, true);
    }
  }
}

function notifyUiEntityReleased(ctx: GameState, heldEntity: number, peerId?: string, ownerId?: string) {
  ctx.sendMessage(Thread.Main, {
    type: EntityGrabbedMessage,
    held: false,
    entityId: heldEntity,
    networkId: heldEntity ? Networked.networkId[heldEntity] : undefined,
    prefab: heldEntity ? Prefab.get(heldEntity) : undefined,
    ownerId,
    peerId,
  });
}

function notifyUiEntityGrabbed(ctx: GameState, eid: number, peerId?: string, ownerId?: string) {
  ctx.sendMessage(Thread.Main, {
    type: EntityGrabbedMessage,
    held: true,
    entityId: eid,
    networkId: eid ? Networked.networkId[eid] : undefined,
    prefab: eid ? Prefab.get(eid) : undefined,
    ownerId,
    peerId,
  });
}
