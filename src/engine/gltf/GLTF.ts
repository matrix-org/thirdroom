export type GLTFId = number;

export type GLTFExtensions = { [key: string]: unknown };

export type GLTFExtras = { [key: string]: unknown };

export interface GLTFProperty {
  extensions?: GLTFExtensions;
  extras?: GLTFExtras;
}

export interface GLTFChildOfRootProperty extends GLTFProperty {
  name?: string;
}

/**
 * An object pointing to a buffer view containing the indices of deviating accessor values. The number of indices is equal to `accessor.sparse.count`. Indices **MUST** strictly increase.
 */
export interface GLTFAccessorSparseIndices extends GLTFProperty {
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
  componentType: 5121 | 5123 | 5125;
}

/**
 * An object pointing to a buffer view containing the deviating accessor values. The number of elements is equal to `accessor.sparse.count` times number of components. The elements have the same component type as the base accessor. The elements are tightly packed. Data **MUST** be aligned following the same rules as the base accessor.
 */
export interface GLTFAccessorSparseValues extends GLTFProperty {
  /**
   * The index of the bufferView with sparse values. The referenced buffer view **MUST NOT** have its `target` or `byteStride` properties defined.
   */
  bufferView: GLTFId;
  /**
   * The offset relative to the start of the bufferView in bytes.
   */
  byteOffset?: number;
}

/**
 * Sparse storage of accessor values that deviate from their initialization value.
 */
export interface GLTFAccessorSparse extends GLTFProperty {
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
}

/**
 * A typed view into a buffer view that contains raw binary data.
 */
export interface GLTFAccessor extends GLTFChildOfRootProperty {
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
  componentType: 5120 | 5121 | 5122 | 5123 | 5125 | 5126;
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
  type: "SCALAR" | "VEC2" | "VEC3" | "VEC4" | "MAT2" | "MAT3" | "MAT4";
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
}

/**
 * The descriptor of the animated property.
 */
export interface GLTFAnimationChannelTarget extends GLTFProperty {
  /**
   * The index of the node to animate. When undefined, the animated object **MAY** be defined by an extension.
   */
  node?: GLTFId;
  /**
   * The name of the node's TRS property to animate, or the `"weights"` of the Morph Targets it instantiates. For the `"translation"` property, the values that are provided by the sampler are the translation along the X, Y, and Z axes. For the `"rotation"` property, the values are a quaternion in the order (x, y, z, w), where w is the scalar. For the `"scale"` property, the values are the scaling factors along the X, Y, and Z axes.
   */
  path: "translation" | "rotation" | "scale" | "weights";
}

/**
 * An animation channel combines an animation sampler with a target property being animated.
 */
export interface GLTFAnimationChannel extends GLTFProperty {
  /**
   * The index of a sampler in this animation used to compute the value for the target.
   */
  sampler: GLTFId;
  /**
   * The descriptor of the animated property.
   */
  target: GLTFAnimationChannelTarget;
}

/**
 * An animation sampler combines timestamps with a sequence of output values and defines an interpolation algorithm.
 */
export interface GLTFAnimationSampler extends GLTFProperty {
  /**
   * The index of an accessor containing keyframe timestamps.
   */
  input: GLTFId;
  /**
   * Interpolation algorithm.
   */
  interpolation?: "LINEAR" | "STEP" | "CUBICSPLINE";
  /**
   * The index of an accessor, containing keyframe output values.
   */
  output: GLTFId;
}

/**
 * A keyframe animation.
 */
export interface GLTFAnimation extends GLTFChildOfRootProperty {
  /**
   * An array of animation channels. An animation channel combines an animation sampler with a target property being animated. Different channels of the same animation **MUST NOT** have the same targets.
   */
  channels: GLTFAnimationChannel[];
  /**
   * An array of animation samplers. An animation sampler combines timestamps with a sequence of output values and defines an interpolation algorithm.
   */
  samplers: GLTFAnimationSampler[];
}

/**
 * Metadata about the glTF asset.
 */
export interface GLTFAsset extends GLTFProperty {
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
}

/**
 * A buffer points to binary geometry, animation, or skins.
 */
export interface GLTFBuffer extends GLTFChildOfRootProperty {
  /**
   * The URI (or IRI) of the buffer.
   */
  uri?: string;
  /**
   * The length of the buffer in bytes.
   */
  byteLength: number;
}

/**
 * A view into a buffer generally representing a subset of the buffer.
 */
export interface GLTFBufferView extends GLTFChildOfRootProperty {
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
  target?: 34962 | 34963;
}

/**
 * An orthographic camera containing properties to create an orthographic projection matrix.
 */
export interface GLTFCameraOrthographic extends GLTFProperty {
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
}

/**
 * A perspective camera containing properties to create a perspective projection matrix.
 */
export interface GLTFCameraPerspective extends GLTFProperty {
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
}

/**
 * A camera's projection.  A node **MAY** reference a camera to apply a transform to place the camera in the scene.
 */
export interface GLTFCamera extends GLTFChildOfRootProperty {
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
  type: "perspective" | "orthographic";
}

/**
 * Image data used to create a texture. Image **MAY** be referenced by an URI (or IRI) or a buffer view index.
 */
export interface GLTFImage extends GLTFChildOfRootProperty {
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
}

/**
 * Reference to a texture.
 */
export interface GLTFTextureInfo extends GLTFProperty {
  /**
   * The index of the texture.
   */
  index: GLTFId;
  /**
   * The set index of texture's TEXCOORD attribute used for texture coordinate mapping.
   */
  texCoord?: number;

  extensions?: {
    KHR_texture_transform?: GLTFTextureTransform;
  };
}

export interface GLTFTextureTransform extends GLTFProperty {
  offset?: number[];
  rotation?: number;
  scale?: number[];
  texCoord?: number;
}

/**
 * A set of parameter values that are used to define the metallic-roughness material model from Physically-Based Rendering (PBR) methodology.
 */
export interface GLTFMaterialPbrMetallicRoughness extends GLTFProperty {
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
}

export interface GLTFMaterialNormalTextureInfo extends GLTFTextureInfo {
  /**
   * The scalar parameter applied to each normal vector of the normal texture.
   */
  scale?: number;
}

export interface GLTFMaterialOcclusionTextureInfo extends GLTFTextureInfo {
  /**
   * A scalar multiplier controlling the amount of occlusion applied.
   */
  strength?: number;
}

/**
 * The material appearance of a primitive.
 */
export interface GLTFMaterial extends GLTFChildOfRootProperty {
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
  extensions?: {
    KHR_materials_emissive_strength?: GLTFMaterialEmissiveStrength;
    KHR_materials_ior?: GLTFMaterialIOR;
    KHR_materials_transmission?: GLTFMaterialTransmission;
    KHR_materials_volume?: GLTFMaterialVolume;
    KHR_materials_unlit?: {};
  };
}

export interface GLTFMaterialEmissiveStrength extends GLTFProperty {
  emissiveStrength?: number;
}

export interface GLTFMaterialIOR extends GLTFProperty {
  ior?: number;
}

export interface GLTFMaterialTransmission extends GLTFProperty {
  transmissionFactor?: number;
  transmissionTexture?: GLTFTextureInfo;
}

export interface GLTFMaterialVolume extends GLTFProperty {
  thicknessFactor?: number;
  thicknessTexture?: GLTFTextureInfo;
  attenuationDistance?: number;
  attenuationColor?: number[];
}

/**
 * Geometry to be rendered with the given material.
 */
export interface GLTFMeshPrimitive extends GLTFProperty {
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
  mode?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  /**
   * An array of morph targets.
   */
  targets?: {
    [k: string]: GLTFId;
  }[];
}

/**
 * A set of primitives to be rendered.  Its global transform is defined by a node that references it.
 */
export interface GLTFMesh extends GLTFChildOfRootProperty {
  /**
   * An array of primitives, each defining geometry to be rendered.
   */
  primitives: GLTFMeshPrimitive[];
  /**
   * Array of weights to be applied to the morph targets. The number of array elements **MUST** match the number of morph targets.
   */
  weights?: number[];
}

/**
 * A node in the node hierarchy.  When the node contains `skin`, all `mesh.primitives` **MUST** contain `JOINTS_0` and `WEIGHTS_0` attributes.  A node **MAY** have either a `matrix` or any combination of `translation`/`rotation`/`scale` (TRS) properties. TRS properties are converted to matrices and postmultiplied in the `T * R * S` order to compose the transformation matrix; first the scale is applied to the vertices, then the rotation, and then the translation. If none are provided, the transform is the identity. When a node is targeted for animation (referenced by an animation.channel.target), `matrix` **MUST NOT** be present.
 */
export interface GLTFNode extends GLTFChildOfRootProperty {
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
  extensions?: {
    EXT_mesh_gpu_instancing?: GLTFMeshGPUInstancing;
    MX_reflection_probes?: GLTFReflectionProbeRef;
    MX_lightmap?: GLTFLightmap;
    KHR_lights_punctual?: GLTFLightRef;
    KHR_audio?: GLTFNodeAudioRef;
    MOZ_hubs_components?: GLTFHubsComponents;
    MX_tiles_renderer?: GLTFTilesRenderer;
    OMI_collider?: GLTFColliderRef;
    MX_portal?: GLTFPortal;
    OMI_link?: GLTFLink;
    MX_spawn_point?: {};
  };
}

interface GLTFLightRef extends GLTFProperty {
  light: GLTFId;
}

export interface GLTFMeshGPUInstancing extends GLTFProperty {
  attributes: {
    TRANSLATION: GLTFId;
    ROTATION: GLTFId;
    SCALE: GLTFId;
    [key: string]: GLTFId;
  };
}

export interface GLTFNodeAudioRef extends GLTFProperty {
  emitter: GLTFId;
}

export interface GLTFHubsComponents extends GLTFProperty {
  "spawn-point"?: {};
  waypoint?: {
    canBeSpawnPoint: boolean;
  };
  trimesh?: {};
  "nav-mesh"?: {};
  visible?: {
    visible: boolean;
  };
  "scene-preview-camera"?: {};
}

export interface GLTFTilesRenderer extends GLTFProperty {
  tilesetUrl: string;
}

export interface GLTFLink extends GLTFProperty {
  uri: string;
}

export interface GLTFPortal extends GLTFProperty {
  uri: string;
}

export interface GLTFInstancedMeshExtension extends GLTFProperty {
  /**
   * A plain JSON object, where each key corresponds to a mesh attribute semantic and each value is the index of the accessor containing attribute's data.
   */
  attributes: {
    [k: string]: GLTFId;
  };
}

export interface GLTFLightmap extends GLTFProperty {
  lightMapTexture: GLTFTextureInfo;
  scale?: number[];
  offset?: number[];
  intensity?: number;
}

export interface GLTFReflectionProbeRef extends GLTFProperty {
  reflectionProbe: number;
}

export interface GLTFColliderRef extends GLTFProperty {
  collider: GLTFId;
}

/**
 * Texture sampler properties for filtering and wrapping modes.
 */
export interface GLTFSampler extends GLTFChildOfRootProperty {
  /**
   * Magnification filter.
   */
  magFilter?: 9728 | 9729;
  /**
   * Minification filter.
   */
  minFilter?: 9728 | 9729 | 9984 | 9985 | 9986 | 9987;
  /**
   * S (U) wrapping mode.
   */
  wrapS?: 33071 | 33648 | 10497;
  /**
   * T (V) wrapping mode.
   */
  wrapT?: 33071 | 33648 | 10497;
}

/**
 * The root nodes of a scene.
 */
export interface GLTFScene extends GLTFChildOfRootProperty {
  /**
   * The indices of each root node.
   */
  nodes?: GLTFId[];
  extensions?: GLTFExtensions & {
    MX_reflection_probes?: GLTFReflectionProbeRef;
    MX_postprocessing?: GLTFPostprocessingExtension;
    KHR_audio?: GLTFSceneAudioRefs;
    MX_background?: GLTFBackground;
    MX_character_controller?: GLTFCharacterController;
    MX_scene_ar?: GLTFSceneAR;
  };
}

export interface GLTFSceneAudioRefs extends GLTFProperty {
  emitters: GLTFId[];
}

export interface GLTFBackground extends GLTFProperty {
  backgroundTexture: GLTFTextureInfo;
}

export interface GLTFCharacterController extends GLTFProperty {
  type: "first-person" | "fly";
}

export type GLTFSceneAR = {};

/**
 * Joints and matrices defining a skin.
 */
export interface GLTFSkin extends GLTFChildOfRootProperty {
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
}

/**
 * A texture and its sampler.
 */
export interface GLTFTexture extends GLTFChildOfRootProperty {
  /**
   * The index of the sampler used by this texture. When undefined, a sampler with repeat wrapping and auto filtering **SHOULD** be used.
   */
  sampler?: GLTFId;
  /**
   * The index of the image used by this texture. When undefined, an extension or other mechanism **SHOULD** supply an alternate texture source, otherwise behavior is undefined.
   */
  source?: GLTFId;
  extensions?: GLTFExtensions & {
    KHR_texture_basisu?: GLTFTextureBasisU;
    MX_texture_rgbm?: GLTFTextureRGBM;
  };
}

export interface GLTFTextureBasisU extends GLTFProperty {
  source?: GLTFId;
}

export type GLTFTextureRGBM = GLTFProperty;

/**
 * The root object for a glTF asset.
 */
export interface GLTFRoot extends GLTFProperty {
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
  extensions?: GLTFExtensions & {
    KHR_audio?: GLTFKHRAudioExtension;
    KHR_lights_punctual?: GLTFKHRLightsExtension;
    MX_reflection_probes?: GLTFRootReflectionProbesExtension;
    OMI_collider?: GLTFColliders;
  };
}

interface GLTFKHRAudioExtension extends GLTFProperty {
  audio?: GLTFAudio[];
  sources?: GLTFAudioSource[];
  emitters?: GLTFAudioEmitter[];
}

interface GLTFKHRLightsExtension extends GLTFProperty {
  lights: GLTFLight[];
}

export interface GLTFAudio extends GLTFChildOfRootProperty {
  uri?: string;
  mimeType?: string;
  bufferView?: GLTFId;
}

export interface GLTFAudioSource extends GLTFChildOfRootProperty {
  gain?: number;
  autoPlay?: boolean;
  loop?: boolean;
  audio?: GLTFId;
}

export interface GLTFAudioEmitter extends GLTFChildOfRootProperty {
  type: string;
  gain?: number;
  sources?: GLTFId[];
  positional?: GLTFAudioEmitterPositional;
}

export interface GLTFAudioEmitterPositional extends GLTFChildOfRootProperty {
  coneInnerAngle?: number;
  coneOuterAngle?: number;
  coneOuterGain?: number;
  distanceModel?: string;
  maxDistance?: number;
  refDistance?: number;
  rolloffFactor?: number;
}

export interface GLTFLight extends GLTFChildOfRootProperty {
  name?: string;
  spot?: GLTFSpotLight;
  color?: number[];
  intensity?: number;
  range?: number;
  type: string;
}

export interface GLTFSpotLight extends GLTFProperty {
  innerConeAngle: number;
  outerConeAngle: number;
}

export enum GLTFLightType {
  Directional = "directional",
  Point = "point",
  Spot = "spot",
}

export interface GLTFReflectionProbe extends GLTFChildOfRootProperty {
  size?: number[];
  reflectionProbeTexture: GLTFTextureInfo;
}

export interface GLTFRootReflectionProbesExtension extends GLTFProperty {
  reflectionProbes: GLTFReflectionProbe[];
}

export interface GLTFBloomEffect extends GLTFProperty {
  strength?: number;
  radius?: number;
  threshold?: number;
}

export interface GLTFPostprocessingExtension extends GLTFProperty {
  bloom?: GLTFBloomEffect;
}

export interface GLTFColliders extends GLTFProperty {
  colliders: GLTFCollider[];
}

export interface GLTFCollider extends GLTFChildOfRootProperty {
  type: "box" | "mesh" | "sphere" | "capsule" | "hull";
  extents?: number[];
  radius?: number;
  height?: number;
  mesh?: number;
}
