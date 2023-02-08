#include <math.h>
#include <stdlib.h>
#include <stdbool.h>
#include <string.h>
#include "../../../../src/scripting/src/generated/websg.h"
#include "../../../../src/scripting/src/network.h"

int PACKET_BYTES = 3;

export void *websg_allocate(int size) {
  return malloc(size);
}

export void websg_deallocate(void *ptr) {
  free(ptr);
}

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

unsigned char *outbound_network_packet;
unsigned char *inbound_network_packet;

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

  inbound_network_packet = malloc(sizeof(unsigned char[PACKET_BYTES]));
  outbound_network_packet = malloc(sizeof(unsigned char[PACKET_BYTES]));
}

export void websg_update(float_t dt) {

  // consume net packets
  while (websg_network_receive(inbound_network_packet, PACKET_BYTES) == 1) {
    // material_button
    material_button_state = inbound_network_packet[0];

    MeshPrimitive *left_cube_primitive = left_cube->mesh->primitives[0];
    left_cube_primitive->material->base_color_texture = material_button_state ? planks_texture : bricks_texture;

    MeshPrimitive *right_cube_primitive = right_cube->mesh->primitives[0];
    right_cube_primitive->material->base_color_texture = material_button_state ? bricks_texture : planks_texture;

    // room1 switch
    room1_switch_state = inbound_network_packet[1];
    room1_light->light->intensity = room1_switch_state ? 20 : 0;

    // room2 switch
    room2_switch_state = inbound_network_packet[2];
    room2_light->light->intensity = room2_switch_state ? 20 : 0;
  }

  bool sendUpdate = false;

  if (material_button->interactable->pressed) {
    material_button_state = !material_button_state;

    MeshPrimitive *left_cube_primitive = left_cube->mesh->primitives[0];
    left_cube_primitive->material->base_color_texture = material_button_state ? planks_texture : bricks_texture;

    MeshPrimitive *right_cube_primitive = right_cube->mesh->primitives[0];
    right_cube_primitive->material->base_color_texture = material_button_state ? bricks_texture : planks_texture;

    sendUpdate = true;
  }

  if (room1_switch->interactable->pressed) {
    room1_switch_state = !room1_switch_state;
    room1_light->light->intensity = room1_switch_state ? 20 : 0;

    sendUpdate = true;
  }

  if (room2_switch->interactable->pressed) {
    room2_switch_state = !room2_switch_state;
    room2_light->light->intensity = room2_switch_state ? 20 : 0;

    sendUpdate = true;
  }

  if (sendUpdate) {
    outbound_network_packet[0] = material_button_state ? 1 : 0;
    outbound_network_packet[1] = room1_switch_state ? 1 : 0;
    outbound_network_packet[2] = room2_switch_state ? 1 : 0;

    websg_network_broadcast(outbound_network_packet, PACKET_BYTES);
  }
}
