#include <math.h>
#include "websg.h"

Light *directionalLight;
float_t elapsed = 0;

export void websg_initialize() {
  directionalLight = websg_get_light_by_name("DirectionalLight");
}


export void websg_update(float_t dt) {
  elapsed += dt;
  directionalLight->color[0] = (sin(elapsed) + 1.0) / 2.0;
}