export type GLTFId = number;
/**
 * An object pointing to a buffer view containing the indices of deviating accessor values. The number of indices is equal to `accessor.sparse.count`. Indices **MUST** strictly increase.
 */
export interface GLTFAccessorSparseIndices {
  /**
   * The index of the buffer view with sparse indices. The referenced buffer view **MUST NOT** have its `target` or `byteStride` properties defined. The buffer view and the optional `byteOffset` **MUST** be aligned to the `componentType` byte length.
   */
  bufferView: GLTFId;
  /**
   * The offset relative to the start of the buffer view in bytes.
   */
  byteOffset?: number;
  /**
   * The indices data type.
   */
  componentType: number | number | number | number;
  extensions?: any;
  extras?: any;
  [k: string]: any;
}
/**
 * An object pointing to a buffer view containing the deviating accessor values. The number of elements is equal to `accessor.sparse.count` times number of components. The elements have the same component type as the base accessor. The elements are tightly packed. Data **MUST** be aligned following the same rules as the base accessor.
 */
export interface GLTFAccessorSparseValues {
  /**
   * The index of the bufferView with sparse values. The referenced buffer view **MUST NOT** have its `target` or `byteStride` properties defined.
   */
  bufferView: GLTFId;
  /**
   * The offset relative to the start of the bufferView in bytes.
   */
  byteOffset?: number;
  extensions?: any;
  extras?: any;
  [k: string]: any;
}
/**
 * Sparse storage of accessor values that deviate from their initialization value.
 */
export interface GLTFAccessorSparse {
  /**
   * Number of deviating accessor values stored in the sparse array.
   */
  count: number;
  /**
   * An object pointing to a buffer view containing the indices of deviating accessor values. The number of indices is equal to `count`. Indices **MUST** strictly increase.
   */
  indices: GLTFAccessorSparseIndices;
  /**
   * An object pointing to a buffer view containing the deviating accessor values.
   */
  values: GLTFAccessorSparseValues;
  extensions?: any;
  extras?: any;
  [k: string]: any;
}
/**
 * A typed view into a buffer view that contains raw binary data.
 */
export interface GLTFAccessor {
  /**
   * The index of the bufferView.
   */
  bufferView?: GLTFId;
  /**
   * The offset relative to the start of the buffer view in bytes.
   */
  byteOffset?: number;
  /**
   * The datatype of the accessor's components.
   */
  componentType: number | number | number | number | number | number | number;
  /**
   * Specifies whether integer data values are normalized before usage.
   */
  normalized?: boolean;
  /**
   * The number of elements referenced by this accessor.
   */
  count: number;
  /**
   * Specifies if the accessor's elements are scalars, vectors, or matrices.
   */
  type: any | any | any | any | any | any | any | string;
  /**
   * Maximum value of each component in this accessor.
   */
  max?: number[];
  /**
   * Minimum value of each component in this accessor.
   */
  min?: number[];
  /**
   * Sparse storage of elements that deviate from their initialization value.
   */
  sparse?: GLTFAccessorSparse;
  name?: any;
  extensions?: any;
  extras?: any;
  [k: string]: any;
}
/**
 * The descriptor of the animated property.
 */
export interface GLTFAnimationChannelTarget {
  /**
   * The index of the node to animate. When undefined, the animated object **MAY** be defined by an extension.
   */
  node?: GLTFId;
  /**
   * The name of the node's TRS property to animate, or the `"weights"` of the Morph Targets it instantiates. For the `"translation"` property, the values that are provided by the sampler are the translation along the X, Y, and Z axes. For the `"rotation"` property, the values are a quaternion in the order (x, y, z, w), where w is the scalar. For the `"scale"` property, the values are the scaling factors along the X, Y, and Z axes.
   */
  path: any | any | any | any | string;
  extensions?: any;
  extras?: any;
  [k: string]: any;
}
/**
 * An animation channel combines an animation sampler with a target property being animated.
 */
export interface GLTFAnimationChannel {
  /**
   * The index of a sampler in this animation used to compute the value for the target.
   */
  sampler: GLTFId;
  /**
   * The descriptor of the animated property.
   */
  target: GLTFAnimationChannelTarget;
  extensions?: any;
  extras?: any;
  [k: string]: any;
}
/**
 * An animation sampler combines timestamps with a sequence of output values and defines an interpolation algorithm.
 */
export interface GLTFAnimationSampler {
  /**
   * The index of an accessor containing keyframe timestamps.
   */
  input: GLTFId;
  /**
   * Interpolation algorithm.
   */
  interpolation?: any | any | any | string;
  /**
   * The index of an accessor, containing keyframe output values.
   */
  output: GLTFId;
  extensions?: any;
  extras?: any;
  [k: string]: any;
}
/**
 * A keyframe animation.
 */
export interface GLTFAnimation {
  /**
   * An array of animation channels. An animation channel combines an animation sampler with a target property being animated. Different channels of the same animation **MUST NOT** have the same targets.
   */
  channels: GLTFAnimationChannel[];
  /**
   * An array of animation samplers. An animation sampler combines timestamps with a sequence of output values and defines an interpolation algorithm.
   */
  samplers: GLTFAnimationSampler[];
  name?: any;
  extensions?: any;
  extras?: any;
  [k: string]: any;
}
/**
 * Metadata about the glTF asset.
 */
export interface GLTFAsset {
  /**
   * A copyright message suitable for display to credit the content creator.
   */
  copyright?: string;
  /**
   * Tool that generated this glTF model.  Useful for debugging.
   */
  generator?: string;
  /**
   * The glTF version in the form of `<major>.<minor>` that this asset targets.
   */
  version: string;
  /**
   * The minimum glTF version in the form of `<major>.<minor>` that this asset targets. This property **MUST NOT** be greater than the asset version.
   */
  minVersion?: string;
  extensions?: any;
  extras?: any;
  [k: string]: any;
}
/**
 * A buffer points to binary geometry, animation, or skins.
 */
export interface GLTFBuffer {
  /**
   * The URI (or IRI) of the buffer.
   */
  uri?: string;
  /**
   * The length of the buffer in bytes.
   */
  byteLength: number;
  name?: any;
  extensions?: any;
  extras?: any;
  [k: string]: any;
}
/**
 * A view into a buffer generally representing a subset of the buffer.
 */
export interface GLTFBufferView {
  /**
   * The index of the buffer.
   */
  buffer: GLTFId;
  /**
   * The offset into the buffer in bytes.
   */
  byteOffset?: number;
  /**
   * The length of the bufferView in bytes.
   */
  byteLength: number;
  /**
   * The stride, in bytes.
   */
  byteStride?: number;
  /**
   * The hint representing the intended GPU buffer type to use with this buffer view.
   */
  target?: number | number | number;
  name?: any;
  extensions?: any;
  extras?: any;
  [k: string]: any;
}
/**
 * An orthographic camera containing properties to create an orthographic projection matrix.
 */
export interface GLTFCameraOrthographic {
  /**
   * The floating-point horizontal magnification of the view. This value **MUST NOT** be equal to zero. This value **SHOULD NOT** be negative.
   */
  xmag: number;
  /**
   * The floating-point vertical magnification of the view. This value **MUST NOT** be equal to zero. This value **SHOULD NOT** be negative.
   */
  ymag: number;
  /**
   * The floating-point distance to the far clipping plane. This value **MUST NOT** be equal to zero. `zfar` **MUST** be greater than `znear`.
   */
  zfar: number;
  /**
   * The floating-point distance to the near clipping plane.
   */
  znear: number;
  extensions?: any;
  extras?: any;
  [k: string]: any;
}
/**
 * A perspective camera containing properties to create a perspective projection matrix.
 */
export interface GLTFCameraPerspective {
  /**
   * The floating-point aspect ratio of the field of view.
   */
  aspectRatio?: number;
  /**
   * The floating-point vertical field of view in radians. This value **SHOULD** be less than π.
   */
  yfov: number;
  /**
   * The floating-point distance to the far clipping plane.
   */
  zfar?: number;
  /**
   * The floating-point distance to the near clipping plane.
   */
  znear: number;
  extensions?: any;
  extras?: any;
  [k: string]: any;
}
/**
 * A camera's projection.  A node **MAY** reference a camera to apply a transform to place the camera in the scene.
 */
export interface GLTFCamera {
  /**
   * An orthographic camera containing properties to create an orthographic projection matrix. This property **MUST NOT** be defined when `perspective` is defined.
   */
  orthographic?: GLTFCameraOrthographic;
  /**
   * A perspective camera containing properties to create a perspective projection matrix. This property **MUST NOT** be defined when `orthographic` is defined.
   */
  perspective?: GLTFCameraPerspective;
  /**
   * Specifies if the camera uses a perspective or orthographic projection.
   */
  type: any | any | string;
  name?: any;
  extensions?: any;
  extras?: any;
  [k: string]: any;
}
/**
 * Image data used to create a texture. Image **MAY** be referenced by an URI (or IRI) or a buffer view index.
 */
export interface GLTFImage {
  /**
   * The URI (or IRI) of the image.
   */
  uri?: string;
  /**
   * The image's media type. This field **MUST** be defined when `bufferView` is defined.
   */
  mimeType?: string;
  /**
   * The index of the bufferView that contains the image. This field **MUST NOT** be defined when `uri` is defined.
   */
  bufferView?: GLTFId;
  name?: any;
  extensions?: any;
  extras?: any;
  [k: string]: any;
}
/**
 * Reference to a texture.
 */
export interface GLTFTextureInfo {
  /**
   * The index of the texture.
   */
  index: GLTFId;
  /**
   * The set index of texture's TEXCOORD attribute used for texture coordinate mapping.
   */
  texCoord?: number;
  extensions?: any;
  extras?: any;
  [k: string]: any;
}
/**
 * A set of parameter values that are used to define the metallic-roughness material model from Physically-Based Rendering (PBR) methodology.
 */
export interface GLTFMaterialPbrMetallicRoughness {
  /**
   * The factors for the base color of the material.
   */
  baseColorFactor?: number[];
  /**
   * The base color texture.
   */
  baseColorTexture?: GLTFTextureInfo;
  /**
   * The factor for the metalness of the material.
   */
  metallicFactor?: number;
  /**
   * The factor for the roughness of the material.
   */
  roughnessFactor?: number;
  /**
   * The metallic-roughness texture.
   */
  metallicRoughnessTexture?: GLTFTextureInfo;
  extensions?: any;
  extras?: any;
  [k: string]: any;
}
export interface GLTFMaterialNormalTextureInfo {
  index?: any;
  texCoord?: any;
  /**
   * The scalar parameter applied to each normal vector of the normal texture.
   */
  scale?: number;
  extensions?: any;
  extras?: any;
  [k: string]: any;
}
export interface GLTFMaterialOcclusionTextureInfo {
  index?: any;
  texCoord?: any;
  /**
   * A scalar multiplier controlling the amount of occlusion applied.
   */
  strength?: number;
  extensions?: any;
  extras?: any;
  [k: string]: any;
}
/**
 * The material appearance of a primitive.
 */
export interface GLTFMaterial {
  name?: any;
  extensions?: any;
  extras?: any;
  /**
   * A set of parameter values that are used to define the metallic-roughness material model from Physically Based Rendering (PBR) methodology. When undefined, all the default values of `pbrMetallicRoughness` **MUST** apply.
   */
  pbrMetallicRoughness?: GLTFMaterialPbrMetallicRoughness;
  /**
   * The tangent space normal texture.
   */
  normalTexture?: GLTFMaterialNormalTextureInfo;
  /**
   * The occlusion texture.
   */
  occlusionTexture?: GLTFMaterialOcclusionTextureInfo;
  /**
   * The emissive texture.
   */
  emissiveTexture?: GLTFTextureInfo;
  /**
   * The factors for the emissive color of the material.
   */
  emissiveFactor?: number[];
  /**
   * The alpha rendering mode of the material.
   */
  alphaMode?: string;
  /**
   * The alpha cutoff value of the material.
   */
  alphaCutoff?: number;
  /**
   * Specifies whether the material is double sided.
   */
  doubleSided?: boolean;
  [k: string]: any;
}
/**
 * Geometry to be rendered with the given material.
 */
export interface GLTFMeshPrimitive {
  /**
   * A plain JSON object, where each key corresponds to a mesh attribute semantic and each value is the index of the accessor containing attribute's data.
   */
  attributes: {
    [k: string]: GLTFId;
  };
  /**
   * The index of the accessor that contains the vertex indices.
   */
  indices?: GLTFId;
  /**
   * The index of the material to apply to this primitive when rendering.
   */
  material?: GLTFId;
  /**
   * The topology type of primitives to render.
   */
  mode?: number | number | number | number | number | number | number | number;
  /**
   * An array of morph targets.
   */
  targets?: {
    [k: string]: GLTFId;
  }[];
  extensions?: any;
  extras?: any;
  [k: string]: any;
}
/**
 * A set of primitives to be rendered.  Its global transform is defined by a node that references it.
 */
export interface GLTFMesh {
  /**
   * An array of primitives, each defining geometry to be rendered.
   */
  primitives: GLTFMeshPrimitive[];
  /**
   * Array of weights to be applied to the morph targets. The number of array elements **MUST** match the number of morph targets.
   */
  weights?: number[];
  name?: any;
  extensions?: any;
  extras?: any;
  [k: string]: any;
}
/**
 * A node in the node hierarchy.  When the node contains `skin`, all `mesh.primitives` **MUST** contain `JOINTS_0` and `WEIGHTS_0` attributes.  A node **MAY** have either a `matrix` or any combination of `translation`/`rotation`/`scale` (TRS) properties. TRS properties are converted to matrices and postmultiplied in the `T * R * S` order to compose the transformation matrix; first the scale is applied to the vertices, then the rotation, and then the translation. If none are provided, the transform is the identity. When a node is targeted for animation (referenced by an animation.channel.target), `matrix` **MUST NOT** be present.
 */
export interface GLTFNode {
  /**
   * The index of the camera referenced by this node.
   */
  camera?: GLTFId;
  /**
   * The indices of this node's children.
   */
  children?: GLTFId[];
  /**
   * The index of the skin referenced by this node.
   */
  skin?: GLTFId;
  /**
   * A floating-point 4x4 transformation matrix stored in column-major order.
   */
  matrix?: number[];
  /**
   * The index of the mesh in this node.
   */
  mesh?: GLTFId;
  /**
   * The node's unit quaternion rotation in the order (x, y, z, w), where w is the scalar.
   */
  rotation?: number[];
  /**
   * The node's non-uniform scale, given as the scaling factors along the x, y, and z axes.
   */
  scale?: number[];
  /**
   * The node's translation along the x, y, and z axes.
   */
  translation?: number[];
  /**
   * The weights of the instantiated morph target. The number of array elements **MUST** match the number of morph targets of the referenced mesh. When defined, `mesh` **MUST** also be defined.
   */
  weights?: number[];
  name?: any;
  extensions?: {
    [key: string]: any;
    MX_reflection_probes?: GLTFReflectionProbeRef;
  };
  extras?: any;
  [k: string]: any;
}
/**
 * Texture sampler properties for filtering and wrapping modes.
 */
export interface GLTFSampler {
  /**
   * Magnification filter.
   */
  magFilter?: number | number | number;
  /**
   * Minification filter.
   */
  minFilter?: number | number | number | number | number | number | number;
  /**
   * S (U) wrapping mode.
   */
  wrapS?: number | number | number | number;
  /**
   * T (V) wrapping mode.
   */
  wrapT?: number | number | number | number;
  name?: any;
  extensions?: any;
  extras?: any;
  [k: string]: any;
}
/**
 * The root nodes of a scene.
 */
export interface GLTFScene {
  /**
   * The indices of each root node.
   */
  nodes?: GLTFId[];
  name?: any;
  extensions?: {
    [key: string]: any;
    MX_reflection_probes?: GLTFReflectionProbeRef;
    MX_postprocessing?: GLTFPostprocessingExtension;
  };
  extras?: any;
  [k: string]: any;
}
/**
 * Joints and matrices defining a skin.
 */
export interface GLTFSkin {
  /**
   * The index of the accessor containing the floating-point 4x4 inverse-bind matrices.
   */
  inverseBindMatrices?: GLTFId;
  /**
   * The index of the node used as a skeleton root.
   */
  skeleton?: GLTFId;
  /**
   * Indices of skeleton nodes, used as joints in this skin.
   */
  joints: GLTFId[];
  name?: any;
  extensions?: any;
  extras?: any;
  [k: string]: any;
}
/**
 * A texture and its sampler.
 */
export interface GLTFTexture {
  /**
   * The index of the sampler used by this texture. When undefined, a sampler with repeat wrapping and auto filtering **SHOULD** be used.
   */
  sampler?: GLTFId;
  /**
   * The index of the image used by this texture. When undefined, an extension or other mechanism **SHOULD** supply an alternate texture source, otherwise behavior is undefined.
   */
  source?: GLTFId;
  name?: any;
  extensions?: any;
  extras?: any;
  [k: string]: any;
}
/**
 * The root object for a glTF asset.
 */
export interface GLTFRoot {
  /**
   * Names of glTF extensions used in this asset.
   */
  extensionsUsed?: string[];
  /**
   * Names of glTF extensions required to properly load this asset.
   */
  extensionsRequired?: string[];
  /**
   * An array of accessors.
   */
  accessors?: GLTFAccessor[];
  /**
   * An array of keyframe animations.
   */
  animations?: GLTFAnimation[];
  /**
   * Metadata about the glTF asset.
   */
  asset: GLTFAsset;
  /**
   * An array of buffers.
   */
  buffers?: GLTFBuffer[];
  /**
   * An array of bufferViews.
   */
  bufferViews?: GLTFBufferView[];
  /**
   * An array of cameras.
   */
  cameras?: GLTFCamera[];
  /**
   * An array of images.
   */
  images?: GLTFImage[];
  /**
   * An array of materials.
   */
  materials?: GLTFMaterial[];
  /**
   * An array of meshes.
   */
  meshes?: GLTFMesh[];
  /**
   * An array of nodes.
   */
  nodes?: GLTFNode[];
  /**
   * An array of samplers.
   */
  samplers?: GLTFSampler[];
  /**
   * The index of the default scene.
   */
  scene?: GLTFId;
  /**
   * An array of scenes.
   */
  scenes?: GLTFScene[];
  /**
   * An array of skins.
   */
  skins?: GLTFSkin[];
  /**
   * An array of textures.
   */
  textures?: GLTFTexture[];
  extensions?: {
    [key: string]: any;
    KHR_audio?: GLTFKHRAudioExtension;
    KHR_lights_punctual?: GLTFKHRLightsExtension;
    MX_reflection_probes?: GLTFRootReflectionProbesExtension;
  };
  extras?: any;
  [k: string]: any;
}

interface GLTFKHRAudioExtension {
  audio?: GLTFAudio[];
  sources?: GLTFAudioSource[];
  emitters?: GLTFAudioEmitter[];
}

interface GLTFKHRLightsExtension {
  lights: GLTFLight[];
}

export interface GLTFAudio {
  uri?: string;
  mimeType?: string;
  bufferView?: GLTFId;
  name?: any;
  extensions?: any;
  extras?: any;
  [k: string]: any;
}

export interface GLTFAudioSource {
  gain?: number;
  autoPlay?: boolean;
  loop?: boolean;
  audio?: GLTFId;
  name?: any;
  extensions?: any;
  extras?: any;
  [k: string]: any;
}

export interface GLTFAudioEmitter {
  type: string;
  gain?: number;
  sources?: GLTFId[];
  positional?: GLTFAudioEmitterPositional;
  name?: any;
  extensions?: any;
  extras?: any;
  [k: string]: any;
}

export interface GLTFAudioEmitterPositional {
  coneInnerAngle?: number;
  coneOuterAngle?: number;
  coneOuterGain?: number;
  distanceModel?: string;
  maxDistance?: number;
  refDistance?: number;
  rolloffFactor?: number;
  extensions?: any;
  extras?: any;
}

export interface GLTFLight {
  name?: string;
  spot?: GLTFSpotLight;
  color?: number[];
  intensity?: number;
  range?: number;
  type: string;
}

export interface GLTFSpotLight {
  innerConeAngle: number;
  outerConeAngle: number;
}

export enum GLTFLightType {
  Directional = "directional",
  Point = "point",
  Spot = "spot",
}

export interface GLTFInstancedMeshExtension {
  /**
   * A plain JSON object, where each key corresponds to a mesh attribute semantic and each value is the index of the accessor containing attribute's data.
   */
  attributes: {
    [k: string]: GLTFId;
  };
}

export interface GLTFLightmapExtension {
  lightMapTexture: GLTFTextureInfo;
  scale?: number[];
  offset?: number[];
  intensity?: number;
}

export interface GLTFReflectionProbeRef {
  reflectionProbe: number;
}

export interface GLTFReflectionProbe {
  size?: number[];
  reflectionProbeTexture: GLTFTextureInfo;
}

export interface GLTFRootReflectionProbesExtension {
  reflectionProbes: GLTFReflectionProbe[];
}

export interface GLTFBloomEffect {
  strength: number;
}

export interface GLTFPostprocessingExtension {
  bloom?: GLTFBloomEffect;
}
