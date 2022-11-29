#ifndef __websg_h
#define __websg_h
#include <math.h>

#define import_websg(NAME) __attribute__((import_module("websg"),import_name(#NAME)))

#define export __attribute__((used))

typedef struct ArrayBuffer {
  unsigned int size;
  unsigned char *buf;
} ArrayBuffer;

typedef struct _Skin Skin;

typedef struct _Node Node;

typedef enum ResourceType {
  ResourceType_Unknown = 0,
  ResourceType_Nametag = 1,
  ResourceType_Sampler = 2,
  ResourceType_Buffer = 3,
  ResourceType_BufferView = 4,
  ResourceType_AudioData = 5,
  ResourceType_AudioSource = 6,
  ResourceType_MediaStreamSource = 7,
  ResourceType_AudioEmitter = 8,
  ResourceType_Image = 9,
  ResourceType_Texture = 10,
  ResourceType_ReflectionProbe = 11,
  ResourceType_Material = 12,
  ResourceType_Light = 13,
  ResourceType_Camera = 14,
  ResourceType_SparseAccessor = 15,
  ResourceType_Accessor = 16,
  ResourceType_MeshPrimitive = 17,
  ResourceType_InstancedMesh = 18,
  ResourceType_Mesh = 19,
  ResourceType_LightMap = 20,
  ResourceType_TilesRenderer = 21,
  ResourceType_Skin = 22,
  ResourceType_Interactable = 23,
  ResourceType_Node = 24,
  ResourceType_Scene = 25,
} ResourceType;

typedef struct Nametag {
  const char *name;
  float_t screen_x;
  float_t screen_y;
  float_t distance_from_camera;
  int in_frustum;
} Nametag;

typedef enum SamplerMagFilter {
  SamplerMagFilter_NEAREST = 9728,
  SamplerMagFilter_LINEAR = 9729,
} SamplerMagFilter;

typedef enum SamplerMinFilter {
  SamplerMinFilter_NEAREST = 9728,
  SamplerMinFilter_LINEAR = 9729,
  SamplerMinFilter_NEAREST_MIPMAP_NEAREST = 9984,
  SamplerMinFilter_LINEAR_MIPMAP_NEAREST = 9985,
  SamplerMinFilter_NEAREST_MIPMAP_LINEAR = 9986,
  SamplerMinFilter_LINEAR_MIPMAP_LINEAR = 9987,
} SamplerMinFilter;

typedef enum SamplerWrap {
  SamplerWrap_CLAMP_TO_EDGE = 33071,
  SamplerWrap_MIRRORED_REPEAT = 33648,
  SamplerWrap_REPEAT = 10497,
} SamplerWrap;

typedef enum SamplerMapping {
  SamplerMapping_UVMapping = 0,
  SamplerMapping_CubeReflectionMapping = 1,
  SamplerMapping_CubeRefractionMapping = 2,
  SamplerMapping_EquirectangularReflectionMapping = 3,
  SamplerMapping_EquirectangularRefractionMapping = 4,
  SamplerMapping_CubeUVReflectionMapping = 5,
} SamplerMapping;

typedef struct Sampler {
  const char *name;
  SamplerMagFilter mag_filter;
  SamplerMinFilter min_filter;
  SamplerWrap wrap_s;
  SamplerWrap wrap_t;
  SamplerMapping mapping;
} Sampler;

typedef struct Buffer {
  const char *name;
  const char *uri;
  ArrayBuffer data;
} Buffer;

typedef enum BufferViewTarget {
  BufferViewTarget_None = 0,
  BufferViewTarget_ArrayBuffer = 34962,
  BufferViewTarget_ElementArrayBuffer = 34963,
} BufferViewTarget;

typedef struct BufferView {
  const char *name;
  Buffer *buffer;
  unsigned int byte_offset;
  unsigned int byte_length;
  unsigned int byte_stride;
  BufferViewTarget target;
} BufferView;

typedef struct AudioData {
  const char *name;
  BufferView *buffer_view;
  const char *mime_type;
  const char *uri;
} AudioData;

typedef struct AudioSource {
  const char *name;
  AudioData *audio;
  float_t gain;
  int auto_play;
  float_t seek;
  int play;
  int loop;
  float_t playback_rate;
  float_t current_time;
  int playing;
  float_t duration;
} AudioSource;

typedef struct MediaStreamSource {
  const char *name;
  const char *stream;
  float_t gain;
} MediaStreamSource;

typedef enum AudioEmitterType {
  AudioEmitterType_Positional = 0,
  AudioEmitterType_Global = 1,
} AudioEmitterType;

typedef enum AudioEmitterOutput {
  AudioEmitterOutput_Environment = 0,
  AudioEmitterOutput_Music = 1,
  AudioEmitterOutput_Voice = 2,
} AudioEmitterOutput;

typedef enum AudioEmitterDistanceModel {
  AudioEmitterDistanceModel_Linear = 0,
  AudioEmitterDistanceModel_Inverse = 1,
  AudioEmitterDistanceModel_Exponential = 2,
} AudioEmitterDistanceModel;

typedef struct AudioEmitter {
  const char *name;
  AudioEmitterType type;
  AudioSource *sources[16];
  float_t gain;
  float_t cone_inner_angle;
  float_t cone_outer_angle;
  AudioEmitterDistanceModel distance_model;
  float_t max_distance;
  float_t ref_distance;
  float_t rolloff_factor;
  AudioEmitterOutput output;
} AudioEmitter;

typedef struct Image {
  const char *name;
  const char *uri;
  const char *mime_type;
  BufferView *buffer_view;
  int flip_y;
} Image;

typedef enum TextureEncoding {
  TextureEncoding_Linear = 3000,
  TextureEncoding_sRGB = 3001,
} TextureEncoding;

typedef struct Texture {
  const char *name;
  Sampler *sampler;
  Image *source;
  TextureEncoding encoding;
} Texture;

typedef struct ReflectionProbe {
  const char *name;
  Texture *reflection_probe_texture;
  float_t size[3];
} ReflectionProbe;

typedef enum MaterialAlphaMode {
  MaterialAlphaMode_OPAQUE = 0,
  MaterialAlphaMode_MASK = 1,
  MaterialAlphaMode_BLEND = 2,
} MaterialAlphaMode;

typedef enum MaterialType {
  MaterialType_Standard = 0,
  MaterialType_Unlit = 1,
} MaterialType;

typedef struct Material {
  const char *name;
  MaterialType type;
  int double_sided;
  float_t alpha_cutoff;
  MaterialAlphaMode alpha_mode;
  float_t base_color_factor[4];
  Texture *base_color_texture;
  float_t metallic_factor;
  float_t roughness_factor;
  Texture *metallic_roughness_texture;
  float_t normal_texture_scale;
  Texture *normal_texture;
  float_t occlusion_texture_strength;
  Texture *occlusion_texture;
  float_t emissive_strength;
  float_t emissive_factor[3];
  Texture *emissive_texture;
  float_t ior;
  float_t transmission_factor;
  Texture *transmission_texture;
  float_t thickness_factor;
  Texture *thickness_texture;
  float_t attenuation_distance;
  float_t attenuation_color[3];
} Material;

typedef enum LightType {
  LightType_Directional = 0,
  LightType_Point = 1,
  LightType_Spot = 2,
} LightType;

typedef struct Light {
  const char *name;
  LightType type;
  float_t color[3];
  float_t intensity;
  float_t range;
  int cast_shadow;
  float_t inner_cone_angle;
  float_t outer_cone_angle;
} Light;

typedef enum CameraType {
  CameraType_Perspective = 0,
  CameraType_Orthographic = 1,
} CameraType;

typedef struct Camera {
  const char *name;
  CameraType type;
  unsigned int layers;
  float_t zfar;
  float_t znear;
  float_t xmag;
  float_t ymag;
  float_t yfov;
  float_t aspect_ratio;
  int projection_matrix_needs_update;
} Camera;

typedef enum AccessorComponentType {
  AccessorComponentType_Int8 = 5120,
  AccessorComponentType_Uint8 = 5121,
  AccessorComponentType_Int16 = 5122,
  AccessorComponentType_Uint16 = 5123,
  AccessorComponentType_Uint32 = 5125,
  AccessorComponentType_Float32 = 5126,
} AccessorComponentType;

typedef struct SparseAccessor {
  unsigned int count;
  BufferView *indices_buffer_view;
  unsigned int indices_byte_offset;
  AccessorComponentType indices_component_type;
  BufferView *values_buffer_view;
  unsigned int values_byte_offset;
} SparseAccessor;

typedef enum AccessorType {
  AccessorType_SCALAR = 0,
  AccessorType_VEC2 = 1,
  AccessorType_VEC3 = 2,
  AccessorType_VEC4 = 3,
  AccessorType_MAT2 = 4,
  AccessorType_MAT3 = 5,
  AccessorType_MAT4 = 6,
} AccessorType;

typedef struct Accessor {
  const char *name;
  BufferView *buffer_view;
  unsigned int byte_offset;
  AccessorComponentType component_type;
  int normalized;
  unsigned int count;
  AccessorType type;
  float_t max[16];
  float_t min[16];
  SparseAccessor *sparse;
} Accessor;

typedef enum MeshPrimitiveMode {
  MeshPrimitiveMode_POINTS = 0,
  MeshPrimitiveMode_LINES = 1,
  MeshPrimitiveMode_LINE_LOOP = 2,
  MeshPrimitiveMode_LINE_STRIP = 3,
  MeshPrimitiveMode_TRIANGLES = 4,
  MeshPrimitiveMode_TRIANGLE_STRIP = 5,
  MeshPrimitiveMode_TRIANGLE_FAN = 6,
} MeshPrimitiveMode;

typedef enum MeshPrimitiveAttributeIndex {
  MeshPrimitiveAttributeIndex_POSITION = 0,
  MeshPrimitiveAttributeIndex_NORMAL = 1,
  MeshPrimitiveAttributeIndex_TANGENT = 2,
  MeshPrimitiveAttributeIndex_TEXCOORD_0 = 3,
  MeshPrimitiveAttributeIndex_TEXCOORD_1 = 4,
  MeshPrimitiveAttributeIndex_COLOR_0 = 5,
  MeshPrimitiveAttributeIndex_JOINTS_0 = 6,
  MeshPrimitiveAttributeIndex_WEIGHTS_0 = 7,
} MeshPrimitiveAttributeIndex;

typedef enum InstancedMeshAttributeIndex {
  InstancedMeshAttributeIndex_TRANSLATION = 0,
  InstancedMeshAttributeIndex_ROTATION = 1,
  InstancedMeshAttributeIndex_SCALE = 2,
  InstancedMeshAttributeIndex_LIGHTMAP_OFFSET = 3,
  InstancedMeshAttributeIndex_LIGHTMAP_SCALE = 4,
} InstancedMeshAttributeIndex;

typedef struct MeshPrimitive {
  Material *material;
} MeshPrimitive;

typedef struct InstancedMesh {
  const char *name;
  Accessor *attributes[10];
} InstancedMesh;

typedef struct Mesh {
  const char *name;
  MeshPrimitive *primitives[16];
} Mesh;

typedef struct LightMap {
  const char *name;
  Texture *texture;
  float_t offset[2];
  float_t scale[2];
  float_t intensity;
} LightMap;

typedef struct TilesRenderer {
  const char *uri;
} TilesRenderer;

typedef struct _Skin {
  const char *name;
  Node *joints[128];
  Accessor *inverse_bind_matrices;
} Skin;

typedef enum InteractableType {
  InteractableType_Interactable = 1,
  InteractableType_Grabbable = 2,
  InteractableType_Player = 3,
  InteractableType_Portal = 4,
} InteractableType;

typedef struct Interactable {
  const char *name;
  InteractableType type;
  int pressed;
  int held;
  int released;
} Interactable;

typedef struct _Node {
  const char *name;
  Mesh *mesh;
  Light *light;
  Interactable *interactable;
} Node;

typedef struct Scene {
  const char *name;
  Texture *background_texture;
  ReflectionProbe *reflection_probe;
  AudioEmitter *audio_emitters[16];
  Node *first_node;
} Scene;

import_websg(get_resource_by_name) void *websg_get_resource_by_name(ResourceType type, const char *name);
import_websg(create_resource) int websg_create_resource(ResourceType type, void *resource);
import_websg(dispose_resource) int websg_dispose_resource(void *resource);

#endif