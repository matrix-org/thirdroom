import { getModule } from "../../module/module.common";
import { CameraType } from "../../resource/schema";
import { RenderContext, RendererModule } from "../renderer.render";

export function ResizeViewportSystem(ctx: RenderContext) {
  const rendererModule = getModule(ctx, RendererModule);
  const { needsResize, canvasWidth, canvasHeight, renderPipeline } = rendererModule;

  const activeScene = ctx.worldResource.environment?.publicScene;
  const activeCameraNode = ctx.worldResource.activeCameraNode;

  // TODO: Remove this
  if (activeScene?.eid !== rendererModule.prevSceneResource) {
    rendererModule.enableMatrixMaterial = false;
  }

  if (
    activeCameraNode &&
    activeCameraNode.cameraObject &&
    activeCameraNode.camera &&
    (needsResize || rendererModule.prevCameraResource !== activeCameraNode.eid)
  ) {
    if (
      "isPerspectiveCamera" in activeCameraNode.cameraObject &&
      activeCameraNode.camera.type === CameraType.Perspective
    ) {
      if (activeCameraNode.camera.aspectRatio === 0) {
        activeCameraNode.cameraObject.aspect = canvasWidth / canvasHeight;
      }
    }

    activeCameraNode.cameraObject.updateProjectionMatrix();

    renderPipeline.setSize(canvasWidth, canvasHeight);
    rendererModule.needsResize = false;
    rendererModule.prevCameraResource = activeCameraNode.eid;
    rendererModule.prevSceneResource = activeScene?.eid;
  }
}
