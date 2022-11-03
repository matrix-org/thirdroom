#ifndef __wasgi_h
#define __wasgi_h
#include <math.h>

#include "../include/quickjs/cutils.h"

#define import(MODULE) __attribute__((import_module(#MODULE)))
#define export __attribute__((used))

export void *allocate(int size);
export void deallocate(void *ptr);

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
  int32_t cast_shadow;
  float_t inner_cone_angle;
  float_t outer_cone_angle;
} Light;

import(wasgi) Light *get_light_by_name(const char *name);
import(wasgi) Light *create_light();
import(wasgi) int set_light_name(Light *light, const char *name);
import(wasgi) int dispose_light(Light *light);

#endif