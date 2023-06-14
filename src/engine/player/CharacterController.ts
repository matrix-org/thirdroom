import { removeComponent, addComponent, defineComponent, hasComponent } from "bitecs";

import { PlayerModule } from "./Player.game";
import { ourPlayerQuery } from "./Player";
import { GameContext } from "../GameTypes";
import { ActionMap, ActionType, BindingType, ButtonActionState } from "../input/ActionMap";
import { InputModule } from "../input/input.game";
import { getModule } from "../module/module.common";
import { PhysicsModuleState, PhysicsModule } from "../physics/physics.game";
import { RemoteNode } from "../resource/RemoteResources";
import { tryGetRemoteResource } from "../resource/resource.game";
import { addFlyControls, FlyControls } from "./FlyCharacterController";
import { getAvatar } from "./getAvatar";
import { getCamera } from "./getCamera";
import { KinematicControls } from "./KinematicCharacterController";

export enum CharacterControllerType {
  FirstPerson = "first-person",
  Fly = "fly",
}

export const CharacterControllerAction = {
  ToggleFlyMode: "toggleFlyMode",
  ToggleThirdPerson: "toggleThirdPerson",
};

export const CharacterControllerActionMap: ActionMap = {
  id: "character-controller",
  actionDefs: [
    {
      id: "toggleFlyMode",
      path: CharacterControllerAction.ToggleFlyMode,
      type: ActionType.Button,
      bindings: [
        {
          type: BindingType.Button,
          path: "Keyboard/KeyB",
        },
      ],
    },
    {
      id: "toggleThirdPerson",
      path: CharacterControllerAction.ToggleThirdPerson,
      type: ActionType.Button,
      bindings: [
        {
          type: BindingType.Button,
          path: "Keyboard/KeyV",
        },
      ],
    },
  ],
};

export interface ISceneCharacterControllerComponent {
  type: CharacterControllerType;
}

export const SceneCharacterControllerComponent: Map<number, ISceneCharacterControllerComponent> = new Map();

function swapToFlyPlayerRig(ctx: GameContext, physics: PhysicsModuleState, node: RemoteNode) {
  removeComponent(ctx.world, KinematicControls, node.eid);
  addFlyControls(ctx, node.eid);
}

function swapToPlayerRig(ctx: GameContext, physics: PhysicsModuleState, node: RemoteNode) {
  removeComponent(ctx.world, FlyControls, node.eid);
  addComponent(ctx.world, KinematicControls, node.eid);
}

export const ThirdPersonComponent = defineComponent();

function swapToThirdPerson(ctx: GameContext, node: RemoteNode) {
  addComponent(ctx.world, ThirdPersonComponent, node.eid);
  const camera = getCamera(ctx, node);
  camera.position[2] = 2;
  camera.parent!.position[0] = 0.4;

  const avatar = getAvatar(ctx, node);
  avatar.visible = true;
}

function swapToFirstPerson(ctx: GameContext, node: RemoteNode) {
  removeComponent(ctx.world, ThirdPersonComponent, node.eid);
  const camera = getCamera(ctx, node);
  camera.position[2] = 0;
  camera.parent!.position[0] = 0;

  const avatar = getAvatar(ctx, node);
  avatar.visible = false;
}

export function EnableCharacterControllerSystem(ctx: GameContext) {
  const input = getModule(ctx, InputModule);
  const physics = getModule(ctx, PhysicsModule);

  const eid = ourPlayerQuery(ctx.world)[0];

  if (eid) {
    const player = tryGetRemoteResource<RemoteNode>(ctx, eid);
    const toggleFlyMode = input.actionStates.get(CharacterControllerAction.ToggleFlyMode) as ButtonActionState;

    const camRigModule = getModule(ctx, PlayerModule);

    if (camRigModule.orbiting) {
      return;
    }

    if (toggleFlyMode.pressed) {
      if (hasComponent(ctx.world, FlyControls, player.eid)) {
        swapToPlayerRig(ctx, physics, player);
      } else {
        swapToFlyPlayerRig(ctx, physics, player);
      }
    }

    const toggleCameraMode = input.actionStates.get(CharacterControllerAction.ToggleThirdPerson) as ButtonActionState;
    if (toggleCameraMode.pressed) {
      if (hasComponent(ctx.world, ThirdPersonComponent, player.eid)) {
        swapToFirstPerson(ctx, player);
      } else {
        swapToThirdPerson(ctx, player);
      }
    }
  }
}
