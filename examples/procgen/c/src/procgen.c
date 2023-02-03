#include <math.h>
#include <stdlib.h>
#include <stdbool.h>
#include <string.h>
#include "../../../../src/scripting/src/generated/websg.h"

export void *websg_allocate(int size) {
  return malloc(size);
}

export void websg_deallocate(void *ptr) {
  free(ptr);
}

void add_node_to_scene(Scene *scene, Node *node) {
  if (scene->first_node == NULL) {
    node->parent_scene = scene;
    scene->first_node = node;
  } else {
    Node *cur = scene->first_node;
    Node *last;

    while (cur != NULL) {
      last = cur;
      cur = cur->next_sibling;
    }

    last->next_sibling = node;
    node->prev_sibling = last;
    node->parent_scene = scene;
  }
}

const float_t F_POSITIONS[] = {
  // left column front
  0,   0,  0,
  0, 150,  0,
  30,   0,  0,
  0, 150,  0,
  30, 150,  0,
  30,   0,  0,

  // top rung front
  30,   0,  0,
  30,  30,  0,
  100,   0,  0,
  30,  30,  0,
  100,  30,  0,
  100,   0,  0,

  // middle rung front
  30,  60,  0,
  30,  90,  0,
  67,  60,  0,
  30,  90,  0,
  67,  90,  0,
  67,  60,  0,

  // left column back
  0,    0,  30,
  30,   0,  30,
  0,  150,  30,
  0, 150,  30,
  30,   0,  30,
  30, 150,  30,

  // top rung back
  30,   0,  30,
  100,   0,  30,
  30,  30,  30,
  30,  30,  30,
  100,   0,  30,
  100,  30,  30,

  // middle rung back
  30,  60,  30,
  67,  60,  30,
  30,  90,  30,
  30,  90,  30,
  67,  60,  30,
  67,  90,  30,

  // top
  0,   0,   0,
  100, 0,   0,
  100, 0,  30,
  0,   0,   0,
  100, 0,  30,
  0,   0,  30,

  // top rung right
  100,   0,   0,
  100,  30,   0,
  100,  30,  30,
  100,   0,   0,
  100,  30,  30,
  100,   0,  30,

  // under top rung
  30,   30,   0,
  30,   30,  30,
  100,  30,  30,
  30,   30,   0,
  100,  30,  30,
  100,  30,   0,

  // between top rung and middle
  30,   30,   0,
  30,   60,  30,
  30,   30,  30,
  30,   30,   0,
  30,   60,   0,
  30,   60,  30,

  // top of middle rung
  30,   60,   0,
  67,   60,  30,
  30,   60,  30,
  30,   60,   0,
  67,   60,   0,
  67,   60,  30,

  // right of middle rung
  67,   60,   0,
  67,   90,  30,
  67,   60,  30,
  67,   60,   0,
  67,   90,   0,
  67,   90,  30,

  // bottom of middle rung.
  30,   90,   0,
  30,   90,  30,
  67,   90,  30,
  30,   90,   0,
  67,   90,  30,
  67,   90,   0,

  // right of bottom
  30,   90,   0,
  30,  150,  30,
  30,   90,  30,
  30,   90,   0,
  30,  150,   0,
  30,  150,  30,

  // bottom
  0,   150,   0,
  0,   150,  30,
  30,  150,  30,
  0,   150,   0,
  30,  150,  30,
  30,  150,   0,

  // left side
  0,   0,   0,
  0,   0,  30,
  0, 150,  30,
  0,   0,   0,
  0, 150,  30,
  0, 150,   0,
};

void* data;
Accessor *positions_accessor;

export void websg_loaded() {
  size_t size = 288 * sizeof(float_t);
  data = malloc(size);
  memcpy(data, &F_POSITIONS, size);

  Buffer *buffer = malloc(sizeof(Buffer));
  buffer->data.size = size;
  buffer->data.mutable = true;
  buffer->data.data = data;
  websg_create_resource(ResourceType_Buffer, buffer);

  BufferView *geometry_buffer_view = malloc(sizeof(BufferView));
  geometry_buffer_view->buffer = buffer;
  geometry_buffer_view->byte_length = size;
  geometry_buffer_view->byte_offset = 0;
  geometry_buffer_view->byte_stride = 0;
  websg_create_resource(ResourceType_BufferView, geometry_buffer_view);

  positions_accessor = malloc(sizeof(Accessor));
  positions_accessor->buffer_view = geometry_buffer_view;
  positions_accessor->component_type = AccessorComponentType_Float32;
  positions_accessor->byte_offset = 0;
  positions_accessor->count = 96;
  positions_accessor->type = AccessorType_VEC3;
  positions_accessor->normalized = false;
  positions_accessor->dynamic = true;
  positions_accessor->version = 0;
  websg_create_resource(ResourceType_Accessor, positions_accessor);

  Material *material = malloc(sizeof(Material));
  material->type = MaterialType_Unlit;
  material->alpha_mode = MaterialAlphaMode_OPAQUE;
  material->base_color_factor[0] = 1;
  material->base_color_factor[1] = 0;
  material->base_color_factor[2] = 0;
  material->base_color_factor[3] = 1;
  websg_create_resource(ResourceType_Material, material);

  MeshPrimitive *mesh_primitive = malloc(sizeof(MeshPrimitive));
  mesh_primitive->mode = MeshPrimitiveMode_TRIANGLES;
  mesh_primitive->material = material;
  mesh_primitive->attributes[MeshPrimitiveAttributeIndex_POSITION] = positions_accessor;
  websg_create_resource(ResourceType_MeshPrimitive, mesh_primitive);

  Mesh *mesh = malloc(sizeof(Mesh));
  mesh->primitives[0] = mesh_primitive;
  websg_create_resource(ResourceType_Mesh, mesh);

  Node *node = malloc(sizeof(Node));
  node->enabled = true;
  node->is_static = false;
  node->visible = true;
  node->layers = 1;
  node->world_matrix_needs_update = true;
  node->mesh = mesh;
  node->position[0] = 0;
  node->position[1] = 0;
  node->position[2] = 0;
  node->quaternion[0] = 0;
  node->quaternion[1] = 0;
  node->quaternion[2] = 0;
  node->quaternion[3] = 1;
  node->scale[0] = 1;
  node->scale[1] = 1;
  node->scale[2] = 1;
  websg_create_resource(ResourceType_Node, node);


  Scene *scene = websg_get_active_scene();
  add_node_to_scene(scene, node);
}

float_t elapsed = 0;

export void websg_update(float_t dt) {
  elapsed += dt;
  float_t *positions = (float_t*)data;

  for (int i = 0; i < 288; i ++) {
    positions[i] = F_POSITIONS[i] + sinf(elapsed);
  }

  positions_accessor->version++;
}
