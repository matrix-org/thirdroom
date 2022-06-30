import RAPIER from "@dimforge/rapier3d-compat";
import { defineComponent, Types, defineQuery, removeComponent, addComponent, hasComponent } from "bitecs";
import { vec3, mat4, quat } from "gl-matrix";
import { Vector3 } from "three";

import { createCursorView, CursorView, readUint32, sliceCursorView, writeUint32 } from "../engine/allocator/CursorView";
import { Transform } from "../engine/component/transform";
import { GameState } from "../engine/GameTypes";
import {
  enableActionMap,
  ActionMap,
  ActionType,
  BindingType,
  ButtonActionState,
} from "../engine/input/ActionMappingSystem";
import { InputModule } from "../engine/input/input.game";
import { defineModule, getModule } from "../engine/module/module.common";
import {
  broadcastReliable,
  NetPipeData,
  Networked,
  NetworkModule,
  Owned,
  registerInboundMessageHandler,
  writeMessageType,
} from "../engine/network/network.game";
import { RemoteNodeComponent } from "../engine/node/node.game";
import { PhysicsModule, RigidBody } from "../engine/physics/physics.game";

type GrabThrow = {};

const RemoveOwnershipMessage = 10;

export const GrabThrowModule = defineModule<GameState, GrabThrow>({
  name: "grab-throw",
  create() {
    return {};
  },
  init(ctx) {
    enableActionMap(ctx, GrabThrowActionMap);

    const network = getModule(ctx, NetworkModule);

    // TODO: make new API for this that allows user to use strings (internally mapped to an integer)
    registerInboundMessageHandler(network, RemoveOwnershipMessage, deserializeRemoveOwnership);
  },
});

const messageView = createCursorView(new ArrayBuffer(Uint32Array.BYTES_PER_ELEMENT * 2));

const createRemoveOwnershipMessage = (ctx: GameState, eid: number) => {
  writeMessageType(messageView, RemoveOwnershipMessage);
  serializeRemoveOwnership(messageView, eid);
  return sliceCursorView(messageView);
};

const serializeRemoveOwnership = (cv: CursorView, eid: number) => {
  writeUint32(cv, Networked.networkId[eid]);
};

const deserializeRemoveOwnership = (input: NetPipeData) => {
  const [ctx, cv] = input;
  const network = getModule(ctx, NetworkModule);
  const nid = readUint32(cv);
  const eid = network.networkIdToEntityId.get(nid);
  if (eid) {
    removeComponent(ctx.world, Networked, eid);
    removeComponent(ctx.world, RemoteNodeComponent, eid);
    removeComponent(ctx.world, RigidBody, eid);
  }
};

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

const GRAB_DISTANCE = 3;
const GRAB_MAX_DISTANCE = 1;
const GRAB_MOVE_SPEED = 10;
const CUBE_THROW_FORCE = 10;

const _direction = vec3.create();
const _target = vec3.create();

const _impulse = new RAPIER.Vector3(0, 0, 0);

const _cameraWorldQuat = quat.create();

// const shapeCastPosition = new Vector3();
// const shapeCastRotation = new Quaternion();

// const colliderShape = new RAPIER.Ball(0.5);

const collisionGroups = 0x0ff0_0ff0;

export function GrabThrowSystem(ctx: GameState) {
  const physics = getModule(ctx, PhysicsModule);
  // const { physicsWorld } = physics;
  const input = getModule(ctx, InputModule);

  let heldEntity = grabQuery(ctx.world)[0];

  const grabBtn = input.actions.get("Grab") as ButtonActionState;
  const grabBtn2 = input.actions.get("Grab2") as ButtonActionState;
  const throwBtn = input.actions.get("Throw") as ButtonActionState;
  const throwBtn2 = input.actions.get("Throw2") as ButtonActionState;

  const grabPressed = grabBtn.pressed || grabBtn2.pressed;
  const throwPressed = throwBtn.pressed || throwBtn2.pressed;

  // if holding and entity and throw is pressed
  if (heldEntity && throwPressed) {
    removeComponent(ctx.world, GrabComponent, heldEntity);

    mat4.getRotation(_cameraWorldQuat, Transform.worldMatrix[ctx.activeCamera]);
    const direction = vec3.set(_direction, 0, 0, -1);
    vec3.transformQuat(direction, direction, _cameraWorldQuat);
    vec3.scale(direction, direction, CUBE_THROW_FORCE);

    // fire!
    _impulse.x = direction[0];
    _impulse.y = direction[1];
    _impulse.z = direction[2];
    RigidBody.store.get(heldEntity)?.applyImpulse(_impulse, true);

    // if holding an entity and grab is pressed again
  } else if (grabPressed && heldEntity) {
    // release
    removeComponent(ctx.world, GrabComponent, heldEntity);

    // if grab is pressed
  } else if (grabPressed) {
    // raycast outward from camera
    const cameraMatrix = Transform.worldMatrix[ctx.activeCamera];
    mat4.getRotation(_cameraWorldQuat, cameraMatrix);

    const target = vec3.set(_target, 0, 0, -1);
    vec3.transformQuat(target, target, _cameraWorldQuat);
    vec3.scale(target, target, GRAB_MAX_DISTANCE);

    const source = mat4.getTranslation(vec3.create(), cameraMatrix);

    const s: Vector3 = new Vector3().fromArray(source);
    const t: Vector3 = new Vector3().fromArray(target);

    const ray = new RAPIER.Ray(s, t);
    const maxToi = 4.0;
    const solid = true;

    // shapeCastPosition.copy(s);

    // TODO: use shape for pickup and ray for things like constraint tools
    const hit = physics.physicsWorld.castRay(ray, maxToi, solid, collisionGroups);
    // const hit = physicsWorld.castShape(shapeCastPosition, shapeCastRotation, t, colliderShape, ctx.dt, collisionGroups);

    if (hit != null) {
      // const hitPoint = ray.pointAt(hit.toi); // ray.origin + ray.dir * toi
      const eid = physics.handleToEid.get(hit.colliderHandle);
      if (!eid) {
        console.warn(`Could not find entity for physics handle ${hit.colliderHandle}`);
      } else {
        // GrabComponent.joint[eid].set([hitPoint.x, hitPoint.y, hitPoint.z]);
        addComponent(ctx.world, GrabComponent, eid);
        if (!hasComponent(ctx.world, Owned, eid)) {
          addComponent(ctx.world, Owned, eid);
          // send message to remove on other side
          broadcastReliable(ctx, createRemoveOwnershipMessage(ctx, eid));
        }
      }
    }
  }

  // if still holding entity, move towards the grab point
  heldEntity = grabQuery(ctx.world)[0];
  if (heldEntity) {
    const heldPosition = Transform.position[heldEntity];

    const target = _target;
    mat4.getTranslation(target, Transform.worldMatrix[ctx.activeCamera]);

    mat4.getRotation(_cameraWorldQuat, Transform.worldMatrix[ctx.activeCamera]);
    const direction = vec3.set(_direction, 0, 0, 1);
    vec3.transformQuat(direction, direction, _cameraWorldQuat);
    vec3.scale(direction, direction, GRAB_DISTANCE);

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
