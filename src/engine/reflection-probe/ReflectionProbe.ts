import { Box3, Object3D, Vector3 } from "three";

import { updateTransformFromNode } from "../node/node.render";
import { RenderThreadState } from "../renderer/renderer.render";
import { RenderNode, RenderReflectionProbe } from "../resource/resource.render";

export class ReflectionProbe extends Object3D {
  public box: Box3;
  private size: Vector3;
  public needsUpdate: boolean;

  constructor(public resource: RenderReflectionProbe) {
    super();
    this.box = new Box3();
    this.size = new Vector3();
    this.needsUpdate = true;
  }

  update(ctx: RenderThreadState, node: RenderNode) {
    if (this.needsUpdate && this.resource.size) {
      updateTransformFromNode(ctx, node, this);
      this.size.fromArray(this.resource.size);
      this.box.setFromCenterAndSize(this.position, this.size);
    }
  }
}
