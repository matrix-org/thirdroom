import RAPIER from "@dimforge/rapier3d-compat";
import { addComponent } from "bitecs";
import { mat4, vec3, quat } from "gl-matrix";

import { Transform, addChild } from "../engine/component/transform";
import { GameState } from "../engine/GameTypes";
import {
  ActionMap,
  ActionType,
  BindingType,
  ButtonActionState,
  enableActionMap,
} from "../engine/input/ActionMappingSystem";
import { InputModule } from "../engine/input/input.game";
import { defineModule, getModule } from "../engine/module/module.common";
import { Networked, Owned } from "../engine/network/network.game";
import { RigidBody } from "../engine/physics/physics.game";
import { getPrefabTemplate } from "../engine/prefab";

type CubeSpawnerModuleState = {};

export const CubeSpawnerModule = defineModule<GameState, CubeSpawnerModuleState>({
  name: "cube-spawner",
  create() {
    return {};
  },
  init(state) {
    enableActionMap(state, CubeSpawnerActionMap);
  },
});

export const CubeSpawnerActionMap: ActionMap = {
  id: "cube-spawner",
  actions: [
    {
      id: "spawnCube",
      path: "SpawnCube",
      type: ActionType.Button,
      bindings: [
        {
          type: BindingType.Button,
          path: "Keyboard/KeyF",
        },
      ],
    },
  ],
};

export const CubeSpawnerSystem = (state: GameState) => {
  const input = getModule(state, InputModule);
  const spawnCube = input.actions.get("SpawnCube") as ButtonActionState;
  if (spawnCube.pressed) {
    const cube = getPrefabTemplate(state, "blue-cube")?.create();

    addComponent(state.world, Networked, cube);
    // addComponent(state.world, NetworkTransform, cube);
    addComponent(state.world, Owned, cube);

    mat4.getTranslation(Transform.position[cube], Transform.worldMatrix[state.camera]);

    const worldQuat = quat.create();
    mat4.getRotation(worldQuat, Transform.worldMatrix[state.camera]);
    const direction = vec3.set(vec3.create(), 0, 0, -1);
    vec3.transformQuat(direction, direction, worldQuat);
    vec3.scale(direction, direction, 10);
    RigidBody.store.get(cube)?.applyImpulse(new RAPIER.Vector3(direction[0], direction[1], direction[2]), true);

    addChild(state.scene, cube);
  }
};
