import { getModule } from "../module/module.common";
import { StatsModule } from "../stats/stats.render";
import { clamp } from "../utils/interpolation";
import { RendererModule, RenderThreadState } from "./renderer.render";

const DPR_STEP = 0.02;
const DPR_MIN = 0.33;
const FRAME_MIN = 1 / 60;
const FRAME_MARGIN = 0.001;

let tick = 0;
export function DynamicResolutionSystem(ctx: RenderThreadState) {
  const { renderer, dynamicResolutionScaling } = getModule(ctx, RendererModule);

  if (!dynamicResolutionScaling) return;

  const { deltaRMS } = getModule(ctx, StatsModule);

  if (tick++ % 10 === 0) {
    const dpr = renderer.getPixelRatio();
    // if rms of dt takes longer than target fps
    if (deltaRMS > FRAME_MIN + FRAME_MARGIN && dpr > DPR_MIN) {
      renderer.setPixelRatio(clamp(DPR_MIN, 1, dpr - DPR_STEP * ctx.dt * 100));
      console.log("dpr", renderer.getPixelRatio());
    } else if (deltaRMS < FRAME_MIN - FRAME_MARGIN && dpr < 1) {
      renderer.setPixelRatio(clamp(DPR_MIN, 1, dpr + DPR_STEP * ctx.dt * 100));
      console.log("dpr", renderer.getPixelRatio());
    }
  }
}
