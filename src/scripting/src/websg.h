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

#endif