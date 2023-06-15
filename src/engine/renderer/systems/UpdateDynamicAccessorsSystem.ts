import { getModule } from "../../module/module.common";
import { RenderContext, RendererModule } from "../renderer.render";

export function UpdateDynamicAccessorsSystem(ctx: RenderContext) {
  const { dynamicAccessors } = getModule(ctx, RendererModule);

  for (let i = 0; i < dynamicAccessors.length; i++) {
    const accessor = dynamicAccessors[i];

    const version = accessor.version;

    if (version !== accessor.prevVersion) {
      accessor.attribute.needsUpdate = true;
      accessor.prevVersion = version;
    }
  }
}
