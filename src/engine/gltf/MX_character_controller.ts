import { addComponent } from "bitecs";

import { GameState } from "../GameTypes";
import { GLTFScene } from "./GLTF";
import { GLTFResource } from "./gltf.game";

export enum CharacterControllerType {
  FirstPerson = "first-person",
  Fly = "fly",
}

export interface ISceneCharacterControllerComponent {
  type: CharacterControllerType;
}

export const SceneCharacterControllerComponent: Map<number, ISceneCharacterControllerComponent> = new Map();

export function hasCharacterControllerExtension(scene: GLTFScene) {
  return scene.extensions?.MX_character_controller !== undefined;
}

export function inflateSceneCharacterController(
  ctx: GameState,
  resource: GLTFResource,
  sceneIndex: number,
  sceneEid: number
) {
  if (!resource.root.scenes) {
    return;
  }

  const type = resource.root.scenes[sceneIndex]?.extensions?.MX_character_controller?.type as
    | CharacterControllerType
    | undefined;

  if (type === undefined) {
    return;
  }

  addComponent(ctx.world, SceneCharacterControllerComponent, sceneEid);
  SceneCharacterControllerComponent.set(sceneEid, {
    type,
  });
}
