import { swapReadBufferFlags, swapWriteBufferFlags } from "./allocator/TripleBuffer";
import { MainContext } from "./MainThread";

export function IncomingMainThreadTripleBufferSystem(ctx: MainContext) {
  swapReadBufferFlags(ctx.gameToMainTripleBufferFlags);
}

export function OutgoingMainThreadTripleBufferSystem(ctx: MainContext) {
  swapWriteBufferFlags(ctx.mainToGameTripleBufferFlags);
}
