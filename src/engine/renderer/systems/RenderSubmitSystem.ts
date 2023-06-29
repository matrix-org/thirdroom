import { getModule, Thread } from "../../module/module.common";
import { RendererMessageType } from "../renderer.common";
import { RenderContext, RendererModule } from "../renderer.render";

export function RenderSubmitSystem(ctx: RenderContext) {
  const rendererModule = getModule(ctx, RendererModule);
  const { renderPipeline } = rendererModule;

  const activeScene = ctx.worldResource.environment?.publicScene;
  const activeCameraNode = ctx.worldResource.activeCameraNode;

  if (activeScene && activeCameraNode && activeCameraNode.cameraObject) {
    renderPipeline.render(rendererModule.scene, activeCameraNode.cameraObject, ctx.dt);
  }

  for (let i = rendererModule.sceneRenderedRequests.length - 1; i >= 0; i--) {
    const request = rendererModule.sceneRenderedRequests[i];

    if (activeScene && activeScene.eid === request.sceneResourceId && --request.frames <= 0) {
      ctx.sendMessage(Thread.Game, {
        type: RendererMessageType.SceneRenderedNotification,
        id: request.id,
      });

      rendererModule.sceneRenderedRequests.splice(i, 1);
    }
  }
}
