import { swapWriteBufferFlags } from "../allocator/TripleBuffer";
import { GameState } from "../GameTypes";

export function OutgoingTripleBufferSystem(ctx: GameState) {
  swapWriteBufferFlags(ctx.gameToMainTripleBufferFlags);
  swapWriteBufferFlags(ctx.gameToRenderTripleBufferFlags);
}
