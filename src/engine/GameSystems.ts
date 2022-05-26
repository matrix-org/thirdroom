import { copyToWriteBuffer, swapWriteBuffer } from "./allocator/TripleBuffer";
import { renderableBuffer } from "./component/buffers";
import { updateMatrixWorld } from "./component/transform";
import { GameState } from "./GameTypes";
import { getModule } from "./module/module.common";
import { RendererModule } from "./renderer/renderer.game";

export function TimeSystem(state: GameState) {
  const now = performance.now();
  state.dt = (now - state.elapsed) / 1000;
  state.elapsed = now;
}

export const UpdateWorldMatrixSystem = (state: GameState) => {
  updateMatrixWorld(state.scene);
};

export const RenderableTripleBufferSystem = (state: GameState) => {
  const renderModule = getModule(state, RendererModule);

  copyToWriteBuffer(renderModule.renderableTripleBuffer, renderableBuffer);
  swapWriteBuffer(renderModule.renderableTripleBuffer);
};
