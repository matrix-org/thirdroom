import { Box3, Object3D, Vector3 } from "three";

import { RendererNodeResource, updateTransformFromNode } from "../node/node.render";
import { RenderThreadState } from "../renderer/renderer.render";
import { RendererReflectionProbeResource } from "./reflection-probe.render";

export class ReflectionProbe extends Object3D {
  public box: Box3;
  private size: Vector3;
  public needsUpdate: boolean;

  constructor(public resource: RendererReflectionProbeResource) {
    super();
    this.box = new Box3();
    this.size = new Vector3();
    this.needsUpdate = true;
  }

  update(ctx: RenderThreadState, node: RendererNodeResource) {
    if (this.needsUpdate && this.resource.size) {
      updateTransformFromNode(ctx, node, this);
      this.size.fromArray(this.resource.size);
      this.box.setFromCenterAndSize(this.position, this.size);
    }
  }
}
