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

typedef enum  {
  Standard,
  Unlit,
} MaterialType;

typedef enum {
  OPAQUE,
  MASK,
  BLEND,
} MaterialAlphaMode;

typedef struct Texture {} Texture;

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
import_websg(dispose_material) int websg_dispose_material(Material *material);

#endif