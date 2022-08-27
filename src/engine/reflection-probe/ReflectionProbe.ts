import { Box3, Box3Helper, Color, Object3D, Vector3 } from "three";

import { ReadObjectTripleBufferView } from "../allocator/ObjectBufferView";
import { RendererNodeTripleBuffer } from "../node/node.common";
import { LocalNode, updateTransformFromNode } from "../node/node.render";
import { RenderThreadState } from "../renderer/renderer.render";
import { LocalReflectionProbeResource } from "./reflection-probe.render";

const zeroVec3 = new Vector3(0, 0, 0);

export class ReflectionProbe extends Object3D {
  public box: Box3;

  private boxHelper: Box3Helper;
  //private probeHelper: Mesh;

  constructor(public resource: LocalReflectionProbeResource) {
    super();

    this.box = new Box3();

    // this.probeHelper = new Mesh(
    //   new SphereGeometry(0.25),
    //   new MeshStandardMaterial({
    //     roughness: 0,
    //     metalness: 1,
    //   })
    // );
    // this.add(this.probeHelper);

    this.boxHelper = new Box3Helper(new Box3(), new Color(0xffffff));
    this.add(this.boxHelper);
  }

  update(ctx: RenderThreadState, node: LocalNode, nodeReadView: ReadObjectTripleBufferView<RendererNodeTripleBuffer>) {
    //(this.probeHelper.material as MeshStandardMaterial).envMap = this.resource.reflectionProbeTexture.texture;

    if (this.resource.size) {
      updateTransformFromNode(ctx, nodeReadView, this);
      this.box.setFromCenterAndSize(this.position, this.resource.size);
      this.boxHelper.box.setFromCenterAndSize(zeroVec3, this.resource.size);
    }
  }
}
