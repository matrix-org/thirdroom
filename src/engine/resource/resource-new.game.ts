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

export const RemoteAudioData = createResourceClass(AudioDataResource, true);
export const RemoteAudioSource = createResourceClass(AudioSourceResource, true);
export const RemoteMediaStreamSource = createResourceClass(MediaStreamSourceResource, true);
export const RemoteAudioEmitter = createResourceClass(AudioEmitterResource, true);
export const RemoteNametag = createResourceClass(NametagResource, true);
export const RemoteSampler = createResourceClass(SamplerResource, true);
export const RemoteScene = createResourceClass(SceneResource, true);
export const RemoteMaterial = createResourceClass(MaterialResource, true);
export const RemoteTexture = createResourceClass(TextureResource, true);
export type IRemoteLight = InstanceType<typeof RemoteLight>;
export type IRemoteLightName = IRemoteLight["name"];
export const RemoteLight = createResourceClass(LightResource, true);
export const RemoteReflectionProbe = createResourceClass(ReflectionProbeResource, true);
export const RemoteCamera = createResourceClass(CameraResource, true);
export const RemoteImage = createResourceClass(ImageResource, true);
export const RemoteBufferView = createResourceClass(BufferViewResource, true);
export const RemoteAccessor = createResourceClass(AccessorResource, true);
export const RemoteSparseAccessor = createResourceClass(SparseAccessorResource, true);
export const RemoteMesh = createResourceClass(MeshResource, true);
export const RemoteMeshPrimitive = createResourceClass(MeshPrimitiveResource, true);
export const RemoteInstancedMesh = createResourceClass(InstancedMeshResource, true);
export const RemoteLightMap = createResourceClass(LightMapResource, true);
export const RemoteSkin = createResourceClass(SkinResource, true);
export const RemoteTilesRenderer = createResourceClass(TilesRendererResource, true);
export const RemoteNode = createResourceClass(NodeResource, true);
