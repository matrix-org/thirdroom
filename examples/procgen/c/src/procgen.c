#include <math.h>
#include <stdlib.h>
#include <stdint.h>
#include <stdbool.h>
#include <string.h>
#define FNL_IMPL
#include "./FastNoiseLite.h"
#include "../../../../src/scripting/src/generated/websg.h"

#define MIN(a,b) (((a)<(b))?(a):(b))
#define MAX(a,b) (((a)>(b))?(a):(b))
#define F_EPSILON 0.00000005f
#define F_EQ(x,y) (((x)*(x) - (y)*(y) <= F_EPSILON) ? 1 : 0)

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

struct SphereData {
  int vertex_count;
  uint16_t *indices;
  float_t *positions;
  float_t *normals;
  float_t *uvs;
  MeshPrimitive *mesh_primitive;
} typedef SphereData;

// Adapted from https://github.com/dmnsgn/primitive-geometry/blob/main/src/ellipsoid.js
SphereData *generate_sphere_primitive(
  MeshPrimitive *mesh_primitive,
  float_t radius,
  int widthSegments,
  int heightSegments,
  float_t theta,
  float_t thetaOffset,
  float_t phi,
  float_t phiOffset
) {
  size_t byte_length = 0;

  int size = (widthSegments + 1) * (heightSegments + 1);

  int indices_count = widthSegments * heightSegments * 6;
  size_t indices_byte_length = sizeof(uint16_t) * indices_count;
  size_t indices_byte_offset = byte_length;
  byte_length += indices_byte_length;

  int positions_count = size;
  size_t positions_byte_length = sizeof(float_t) * positions_count * 3;
  size_t positions_byte_offset = byte_length;
  byte_length += positions_byte_length;

  int normals_count = size;
  size_t normals_byte_length = sizeof(float_t) * normals_count * 3;
  size_t normals_byte_offset = byte_length;
  byte_length += normals_byte_length;

  int uvs_count = size;
  size_t uvs_byte_length = sizeof(float_t) * uvs_count * 2;
  size_t uvs_byte_offset = byte_length;
  byte_length += uvs_byte_length;

  void *buffer_data = malloc(byte_length);

  uint16_t *indices = buffer_data + indices_byte_offset;
  float_t *positions = buffer_data + positions_byte_offset;
  float_t *normals = buffer_data + normals_byte_offset;
  float_t *uvs = buffer_data + uvs_byte_offset;

  float_t temp[3];
  int vertexIndex = 0;
  int curIndex = 0;

  for ( int iy = 0; iy <= heightSegments; iy ++ ) {

    float_t v = (float)iy / heightSegments;
    float_t t = v * theta + thetaOffset;
    float_t cosTheta = cosf(t);
    float_t sinTheta = sinf(t);

    for ( int ix = 0; ix <= widthSegments; ix ++ ) {

      float_t u = (float)ix / widthSegments;
      float_t p = u * phi + phiOffset;
      float_t cosPhi = cosf(p);
      float_t sinPhi = sinf(p);

      temp[0] = -cosPhi * sinTheta;
      temp[1] = -cosTheta;
      temp[2] = sinPhi * sinTheta;

      positions[vertexIndex * 3] = radius * temp[0];
      positions[vertexIndex * 3 + 1] = radius * temp[1];
      positions[vertexIndex * 3 + 2] = radius * temp[2];

      float_t length = sqrtf(temp[0] * temp[0] + temp[1] * temp[1] + temp[2] * temp[2]);
      float_t n = 1 / length;
      normals[vertexIndex * 3] = temp[0] * n;
      normals[vertexIndex * 3 + 1] = temp[1] * n;
      normals[vertexIndex * 3 + 2] = temp[2] * n;

      uvs[vertexIndex * 2] = u;
      uvs[vertexIndex * 2 + 1] = v;

      vertexIndex++;
    }

    if (iy > 0) {
      for (int i = vertexIndex - 2 * (widthSegments + 1); i + widthSegments + 2 < vertexIndex; i++) {
        int16_t a = i;
        int16_t b = i + 1;
        int16_t c = i + widthSegments + 1;
        int16_t d = i + widthSegments + 2;
        indices[curIndex] = a;
        indices[curIndex + 1] = b;
        indices[curIndex + 2] = c;

        indices[curIndex + 3] = c;
        indices[curIndex + 4] = b;
        indices[curIndex + 5] = d;

        curIndex += 6;
      }
    }
  }

  Buffer *buffer = malloc(sizeof(Buffer));
  buffer->data.size = byte_length;
  buffer->data.mutable = true;
  buffer->data.data = buffer_data;
  websg_create_resource(ResourceType_Buffer, buffer);

  BufferView *geometry_buffer_view = malloc(sizeof(BufferView));
  geometry_buffer_view->buffer = buffer;
  geometry_buffer_view->byte_length = byte_length;
  geometry_buffer_view->byte_offset = 0;
  geometry_buffer_view->byte_stride = 0;
  websg_create_resource(ResourceType_BufferView, geometry_buffer_view);

  Accessor *indices_accessor = malloc(sizeof(Accessor));
  indices_accessor->buffer_view = geometry_buffer_view;
  indices_accessor->component_type = AccessorComponentType_Uint16;
  indices_accessor->byte_offset = indices_byte_offset;
  indices_accessor->count = indices_count;
  indices_accessor->type = AccessorType_SCALAR;
  indices_accessor->normalized = false;
  indices_accessor->dynamic = false;
  indices_accessor->version = 0;
  websg_create_resource(ResourceType_Accessor, indices_accessor);

  Accessor *positions_accessor = malloc(sizeof(Accessor));
  positions_accessor->buffer_view = geometry_buffer_view;
  positions_accessor->component_type = AccessorComponentType_Float32;
  positions_accessor->byte_offset = positions_byte_offset;
  positions_accessor->count = positions_count;
  positions_accessor->type = AccessorType_VEC3;
  positions_accessor->normalized = false;
  positions_accessor->dynamic = true;
  positions_accessor->version = 0;
  websg_create_resource(ResourceType_Accessor, positions_accessor);

  Accessor *normals_accessor = malloc(sizeof(Accessor));
  normals_accessor->buffer_view = geometry_buffer_view;
  normals_accessor->component_type = AccessorComponentType_Float32;
  normals_accessor->byte_offset = normals_byte_offset;
  normals_accessor->count = normals_count;
  normals_accessor->type = AccessorType_VEC3;
  normals_accessor->normalized = true;
  normals_accessor->dynamic = true;
  normals_accessor->version = 0;
  websg_create_resource(ResourceType_Accessor, normals_accessor);

  Accessor *uvs_accessor = malloc(sizeof(Accessor));
  uvs_accessor->buffer_view = geometry_buffer_view;
  uvs_accessor->component_type = AccessorComponentType_Float32;
  uvs_accessor->byte_offset = uvs_byte_offset;
  uvs_accessor->count = uvs_count;
  uvs_accessor->type = AccessorType_VEC2;
  uvs_accessor->normalized = false;
  uvs_accessor->dynamic = false;
  uvs_accessor->version = 0;
  websg_create_resource(ResourceType_Accessor, uvs_accessor);

  mesh_primitive->mode = MeshPrimitiveMode_TRIANGLES;
  mesh_primitive->indices = indices_accessor;
  mesh_primitive->attributes[MeshPrimitiveAttributeIndex_POSITION] = positions_accessor;
  mesh_primitive->attributes[MeshPrimitiveAttributeIndex_NORMAL] = normals_accessor;
  mesh_primitive->attributes[MeshPrimitiveAttributeIndex_TEXCOORD_0] = uvs_accessor;

  SphereData *sphere_data = malloc(sizeof(SphereData));
  sphere_data->vertex_count = vertexIndex;
  sphere_data->indices = indices;
  sphere_data->positions = positions;
  sphere_data->normals = normals;
  sphere_data->uvs = uvs;
  sphere_data->mesh_primitive = mesh_primitive;

  return sphere_data;
}

fnl_state noise_state;
SphereData *sphere;

export void websg_loaded() {
  Material *material = malloc(sizeof(Material));
  material->type = MaterialType_Standard;
  material->alpha_mode = MaterialAlphaMode_OPAQUE;
  material->base_color_factor[0] = 0;
  material->base_color_factor[1] = 0;
  material->base_color_factor[2] = 0;
  material->base_color_factor[3] = 1;
  material->metallic_factor = 1;
  material->roughness_factor = 0.01;
  websg_create_resource(ResourceType_Material, material);

  MeshPrimitive *mesh_primitive = malloc(sizeof(MeshPrimitive));
  sphere = generate_sphere_primitive(mesh_primitive, 1, 32, 16, M_PI, 0, M_PI * 2, 0);
  mesh_primitive->material = material;
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
  node->position[0] = 7;
  node->position[1] = 8;
  node->position[2] = -17;
  node->quaternion[0] = 0;
  node->quaternion[1] = 0;
  node->quaternion[2] = 0;
  node->quaternion[3] = 1;
  node->scale[0] = 3;
  node->scale[1] = 3;
  node->scale[2] = 3;
  websg_create_resource(ResourceType_Node, node);


  Scene *scene = websg_get_active_scene();
  add_node_to_scene(scene, node);

  noise_state = fnlCreateState();
  noise_state.noise_type = FNL_NOISE_OPENSIMPLEX2;
  noise_state.frequency = 0.05;
  noise_state.fractal_type = FNL_FRACTAL_PINGPONG;
}

float_t elapsed = 0;

export void websg_update(float_t dt) {
  elapsed += dt;

  for (int i = 0; i < sphere->vertex_count; i++) {
    float_t x = sphere->positions[i * 3];
    float_t y = sphere->positions[i * 3 + 1];
    float_t z = sphere->positions[i * 3 + 2];

    float_t length = sqrtf(x * x + y * y + z * z);
    float_t n = 1 / length;
    x = x * n;
    y = y * n;
    z = z * n;

    float_t noise = 1 + 0.5 * fnlGetNoise3D(&noise_state, x * 50 + elapsed, y * 50, z * 50);
    sphere->positions[i * 3] = x * noise;
    sphere->positions[i * 3 + 1] = y * noise;
    sphere->positions[i * 3 + 2] = z * noise;
  }

  sphere->mesh_primitive->attributes[MeshPrimitiveAttributeIndex_POSITION]->version++;
}
