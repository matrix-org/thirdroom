import { swapReadBufferFlags } from "../allocator/TripleBuffer";
import { RenderThreadState } from "./renderer.render";

export function RendererIncomingTripleBufferSystem(ctx: RenderThreadState) {
  const bufferSwapped = swapReadBufferFlags(ctx.gameToRenderTripleBufferFlags);
  ctx.isStaleFrame = !bufferSwapped;
}
