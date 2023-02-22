import { copyToWriteBuffer } from "../allocator/TripleBuffer";
import { GameState } from "../GameTypes";
import { getModule } from "../module/module.common";
import { ResourceModule } from "./resource.game";

export function GameResourceSystem(ctx: GameState) {
  const { resources } = getModule(ctx, ResourceModule);

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
