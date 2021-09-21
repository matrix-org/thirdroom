import { World } from "./World";
import { Clock } from "three";

export function TimeModule(world: World) {
  const clock = new Clock();
  world.elapsed = 0;
  world.delta = 0;

  function TimeSystem(world: World) {
    world.delta = clock.getDelta();
    world.elapsed = clock.elapsedTime;
    return world;
  }

  return {
    TimeSystem,
    dispose: () => {
      clock.stop();
    },
  };
}
