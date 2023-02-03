import { RenderAccessor } from "../resource/resource.render";

export function updateDynamicAccessors(dynamicAccessors: RenderAccessor[]) {
  for (let i = 0; i < dynamicAccessors.length; i++) {
    const accessor = dynamicAccessors[i];

    const version = accessor.version;

    if (version !== accessor.prevVersion) {
      accessor.attribute.needsUpdate = true;
      accessor.prevVersion = version;
    }
  }
}
