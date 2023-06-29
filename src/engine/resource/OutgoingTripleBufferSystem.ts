import { swapWriteBufferFlags } from "../allocator/TripleBuffer";
import { GameContext } from "../GameTypes";

export function OutgoingTripleBufferSystem(ctx: GameContext) {
  swapWriteBufferFlags(ctx.gameToMainTripleBufferFlags);
  swapWriteBufferFlags(ctx.gameToRenderTripleBufferFlags);
}
