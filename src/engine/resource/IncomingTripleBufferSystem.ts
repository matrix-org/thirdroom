import { swapReadBufferFlags } from "../allocator/TripleBuffer";
import { GameState } from "../GameTypes";

export function IncomingTripleBufferSystem(ctx: GameState) {
  swapReadBufferFlags(ctx.mainToGameTripleBufferFlags);
  swapReadBufferFlags(ctx.renderToGameTripleBufferFlags);
}
