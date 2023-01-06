export enum CharacterControllerType {
  FirstPerson = "first-person",
  Fly = "fly",
}

export interface ISceneCharacterControllerComponent {
  type: CharacterControllerType;
}

export const SceneCharacterControllerComponent: Map<number, ISceneCharacterControllerComponent> = new Map();
