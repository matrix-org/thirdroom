import { GameState } from "../GameTypes";
import { getModule } from "../module/module.common";
import { ScriptingModule } from "../scripting/scripting.game";

export function GameResourceSystem(ctx: GameState) {
  const { scripts } = getModule(ctx, ScriptingModule);

  ctx.resourceManager.commitResources();

  for (let i = 0; i < scripts.length; i++) {
    const script = scripts[i];
    script.resourceManager.commitResources();
  }
}
