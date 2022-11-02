import { copyToWriteBuffer } from "../allocator/TripleBuffer";
import { GameState } from "../GameTypes";
import { getModule } from "../module/module.common";
import { ScriptingModule } from "../scripting/scripting.game";
import { RemoteResource, ResourceDefinition } from "./ResourceDefinition";

export function GameResourceSystem(ctx: GameState) {
  const { scripts } = getModule(ctx, ScriptingModule);

  commitResources(ctx.resourceManager.resources);

  for (let i = 0; i < scripts.length; i++) {
    const script = scripts[i];
    commitResources(script.resourceManager.resources);
  }
}

function commitResources(resources: RemoteResource<ResourceDefinition>[]) {
  for (let i = 0; i < resources.length; i++) {
    const resource = resources[i];
    const byteView = resource.byteView;

    if (resource.initialized) {
      copyToWriteBuffer(resource.tripleBuffer, byteView);
    } else {
      const tripleBufferByteViews = resource.tripleBuffer.byteViews;
      tripleBufferByteViews[0].set(byteView);
      tripleBufferByteViews[1].set(byteView);
      tripleBufferByteViews[2].set(byteView);
      resource.initialized = true;
    }
  }
}
