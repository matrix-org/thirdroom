#ifndef __websg_h
#define __websg_h
#include <stdint.h>
#include <math.h>

#define import_websg(NAME) __attribute__((import_module("websg"),import_name(#NAME)))

#define export __attribute__((used))

typedef uint32_t scene_id_t;
typedef uint32_t node_id_t;
typedef uint32_t mesh_id_t;
typedef uint32_t accessor_id_t;
typedef uint32_t buffer_view_id_t;
typedef uint32_t buffer_id_t;
typedef uint32_t material_id_t;
typedef uint32_t texture_id_t;
typedef uint32_t light_id_t;

// Environment

// Returns the scene id or 0 if not found
import_websg(get_environment_scene) scene_id_t websg_get_environment_scene();
// Returns 0 if successful or -1 if error
import_websg(set_environment_scene) int32_t websg_set_environment_scene(scene_id_t scene_id);

/*******
 * Scene
 *******/

// Returns scene id or 0 if error
import_websg(create_scene) scene_id_t websg_create_scene();
// Returns scene id or 0 if not found
import_websg(scene_find_by_name) scene_id_t websg_scene_find_by_name(const char *name, uint32_t length);

// Scene Hierarchy

// Returns 0 if successful or -1 if error
import_websg(scene_add_node) int32_t websg_scene_add_node(scene_id_t scene_id, node_id_t node_id);
// Returns 0 if successful or -1 if error
import_websg(scene_remove_node) int32_t websg_scene_remove_node(scene_id_t scene_id, node_id_t node_id);
// Returns the number of child nodes or -1 if error
import_websg(scene_get_node_count) int32_t websg_scene_get_node_count(scene_id_t scene_id);
// Returns the number of node ids written to the array or -1 if error
import_websg(scene_get_nodes) int32_t websg_scene_get_nodes(
  scene_id_t scene_id,
  node_id_t *nodes,
  uint32_t max_count
);
// Returns the node id or 0 if not found
import_websg(scene_get_node) node_id_t websg_scene_get_node(
  scene_id_t scene_id,
  uint32_t index
);

/**
 * Node
 **/

// Returns node id or 0 if error
import_websg(create_node) node_id_t websg_create_node();
// Returns node id or 0 if not found
import_websg(node_find_by_name) node_id_t websg_node_find_by_name(const char *name, uint32_t length);

// Node Hierarchy

// Returns 0 if successful or -1 if error
import_websg(node_add_child) int32_t websg_node_add_child(node_id_t node_id, node_id_t child_id);
// Returns 0 if successful or -1 if error
import_websg(node_remove_child) int32_t websg_node_remove_child(node_id_t node_id, node_id_t child_id);
// Returns the number of child nodes or -1 if error
import_websg(node_get_child_count) int32_t websg_node_get_child_count(node_id_t node_id);
// Returns the number of node ids written to the array or -1 if error
import_websg(node_get_children) int32_t websg_node_get_children(
  node_id_t node_id,
  node_id_t *children,
  uint32_t max_count
);
// Returns the node id or 0 if not found
import_websg(node_get_child) node_id_t websg_node_get_child(node_id_t node_id, uint32_t index);
// Returns the node id or 0 if not found
import_websg(node_get_parent) node_id_t websg_node_get_parent(node_id_t node_id);
// Returns the scene id or 0 if not found
import_websg(node_get_parent_scene) scene_id_t websg_node_get_parent_scene(node_id_t node_id);

// Node Transform

// Returns 0 if successful or -1 if error
import_websg(node_get_position) int32_t websg_node_get_position(node_id_t node_id, float_t *position);
// Returns 0 if successful or -1 if error
import_websg(node_set_position) int32_t websg_node_set_position(node_id_t node_id, float_t *position);
// Returns 0 if successful or -1 if error
import_websg(node_get_quaternion) int32_t websg_node_get_quaternion(node_id_t node_id, float_t *quaternion);
// Returns 0 if successful or -1 if error
import_websg(node_set_quaternion) int32_t websg_node_set_quaternion(node_id_t node_id, float_t *quaternion);
// Returns 0 if successful or -1 if error
import_websg(node_get_scale) int32_t websg_node_get_scale(node_id_t node_id, float_t *scale);
// Returns 0 if successful or -1 if error
import_websg(node_set_scale) int32_t websg_node_set_scale(node_id_t node_id, float_t *scale);
// Returns 0 if successful or -1 if error
import_websg(node_get_local_matrix) int32_t websg_node_get_local_matrix(node_id_t node_id, float_t *local_matrix);
// Returns 0 if successful or -1 if error
import_websg(node_set_local_matrix) int32_t websg_node_set_local_matrix(node_id_t node_id, float_t *local_matrix);
// Returns 0 if successful or -1 if error
import_websg(node_get_world_matrix) int32_t websg_node_get_world_matrix(node_id_t node_id, float_t *world_matrix);

// Node Props

// Returns 0 if false 1 if true
import_websg(node_get_visible) uint32_t websg_node_get_visible(node_id_t node_id);
// Returns 0 if successful or -1 if error
import_websg(node_set_visible) int32_t websg_node_set_visible(node_id_t node_id, uint32_t visible);
// Returns 0 if false 1 if true
import_websg(node_get_is_static) uint32_t websg_node_get_is_static(node_id_t node_id);
// Returns 0 if successful or -1 if error
import_websg(node_set_is_static) int32_t websg_node_set_is_static(node_id_t node_id, uint32_t is_static);

// Node Refs

import_websg(node_get_mesh) mesh_id_t websg_node_get_mesh(node_id_t node_id);
import_websg(node_set_mesh) int32_t websg_node_set_mesh(node_id_t node_id, mesh_id_t mesh_id);

import_websg(node_get_light) light_id_t websg_node_get_light(node_id_t node_id);
import_websg(node_set_light) int32_t websg_node_set_light(node_id_t node_id, light_id_t light_id);

/**
 * Mesh
 **/

typedef enum MeshPrimitiveMode {
  MeshPrimitiveMode_POINTS,
  MeshPrimitiveMode_LINES,
  MeshPrimitiveMode_LINE_LOOP,
  MeshPrimitiveMode_LINE_STRIP,
  MeshPrimitiveMode_TRIANGLES,
  MeshPrimitiveMode_TRIANGLE_STRIP,
  MeshPrimitiveMode_TRIANGLE_FAN,
} MeshPrimitiveMode;

typedef enum MeshPrimitiveAttribute {
  MeshPrimitiveAttribute_POSITION,
  MeshPrimitiveAttribute_NORMAL,
  MeshPrimitiveAttribute_TANGENT,
  MeshPrimitiveAttribute_TEXCOORD_0,
  MeshPrimitiveAttribute_TEXCOORD_1,
  MeshPrimitiveAttribute_COLOR_0,
  MeshPrimitiveAttribute_JOINTS_0,
  MeshPrimitiveAttribute_WEIGHTS_0,
} MeshPrimitiveAttribute;

typedef struct MeshPrimitiveAttributeItem {
  MeshPrimitiveAttribute key;
  accessor_id_t accessor_id;
} MeshPrimitiveAttributeItem;

typedef struct MeshPrimitiveProps {
  MeshPrimitiveMode mode;
  accessor_id_t indices;
  material_id_t material;
  uint32_t attribute_count;
  MeshPrimitiveAttributeItem *attributes;
} MeshPrimitiveProps;

import_websg(create_mesh) mesh_id_t websg_create_mesh(MeshPrimitiveProps *primitives, uint32_t count);
import_websg(mesh_find_by_name) mesh_id_t websg_mesh_find_by_name(const char *name, uint32_t length);
// Returns the number of mesh primitives or -1 if error
import_websg(mesh_get_primitive_count) int32_t websg_mesh_get_primitive_count(mesh_id_t mesh_id);
// Returns the accessor id or 0 if not found
import_websg(mesh_get_primitive_attribute) accessor_id_t websg_mesh_get_primitive_attribute(
  mesh_id_t mesh_id,
  uint32_t index,
  MeshPrimitiveAttribute attribute
);
// Returns the accessor id or 0 if not found
import_websg(mesh_get_primitive_indices) accessor_id_t websg_mesh_get_primitive_indices(
  mesh_id_t mesh_id,
  uint32_t index
);
// Returns the material id or 0 if not found
import_websg(mesh_get_primitive_material) material_id_t websg_mesh_get_primitive_material(
  mesh_id_t mesh_id,
  uint32_t index
);
import_websg(mesh_set_primitive_material) mesh_id_t websg_mesh_set_primitive_material(
  mesh_id_t mesh_id,
  uint32_t index,
  material_id_t material_id
);
import_websg(mesh_get_primitive_mode) MeshPrimitiveMode websg_mesh_get_primitive_mode(
  mesh_id_t mesh_id,
  uint32_t index
);
import_websg(mesh_set_primitive_draw_range) MeshPrimitiveMode websg_mesh_set_primitive_draw_range(
  mesh_id_t mesh_id,
  uint32_t index,
  uint32_t start,
  uint32_t count
);

/**
 * Accessor
 **/

typedef enum AccessorType {
  AccessorType_SCALAR,
  AccessorType_VEC2,
  AccessorType_VEC3,
  AccessorType_VEC4,
  AccessorType_MAT2,
  AccessorType_MAT3,
  AccessorType_MAT4,
} AccessorType;

typedef enum AccessorComponentType {
  AccessorComponentType_Int8 = 5120,
  AccessorComponentType_Uint8 = 5121,
  AccessorComponentType_Int16 = 5122,
  AccessorComponentType_Uint16 = 5123,
  AccessorComponentType_Uint32 = 5125,
  AccessorComponentType_Float32 = 5126,
} AccessorComponentType;

typedef struct AccessorProps {
  AccessorType type;
  AccessorComponentType component_type;
  uint32_t count;
  uint32_t normalized;
  uint32_t dynamic;
  float_t min[16]; // Currently unused and optional but see spec for use.
  float_t max[16]; // Currently unused and optional but see spec for use.
} AccessorProps;

// TODO: Add standard websg_create_accessor method that takes buffer views and support sparse accessors
import_websg(create_accessor_from) accessor_id_t websg_create_accessor_from(
  void *data,
  uint32_t byte_length,
  AccessorProps *props
);
import_websg(accessor_find_by_name) accessor_id_t websg_accessor_find_by_name(const char *name, uint32_t length);
import_websg(accessor_update_with) int32_t websg_accessor_update_with(
  accessor_id_t accessor_id,
  void *data,
  uint32_t length
);

/**
 * Material
 **/

typedef enum MaterialType {
  MaterialType_Standard,
  MaterialType_Unlit,
} MaterialType;

import_websg(create_material) material_id_t websg_create_material(MaterialType type);
import_websg(material_find_by_name) material_id_t websg_material_find_by_name(const char *name, uint32_t length);
import_websg(material_get_base_color_factor) int32_t websg_material_get_base_color_factor(
  material_id_t material_id,
  float_t *base_color_factor
);
import_websg(material_set_base_color_factor) int32_t websg_material_set_base_color_factor(
  material_id_t material_id,
  float_t *base_color_factor
);
import_websg(material_get_metallic_factor) float_t websg_material_get_metallic_factor(material_id_t material_id);
import_websg(material_set_metallic_factor) int32_t websg_material_set_metallic_factor(
  material_id_t material_id,
  float_t metallic_factor
);
import_websg(material_get_roughness_factor) float_t websg_material_get_roughness_factor(material_id_t material_id);
import_websg(material_set_roughness_factor) int32_t websg_material_set_roughness_factor(
  material_id_t material_id,
  float_t roughness_factor
);
import_websg(material_get_emissive_factor) int32_t websg_material_get_emissive_factor(
  material_id_t material_id,
  float_t *emissive_factor
);
import_websg(material_set_emissive_factor) int32_t websg_material_set_emissive_factor(
  material_id_t material_id,
  float_t *emissive_factor
);
import_websg(material_get_base_color_texture) texture_id_t websg_material_get_base_color_texture(
  material_id_t material_id
);
import_websg(material_set_base_color_texture) int32_t websg_material_set_base_color_texture(
  material_id_t material_id,
  texture_id_t texture_id
);

/**
 * Light
 **/

typedef enum LightType {
  LightType_Directional,
  LightType_Point,
  LightType_Spot,
} LightType;

import_websg(create_light) light_id_t websg_create_light(LightType type);
import_websg(light_get_color) int32_t websg_light_get_color(light_id_t light_id, float_t *color);
import_websg(light_set_color) int32_t websg_light_set_color(light_id_t light_id, float_t *color);
import_websg(light_get_intensity) float_t websg_light_get_intensity(light_id_t light_id);
import_websg(light_set_intensity) int32_t websg_light_set_intensity(light_id_t light_id, float_t intensity);

/**
 * Interactable
 **/

typedef enum InteractableType {
  InteractableType_Interactable = 1,
} InteractableType;

typedef struct Interactable {
  InteractableType type;
  uint32_t pressed;
  uint32_t held;
  uint32_t released;
} Interactable;

import_websg(add_interactable) int32_t websg_add_interactable(node_id_t node_id, InteractableType type);
import_websg(remove_interactable) int32_t websg_remove_interactable(node_id_t node_id);
import_websg(has_interactable) int32_t websg_has_interactable(node_id_t node_id);
import_websg(get_interactable) int32_t websg_get_interactable(node_id_t node_id, Interactable *interactable);
import_websg(get_interactable_pressed) int32_t websg_get_interactable_pressed(node_id_t node_id);
import_websg(get_interactable_held) int32_t websg_get_interactable_held(node_id_t node_id);
import_websg(get_interactable_released) int32_t websg_get_interactable_released(node_id_t node_id);

#endif
