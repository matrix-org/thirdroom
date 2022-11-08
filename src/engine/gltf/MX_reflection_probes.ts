import { GameState } from "../GameTypes";
import { createReflectionProbeResource, RemoteReflectionProbe } from "../reflection-probe/reflection-probe.game";
import { SamplerMapping } from "../resource/schema";
import { GLTFNode, GLTFScene } from "./GLTF";
import { GLTFResource, loadGLTFTexture } from "./gltf.game";

export function hasReflectionProbeExtension(property: GLTFNode | GLTFScene) {
  return property.extensions?.MX_reflection_probes !== undefined;
}

export async function loadGLTFReflectionProbe(
  ctx: GameState,
  resource: GLTFResource,
  property: GLTFNode | GLTFScene
): Promise<RemoteReflectionProbe> {
  const index = property.extensions!.MX_reflection_probes!.reflectionProbe;

  let reflectionProbePromise = resource.reflectionProbePromises.get(index);

  if (reflectionProbePromise) {
    return reflectionProbePromise;
  }

  reflectionProbePromise = _loadGLTFReflectionProbe(ctx, resource, index);

  resource.reflectionProbePromises.set(index, reflectionProbePromise);

  return reflectionProbePromise;
}

async function _loadGLTFReflectionProbe(
  ctx: GameState,
  resource: GLTFResource,
  index: number
): Promise<RemoteReflectionProbe> {
  const extension = resource.root.extensions?.MX_reflection_probes;

  if (!extension) {
    throw new Error("glTF file has no MX_reflection_probes extension");
  }

  if (!extension.reflectionProbes || !extension.reflectionProbes[index]) {
    throw new Error(`Reflection Probe ${index} not found`);
  }

  const reflectionProbeDef = extension.reflectionProbes[index];

  const reflectionProbe = createReflectionProbeResource(ctx, {
    reflectionProbeTexture: await loadGLTFTexture(resource, reflectionProbeDef.reflectionProbeTexture.index, {
      mapping: SamplerMapping.EquirectangularReflectionMapping,
      flipY: false,
    }),
    size: reflectionProbeDef.size ? new Float32Array(reflectionProbeDef.size) : undefined,
  });

  resource.reflectionProbes.set(index, reflectionProbe);

  return reflectionProbe;
}
