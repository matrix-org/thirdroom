import { addComponent, defineQuery } from "bitecs";
import { mat4, quat, vec3 } from "gl-matrix";
import RAPIER from "@dimforge/rapier3d-compat";
import { Quaternion, Vector3 } from "three";

import { getCamera } from "../engine/camera/camera.game";
import { updateMatrixWorld } from "../engine/component/transform";
import { GameState } from "../engine/GameTypes";
import { enableActionMap } from "../engine/input/ActionMappingSystem";
import { ActionMap, ActionType, BindingType, ButtonActionState } from "../engine/input/ActionMap";
import { InputModule } from "../engine/input/input.game";
import { tryGetInputController, InputController } from "../engine/input/InputController";
import { defineModule, getModule } from "../engine/module/module.common";
import { tryGetRemoteResource } from "../engine/resource/resource.game";
import { RemoteNode } from "../engine/resource/RemoteResources";
import { RigidBody } from "../engine/physics/physics.game";

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
      networked: true,
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
      networked: true,
    },
  ],
};

export const FlyCharacterControllerModule = defineModule<GameState, FlyCharacterControllerModuleState>({
  name: "fly-character-controller",
  create() {
    return {};
  },
  init(ctx) {
    const input = getModule(ctx, InputModule);
    const controller = input.defaultController;
    enableActionMap(controller, FlyCharacterControllerActionMap);
  },
});

interface IFlyPlayerRig {
  speed: number;
}

export const FlyControls: Map<number, IFlyPlayerRig> = new Map();
export const flyControlsQuery = defineQuery([FlyControls]);

const velocityVec = vec3.create();
const cameraWorldRotation = quat.create();

export function addFlyControls(ctx: GameState, eid: number) {
  addComponent(ctx.world, FlyControls, eid);
  FlyControls.set(eid, {
    speed: 10,
  });
  return eid;
}

const _q = new Quaternion();
const _p = new Vector3();

function applyFlyControls(
  ctx: GameState,
  body: RAPIER.RigidBody,
  controller: InputController,
  playerRig: RemoteNode,
  camera: RemoteNode
) {
  const { speed } = FlyControls.get(playerRig.eid)!;
  const moveVec = controller.actionStates.get(FlyCharacterControllerActions.Move) as Float32Array;
  const boost = controller.actionStates.get(FlyCharacterControllerActions.Boost) as ButtonActionState;

  const boostModifier = boost.held ? 2 : 1;

  vec3.set(velocityVec, moveVec[0], 0, -moveVec[1]);

  updateMatrixWorld(camera);

  mat4.getRotation(cameraWorldRotation, camera.worldMatrix);
  vec3.transformQuat(velocityVec, velocityVec, cameraWorldRotation);
  vec3.normalize(velocityVec, velocityVec);
  vec3.scale(velocityVec, velocityVec, ctx.dt * speed * boostModifier);
  vec3.add(playerRig.position, playerRig.position, velocityVec);

  _q.fromArray(playerRig.quaternion);
  _p.fromArray(playerRig.position);

  body.setNextKinematicRotation(_q);
  body.setNextKinematicTranslation(_p);
}

export function FlyControllerSystem(ctx: GameState) {
  const input = getModule(ctx, InputModule);
  const ents = flyControlsQuery(ctx.world);

  for (let i = 0; i < ents.length; i++) {
    const playerRigEid = ents[i];
    const playerRig = tryGetRemoteResource<RemoteNode>(ctx, playerRigEid);
    const camera = getCamera(ctx, playerRig);
    const controller = tryGetInputController(input, playerRigEid);

    const body = RigidBody.store.get(playerRigEid);

    if (!body) {
      throw new Error("rigidbody not found on eid " + playerRigEid);
    }

    applyFlyControls(ctx, body, controller, playerRig, camera);
  }
}
