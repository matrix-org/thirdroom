import { swapReadBufferFlags } from "../../allocator/TripleBuffer";
import { RenderContext } from "../renderer.render";

export function RendererIncomingTripleBufferSystem(ctx: RenderContext) {
  const bufferSwapped = swapReadBufferFlags(ctx.gameToRenderTripleBufferFlags);
  ctx.isStaleFrame = !bufferSwapped;
}
