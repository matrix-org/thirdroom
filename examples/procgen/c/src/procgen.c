#include <math.h>
#include <stdlib.h>
#include <stdint.h>
#include <stdbool.h>
#include <string.h>
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

void generate_sphere_primitive(
  MeshPrimitive *mesh_primitive,
  float_t radius,
  int widthSegments,
  int heightSegments,
  float_t phiStart,
  float_t phiLength,
  float_t thetaStart,
  float_t thetaLength
) {
  widthSegments = MAX( 3, widthSegments );
  heightSegments = MAX( 2, heightSegments );

  float_t thetaEnd = fminf( thetaStart + thetaLength, M_PI );

  // buffers

  size_t size = 0;

  int count = widthSegments * heightSegments;

  // indices
  int indices_count = count * 3;
  size_t indices_byte_length = sizeof(uint16_t) * indices_count;
  size_t indices_byte_offset = size;
  size += indices_byte_length;

  // positions
  int positions_count = count;
  size_t positions_byte_length = sizeof(float_t) * positions_count * 3;
  size_t positions_byte_offset = size;
  size += positions_byte_length;

  // normals
  int normals_count = count;
  size_t normals_byte_length = sizeof(float_t) * normals_count * 3;
  size_t normals_byte_offset = size;
  size += normals_byte_length;

  // uvs
  int uvs_count = count;
  size_t uvs_byte_length = sizeof(float_t) * uvs_count * 2;
  size_t uvs_byte_offset = size;
  size += uvs_byte_length;

  void *buffer_data = malloc(size);

  uint16_t *indices = buffer_data + indices_byte_offset;
  float_t *positions = buffer_data + positions_byte_offset;
  float_t *normals = buffer_data + normals_byte_offset;
  float_t *uvs = buffer_data + uvs_byte_offset;

  // generate positions, normals and uvs

  for ( int iy = 0; iy <= heightSegments; iy ++ ) {

    float_t v = iy / heightSegments;

    // special case for the poles

    float_t uOffset = 0;

    if ( iy == 0 && thetaStart == 0 ) {

      uOffset = 0.5 / widthSegments;

    } else if ( iy == heightSegments && F_EQ(thetaEnd, M_PI) ) {

      uOffset = - 0.5 / widthSegments;

    }

    for ( int ix = 0; ix <= widthSegments; ix ++ ) {

      float_t u = ix / widthSegments;

      // position

      float_t *position = &positions[ix * iy];
      position[0] = -radius * cosf(phiStart + u * phiLength) * sinf(thetaStart + v * thetaLength);
      position[1] = radius * cosf(thetaStart + v * thetaLength);
      position[2] = radius * sinf(phiStart + u * phiLength) * sinf(thetaStart + v * thetaLength);

      // normal

      float_t *normal = &normals[ix * iy];
      float_t length = sqrtf(position[0] * position[0] + position[1] * position[1] + position[2] * position[2]);
      float_t n = 1 / length;
      normal[0] = position[0] * n;
      normal[1] = position[1] * n;
      normal[2] = position[2] * n;

      // uv

      float_t *uv = &uvs[ix * iy];
      uv[0] = u + uOffset;
      uv[1] = 1 - v;
    }

  }

  // indices

  for ( int iy = 0; iy < heightSegments; iy ++ ) {

    for ( int ix = 0; ix < widthSegments; ix ++ ) {

      int index = iy * heightSegments + ix;

      int a = iy * (ix + 1);
      int b = iy * ix;;
      int c = (iy + 1) * ix;
      int d = (iy + 1) * (ix + 1);

      if ( iy != 0 || thetaStart > 0 ) {
        indices[index * 3] = a;
        indices[index * 3 + 1] = b;
        indices[index * 3 + 2] = b;
      }
      
      if ( iy != heightSegments - 1 || thetaEnd < M_PI ) {
        indices[index * 3] = b;
        indices[index * 3 + 1] = c;
        indices[index * 3 + 2] = d;
      }
    }

  }

  Buffer *buffer = malloc(sizeof(Buffer));
  buffer->data.size = size;
  buffer->data.mutable = true;
  buffer->data.data = buffer_data;
  websg_create_resource(ResourceType_Buffer, buffer);

  BufferView *geometry_buffer_view = malloc(sizeof(BufferView));
  geometry_buffer_view->buffer = buffer;
  geometry_buffer_view->byte_length = size;
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
  normals_accessor->dynamic = false;
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
}

void* data;
Accessor *positions_accessor;

export void websg_loaded() {
  Material *material = malloc(sizeof(Material));
  material->type = MaterialType_Unlit;
  material->alpha_mode = MaterialAlphaMode_OPAQUE;
  material->base_color_factor[0] = 1;
  material->base_color_factor[1] = 0;
  material->base_color_factor[2] = 0;
  material->base_color_factor[3] = 1;
  websg_create_resource(ResourceType_Material, material);

  MeshPrimitive *mesh_primitive = malloc(sizeof(MeshPrimitive));
  generate_sphere_primitive(mesh_primitive, 1, 32, 16, 0, M_PI, M_2_PI, 0);
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
  node->position[0] = 0;
  node->position[1] = 0;
  node->position[2] = 0;
  node->quaternion[0] = 0;
  node->quaternion[1] = 0;
  node->quaternion[2] = 0;
  node->quaternion[3] = 1;
  node->scale[0] = 10;
  node->scale[1] = 10;
  node->scale[2] = 10;
  websg_create_resource(ResourceType_Node, node);


  Scene *scene = websg_get_active_scene();
  add_node_to_scene(scene, node);
}

float_t elapsed = 0;

export void websg_update(float_t dt) {
  elapsed += dt;
}
