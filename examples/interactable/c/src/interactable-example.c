#include <math.h>
#include <stdlib.h>
#include <stdbool.h>
#include <string.h>
#include "../../../../src/engine/scripting/emscripten/src/websg.h"

node_id_t material_button;
node_id_t room1_switch;
node_id_t room2_switch;
node_id_t left_cube;
node_id_t right_cube;

light_id_t room1_light;
light_id_t room2_light;

material_id_t left_cube_material;
material_id_t right_cube_material;
texture_id_t bricks_texture;
texture_id_t planks_texture;

bool material_button_state = true;
bool room1_switch_state = true;
bool room2_switch_state = true;

export void websg_load() {
  const char *material_button_name = "MaterialButton";
  material_button = websg_node_find_by_name(material_button_name, strlen(material_button_name));
  const char *left_cube_name = "LeftCube";
  left_cube = websg_node_find_by_name(left_cube_name, strlen(left_cube_name));
  const char *right_cube_name = "RightCube";
  right_cube = websg_node_find_by_name(right_cube_name, strlen(right_cube_name));
  const char *room1_switch_name = "Room1Switch";
  room1_switch = websg_node_find_by_name(room1_switch_name, strlen(room1_switch_name));
  const char *room2_switch_name = "Room2Switch";
  room2_switch = websg_node_find_by_name(room2_switch_name, strlen(room2_switch_name));
  const char *room1_light_name = "Room1Light";
  node_id_t room1_light_node = websg_node_find_by_name(room1_light_name, strlen(room1_light_name));
  websg_node_set_is_static(room1_light_node, 0);
  room1_light = websg_node_get_light(room1_light_node);
  const char *room2_light_name = "Room2Light";
  node_id_t room2_light_node = websg_node_find_by_name(room2_light_name, strlen(room2_light_name));
  websg_node_set_is_static(room2_light_node, 0);
  room2_light = websg_node_get_light(room2_light_node);

  mesh_id_t right_cube_mesh = websg_node_get_mesh(right_cube);
  right_cube_material = websg_mesh_get_primitive_material(right_cube_mesh, 0);
  bricks_texture = websg_material_get_base_color_texture(right_cube_material);

  mesh_id_t left_cube_mesh = websg_node_get_mesh(left_cube);
  left_cube_material = websg_mesh_get_primitive_material(left_cube_mesh, 0);
  planks_texture = websg_material_get_base_color_texture(left_cube_material);

  websg_add_interactable(material_button, InteractableType_Interactable);
  websg_add_interactable(room1_switch, InteractableType_Interactable);
  websg_add_interactable(room2_switch, InteractableType_Interactable);
}

export void websg_update(float_t dt) {
  if (websg_get_interactable_pressed(material_button)) {
    material_button_state = !material_button_state;
    websg_material_set_base_color_texture(left_cube_material, material_button_state ? planks_texture : bricks_texture);
    websg_material_set_base_color_texture(right_cube_material, material_button_state ? bricks_texture : planks_texture);
  }

  if (websg_get_interactable_pressed(room1_switch)) {
    room1_switch_state = !room1_switch_state;
    websg_light_set_intensity(room1_light, room1_switch_state ? 20.0f : 0.0f);
  }

  if (websg_get_interactable_pressed(room2_switch)) {
    room2_switch_state = !room2_switch_state;
    websg_light_set_intensity(room2_light, room2_switch_state ? 20.0f : 0.0f);
  }
}
