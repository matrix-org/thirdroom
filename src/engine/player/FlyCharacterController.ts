import { addComponent, defineQuery } from "bitecs";
import { quat, vec3 } from "gl-matrix";
import RAPIER from "@dimforge/rapier3d-compat";
import { Quaternion, Vector3 } from "three";

import { getCamera } from "./getCamera";
import { updateMatrixWorld } from "../component/transform";
import { GameContext } from "../GameTypes";
import { enableActionMap } from "../input/ActionMappingSystem";
import { ActionMap, ActionType, BindingType, ButtonActionState } from "../input/ActionMap";
import { GameInputModule, InputModule } from "../input/input.game";
import { defineModule, getModule } from "../module/module.common";
import { tryGetRemoteResource } from "../resource/resource.game";
import { RemoteNode } from "../resource/RemoteResources";
import { RigidBody } from "../physics/physics.game";
import { getRotationNoAlloc } from "../utils/getRotationNoAlloc";

type FlyCharacterControllerModuleState = {};

export const FlyCharacterControllerActions = {
  Move: "FlyCharacterController/Move",
  Boost: "FlyCharacterController/Boost",
};

export const FlyCharacterControllerActionMap: ActionMap = {
  id: "fly-character-controller",
  actionDefs: [
    {
      id: "move",
      path: FlyCharacterControllerActions.Move,
      type: ActionType.Vector2,
      bindings: [
        {
          type: BindingType.DirectionalButtons,
          up: "Keyboard/KeyW",
          down: "Keyboard/KeyS",
          left: "Keyboard/KeyA",
          right: "Keyboard/KeyD",
        },
      ],
    },
    {
      id: "boost",
      path: FlyCharacterControllerActions.Boost,
      type: ActionType.Button,
      bindings: [
        {
          type: BindingType.Button,
          path: "Keyboard/ShiftLeft",
        },
      ],
    },
  ],
};

export const FlyCharacterControllerModule = defineModule<GameContext, FlyCharacterControllerModuleState>({
  name: "fly-character-controller",
  create() {
    return {};
  },
  init(ctx) {
    const input = getModule(ctx, InputModule);
    enableActionMap(input, FlyCharacterControllerActionMap);
  },
});

interface IFlyPlayerRig {
  speed: number;
}

export const FlyControls: Map<number, IFlyPlayerRig> = new Map();
export const flyControlsQuery = defineQuery([FlyControls]);

const velocityVec = vec3.create();
const cameraWorldRotation = quat.create();

export function addFlyControls(ctx: GameContext, eid: number) {
  addComponent(ctx.world, FlyControls, eid);
  FlyControls.set(eid, {
    speed: 10,
  });
  return eid;
}

const _q = new Quaternion();
const _p = new Vector3();

function applyFlyControls(
  ctx: GameContext,
  body: RAPIER.RigidBody,
  input: GameInputModule,
  playerRig: RemoteNode,
  camera: RemoteNode
) {
  const { speed } = FlyControls.get(playerRig.eid)!;
  const actionStates = input.actionStates;
  const moveVec = actionStates.get(FlyCharacterControllerActions.Move) as Float32Array;
  const boost = actionStates.get(FlyCharacterControllerActions.Boost) as ButtonActionState;

  const boostModifier = boost.held ? 2 : 1;

  vec3.set(velocityVec, moveVec[0], 0, -moveVec[1]);

  updateMatrixWorld(camera);

  getRotationNoAlloc(cameraWorldRotation, camera.worldMatrix);
  vec3.transformQuat(velocityVec, velocityVec, cameraWorldRotation);
  vec3.normalize(velocityVec, velocityVec);
  vec3.scale(velocityVec, velocityVec, ctx.dt * speed * boostModifier);
  vec3.add(playerRig.position, playerRig.position, velocityVec);

  _q.fromArray(playerRig.quaternion);
  _p.fromArray(playerRig.position);

  body.setNextKinematicRotation(_q);
  body.setNextKinematicTranslation(_p);
}

export function FlyControllerSystem(ctx: GameContext) {
  const input = getModule(ctx, InputModule);
  const ents = flyControlsQuery(ctx.world);

  for (let i = 0; i < ents.length; i++) {
    const playerRigEid = ents[i];
    const playerRig = tryGetRemoteResource<RemoteNode>(ctx, playerRigEid);
    const camera = getCamera(ctx, playerRig);
    const body = RigidBody.store.get(playerRigEid);

    if (!body) {
      throw new Error("rigidbody not found on eid " + playerRigEid);
    }

    applyFlyControls(ctx, body, input, playerRig, camera);
  }
}
