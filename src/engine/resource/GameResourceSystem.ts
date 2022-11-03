import { GameState } from "../GameTypes";
import { scriptQuery, ScriptComponent } from "../scripting/scripting.game";

export function GameResourceSystem(ctx: GameState) {
  ctx.resourceManager.commitResources();

  const scriptEntities = scriptQuery(ctx.world);

  for (let i = 0; i < scriptEntities.length; i++) {
    const eid = scriptEntities[i];
    const script = ScriptComponent.get(eid);

    if (script) {
      script.resourceManager.commitResources();
    }
  }
}
