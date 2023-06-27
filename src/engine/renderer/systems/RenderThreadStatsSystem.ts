import { getModule } from "../../module/module.common";
import { RenderStats } from "../renderer.common";
import { RenderContext, RendererModule } from "../renderer.render";

export function RenderThreadStatsSystem(ctx: RenderContext) {
  const renderModule = getModule(ctx, RendererModule);

  const {
    render: { frame, calls, triangles, points, lines },
    memory: { geometries, textures },
    programs,
  } = renderModule.renderer.info;

  if (ctx.isStaleFrame) {
    renderModule.staleTripleBufferCounter++;
  } else {
    if (renderModule.staleTripleBufferCounter > 1) {
      renderModule.staleFrameCounter++;
    }

    renderModule.staleTripleBufferCounter = 0;
  }

  const end = performance.now();

  const frameDuration = (end - ctx.elapsed) / 1000;

  const statsBuffer = renderModule.statsBuffer;
  statsBuffer.f32[RenderStats.fps] = 1 / ctx.dt;
  statsBuffer.f32[RenderStats.frameTime] = ctx.dt * 1000;
  statsBuffer.f32[RenderStats.frameDuration] = frameDuration;
  statsBuffer.u32[RenderStats.frame] = frame;
  statsBuffer.u32[RenderStats.staleFrames] = renderModule.staleFrameCounter;
  statsBuffer.u32[RenderStats.drawCalls] = calls;
  statsBuffer.u32[RenderStats.programs] = programs ? programs.length : 0;
  statsBuffer.u32[RenderStats.geometries] = geometries;
  statsBuffer.u32[RenderStats.textures] = textures;
  statsBuffer.u32[RenderStats.triangles] = triangles;
  statsBuffer.u32[RenderStats.points] = points;
  statsBuffer.u32[RenderStats.lines] = lines;

  renderModule.renderer.info.reset();
}
