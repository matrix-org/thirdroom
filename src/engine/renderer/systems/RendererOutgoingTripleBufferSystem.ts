import { swapWriteBufferFlags } from "../../allocator/TripleBuffer";
import { RenderContext } from "../renderer.render";

export function RendererOutgoingTripleBufferSystem(ctx: RenderContext) {
  swapWriteBufferFlags(ctx.renderToGameTripleBufferFlags);
}
