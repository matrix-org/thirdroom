import { RemoteTexture, SamplerMapping } from "../resource/schema";
import { GLTFNode, GLTFScene } from "./GLTF";
import { GLTFResource, loadGLTFTexture } from "./gltf.game";

export function hasBackgroundExtension(property: GLTFNode | GLTFScene) {
  return property.extensions?.MX_background !== undefined;
}

export async function loadGLTFBackgroundTexture(
  resource: GLTFResource,
  property: GLTFNode | GLTFScene
): Promise<RemoteTexture> {
  const index = property.extensions!.MX_background!.backgroundTexture.index;

  return loadGLTFTexture(resource, index, {
    mapping: SamplerMapping.EquirectangularReflectionMapping,
    flipY: true,
  });
}
