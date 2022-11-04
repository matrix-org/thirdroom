import { GameState } from "../GameTypes";
import { SamplerMapping } from "../resource/schema";
import { RemoteTexture } from "../texture/texture.game";
import { GLTFNode, GLTFScene } from "./GLTF";
import { GLTFResource, loadGLTFTexture } from "./gltf.game";

export function hasBackgroundExtension(property: GLTFNode | GLTFScene) {
  return property.extensions?.MX_background !== undefined;
}

export async function loadGLTFBackgroundTexture(
  ctx: GameState,
  resource: GLTFResource,
  property: GLTFNode | GLTFScene
): Promise<RemoteTexture> {
  const index = property.extensions!.MX_background!.backgroundTexture.index;

  return loadGLTFTexture(ctx, resource, index, {
    mapping: SamplerMapping.EquirectangularReflectionMapping,
    flipY: true,
  });
}
