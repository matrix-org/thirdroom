import { swapWriteBufferFlags } from "../allocator/TripleBuffer";
import { RenderThreadState } from "./renderer.render";

export function RendererOutgoingTripleBufferSystem(ctx: RenderThreadState) {
  swapWriteBufferFlags(ctx.renderToGameTripleBufferFlags);
}
