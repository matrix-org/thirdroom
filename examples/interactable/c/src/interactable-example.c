#include <math.h>
#include <stdlib.h>
#include <stdbool.h>
#include <string.h>
#include "websg.h"

Node *material_button;
Node *room1_switch;
Node *room2_switch;
Node *left_cube;
Node *right_cube;
Node *room1_light;
Node *room2_light;

Texture *bricks_texture;
Texture *planks_texture;

bool material_button_state = true;
bool room1_switch_state = true;
bool room2_switch_state = true;

export void websg_loaded() {
  material_button = websg_get_resource_by_name(ResourceType_Node, "MaterialButton");
  left_cube = websg_get_resource_by_name(ResourceType_Node, "LeftCube");
  right_cube = websg_get_resource_by_name(ResourceType_Node, "RightCube");
  room1_switch = websg_get_resource_by_name(ResourceType_Node, "Room1Switch");
  room2_switch = websg_get_resource_by_name(ResourceType_Node, "Room2Switch");
  room1_light = websg_get_resource_by_name(ResourceType_Node, "Room1Light");
  room2_light = websg_get_resource_by_name(ResourceType_Node, "Room2Light");

  MeshPrimitive *right_cube_primitive = right_cube->mesh->primitives[0];
  bricks_texture = right_cube_primitive->material->base_color_texture;
  MeshPrimitive *left_cube_primitive = left_cube->mesh->primitives[0];
  planks_texture = left_cube_primitive->material->base_color_texture;

  Interactable *material_button_interactable = malloc(sizeof(Interactable));
  Interactable *room1_switch_interactable = malloc(sizeof(Interactable));
  Interactable *room2_switch_interactable = malloc(sizeof(Interactable));

  websg_create_resource(ResourceType_Interactable, material_button_interactable);
  websg_create_resource(ResourceType_Interactable, room1_switch_interactable);
  websg_create_resource(ResourceType_Interactable, room2_switch_interactable);

  material_button->interactable = material_button_interactable;
  room1_switch->interactable = room1_switch_interactable;
  room2_switch->interactable = room2_switch_interactable;
}

export void websg_update(float_t dt) {
  if (material_button->interactable->pressed) {
    material_button_state = !material_button_state;

    MeshPrimitive *left_cube_primitive = left_cube->mesh->primitives[0];
    left_cube_primitive->material->base_color_texture = material_button_state ? planks_texture : bricks_texture;

    MeshPrimitive *right_cube_primitive = right_cube->mesh->primitives[0];
    right_cube_primitive->material->base_color_texture = material_button_state ? bricks_texture : planks_texture;
  }

  if (room1_switch->interactable->pressed) {
    room1_switch_state = !room1_switch_state;
    room1_light->light->intensity = room1_switch_state ? 20 : 0;
  }

  if (room2_switch->interactable->pressed) {
    room2_switch_state = !room2_switch_state;
    room2_light->light->intensity = room2_switch_state ? 20 : 0;
  }
}
