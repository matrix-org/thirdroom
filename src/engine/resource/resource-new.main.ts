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

export const MainThreadAudioData = createResourceClass(AudioDataResource, false);
export const MainThreadAudioSource = createResourceClass(AudioSourceResource, false);
export const MainThreadMediaStreamSource = createResourceClass(MediaStreamSourceResource, false);
export const MainThreadAudioEmitter = createResourceClass(AudioEmitterResource, false);
export const MainThreadNametag = createResourceClass(NametagResource, false);
export const MainThreadSampler = createResourceClass(SamplerResource, false);
export const MainThreadScene = createResourceClass(SceneResource, false);
export const MainThreadMaterial = createResourceClass(MaterialResource, false);
export const MainThreadTexture = createResourceClass(TextureResource, false);
export const MainThreadLight = createResourceClass(LightResource, false);
export const MainThreadReflectionProbe = createResourceClass(ReflectionProbeResource, false);
export const MainThreadCamera = createResourceClass(CameraResource, false);
export const MainThreadImage = createResourceClass(ImageResource, false);
export const MainThreadBufferView = createResourceClass(BufferViewResource, false);
export const MainThreadAccessor = createResourceClass(AccessorResource, false);
export const MainThreadSparseAccessor = createResourceClass(SparseAccessorResource, false);
export const MainThreadMesh = createResourceClass(MeshResource, false);
export const MainThreadMeshPrimitive = createResourceClass(MeshPrimitiveResource, false);
export const MainThreadInstancedMesh = createResourceClass(InstancedMeshResource, false);
export const MainThreadLightMap = createResourceClass(LightMapResource, false);
export const MainThreadSkin = createResourceClass(SkinResource, false);
export const MainThreadTilesRenderer = createResourceClass(TilesRendererResource, false);
export const MainThreadNode = createResourceClass(NodeResource, false);
