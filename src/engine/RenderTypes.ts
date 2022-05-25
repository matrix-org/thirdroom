import { StatsBuffer } from "./stats/stats.common";
import { TripleBuffer } from "./allocator/TripleBuffer";
import { PostMessageTarget } from "./WorkerMessage";

export interface IInitialRenderThreadState {
  initialCanvasWidth: number;
  initialCanvasHeight: number;
  canvasTarget: HTMLCanvasElement | OffscreenCanvas;
  statsBuffer: StatsBuffer;
  renderableTripleBuffer: TripleBuffer;
  enabledSystems: Map<Function, boolean>;
  systems: Function[];
  resourceManagerBuffer: SharedArrayBuffer;
  gameWorkerMessageTarget: PostMessageTarget;
}
