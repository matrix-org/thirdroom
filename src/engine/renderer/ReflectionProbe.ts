import { Box3, Object3D, Vector3 } from "three";

import { updateTransformFromNode } from "./node";
import { RenderContext } from "./renderer.render";
import { getLocalResources, RenderNode, RenderReflectionProbe } from "./RenderResources";

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

  update(ctx: RenderContext, node: RenderNode) {
    if (this.needsUpdate && this.resource.size) {
      updateTransformFromNode(ctx, node, this);
      this.size.fromArray(this.resource.size);
      this.box.setFromCenterAndSize(this.position, this.size);
    }
  }
}

const tempReflectionProbes: ReflectionProbe[] = [];

export function getReflectionProbes(ctx: RenderContext): ReflectionProbe[] {
  const nodes = getLocalResources(ctx, RenderNode);

  tempReflectionProbes.length = 0;

  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];

    if (node.reflectionProbeObject) {
      tempReflectionProbes.push(node.reflectionProbeObject);
    }
  }

  return tempReflectionProbes;
}
