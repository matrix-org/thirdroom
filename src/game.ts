import { GameState } from "./engine/GameWorker";
// import {
//   addPhysicsCharacterController,
//   PhysicsCharacterControllerSystem,
// } from "./plugins/physics-character-controller";

export async function init(state: GameState) {
  //addPhysicsCharacterController(state);

  return {
    ...state,
    systems: [
      
    ]
  }
}