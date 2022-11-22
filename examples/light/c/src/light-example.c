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

Light *directional_light;
float_t elapsed = 0;

export void websg_loaded() {
  directional_light = websg_get_resource_by_name(ResourceType_Light, "DirectionalLight");
}

export void websg_update(float_t dt) {
  elapsed += dt;
  directional_light->color[0] = (sin(elapsed) + 1.0) / 2.0;
}