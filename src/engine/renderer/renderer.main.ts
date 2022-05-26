import { defineModule } from "../module/module.common";
import { IInitialMainThreadState, IMainThreadContext } from "../MainThread";
import { createTripleBuffer } from "../allocator/TripleBuffer";
import { WorkerMessageType } from "../WorkerMessage";
import { createResourceManagerBuffer } from "../resources/ResourceManager";

type MainRendererModuleState = {};

export const RendererModule = defineModule<IMainThreadContext, IInitialMainThreadState, MainRendererModuleState>({
  create() {
    return {};
  },
  init(ctx) {
    const resourceManagerBuffer = createResourceManagerBuffer();

    const renderableTripleBuffer = createTripleBuffer();

    // GameWorker
    ctx.initialGameWorkerState.renderableTripleBuffer = renderableTripleBuffer;
    ctx.initialGameWorkerState.resourceManagerBuffer = resourceManagerBuffer;

    // RenderWorker
    ctx.initialRenderWorkerState.renderableTripleBuffer = renderableTripleBuffer;
    ctx.initialRenderWorkerState.resourceManagerBuffer = resourceManagerBuffer;

    function onResize() {
      ctx.renderWorker.postMessage({
        type: WorkerMessageType.RenderWorkerResize,
        canvasWidth: ctx.canvas.clientWidth,
        canvasHeight: ctx.canvas.clientHeight,
      });
    }

    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
    };
  },
});
