import { Box3, Object3D } from "three";

import { ReadObjectTripleBufferView } from "../allocator/ObjectBufferView";
import { RendererNodeTripleBuffer } from "../node/node.common";
import { updateTransformFromNode } from "../node/node.render";
import { RenderThreadState } from "../renderer/renderer.render";
import { LocalReflectionProbeResource } from "./reflection-probe.render";

export class ReflectionProbe extends Object3D {
  public box: Box3;
  public needsUpdate: boolean;

  constructor(public resource: LocalReflectionProbeResource) {
    super();
    this.box = new Box3();
    this.needsUpdate = true;
  }

  update(ctx: RenderThreadState, nodeReadView: ReadObjectTripleBufferView<RendererNodeTripleBuffer>) {
    if (this.needsUpdate && this.resource.size) {
      updateTransformFromNode(ctx, nodeReadView, this);
      this.box.setFromCenterAndSize(this.position, this.resource.size);
    }
  }
}
