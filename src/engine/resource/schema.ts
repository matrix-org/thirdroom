import { defineResource, LocalResource, PropType, RemoteResource } from "./ResourceDefinition";

export enum ResourceType {
  Unknown,
  Nametag,
  Sampler,
  Buffer,
  BufferView,
  AudioData,
  AudioSource,
  MediaStreamSource,
  AudioEmitter,
  Image,
  Texture,
  ReflectionProbe,
  Material,
  Light,
  Camera,
  SparseAccessor,
  Accessor,
  MeshPrimitive,
  InstancedMesh,
  Mesh,
  LightMap,
  TilesRenderer,
  Skin,
  Interactable,
  Node,
  Scene,
}

export const NametagResource = defineResource("nametag", ResourceType.Nametag, {
  name: PropType.string(),
  screenX: PropType.f32(),
  screenY: PropType.f32(),
  distanceFromCamera: PropType.f32(),
  inFrustum: PropType.bool(),
});

export enum SamplerMagFilter {
  NEAREST = 9728,
  LINEAR = 9729,
}
export enum SamplerMinFilter {
  NEAREST = 9728,
  LINEAR = 9729,
  NEAREST_MIPMAP_NEAREST = 9984,
  LINEAR_MIPMAP_NEAREST = 9985,
  NEAREST_MIPMAP_LINEAR = 9986,
  LINEAR_MIPMAP_LINEAR = 9987,
}
export enum SamplerWrap {
  CLAMP_TO_EDGE = 33071,
  MIRRORED_REPEAT = 33648,
  REPEAT = 10497,
}
export enum SamplerMapping {
  UVMapping,
  CubeReflectionMapping,
  CubeRefractionMapping,
  EquirectangularReflectionMapping,
  EquirectangularRefractionMapping,
  CubeUVReflectionMapping,
}

export const SamplerResource = defineResource("sampler", ResourceType.Sampler, {
  name: PropType.string({ default: "Sampler", script: true }),
  magFilter: PropType.enum(SamplerMagFilter, { default: SamplerMagFilter.LINEAR, script: true, mutable: false }),
  minFilter: PropType.enum(SamplerMinFilter, {
    default: SamplerMinFilter.LINEAR_MIPMAP_LINEAR,
    script: true,
    mutable: false,
  }),
  wrapS: PropType.enum(SamplerWrap, { default: SamplerWrap.REPEAT, script: true, mutable: false }),
  wrapT: PropType.enum(SamplerWrap, { default: SamplerWrap.REPEAT, script: true, mutable: false }),
  mapping: PropType.enum(SamplerMapping, { default: SamplerMapping.UVMapping, script: true, mutable: false }),
});
export type RemoteSampler = RemoteResource<typeof SamplerResource>;
export type LocalSampler = LocalResource<typeof SamplerResource>;

export const BufferResource = defineResource("buffer", ResourceType.Buffer, {
  name: PropType.string({ default: "Buffer", script: true }),
  uri: PropType.string({ script: true, mutable: false }),
  data: PropType.arrayBuffer({ script: true }),
});
export type RemoteBuffer = RemoteResource<typeof BufferResource>;
export type LocalBuffer = LocalResource<typeof BufferResource>;

export enum BufferViewTarget {
  None = 0,
  ArrayBuffer = 34962,
  ElementArrayBuffer = 34963,
}
export const BufferViewResource = defineResource("buffer-view", ResourceType.BufferView, {
  name: PropType.string({ default: "BufferView", script: true }),
  buffer: PropType.ref(BufferResource, { mutable: false, required: true, script: true }),
  byteOffset: PropType.u32({ mutable: false, script: true }),
  byteLength: PropType.u32({ mutable: false, required: true, script: true }),
  byteStride: PropType.u32({ min: 4, max: 252, mutable: false, script: true }),
  target: PropType.enum(BufferViewTarget, { default: BufferViewTarget.None, mutable: false, script: true }),
});
export type RemoteBufferView = RemoteResource<typeof BufferViewResource>;
export type LocalBufferView = LocalResource<typeof BufferViewResource>;

export const AudioDataResource = defineResource("audio-data", ResourceType.AudioData, {
  name: PropType.string({ default: "AudioData", script: true }),
  bufferView: PropType.ref(BufferViewResource, { script: true, mutable: false }),
  mimeType: PropType.string({ script: true, mutable: false }),
  uri: PropType.string({ script: true, mutable: false }),
});

export const AudioSourceResource = defineResource("audio-source", ResourceType.AudioSource, {
  name: PropType.string({ default: "AudioSource", script: true }),
  audio: PropType.ref(AudioDataResource, { script: true }),
  gain: PropType.f32({ default: 1, min: 0, script: true }),
  autoPlay: PropType.bool({ default: true, script: true, mutable: false }),
  seek: PropType.f32({ min: 0 }),
  play: PropType.bool({ default: false }),
  loop: PropType.bool({ default: true, script: true }),
  playbackRate: PropType.f32({ default: 1 }),
  currentTime: PropType.f32(), // TODO: write from main thread
  playing: PropType.bool({ default: true }), // TODO: write from main thread and game thread
  duration: PropType.f32(), // TODO: write from main thread
});

export const MediaStreamSourceResource = defineResource("media-stream-source", ResourceType.MediaStreamSource, {
  name: PropType.string({ default: "MediaStreamSource", script: true }),
  stream: PropType.string({ script: true }),
  gain: PropType.f32({ default: 1, min: 0, script: true }),
});

export enum AudioEmitterType {
  Positional,
  Global,
}
export enum AudioEmitterOutput {
  Environment,
  Music,
  Voice,
}
export enum AudioEmitterDistanceModel {
  Linear,
  Inverse,
  Exponential,
}
export const AudioEmitterResource = defineResource("audio-emitter", ResourceType.AudioEmitter, {
  name: PropType.string({ default: "AudioEmitter", script: true }),
  type: PropType.enum(AudioEmitterType, { required: true, script: true }),
  sources: PropType.refArray(AudioSourceResource, { size: 16, script: true }),
  gain: PropType.f32({ default: 1, min: 0, script: true }),
  coneInnerAngle: PropType.f32({ default: Math.PI * 2, min: 0, max: Math.PI * 2, script: true }),
  coneOuterAngle: PropType.f32({ default: Math.PI * 2, min: 0, max: Math.PI * 2, script: true }),
  distanceModel: PropType.enum(AudioEmitterDistanceModel, { default: AudioEmitterDistanceModel.Inverse, script: true }),
  maxDistance: PropType.f32({ default: 10000, minExclusive: 0, script: true }),
  refDistance: PropType.f32({ default: 1, min: 0, script: true }),
  rolloffFactor: PropType.f32({ default: 1, min: 0, script: true }),
  output: PropType.enum(AudioEmitterOutput, { default: AudioEmitterOutput.Environment }),
});

export const ImageResource = defineResource("image", ResourceType.Image, {
  name: PropType.string({ default: "Image", script: true }),
  uri: PropType.string({ script: true, mutable: false }),
  mimeType: PropType.string({ script: true, mutable: false }),
  bufferView: PropType.ref(BufferViewResource, { script: true, mutable: false }),
  flipY: PropType.bool({ script: true, mutable: false }),
});
export type RemoteImage = RemoteResource<typeof ImageResource>;
export type LocalImage = LocalResource<typeof ImageResource>;

export enum TextureEncoding {
  Linear = 3000,
  sRGB = 3001,
}
export const TextureResource = defineResource("texture", ResourceType.Texture, {
  name: PropType.string({ default: "Texture", script: true }),
  sampler: PropType.ref(SamplerResource, { script: true, mutable: false }),
  source: PropType.ref(ImageResource, { script: true, mutable: false, required: true }),
  encoding: PropType.enum(TextureEncoding, { default: TextureEncoding.Linear, script: true, mutable: false }),
});
export type RemoteTexture = RemoteResource<typeof TextureResource>;
export type LocalTexture = LocalResource<typeof TextureResource>;

export const ReflectionProbeResource = defineResource("reflection-probe", ResourceType.ReflectionProbe, {
  name: PropType.string({ default: "ReflectionProbe", script: true }),
  reflectionProbeTexture: PropType.ref(TextureResource, { script: true, mutable: false }),
  size: PropType.vec3({ script: true }),
});

export enum MaterialAlphaMode {
  OPAQUE,
  MASK,
  BLEND,
}
export enum MaterialType {
  Standard,
  Unlit,
}
export const MaterialResource = defineResource("material", ResourceType.Material, {
  name: PropType.string({ default: "Material", script: true }),
  type: PropType.enum(MaterialType, { required: true, script: true }),
  doubleSided: PropType.bool({ default: false, script: true }),
  alphaCutoff: PropType.f32({ default: 0.5, script: true }),
  alphaMode: PropType.enum(MaterialAlphaMode, { default: MaterialAlphaMode.OPAQUE, script: true }),
  baseColorFactor: PropType.rgba({ default: [1, 1, 1, 1], script: true }),
  baseColorTexture: PropType.ref(TextureResource, { script: true }),
  metallicFactor: PropType.f32({ default: 1, script: true }),
  roughnessFactor: PropType.f32({ default: 1, script: true }),
  metallicRoughnessTexture: PropType.ref(TextureResource, { script: true }),
  normalTextureScale: PropType.f32({ default: 1, script: true }),
  normalTexture: PropType.ref(TextureResource, { script: true }),
  occlusionTextureStrength: PropType.f32({ default: 1, script: true }),
  occlusionTexture: PropType.ref(TextureResource, { script: true }),
  emissiveStrength: PropType.f32({ default: 1, script: true }),
  emissiveFactor: PropType.rgb({ default: [0, 0, 0], script: true }),
  emissiveTexture: PropType.ref(TextureResource, { script: true }),
  ior: PropType.f32({ default: 1.5, script: true }),
  transmissionFactor: PropType.f32({ default: 0, script: true }),
  transmissionTexture: PropType.ref(TextureResource, { script: true }),
  thicknessFactor: PropType.f32({ default: 0, script: true }),
  thicknessTexture: PropType.ref(TextureResource, { script: true }),
  // default +Infinity (represented as 0)
  attenuationDistance: PropType.f32({ default: 0, script: true }),
  attenuationColor: PropType.rgb({ default: [1, 1, 1], script: true }),
});
export type RemoteMaterial = RemoteResource<typeof MaterialResource>;
export type LocalMaterial = LocalResource<typeof MaterialResource>;

export enum LightType {
  Directional,
  Point,
  Spot,
}
export const LightResource = defineResource("light", ResourceType.Light, {
  name: PropType.string({ default: "Light", script: true }),
  type: PropType.enum(LightType, { required: true, script: true, mutable: false }),
  color: PropType.rgb({ default: [1, 1, 1], script: true }),
  intensity: PropType.f32({ default: 1, script: true }),
  range: PropType.f32({ default: 1, script: true }),
  castShadow: PropType.bool({ default: true, script: true }),
  innerConeAngle: PropType.f32({ default: 1, script: true }),
  outerConeAngle: PropType.f32({ default: 1, script: true }),
});
export type RemoteLight = RemoteResource<typeof LightResource>;
export type LocalLight = LocalResource<typeof LightResource>;

export enum CameraType {
  Perspective,
  Orthographic,
}
export const CameraResource = defineResource("camera", ResourceType.Camera, {
  // Shared properties between camera types
  name: PropType.string({ default: "Camera", script: true }),
  type: PropType.enum(CameraType, { script: true, mutable: false, required: true }),
  layers: PropType.bitmask({ default: 1, script: true }),
  // zfar must be greater than znear
  zfar: PropType.f32({ min: 0, script: true }),
  znear: PropType.f32({ min: 0, script: true }),
  // Only used for orthographic cameras
  xmag: PropType.f32({ minExclusive: 0, script: true }),
  ymag: PropType.f32({ minExclusive: 0, script: true }),
  // Only used for perspective camera
  yfov: PropType.f32({ minExclusive: 0, script: true }),
  // 0 means auto aspect ratio
  aspectRatio: PropType.f32({ min: 0, default: 0, script: true }),
  projectionMatrixNeedsUpdate: PropType.bool({ default: true, script: true }),
});
export type RemoteCamera = RemoteResource<typeof CameraResource>;
export type LocalCamera = LocalResource<typeof CameraResource>;

export enum AccessorComponentType {
  Int8 = 5120,
  Uint8 = 5121,
  Int16 = 5122,
  Uint16 = 5123,
  Uint32 = 5125,
  Float32 = 5126,
}
export const SparseAccessorResource = defineResource("sparse-accessor", ResourceType.SparseAccessor, {
  count: PropType.u32({ min: 1, mutable: false, required: true, script: true }),
  indicesBufferView: PropType.ref(BufferViewResource, { mutable: false, required: true, script: true }),
  indicesByteOffset: PropType.u32({ mutable: false, script: true }),
  indicesComponentType: PropType.enum(AccessorComponentType, { mutable: false, required: true, script: true }),
  valuesBufferView: PropType.ref(BufferViewResource, { mutable: false, required: true, script: true }),
  valuesByteOffset: PropType.u32({ mutable: false, script: true }),
});

export enum AccessorType {
  SCALAR,
  VEC2,
  VEC3,
  VEC4,
  MAT2,
  MAT3,
  MAT4,
}
export const AccessorResource = defineResource("accessor", ResourceType.Accessor, {
  name: PropType.string({ default: "Accessor", script: true }),
  bufferView: PropType.ref(BufferViewResource, { mutable: false, script: true }),
  byteOffset: PropType.u32({ mutable: false, script: true }),
  componentType: PropType.enum(AccessorComponentType, { mutable: false, required: true, script: true }),
  normalized: PropType.bool({ mutable: false, script: true }),
  count: PropType.u32({ min: 1, mutable: false, required: true, script: true }),
  type: PropType.enum(AccessorType, { mutable: false, required: true, script: true }),
  // Maximum component size is 16 floats so initialize with a zeroed 16 element array
  max: PropType.mat4({ default: new Float32Array(16), script: true }),
  min: PropType.mat4({ default: new Float32Array(16), script: true }),
  sparse: PropType.ref(SparseAccessorResource, { mutable: false, script: true }),
});

export enum MeshPrimitiveMode {
  POINTS,
  LINES,
  LINE_LOOP,
  LINE_STRIP,
  TRIANGLES,
  TRIANGLE_STRIP,
  TRIANGLE_FAN,
}
export enum MeshPrimitiveAttributeIndex {
  POSITION,
  NORMAL,
  TANGENT,
  TEXCOORD_0,
  TEXCOORD_1,
  COLOR_0,
  JOINTS_0,
  WEIGHTS_0,
}
export enum InstancedMeshAttributeIndex {
  TRANSLATION,
  ROTATION,
  SCALE,
  LIGHTMAP_OFFSET,
  LIGHTMAP_SCALE,
}
export const MeshPrimitiveResource = defineResource("mesh-primitive", ResourceType.MeshPrimitive, {
  // Max 8 attributes, indexed by MeshPrimitiveAttributeIndex
  // attributes: PropType.refMap(AccessorResource, {
  //   size: Object.values(MeshPrimitiveAttributeIndex).length,
  //   mutable: false,
  //   required: true,
  //   script: true,
  // }),
  //indices: PropType.ref(AccessorResource, { mutable: false, script: true }),
  material: PropType.ref(MaterialResource, { script: true }),
  //mode: PropType.enum(MeshPrimitiveMode, { default: MeshPrimitiveMode.TRIANGLES, script: true, mutable: false }),
  // TODO: targets
});
export type RemoteMeshPrimitive = RemoteResource<typeof MeshPrimitiveResource>;
export type LocalMeshPrimitive = LocalResource<typeof MeshPrimitiveResource>;

export const InstancedMeshResource = defineResource("instanced-mesh", ResourceType.InstancedMesh, {
  name: PropType.string({ default: "InstancedMesh", script: true }),
  // Max 5 attributes, indexed by InstancedMeshAttributeIndex
  attributes: PropType.refMap(AccessorResource, {
    size: Object.values(InstancedMeshAttributeIndex).length,
    mutable: false,
    required: true,
    script: true,
  }),
});

export const MeshResource = defineResource("mesh", ResourceType.Mesh, {
  name: PropType.string({ default: "Mesh", script: true }),
  // Note our implementation uses a fixed size array of primitives so you can have at most 16 primitives per mesh
  primitives: PropType.refArray(MeshPrimitiveResource, { size: 16, script: true }),
  // TODO: weights
});
export type RemoteMesh = RemoteResource<typeof MeshResource>;
export type LocalMesh = LocalResource<typeof MeshResource>;

export const LightMapResource = defineResource("light-map", ResourceType.LightMap, {
  name: PropType.string({ default: "LightMap", script: true }),
  texture: PropType.ref(TextureResource, { mutable: false, required: true, script: true }),
  offset: PropType.vec2({ default: [0, 0], script: true, mutable: false }),
  scale: PropType.vec2({ default: [0, 0], script: true, mutable: false }),
  intensity: PropType.f32({ default: 1, script: true, mutable: false }),
});

export const TilesRendererResource = defineResource("tiles-renderer", ResourceType.TilesRenderer, {
  uri: PropType.string({ mutable: false, required: true, script: true }),
});

export const SkinResource = defineResource("skin", ResourceType.Skin, {
  name: PropType.string({ default: "Skin", script: true }),
  // Use a fixed size array of 128 joints. Three.js supports up to 1024
  joints: PropType.refArray("node", { size: 128, script: true, mutable: false }),
  inverseBindMatrices: PropType.ref(AccessorResource, { script: true }),
});

export enum InteractableType {
  Interactable = 1,
  Grabbable = 2,
  Player = 3,
  Portal = 4,
}

export const InteractableResource = defineResource("interactable", ResourceType.Interactable, {
  name: PropType.string({ default: "Interactable", script: true }),
  type: PropType.enum(InteractableType, {
    required: true,
    mutable: false,
    default: InteractableType.Interactable,
    script: true,
  }),
  pressed: PropType.bool({ mutableScript: false, script: true }),
  held: PropType.bool({ mutableScript: false, script: true }),
  released: PropType.bool({ mutableScript: false, script: true }),
});

export const NodeResource = defineResource("node", ResourceType.Node, {
  //eid: PropType.u32({ script: false }),
  name: PropType.string({ default: "Node", script: true }),
  // parentScene: PropType.ref("scene"),
  // parent: PropType.selfRef(),
  // firstChild: PropType.selfRef(),
  // prevSibling: PropType.selfRef(),
  // nextSibling: PropType.selfRef(),
  // position: PropType.vec3({ script: true }),
  // quaternion: PropType.quat({ script: true }),
  // scale: PropType.vec3({ script: true, default: [1, 1, 1] }),
  // localMatrix: PropType.mat4({ script: true }),
  // worldMatrix: PropType.mat4({ script: true }),
  // visible: PropType.bool({ script: true, default: true }),
  // enabled: PropType.bool({ script: true, default: true }),
  // isStatic: PropType.bool({ script: true, default: true }),
  // layers: PropType.bitmask({ default: 1, script: true }),
  mesh: PropType.ref(MeshResource, { script: true }),
  // instancedMesh: PropType.ref(InstancedMeshResource, { script: true }),
  // lightMap: PropType.ref(LightMapResource, { script: true }),
  // skin: PropType.ref(SkinResource, { script: true }),
  light: PropType.ref(LightResource, { script: true }),
  // reflectionProbe: PropType.ref(ReflectionProbeResource, { script: true }),
  // camera: PropType.ref(CameraResource, { script: true }),
  // audioEmitter: PropType.ref(AudioEmitterResource, { script: true }),
  // tilesRenderer: PropType.ref(TilesRendererResource, { script: true }),
  // nametag: PropType.ref(NametagResource, { script: false }),
  interactable: PropType.ref(InteractableResource, { script: true }),
});
export type RemoteNode = RemoteResource<typeof NodeResource>;
export type LocalNode = LocalResource<typeof NodeResource>;

export const SceneResource = defineResource("scene", ResourceType.Scene, {
  name: PropType.string({ default: "Scene", script: true }),
  backgroundTexture: PropType.ref(TextureResource, { script: true }),
  reflectionProbe: PropType.ref(ReflectionProbeResource, { script: true }),
  audioEmitters: PropType.refArray(AudioEmitterResource, { size: 16, script: true }),
  firstNode: PropType.ref(NodeResource, { script: false }),
});
