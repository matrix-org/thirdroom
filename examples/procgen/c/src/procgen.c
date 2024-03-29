#include <math.h>
#include <stdlib.h>
#include <stdint.h>
#include <stdbool.h>
#include <string.h>
#include <emscripten/console.h>
#define FNL_IMPL
#include "./FastNoiseLite.h"
#include "../../../../src/engine/scripting/emscripten/src/websg.h"
#include "../../../../src/engine/scripting/emscripten/src/thirdroom.h"

#define MIN(a,b) (((a)<(b))?(a):(b))
#define MAX(a,b) (((a)>(b))?(a):(b))
#define F_EPSILON 0.00000005f
#define F_EQ(x,y) (((x)*(x) - (y)*(y) <= F_EPSILON) ? 1 : 0)

struct SphereData {
  int vertex_count;
  accessor_id_t positions_accessor;
  float_t *positions;
  size_t positions_byte_length;
  mesh_id_t mesh_id;
} typedef SphereData;

// Adapted from https://github.com/dmnsgn/primitive-geometry/blob/main/src/ellipsoid.js
SphereData *generate_sphere_mesh(
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
  uint16_t *indices = malloc(indices_byte_length);

  int positions_count = size;
  size_t positions_byte_length = sizeof(float_t) * positions_count * 3;
  float_t *positions = malloc(positions_byte_length);

  int normals_count = size;
  size_t normals_byte_length = sizeof(float_t) * normals_count * 3;
  float_t *normals = malloc(normals_byte_length);

  int uvs_count = size;
  size_t uvs_byte_length = sizeof(float_t) * uvs_count * 2;
  float_t *uvs = malloc(uvs_byte_length);

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

  MeshPrimitiveProps *primitive_props = malloc(sizeof(MeshPrimitiveProps));
  primitive_props->mode = MeshPrimitiveMode_TRIANGLES;
  
  AccessorFromProps *indices_props = malloc(sizeof(AccessorFromProps));
  indices_props->component_type = AccessorComponentType_Uint16;
  indices_props->count = indices_count;
  indices_props->type = AccessorType_SCALAR;
  accessor_id_t indices_accessor = websg_world_create_accessor_from(indices, indices_byte_length, indices_props);
  primitive_props->indices = indices_accessor;

  primitive_props->attributes.items = malloc(sizeof(MeshPrimitiveAttributeItem) * 3);
  primitive_props->attributes.count = 3;

  AccessorFromProps *positions_props = malloc(sizeof(AccessorFromProps));
  positions_props->component_type = AccessorComponentType_Float32;
  positions_props->count = positions_count;
  positions_props->type = AccessorType_VEC3;
  positions_props->dynamic = true;
  accessor_id_t positions_accessor = websg_world_create_accessor_from(positions, positions_byte_length, positions_props);
  primitive_props->attributes.items[0].key = MeshPrimitiveAttribute_POSITION;
  primitive_props->attributes.items[0].accessor_id = positions_accessor;

  AccessorFromProps *normals_props = malloc(sizeof(AccessorFromProps));
  normals_props->component_type = AccessorComponentType_Float32;
  normals_props->count = normals_count;
  normals_props->type = AccessorType_VEC3;
  normals_props->normalized = true;
  normals_props->dynamic = true;
  accessor_id_t normals_accessor = websg_world_create_accessor_from(normals, normals_byte_length, normals_props);
  primitive_props->attributes.items[1].key = MeshPrimitiveAttribute_NORMAL;
  primitive_props->attributes.items[1].accessor_id = normals_accessor;

  AccessorFromProps *uvs_props = malloc(sizeof(AccessorFromProps));
  uvs_props->component_type = AccessorComponentType_Float32;
  uvs_props->count = uvs_count;
  uvs_props->type = AccessorType_VEC2;
  accessor_id_t uvs_accessor = websg_world_create_accessor_from(uvs, uvs_byte_length, uvs_props);
  primitive_props->attributes.items[2].key = MeshPrimitiveAttribute_TEXCOORD_0;
  primitive_props->attributes.items[2].accessor_id = uvs_accessor;

  MeshProps *mesh_props = malloc(sizeof(MeshProps));
  mesh_props->primitives.items = primitive_props;
  mesh_props->primitives.count = 1;

  mesh_id_t mesh_id = websg_world_create_mesh(mesh_props);

  SphereData *sphere_data = malloc(sizeof(SphereData));
  sphere_data->vertex_count = vertexIndex;
  sphere_data->positions = positions;
  sphere_data->positions_accessor = positions_accessor;
  sphere_data->positions_byte_length = positions_byte_length;
  sphere_data->mesh_id = mesh_id;

  return sphere_data;
}

fnl_state noise_state;
SphereData *sphere_data;
node_id_t sphere_node;
float_t *sphere_scale;
material_id_t beam_material;
float_t *beam_emissive_factor;
unsigned char *audio_data;

export int32_t websg_load() {
  MaterialProps *material_props = malloc(sizeof(MaterialProps));
  MaterialPbrMetallicRoughnessProps *pbr_metallic_roughness_props = malloc(sizeof(MaterialPbrMetallicRoughnessProps));
  pbr_metallic_roughness_props->base_color_factor[0] = 0;
  pbr_metallic_roughness_props->base_color_factor[1] = 0;
  pbr_metallic_roughness_props->base_color_factor[2] = 0;
  pbr_metallic_roughness_props->base_color_factor[3] = 1;
  pbr_metallic_roughness_props->metallic_factor = 0.5f;
  pbr_metallic_roughness_props->roughness_factor = 0.7f;
  material_props->pbr_metallic_roughness = pbr_metallic_roughness_props;

  material_id_t mesh_material = websg_world_create_material(material_props);
  sphere_data = generate_sphere_mesh(1, 32, 16, M_PI, 0, M_PI * 2, 0);
  websg_mesh_set_primitive_material(sphere_data->mesh_id, 0, mesh_material);

  sphere_scale = malloc(sizeof(float_t) * 3);
  sphere_scale[0] = 3;
  sphere_scale[1] = 3;
  sphere_scale[2] = 3;


  NodeProps *node_props = malloc(sizeof(NodeProps));
  node_props->translation[0] = 7;
  node_props->translation[1] = 8;
  node_props->translation[2] = -17;
  node_props->rotation[0] = 0;
  node_props->rotation[1] = 0;
  node_props->rotation[2] = 0;
  node_props->rotation[3] = 1;
  node_props->scale[0] = sphere_scale[0];
  node_props->scale[1] = sphere_scale[1];
  node_props->scale[2] = sphere_scale[2];
  node_props->mesh = sphere_data->mesh_id;
  sphere_node = websg_world_create_node(node_props);

  scene_id_t scene = websg_world_get_environment();
  websg_scene_add_node(scene, sphere_node);

  const char *beam_name = "Tube_Light_01";
  mesh_id_t beam_mesh = websg_world_find_mesh_by_name(beam_name, strlen(beam_name));
  beam_material = websg_mesh_get_primitive_material(beam_mesh, 0);
  beam_emissive_factor = malloc(sizeof(float_t) * 3);
  beam_emissive_factor[0] = 1;
  beam_emissive_factor[1] = 1;
  beam_emissive_factor[2] = 1;

  uint32_t audio_data_size = thirdroom_get_audio_data_size();
  audio_data = malloc(audio_data_size);
  noise_state = fnlCreateState();
  noise_state.noise_type = FNL_NOISE_OPENSIMPLEX2;
  noise_state.frequency = 0.01;
  noise_state.fractal_type = FNL_FRACTAL_PINGPONG;

  return 0;
}

float_t elapsed = 0;
float_t acc_noise = 0;

export int32_t websg_update(float_t dt) {
  elapsed += dt;

  thirdroom_get_audio_frequency_data(audio_data);

  float_t low_freq_avg;

  for (int i = 0; i < 128; i++) {
    low_freq_avg += audio_data[i];
  }

  low_freq_avg =  ((float)low_freq_avg / 128) / 255;

  for (int i = 0; i < sphere_data->vertex_count; i++) {
    float_t x = sphere_data->positions[i * 3];
    float_t y = sphere_data->positions[i * 3 + 1];
    float_t z = sphere_data->positions[i * 3 + 2];

    float_t length = sqrtf(x * x + y * y + z * z);
    float_t n = 1 / length;
    x = x * n;
    y = y * n;
    z = z * n;

    float_t noise = 1 + 0.5 * fnlGetNoise3D(&noise_state, x * 5 + elapsed, y * 5 + elapsed, z * 5 + elapsed);
    sphere_data->positions[i * 3] = x * noise;
    sphere_data->positions[i * 3 + 1] = y * noise;
    sphere_data->positions[i * 3 + 2] = z * noise;

    acc_noise += noise;
  }

  float_t scale = 3 * (1 + low_freq_avg);
  sphere_scale[0] = scale;
  sphere_scale[1] = scale;
  sphere_scale[2] = scale;
  websg_node_set_scale(sphere_node, sphere_scale);

  beam_emissive_factor[0] = 1;
  beam_emissive_factor[1] = 1 - low_freq_avg;
  beam_emissive_factor[2] = 1 - low_freq_avg;
  websg_material_set_emissive_factor(beam_material, beam_emissive_factor);

  websg_accessor_update_with(
    sphere_data->positions_accessor,
    sphere_data->positions,
    sphere_data->positions_byte_length
  );

  return 0;
}
