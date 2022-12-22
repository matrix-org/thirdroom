import { MainThreadAudioDataResource } from "../audio/audio-data.main";
import { MainThreadAudioEmitterResource } from "../audio/audio-emitter.main";
import { MainThreadAudioSourceResource } from "../audio/audio-source.main";
import { IMainThreadContext } from "../MainThread";
import { MainThreadNametagResource } from "../nametag/nametag.main";
import { MainNode } from "../node/node.main";
import { MainScene } from "../scene/scene.main";
import { createLocalResourceModule } from "./resource.common";
import {
  AccessorResource,
  BufferResource,
  BufferViewResource,
  CameraResource,
  ImageResource,
  InstancedMeshResource,
  InteractableResource,
  LightMapResource,
  LightResource,
  MaterialResource,
  MeshPrimitiveResource,
  MeshResource,
  ReflectionProbeResource,
  SamplerResource,
  SkinResource,
  SparseAccessorResource,
  TextureResource,
  TilesRendererResource,
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
} = createLocalResourceModule<IMainThreadContext>([
  MainNode,
  MainThreadAudioDataResource,
  MainThreadAudioSourceResource,
  MainThreadAudioEmitterResource,
  MainThreadNametagResource,
  LightResource,
  SamplerResource,
  CameraResource,
  BufferResource,
  BufferViewResource,
  ImageResource,
  MaterialResource,
  TextureResource,
  MeshResource,
  MainScene,
  MeshPrimitiveResource,
  InteractableResource,
  AccessorResource,
  SparseAccessorResource,
  SkinResource,
  InstancedMeshResource,
  LightMapResource,
  ReflectionProbeResource,
  TilesRendererResource,
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
