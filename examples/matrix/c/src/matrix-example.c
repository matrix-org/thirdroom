#include <math.h>
#include <stdlib.h>
#include <stdbool.h>
#include <string.h>
#include "../../../../src/engine/scripting/emscripten/src/websg.h"
#include "../../../../src/engine/scripting/emscripten/src/thirdroom.h"

node_id_t tv_node;
bool tv_state = false;

export void websg_load() {
  const char *tv_node_name = "TV";
  tv_node = websg_world_find_node_by_name(tv_node_name, strlen(tv_node_name));
  InteractableProps *props = malloc(sizeof(InteractableProps));
  props->type = InteractableType_Interactable;
  websg_node_add_interactable(tv_node, props);
  free(props);
}

export void websg_update(float_t dt) {
  if (websg_node_get_interactable_pressed(tv_node)) {
    tv_state = !tv_state;
    thirdroom_enable_matrix_material(tv_state);
  }
}
