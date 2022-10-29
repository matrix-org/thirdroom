import { createResourceClass } from "./ResourceClass";
import {
  AudioDataResource,
  AudioSourceResource,
  MediaStreamSourceResource,
  AudioEmitterResource,
  NametagResource,
  SamplerResource,
  SceneResource,
  MaterialResource,
  TextureResource,
  LightResource,
  ReflectionProbeResource,
  CameraResource,
  ImageResource,
  BufferViewResource,
  AccessorResource,
  SparseAccessorResource,
  MeshResource,
  MeshPrimitiveResource,
  InstancedMeshResource,
  LightMapResource,
  SkinResource,
  TilesRendererResource,
  NodeResource,
} from "./schema";

export const RenderAudioData = createResourceClass(AudioDataResource, false);
export const RenderAudioSource = createResourceClass(AudioSourceResource, false);
export const RenderMediaStreamSource = createResourceClass(MediaStreamSourceResource, false);
export const RenderAudioEmitter = createResourceClass(AudioEmitterResource, false);
export const RenderNametag = createResourceClass(NametagResource, false);
export const RenderSampler = createResourceClass(SamplerResource, false);
export const RenderScene = createResourceClass(SceneResource, false);
export const RenderMaterial = createResourceClass(MaterialResource, false);
export const RenderTexture = createResourceClass(TextureResource, false);
export const RenderLight = createResourceClass(LightResource, false);
export const RenderReflectionProbe = createResourceClass(ReflectionProbeResource, false);
export const RenderCamera = createResourceClass(CameraResource, false);
export const RenderImage = createResourceClass(ImageResource, false);
export const RenderBufferView = createResourceClass(BufferViewResource, false);
export const RenderAccessor = createResourceClass(AccessorResource, false);
export const RenderSparseAccessor = createResourceClass(SparseAccessorResource, false);
export const RenderMesh = createResourceClass(MeshResource, false);
export const RenderMeshPrimitive = createResourceClass(MeshPrimitiveResource, false);
export const RenderInstancedMesh = createResourceClass(InstancedMeshResource, false);
export const RenderLightMap = createResourceClass(LightMapResource, false);
export const RenderSkin = createResourceClass(SkinResource, false);
export const RenderTilesRenderer = createResourceClass(TilesRendererResource, false);
export const RenderNode = createResourceClass(NodeResource, false);
