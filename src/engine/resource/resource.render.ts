import { RendererAccessorResource } from "../accessor/accessor.render";
import { RendererImageResource } from "../image/image.render";
import { RendererMaterialResource } from "../material/material.render";
import {
  RendererMeshResource,
  RendererMeshPrimitiveResource,
  RendererInstancedMeshResource,
  RendererLightMapResource,
  RendererSkinResource,
} from "../mesh/mesh.render";
import { RendererNodeResource } from "../node/node.render";
import { RendererReflectionProbeResource } from "../reflection-probe/reflection-probe.render";
import { RenderThreadState } from "../renderer/renderer.render";
import { RendererSceneResource } from "../scene/scene.render";
import { RendererTextureResource } from "../texture/texture.render";
import { createLocalResourceModule } from "./resource.common";
import {
  SamplerResource,
  LightResource,
  CameraResource,
  BufferResource,
  BufferViewResource,
  InteractableResource,
  SparseAccessorResource,
  TilesRendererResource,
  NametagResource,
  AudioDataResource,
  AudioSourceResource,
  AudioEmitterResource,
} from "./schema";

const {
  ResourceModule,
  getLocalResource,
  getLocalResources,
  waitForLocalResource,
  registerResource,
  registerResourceLoader,
  getResourceDisposed,
  ResourceDisposalSystem,
} = createLocalResourceModule<RenderThreadState>([
  SamplerResource,
  RendererSceneResource,
  RendererTextureResource,
  RendererMaterialResource,
  LightResource,
  RendererReflectionProbeResource,
  CameraResource,
  BufferResource,
  BufferViewResource,
  RendererImageResource,
  InteractableResource,
  RendererAccessorResource,
  SparseAccessorResource,
  RendererMeshResource,
  RendererMeshPrimitiveResource,
  RendererInstancedMeshResource,
  RendererLightMapResource,
  RendererSkinResource,
  RendererNodeResource,
  TilesRendererResource,
  NametagResource,
  AudioDataResource,
  AudioSourceResource,
  AudioEmitterResource,
]);

export {
  ResourceModule,
  getLocalResource,
  getLocalResources,
  waitForLocalResource,
  registerResource,
  registerResourceLoader,
  getResourceDisposed,
  ResourceDisposalSystem,
};
