import {
  FLEX_DIRECTION_COLUMN,
  FLEX_DIRECTION_COLUMN_REVERSE,
  FLEX_DIRECTION_ROW,
  FLEX_DIRECTION_ROW_REVERSE,
  POSITION_TYPE_ABSOLUTE,
  POSITION_TYPE_RELATIVE,
  ALIGN_AUTO,
  ALIGN_BASELINE,
  ALIGN_CENTER,
  ALIGN_FLEX_END,
  ALIGN_FLEX_START,
  ALIGN_SPACE_AROUND,
  ALIGN_SPACE_BETWEEN,
  ALIGN_STRETCH,
  JUSTIFY_CENTER,
  JUSTIFY_FLEX_END,
  JUSTIFY_FLEX_START,
  JUSTIFY_SPACE_AROUND,
  JUSTIFY_SPACE_BETWEEN,
  JUSTIFY_SPACE_EVENLY,
  WRAP_NO_WRAP,
  WRAP_WRAP,
  WRAP_WRAP_REVERSE,
  EDGE_LEFT,
  EDGE_TOP,
  EDGE_RIGHT,
  EDGE_BOTTOM,
} from "yoga-wasm-web";
import * as RAPIER from "@dimforge/rapier3d-compat";

import { defineResource, PropType } from "./ResourceDefinition";

export enum ResourceType {
  Unknown,
  Nametag,
  Sampler,
  Buffer,
  BufferView,
  AudioData,
  AudioSource,
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
  Animation,
  AnimationChannel,
  AnimationSampler,
  Node,
  Scene,
  World,
  Avatar,
  Environment,
  UICanvas,
  UIText,
  UIButton,
  UIImage,
  UIElement,
  Collider,
  PhysicsBody,
}

export enum QueryModifier {
  All,
  None,
  Any,
}

export enum ComponentPropStorageType {
  i32,
  u32,
  f32,
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

export const BufferResource = defineResource("buffer", ResourceType.Buffer, {
  name: PropType.string({ default: "Buffer", script: true }),
  uri: PropType.string({ script: true, mutable: false }),
  data: PropType.arrayBuffer({ script: true }),
});

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
  autoPlay: PropType.bool({ default: false, script: true, mutable: false }),
  loop: PropType.bool({ default: false, script: true }),
  playbackRate: PropType.f32({ default: 1 }),
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
  coneOuterGain: PropType.f32({ default: 0, min: 0, max: 1 }),
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

export enum TextureEncoding {
  Linear = 3000,
  sRGB = 3001,
}

export enum TextureFormat {
  Unknown,
  Basis,
}

export const TextureResource = defineResource("texture", ResourceType.Texture, {
  name: PropType.string({ default: "Texture", script: true }),
  sampler: PropType.ref(SamplerResource, { script: true, mutable: false }),
  source: PropType.ref(ImageResource, { script: true, mutable: false, required: true }),
  rgbm: PropType.bool({ script: true, mutable: false }),
  encoding: PropType.enum(TextureEncoding, { default: TextureEncoding.Linear, script: true, mutable: false }),
  format: PropType.enum(TextureFormat, { default: TextureFormat.Unknown, script: true, mutable: false }),
  depth: PropType.u32({ default: 1, mutable: false }),
});

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
  baseColorTextureOffset: PropType.vec2({ default: [0, 0], mutable: true }),
  baseColorTextureRotation: PropType.f32({ default: 0, mutable: true }),
  baseColorTextureScale: PropType.vec2({ default: [1, 1], mutable: true }),
  metallicFactor: PropType.f32({ default: 1, script: true }),
  roughnessFactor: PropType.f32({ default: 1, script: true }),
  metallicRoughnessTexture: PropType.ref(TextureResource, { script: true }),
  metallicRoughnessTextureOffset: PropType.vec2({ default: [0, 0], mutable: true }),
  metallicRoughnessTextureRotation: PropType.f32({ default: 0, mutable: true }),
  metallicRoughnessTextureScale: PropType.vec2({ default: [1, 1], mutable: true }),
  normalTexture: PropType.ref(TextureResource, { script: true }),
  normalScale: PropType.f32({ default: 1, script: true }),
  normalTextureOffset: PropType.vec2({ default: [0, 0], mutable: true }),
  normalTextureRotation: PropType.f32({ default: 0, mutable: true }),
  normalTextureScale: PropType.vec2({ default: [1, 1], mutable: true }),
  occlusionTextureStrength: PropType.f32({ default: 1, script: true }),
  occlusionTexture: PropType.ref(TextureResource, { script: true }),
  occlusionTextureOffset: PropType.vec2({ default: [0, 0], mutable: true }),
  occlusionTextureRotation: PropType.f32({ default: 0, mutable: true }),
  occlusionTextureScale: PropType.vec2({ default: [1, 1], mutable: true }),
  emissiveStrength: PropType.f32({ default: 1, script: true }),
  emissiveFactor: PropType.rgb({ default: [0, 0, 0], script: true }),
  emissiveTexture: PropType.ref(TextureResource, { script: true }),
  emissiveTextureOffset: PropType.vec2({ default: [0, 0], mutable: true }),
  emissiveTextureRotation: PropType.f32({ default: 0, mutable: true }),
  emissiveTextureScale: PropType.vec2({ default: [1, 1], mutable: true }),
  ior: PropType.f32({ default: 1.5, script: true }),
  transmissionFactor: PropType.f32({ default: 0, script: true }),
  transmissionTexture: PropType.ref(TextureResource, { script: true }),
  transmissionTextureOffset: PropType.vec2({ default: [0, 0], mutable: true }),
  transmissionTextureRotation: PropType.f32({ default: 0, mutable: true }),
  transmissionTextureScale: PropType.vec2({ default: [1, 1], mutable: true }),
  thicknessFactor: PropType.f32({ default: 0, script: true }),
  thicknessTexture: PropType.ref(TextureResource, { script: true }),
  thicknessTextureOffset: PropType.vec2({ default: [0, 0], mutable: true }),
  thicknessTextureRotation: PropType.f32({ default: 0, mutable: true }),
  thicknessTextureScale: PropType.vec2({ default: [1, 1], mutable: true }),
  // default +Infinity (represented as 0)
  attenuationDistance: PropType.f32({ default: 0, script: true }),
  attenuationColor: PropType.rgb({ default: [1, 1, 1], script: true }),
});

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
  innerConeAngle: PropType.f32({ default: 1, script: true }),
  outerConeAngle: PropType.f32({ default: 1, script: true }),
});

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
  dynamic: PropType.bool({ script: true, mutable: false }),
  version: PropType.u32({ script: true }),
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
  attributes: PropType.refMap(AccessorResource, {
    size: Object.values(MeshPrimitiveAttributeIndex).filter((v) => typeof v === "number").length,
    mutable: false,
    required: true,
    script: true,
  }),
  indices: PropType.ref(AccessorResource, { mutable: false, script: true }),
  material: PropType.ref(MaterialResource, { script: true }),
  mode: PropType.enum(MeshPrimitiveMode, { default: MeshPrimitiveMode.TRIANGLES, script: true, mutable: false }),
  drawStart: PropType.u32({ script: true, mutable: true }),
  drawCount: PropType.u32({ script: true, mutable: true }),
  hologramMaterialEnabled: PropType.bool({ script: true }),
  // TODO: targets
});

export const InstancedMeshResource = defineResource("instanced-mesh", ResourceType.InstancedMesh, {
  name: PropType.string({ default: "InstancedMesh", script: true }),
  // Max 5 attributes, indexed by InstancedMeshAttributeIndex
  attributes: PropType.refMap(AccessorResource, {
    size: Object.values(InstancedMeshAttributeIndex).filter((v) => typeof v === "number").length,
    mutable: false,
    required: true,
    script: true,
  }),
});

export const MeshResource = defineResource("mesh", ResourceType.Mesh, {
  name: PropType.string({ default: "Mesh", script: true }),
  // Note our implementation uses a fixed size array of primitives so you can have at most 16 primitives per mesh
  primitives: PropType.refArray(MeshPrimitiveResource, { size: 16, script: true, mutable: false }),
  // TODO: weights
});

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
  UI = 5,
  Screenshare = 6,
}

export const InteractableResource = defineResource("interactable", ResourceType.Interactable, {
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

export enum ElementType {
  Flex,
  Text,
  Button,
  Image,
}

export enum FlexDirection {
  Column = FLEX_DIRECTION_COLUMN,
  ColumnReverse = FLEX_DIRECTION_COLUMN_REVERSE,
  Row = FLEX_DIRECTION_ROW,
  RowReverse = FLEX_DIRECTION_ROW_REVERSE,
}

export enum ElementPositionType {
  Relative = POSITION_TYPE_RELATIVE,
  Absolute = POSITION_TYPE_ABSOLUTE,
}

export enum FlexAlign {
  Auto = ALIGN_AUTO,
  FlexStart = ALIGN_FLEX_START,
  Center = ALIGN_CENTER,
  FlexEnd = ALIGN_FLEX_END,
  Stretch = ALIGN_STRETCH,
  Baseline = ALIGN_BASELINE,
  SpaceBetween = ALIGN_SPACE_BETWEEN,
  SpaceAround = ALIGN_SPACE_AROUND,
}

export enum FlexJustify {
  FlexStart = JUSTIFY_FLEX_START,
  Center = JUSTIFY_CENTER,
  FlexEnd = JUSTIFY_FLEX_END,
  SpaceBetween = JUSTIFY_SPACE_BETWEEN,
  SpaceAround = JUSTIFY_SPACE_AROUND,
  SpaceEvenly = JUSTIFY_SPACE_EVENLY,
}

export enum FlexWrap {
  NoWrap = WRAP_NO_WRAP,
  Wrap = WRAP_WRAP,
  WrapReverse = WRAP_WRAP_REVERSE,
}

export enum FlexEdge {
  LEFT = EDGE_LEFT,
  TOP = EDGE_TOP,
  RIGHT = EDGE_RIGHT,
  BOTTOM = EDGE_BOTTOM,
}

export const UITextResource = defineResource("ui-text", ResourceType.UIText, {
  value: PropType.string({ script: true }),
  fontFamily: PropType.string({ script: true }),
  fontSize: PropType.f32({ default: 12, script: true }),
  fontWeight: PropType.string({ script: true }),
  fontStyle: PropType.string({ script: true }),
  color: PropType.rgba({ script: true }),
});

export const UIButtonResource = defineResource("ui-button", ResourceType.UIButton, {
  interactable: PropType.ref(InteractableResource, { script: true }),
  label: PropType.string({ script: true }),
});

export const UIImageResource = defineResource("ui-image", ResourceType.UIImage, {
  source: PropType.ref(ImageResource, { script: true }),
  alt: PropType.string({ script: true, required: false }),
});

export const UIElementResource = defineResource("ui-element", ResourceType.UIElement, {
  name: PropType.string({ default: "UIElement", script: true }),
  type: PropType.enum(ElementType, { default: ElementType.Flex, mutable: false }),

  position: PropType.vec4({ script: true, mutable: true }),

  positionType: PropType.enum(ElementPositionType, {
    default: ElementPositionType.Relative,
    script: true,
    mutable: true,
  }),

  alignContent: PropType.enum(FlexAlign, {
    default: FlexAlign.FlexStart,
    script: true,
    mutable: true,
  }),

  alignItems: PropType.enum(FlexAlign, {
    default: FlexAlign.Stretch,
    script: true,
    mutable: true,
  }),

  alignSelf: PropType.enum(FlexAlign, {
    default: FlexAlign.Auto,
    script: true,
    mutable: true,
  }),

  flexDirection: PropType.enum(FlexDirection, {
    default: FlexDirection.Row,
    script: true,
    mutable: true,
  }),

  flexWrap: PropType.enum(FlexWrap, {
    default: FlexWrap.NoWrap,
    script: true,
    mutable: true,
  }),

  // Negative values are auto
  flexBasis: PropType.f32({ default: -1, script: true, mutable: true }),

  flexGrow: PropType.f32({ script: true, mutable: true, min: 0 }),

  flexShrink: PropType.f32({ default: 1, script: true, mutable: true, min: 0 }),

  justifyContent: PropType.enum(FlexJustify, {
    default: FlexJustify.FlexStart,
    script: true,
    mutable: true,
  }),

  // Negative values are auto
  width: PropType.f32({ default: -1, script: true, mutable: true }),
  height: PropType.f32({ default: -1, script: true, mutable: true }),

  minWidth: PropType.f32({ default: -1, script: true, mutable: true }),
  minHeight: PropType.f32({ default: -1, script: true, mutable: true }),

  maxWidth: PropType.f32({ default: -1, script: true, mutable: true }),
  maxHeight: PropType.f32({ default: -1, script: true, mutable: true }),

  backgroundColor: PropType.rgba({ script: true, mutable: true }),
  borderColor: PropType.rgba({ script: true, mutable: true }),

  // TODO: vec4 alias
  padding: PropType.vec4({ script: true, mutable: true }),
  margin: PropType.vec4({ script: true, mutable: true }),
  borderWidth: PropType.vec4({ script: true, mutable: true }),
  borderRadius: PropType.vec4({ script: true, mutable: true }),

  parent: PropType.selfRef({ backRef: true }),
  firstChild: PropType.selfRef(),
  prevSibling: PropType.selfRef({ backRef: true }),
  nextSibling: PropType.selfRef(),

  text: PropType.ref(UITextResource, { mutable: false }),
  button: PropType.ref(UIButtonResource, { mutable: false }),
  image: PropType.ref(UIImageResource, { mutable: false }),
});

export const UICanvasResource = defineResource("ui-canvas", ResourceType.UICanvas, {
  name: PropType.string({ default: "UICanvas", script: true }),
  root: PropType.ref(UIElementResource),
  size: PropType.vec2({ script: true, mutable: true }),
  width: PropType.f32({ script: true, mutable: true }),
  height: PropType.f32({ script: true, mutable: true }),
  redraw: PropType.u32({ default: 1, script: true, mutable: true }),
});

export enum ColliderType {
  Box,
  Sphere,
  Capsule,
  Cylinder,
  Hull,
  Trimesh,
}

export const ColliderResource = defineResource("collider", ResourceType.Collider, {
  name: PropType.string({ default: "Collider", script: true }),
  type: PropType.enum(ColliderType, { required: true, mutable: false }),
  activeEvents: PropType.enum(RAPIER.ActiveEvents, { default: 0, mutable: false }),
  collisionGroups: PropType.u32({ mutable: false }),
  offset: PropType.vec3({ mutable: false }),
  restitution: PropType.f32({ mutable: false }),
  density: PropType.f32({ mutable: false }),
  isTrigger: PropType.bool({ mutable: false }),
  size: PropType.vec3({ mutable: false }),
  radius: PropType.f32({ mutable: false }),
  height: PropType.f32({ mutable: false }),
  mesh: PropType.ref(MeshResource, { mutable: false }),
});

export enum PhysicsBodyType {
  Static,
  Kinematic,
  Rigid,
}

export const PhysicsBodyResource = defineResource("physics-body", ResourceType.PhysicsBody, {
  type: PropType.enum(PhysicsBodyType, { required: true, mutable: false }),
  mass: PropType.f32({ min: 0 }),
  linearVelocity: PropType.vec3(),
  angularVelocity: PropType.vec3(),
  inertiaTensor: PropType.mat3(),
});

export const NodeResource = defineResource("node", ResourceType.Node, {
  name: PropType.string({ default: "Node", script: true }),
  parentScene: PropType.ref("scene", { backRef: true, editor: false }),
  parent: PropType.selfRef({ backRef: true, editor: false }),
  firstChild: PropType.selfRef({ editor: false }),
  prevSibling: PropType.selfRef({ backRef: true, editor: false }),
  nextSibling: PropType.selfRef({ editor: false }),
  position: PropType.vec3({ script: true }),
  quaternion: PropType.quat({ script: true }),
  scale: PropType.vec3({ script: true, default: [1, 1, 1] }),
  localMatrix: PropType.mat4({ script: true, editor: false }),
  worldMatrix: PropType.mat4({ script: true, editor: false }),
  worldMatrixNeedsUpdate: PropType.bool({ script: true, default: true }),
  visible: PropType.bool({ script: true, default: true }),
  enabled: PropType.bool({ script: true, default: true }),
  skipLerp: PropType.i32({ script: true, default: 10, editor: false }),
  isStatic: PropType.bool({ script: true, default: false }),
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
  interactable: PropType.ref(InteractableResource, { script: true }),
  uiCanvas: PropType.ref(UICanvasResource, { script: true }),
  collider: PropType.ref(ColliderResource, { script: true }),
  physicsBody: PropType.ref(PhysicsBodyResource, { script: true }),
  castShadow: PropType.bool({ default: true, script: true }),
  receiveShadow: PropType.bool({ default: true, script: true }),
});

export enum AnimationSamplerInterpolation {
  LINEAR,
  STEP,
  CUBICSPLINE,
}

export const AnimationSamplerResource = defineResource("animation-sampler", ResourceType.AnimationSampler, {
  input: PropType.ref(AccessorResource, { script: true, mutable: false, required: true }),
  interpolation: PropType.enum(AnimationSamplerInterpolation, {
    script: true,
    mutable: false,
    default: AnimationSamplerInterpolation.LINEAR,
  }),
  output: PropType.ref(AccessorResource, { script: true, mutable: false, required: true }),
});

export enum AnimationChannelTargetPath {
  Translation,
  Rotation,
  Scale,
  Weights,
}

export const AnimationChannelResource = defineResource("animation-channel", ResourceType.AnimationChannel, {
  sampler: PropType.ref(AnimationSamplerResource, { script: true, mutable: false }),
  targetNode: PropType.ref(NodeResource, { required: true }),
  targetPath: PropType.enum(AnimationChannelTargetPath, { required: true }),
});

export const AnimationResource = defineResource("animation", ResourceType.Animation, {
  name: PropType.string({ default: "Animation", script: true }),
  channels: PropType.refArray(AnimationChannelResource, {
    size: 256,
    script: true,
    required: true,
    mutable: false,
  }),
  samplers: PropType.refArray(AnimationSamplerResource, {
    size: 256,
    script: true,
    required: true,
    mutable: false,
  }),
});

export const SceneResource = defineResource("scene", ResourceType.Scene, {
  name: PropType.string({ default: "Scene", script: true }),
  backgroundTexture: PropType.ref(TextureResource, { script: true }),
  reflectionProbe: PropType.ref(ReflectionProbeResource, { script: true }),
  bloomStrength: PropType.f32({ script: true, default: 0.1 }),
  bloomThreshold: PropType.f32({ script: true, default: 0.9 }),
  bloomRadius: PropType.f32({ script: true, default: 0.4 }),
  audioEmitters: PropType.refArray(AudioEmitterResource, { size: 16, script: true }),
  firstNode: PropType.ref(NodeResource, { script: false }),
  supportsAR: PropType.bool({ script: true, mutable: false }),
});

export const EnvironmentResource = defineResource("environment", ResourceType.Environment, {
  publicScene: PropType.ref(SceneResource, { script: true, required: true, mutable: true }),
  privateScene: PropType.ref(SceneResource, { script: false, required: true, mutable: false }),
});

export const WorldResource = defineResource("world", ResourceType.World, {
  environment: PropType.ref(EnvironmentResource, { script: false }),
  firstNode: PropType.ref(NodeResource),
  persistentScene: PropType.ref(SceneResource, { required: true, script: false }),
  activeCameraNode: PropType.ref(NodeResource, { script: false }),
  activeAvatarNode: PropType.ref(NodeResource, { script: false }),
  activeLeftControllerNode: PropType.ref(NodeResource, { script: false }),
  activeRightControllerNode: PropType.ref(NodeResource, { script: false }),
});
