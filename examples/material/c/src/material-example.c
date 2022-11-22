#include <math.h>
#include <stdlib.h>
#include <stdbool.h>
#include <string.h>

#include "websg.h"

export void *websg_allocate(int size) {
  return malloc(size);
}

export void websg_deallocate(void *ptr) {
  free(ptr);
}

Material *default_material;
Material *ground_material;
Material *glass_material;
Texture *ground_texture;
float_t elapsed = 0;

export void websg_loaded() {
  default_material = websg_get_resource_by_name(ResourceType_Material, "Default");
  ground_material = websg_get_resource_by_name(ResourceType_Material, "Ground");
  glass_material = websg_get_resource_by_name(ResourceType_Material, "Glass");
  ground_texture = ground_material->base_color_texture;
}

export void websg_update(float_t dt) {
  elapsed += dt;

  default_material->base_color_factor[1] = (sin(elapsed) + 1) / 2;
  ground_material->base_color_factor[0] = (sin(elapsed) + 1) / 2;
  glass_material->base_color_factor[3] = (sin(elapsed) + 1) / 2;

  if (elapsed > 5 && ground_material->base_color_texture) {
    default_material->base_color_texture = ground_texture;
    ground_material->base_color_texture = 0;
  }
}