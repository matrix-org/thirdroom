import { defineResource, LocalResource, PropType, RemoteResource } from "./ResourceDefinition";
import { AccessorComponentType, AccessorType } from "../accessor/accessor.common";
import { AudioEmitterDistanceModel, AudioEmitterOutput, AudioEmitterType } from "../audio/audio.common";
import { BufferViewTarget } from "../bufferView/bufferView.common";
import { CameraType } from "../camera/camera.common";
import { MaterialAlphaMode, MaterialType } from "../material/material.common";
import { InstancedMeshAttributeIndex, MeshPrimitiveAttributeIndex, MeshPrimitiveMode } from "../mesh/mesh.common";
import { SamplerMagFilter, SamplerMapping, SamplerMinFilter, SamplerWrap } from "../sampler/sampler.common";
import { TextureEncoding } from "../texture/texture.common";

export const NametagResource = defineResource("nametag", {
  name: PropType.string(),
  screenX: PropType.f32(),
  screenY: PropType.f32(),
  distanceFromCamera: PropType.f32(),
  inFrustum: PropType.bool(),
});

export const SamplerResource = defineResource("sampler", {
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

export const BufferViewResource = defineResource("buffer-view", {
  name: PropType.string({ default: "BufferView", script: true }),
  buffer: PropType.arraybuffer({ mutable: false, required: true, script: true }),
  byteOffset: PropType.u32({ mutable: false, script: true }),
  byteLength: PropType.u32({ mutable: false, required: true, script: true }),
  byteStride: PropType.u32({ min: 4, max: 252, mutable: false, script: true }),
  target: PropType.enum(BufferViewTarget, { default: BufferViewTarget.None, mutable: false, script: true }),
});

export const AudioDataResource = defineResource("audio-data", {
  name: PropType.string({ default: "AudioData", script: true }),
  bufferView: PropType.ref(BufferViewResource, { script: true, mutable: false }),
  mimeType: PropType.string({ script: true, mutable: false }),
  uri: PropType.string({ script: true, mutable: false }),
});

export const AudioSourceResource = defineResource("audio-source", {
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

export const MediaStreamSourceResource = defineResource("media-stream-source", {
  name: PropType.string({ default: "MediaStreamSource", script: true }),
  stream: PropType.string({ script: true }),
  gain: PropType.f32({ default: 1, min: 0, script: true }),
});

export const AudioEmitterResource = defineResource("audio-emitter", {
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

export const ImageResource = defineResource("image", {
  name: PropType.string({ default: "Image", script: true }),
  uri: PropType.string({ script: true, mutable: false }),
  mimeType: PropType.string({ script: true, mutable: false }),
  bufferView: PropType.ref(BufferViewResource, { script: true, mutable: false }),
  flipY: PropType.bool({ script: true, mutable: false }),
});

export const TextureResource = defineResource("texture", {
  name: PropType.string({ default: "Texture", script: true }),
  sampler: PropType.ref(SamplerResource, { script: true, mutable: false }),
  source: PropType.ref(ImageResource, { script: true, mutable: false }),
  encoding: PropType.enum(TextureEncoding, { default: TextureEncoding.Linear, script: true, mutable: false }),
});

export const ReflectionProbeResource = defineResource("reflection-probe", {
  name: PropType.string({ default: "ReflectionProbe", script: true }),
  reflectionProbeTexture: PropType.ref(TextureResource, { script: true, mutable: false }),
  size: PropType.vec3({ script: true, mutable: false }),
});

export const MaterialResource = defineResource("material", {
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
  emissiveFactor: PropType.rgb({ default: [1, 1, 1], script: true }),
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

export enum LightType {
  Directional,
  Point,
  Spot,
}
export const LightResource = defineResource("light", {
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

export const CameraResource = defineResource("camera", {
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
  projectionMatrixNeedsUpdate: PropType.bool({ default: true, script: false, mutable: false }),
});

export const SparseAccessorResource = defineResource("sparse-accessor", {
  count: PropType.u32({ min: 1, mutable: false, required: true, script: true }),
  indicesBufferView: PropType.ref(BufferViewResource, { mutable: false, required: true, script: true }),
  indicesByteOffset: PropType.u32({ mutable: false, script: true }),
  indicesComponentType: PropType.enum(AccessorComponentType, { mutable: false, required: true, script: true }),
  valuesBufferView: PropType.ref(BufferViewResource, { mutable: false, required: true, script: true }),
  valuesByteOffset: PropType.u32({ mutable: false, script: true }),
});

export const AccessorResource = defineResource("accessor", {
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

export const MeshPrimitiveResource = defineResource("mesh-primitive", {
  name: PropType.string({ default: "MeshPrimitive", script: true }),
  // Max 8 attributes, indexed by MeshPrimitiveAttributeIndex
  attributes: PropType.refArray(AccessorResource, {
    size: Object.values(MeshPrimitiveAttributeIndex).length,
    mutable: false,
    required: true,
    script: true,
  }),
  indices: PropType.ref(AccessorResource, { mutable: false, script: true }),
  material: PropType.ref(MaterialResource, { script: true }),
  mode: PropType.enum(MeshPrimitiveMode, { default: MeshPrimitiveMode.TRIANGLES, script: true, mutable: false }),
  // TODO: targets
});

export const InstancedMeshResource = defineResource("instanced-mesh", {
  name: PropType.string({ default: "InstancedMesh", script: true }),
  // Max 5 attributes, indexed by InstancedMeshAttributeIndex
  attributes: PropType.refArray(AccessorResource, {
    size: Object.values(InstancedMeshAttributeIndex).length,
    mutable: false,
    required: true,
    script: true,
  }),
});

export const MeshResource = defineResource("mesh", {
  name: PropType.string({ default: "Mesh", script: true }),
  // Note our implementation uses a fixed size array of primitives so you can have at most 16 primitives per mesh
  primitives: PropType.refArray(MeshPrimitiveResource, { size: 16, script: true }),
  // TODO: weights
});

export const LightMapResource = defineResource("light-map", {
  name: PropType.string({ default: "LightMap", script: true }),
  texture: PropType.ref(TextureResource, { mutable: false, required: true, script: true }),
  offset: PropType.vec2({ default: [0, 0], script: true, mutable: false }),
  scale: PropType.vec2({ default: [0, 0], script: true, mutable: false }),
  intensity: PropType.f32({ default: 1, script: true, mutable: false }),
});

export const TilesRendererResource = defineResource("tiles-renderer", {
  uri: PropType.string({ mutable: false, required: true, script: true }),
});

export const SkinResource = defineResource("skin", {
  name: PropType.string({ default: "Skin", script: true }),
  // Use a fixed size array of 128 joints. Three.js supports up to 1024
  joints: PropType.refArray("node", { size: 128, script: true, mutable: false }),
  inverseBindMatrices: PropType.ref(AccessorResource, { script: true, mutable: false }),
});

export const NodeResource = defineResource("node", {
  eid: PropType.u32({ script: false }),
  name: PropType.string({ default: "Node", script: true }),
  parent: PropType.selfRef({ mutable: false }),
  firstChild: PropType.selfRef({ mutable: false }),
  prevSibling: PropType.selfRef({ mutable: false }),
  nextSibling: PropType.selfRef({ mutable: false }),
  position: PropType.vec3({ script: true }),
  quaternion: PropType.quat({ script: true }),
  scale: PropType.vec3({ script: true, default: [1, 1, 1] }),
  localMatrix: PropType.mat4({ script: true, mutable: false }),
  worldMatrix: PropType.mat4({ script: true, mutable: false }),
  visible: PropType.bool({ script: true, default: true }),
  enabled: PropType.bool({ script: true, default: true }),
  static: PropType.bool({ script: true, default: true }),
  layers: PropType.bitmask({ default: 1, script: true }),
  mesh: PropType.ref(MeshResource, { script: true }),
  instancedMesh: PropType.ref(InstancedMeshResource, { script: true }),
  lightMap: PropType.ref(LightMapResource, { script: true }),
  skin: PropType.ref(SkinResource, { script: true }),
  light: PropType.ref(LightResource, { script: true }),
  reflectionProbe: PropType.ref(ReflectionProbeResource, { script: true }),
  camera: PropType.ref(CameraResource, { script: true }),
  audioEmitter: PropType.ref(AudioEmitterResource, { script: true }),
  tilesRenderer: PropType.ref(TilesRendererResource, { script: true }),
  nametag: PropType.ref(NametagResource, { script: false }),
});

export const SceneResource = defineResource("scene", {
  name: PropType.string({ default: "Scene", script: true }),
  backgroundTexture: PropType.ref(TextureResource, { script: true }),
  reflectionProbe: PropType.ref(ReflectionProbeResource, { script: true }),
  audioEmitters: PropType.refArray(AudioEmitterResource, { size: 16 }),
  firstChild: PropType.ref(NodeResource, { script: true }),
});
