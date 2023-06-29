import { swapReadBufferFlags } from "../allocator/TripleBuffer";
import { GameContext } from "../GameTypes";

export function IncomingTripleBufferSystem(ctx: GameContext) {
  swapReadBufferFlags(ctx.mainToGameTripleBufferFlags);
  swapReadBufferFlags(ctx.renderToGameTripleBufferFlags);
}
