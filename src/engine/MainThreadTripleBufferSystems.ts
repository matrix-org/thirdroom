import { swapReadBufferFlags, swapWriteBufferFlags } from "./allocator/TripleBuffer";
import { IMainThreadContext } from "./MainThread";

export function IncomingMainThreadTripleBufferSystem(ctx: IMainThreadContext) {
  swapReadBufferFlags(ctx.gameToMainTripleBufferFlags);
}

export function OutgoingMainThreadTripleBufferSystem(ctx: IMainThreadContext) {
  swapWriteBufferFlags(ctx.mainToGameTripleBufferFlags);
}
