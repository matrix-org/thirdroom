#ifndef __websg_h
#define __websg_h
#include <math.h>

#define import_websg(NAME) __attribute__((import_module("websg"),import_name(#NAME)))

#define export __attribute__((used))

export void *websg_allocate(int size);
export void websg_deallocate(void *ptr);

typedef enum  {
  Directional,
  Point,
  Spot,
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

import_websg(get_light_by_name) Light *websg_get_light_by_name(const char *name);
import_websg(create_light) Light *websg_create_light(LightType type);
import_websg(set_light_name) int websg_set_light_name(Light *light, const char *name);
import_websg(dispose_light) int websg_dispose_light(Light *light);

typedef struct BufferView {} BufferView;

typedef struct Sampler {} Sampler;

typedef struct Image {
  const char *name;
  const char *uri;
  const char *mime_type;
  BufferView *buffer_view;
  bool flip_y;
} Image;

import_websg(get_image_by_name) Light *websg_get_image_by_name(const char *name);
import_websg(create_image_from_uri) Light *websg_create_image_from_uri(const char *uri, bool flipY);
import_websg(create_image_from_buffer_view) Light *websg_create_image_from_buffer_view(
  BufferView *bufferView,
  const char *mimeType, 
  bool flipY
);
import_websg(set_image_name) int websg_set_image_name(Image *image, const char *name);
import_websg(dispose_image) int websg_dispose_image(Image *image);

typedef enum {
  Linear = 3000,
  sRGB = 3001,
} TextureEncoding;

typedef struct Texture {
  const char *name;
  Sampler *sampler;
  Image *source;
  TextureEncoding encoding;
} Texture;

import_websg(get_texture_by_name) Texture *websg_get_texture_by_name(const char *name);
import_websg(create_texture) Texture *websg_create_texture(Image *source, Sampler *sampler, TextureEncoding encoding);
import_websg(set_texture_name) int websg_set_texture_name(Texture *texture, const char *name);
import_websg(dispose_texture) int websg_dispose_texture(Texture *texture);

typedef enum  {
  Standard,
  Unlit,
} MaterialType;

typedef enum {
  OPAQUE,
  MASK,
  BLEND,
} MaterialAlphaMode;

typedef struct Material {
  const char *name;
  LightType type;
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

import_websg(get_material_by_name) Material *websg_get_material_by_name(const char *name);
import_websg(create_material) Material *websg_create_material(MaterialType type);
import_websg(set_material_name) int websg_set_material_name(Material *material, const char *name);
import_websg(set_material_base_color_texture) int websg_set_material_base_color_texture(
  Material *material,
  Texture *texture
);
import_websg(set_material_metallic_roughness_texture) int websg_set_material_metallic_roughness_texture(
  Material *material,
  Texture *texture
);
import_websg(set_material_normal_texture) int websg_set_material_normal_texture(
  Material *material,
  Texture *texture
);
import_websg(set_material_occlusion_texture) int websg_set_material_occlusion_texture(
  Material *material,
  Texture *texture
);
import_websg(set_material_emissive_texture) int websg_set_material_emissive_texture(
  Material *material,
  Texture *texture
);
import_websg(set_material_transmission_texture) int websg_set_material_transmission_texture(
  Material *material,
  Texture *texture
);
import_websg(set_material_thickness_texture) int websg_set_material_thickness_texture(
  Material *material,
  Texture *texture
);
import_websg(dispose_material) int websg_dispose_material(Material *material);

#endif