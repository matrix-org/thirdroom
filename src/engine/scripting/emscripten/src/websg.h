#ifndef __websg_h
#define __websg_h
#include <stdint.h>
#include <math.h>

/*******************************
 * WASM Import / Export Macros *
 *******************************/

#define import_websg(NAME) __attribute__((import_module("websg"),import_name(#NAME)))

#define export __attribute__((used))

/*************
 * WebSG IDs *
 *************/
typedef uint32_t query_id_t;
typedef uint32_t component_id_t;
typedef uint32_t scene_id_t;
typedef uint32_t camera_id_t;
typedef uint32_t skin_id_t;
typedef uint32_t node_id_t;
typedef uint32_t mesh_id_t;
typedef uint32_t accessor_id_t;
typedef uint32_t material_id_t;
typedef uint32_t texture_id_t;
typedef uint32_t image_id_t;
typedef uint32_t light_id_t;
typedef uint32_t collider_id_t;
typedef uint32_t ui_canvas_id_t;
typedef uint32_t ui_element_id_t;
typedef uint32_t collision_listener_id_t;

/*******************************
 * Common WebSG Property Types *
 *******************************/

typedef struct WebSGFloatArray {
  float_t *items;
  uint32_t count;
} WebSGFloatArray;

typedef struct WebSGString {
  const char *value;
  uint32_t length;
} WebSGString;

typedef struct ExtensionItem {
  const char *name;
  void* extension;
} ExtensionItem;

typedef struct Extensions {
  ExtensionItem *items;
  uint32_t count;
} Extensions;

/*********
 * World *
 *********/

import_websg(world_get_environment) scene_id_t websg_world_get_environment();
import_websg(world_set_environment) int32_t websg_world_set_environment(scene_id_t scene_id);

/***********
 * Queries *
 ***********/
typedef enum QueryModifier {
  QueryModifier_All,
  QueryModifier_None,
  QueryModifier_Any,
} QueryModifier;

typedef struct QueryItem {
  component_id_t *component_ids;
  uint32_t component_count;
  QueryModifier modifier;
} QueryItem;

typedef struct QueryList {
  QueryItem *items;
  uint32_t count;
} QueryList;

import_websg(world_create_query) query_id_t websg_world_create_query(QueryList *query);
import_websg(query_get_results_count) int32_t websg_query_get_results_count(query_id_t query_id);
import_websg(query_get_results) int32_t websg_query_get_results(query_id_t query_id, node_id_t *results, uint32_t max_count);
// Possible future API for a fast path to get component indices
// import_websg(websg_query_get_component_indices) int32_t websg_query_get_component_indices(query_id_t query_id, uint32_t *indices, uint32_t max_count);

/**************
 * Components *
 **************/

typedef enum ComponentPropStorageType {
  ComponentPropStorageType_i32,
  ComponentPropStorageType_u32,
  ComponentPropStorageType_f32,
} ComponentPropStorageType;

import_websg(world_find_component_definition_by_name) component_id_t websg_world_find_component_definition_by_name(const char *name, uint32_t length);
import_websg(component_definition_get_name_length) uint32_t websg_component_definition_get_name_length(component_id_t component_id);
import_websg(component_definition_get_name) int32_t websg_component_definition_get_name(component_id_t component_id,  const char *name, size_t length);
import_websg(component_definition_get_prop_count) int32_t websg_component_definition_get_prop_count(component_id_t component_id);
import_websg(component_definition_get_prop_name_length) uint32_t websg_component_definition_get_prop_name_length(component_id_t component_id, uint32_t prop_idx);
import_websg(component_definition_get_prop_name) int32_t websg_component_definition_get_prop_name(component_id_t component_id, uint32_t prop_idx, const char *prop_name, size_t length);
import_websg(component_definition_get_prop_type_length) uint32_t websg_component_definition_get_prop_type_length(component_id_t component_id, uint32_t prop_idx);
import_websg(component_definition_get_prop_type) int32_t websg_component_definition_get_prop_type(component_id_t component_id, uint32_t prop_idx, const char *prop_type, size_t length);
import_websg(component_definition_get_ref_type_length) uint32_t websg_component_definition_get_ref_type_length(component_id_t component_id, uint32_t prop_idx);
import_websg(component_definition_get_ref_type) int32_t websg_component_definition_get_ref_type(component_id_t component_id, uint32_t prop_idx, const char *ref_type, size_t length);
import_websg(component_definition_get_prop_storage_type) ComponentPropStorageType websg_component_definition_get_prop_storage_type(component_id_t component_id, uint32_t prop_idx);
import_websg(component_definition_get_prop_size) int32_t websg_component_definition_get_prop_size(component_id_t component_id, uint32_t prop_idx);
import_websg(world_get_component_store_size) uint32_t websg_world_get_component_store_size();
import_websg(world_set_component_store_size) int32_t websg_world_set_component_store_size(uint32_t size);
import_websg(world_set_component_store) int32_t websg_world_set_component_store(component_id_t component_id, void *ptr);
import_websg(world_get_component_store) void *websg_world_get_component_store(component_id_t component_id);
import_websg(node_add_component) int32_t websg_node_add_component(node_id_t node_id, component_id_t component_id);
import_websg(node_remove_component) int32_t websg_node_remove_component(node_id_t node_id, component_id_t component_id);
import_websg(node_has_component) int32_t websg_node_has_component(node_id_t node_id, component_id_t component_id);
import_websg(node_get_component_store_index) uint32_t websg_node_get_component_store_index(node_id_t node_id);
import_websg(node_set_forward_direction) int32_t websg_node_set_forward_direction(node_id_t node_id, float_t *direction);

/*********
 * Scene *
 *********/

typedef struct SceneProps {
  const char *name;
  Extensions extensions;
  void *extras;
} SceneProps;

import_websg(world_create_scene) scene_id_t websg_world_create_scene(SceneProps *props);
import_websg(world_find_scene_by_name) scene_id_t websg_world_find_scene_by_name(const char *name, uint32_t length);
import_websg(scene_add_node) int32_t websg_scene_add_node(scene_id_t scene_id, node_id_t node_id);
import_websg(scene_remove_node) int32_t websg_scene_remove_node(scene_id_t scene_id, node_id_t node_id);
import_websg(scene_get_node_count) int32_t websg_scene_get_node_count(scene_id_t scene_id);
import_websg(scene_get_nodes) int32_t websg_scene_get_nodes(scene_id_t scene_id, node_id_t *nodes, uint32_t max_count);
import_websg(scene_get_node) node_id_t websg_scene_get_node(scene_id_t scene_id, uint32_t index);

/********
 * Node *
 ********/

typedef struct NodeProps {
  const char *name;
  Extensions extensions;
  void *extras;
  camera_id_t camera;
  skin_id_t skin;
  mesh_id_t mesh;
  float_t rotation[4];
  float_t scale[3];
  float_t translation[3];
  WebSGFloatArray weights;
} NodeProps;

import_websg(world_create_node) node_id_t websg_world_create_node(NodeProps *props);
import_websg(world_find_node_by_name) node_id_t websg_world_find_node_by_name(const char *name, uint32_t length);
import_websg(node_add_child) int32_t websg_node_add_child(node_id_t node_id, node_id_t child_id);
import_websg(node_remove_child) int32_t websg_node_remove_child(node_id_t node_id, node_id_t child_id);
import_websg(node_get_child_count) int32_t websg_node_get_child_count(node_id_t node_id);
import_websg(node_get_children) int32_t websg_node_get_children(node_id_t node_id, node_id_t *children, uint32_t max_count);
import_websg(node_get_child) node_id_t websg_node_get_child(node_id_t node_id, uint32_t index);
import_websg(node_get_parent) node_id_t websg_node_get_parent(node_id_t node_id);
import_websg(node_get_parent_scene) scene_id_t websg_node_get_parent_scene(node_id_t node_id);
import_websg(node_get_translation_element) float_t websg_node_get_translation_element(node_id_t node_id, uint32_t index);
import_websg(node_set_translation_element) int32_t websg_node_set_translation_element(node_id_t node_id, uint32_t index, float_t value);
import_websg(node_get_translation) int32_t websg_node_get_translation(node_id_t node_id, float_t *translation);
import_websg(node_set_translation) int32_t websg_node_set_translation(node_id_t node_id, float_t *translation);
import_websg(node_get_rotation_element) float_t websg_node_get_rotation_element(node_id_t node_id, uint32_t index);
import_websg(node_set_rotation_element) int32_t websg_node_set_rotation_element(node_id_t node_id, uint32_t index, float_t value);
import_websg(node_get_rotation) int32_t websg_node_get_rotation(node_id_t node_id, float_t *rotation);
import_websg(node_set_rotation) int32_t websg_node_set_rotation(node_id_t node_id, float_t *rotation);
import_websg(node_get_scale_element) float_t websg_node_get_scale_element(node_id_t node_id, uint32_t index);
import_websg(node_set_scale_element) int32_t websg_node_set_scale_element(node_id_t node_id, uint32_t index, float_t value);
import_websg(node_get_scale) int32_t websg_node_get_scale(node_id_t node_id, float_t *scale);
import_websg(node_set_scale) int32_t websg_node_set_scale(node_id_t node_id, float_t *scale);
import_websg(node_get_matrix_element) float_t websg_node_get_matrix_element(node_id_t node_id, uint32_t index);
import_websg(node_set_matrix_element) int32_t websg_node_set_matrix_element(node_id_t node_id, uint32_t index, float_t value);
import_websg(node_get_matrix) int32_t websg_node_get_matrix(node_id_t node_id, float_t *matrix);
import_websg(node_set_matrix) int32_t websg_node_set_matrix(node_id_t node_id, float_t *matrix);
import_websg(node_get_world_matrix_element) float_t websg_node_get_world_matrix_element(node_id_t node_id, uint32_t index);
import_websg(node_get_world_matrix) int32_t websg_node_get_world_matrix(node_id_t node_id, float_t *world_matrix);
import_websg(node_get_visible) uint32_t websg_node_get_visible(node_id_t node_id);
import_websg(node_set_visible) int32_t websg_node_set_visible(node_id_t node_id, uint32_t visible);
import_websg(node_get_is_static) uint32_t websg_node_get_is_static(node_id_t node_id);
import_websg(node_set_is_static) int32_t websg_node_set_is_static(node_id_t node_id, uint32_t is_static);
import_websg(node_set_is_static_recursive) int32_t websg_node_set_is_static_recursive(node_id_t node_id, uint32_t is_static);
import_websg(node_get_mesh) mesh_id_t websg_node_get_mesh(node_id_t node_id);
import_websg(node_set_mesh) int32_t websg_node_set_mesh(node_id_t node_id, mesh_id_t mesh_id);
import_websg(node_get_light) light_id_t websg_node_get_light(node_id_t node_id);
import_websg(node_set_light) int32_t websg_node_set_light(node_id_t node_id, light_id_t light_id);
import_websg(node_get_collider) collider_id_t websg_node_get_collider(node_id_t node_id);
import_websg(node_set_collider) int32_t websg_node_set_collider(node_id_t node_id, collider_id_t collider_id);
import_websg(node_dispose) int32_t websg_node_dispose(node_id_t node_id);

typedef struct CameraRigOptions {
  float_t pitch;
  float_t yaw;
  float_t zoom;
} CameraRigOptions;

import_websg(node_start_orbit) int32_t websg_node_start_orbit(node_id_t node_id, CameraRigOptions *options);
import_websg(world_stop_orbit) int32_t websg_world_stop_orbit();

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

typedef struct MeshPrimitiveAttributesList {
  MeshPrimitiveAttributeItem *items;
  uint32_t count;
} MeshPrimitiveAttributesList;

typedef struct MeshPrimitiveTarget {
  MeshPrimitiveAttribute key;
  accessor_id_t accessor_id;
} MeshPrimitiveTarget;

typedef struct MeshPrimitiveTargetsList {
  MeshPrimitiveTarget *items;
  uint32_t count;
} MeshPrimitiveTargetsList;

typedef struct MeshPrimitiveProps {
  Extensions extensions;
  void *extras;
  MeshPrimitiveAttributesList attributes;
  accessor_id_t indices;
  material_id_t material;
  MeshPrimitiveMode mode;
  MeshPrimitiveTargetsList targets;
} MeshPrimitiveProps;

typedef struct MeshPrimitivePropsList {
  MeshPrimitiveProps *items;
  uint32_t count;
} MeshPrimitivePropsList;

typedef struct MeshProps {
  const char *name;
  Extensions extensions;
  void *extras;
  WebSGFloatArray weights;
  MeshPrimitivePropsList primitives;
} MeshProps;

import_websg(world_create_mesh) mesh_id_t websg_world_create_mesh(MeshProps *props);

typedef struct BoxMeshProps {
  float_t size[3];
  uint32_t segments[3];
  material_id_t material;
} BoxMeshProps;

import_websg(world_create_box_mesh) mesh_id_t websg_world_create_box_mesh(BoxMeshProps *props);
import_websg(world_find_mesh_by_name) mesh_id_t websg_world_find_mesh_by_name(const char *name, uint32_t length);
import_websg(mesh_get_primitive_count) int32_t websg_mesh_get_primitive_count(mesh_id_t mesh_id);
import_websg(mesh_get_primitive_attribute) accessor_id_t websg_mesh_get_primitive_attribute(mesh_id_t mesh_id, uint32_t index, MeshPrimitiveAttribute attribute);
import_websg(mesh_get_primitive_indices) accessor_id_t websg_mesh_get_primitive_indices(mesh_id_t mesh_id, uint32_t index);
import_websg(mesh_get_primitive_material) material_id_t websg_mesh_get_primitive_material(mesh_id_t mesh_id, uint32_t index);
import_websg(mesh_set_primitive_material) int32_t websg_mesh_set_primitive_material(mesh_id_t mesh_id, uint32_t index, material_id_t material_id);
import_websg(mesh_get_primitive_mode) MeshPrimitiveMode websg_mesh_get_primitive_mode(mesh_id_t mesh_id, uint32_t index);
import_websg(mesh_set_primitive_draw_range) MeshPrimitiveMode websg_mesh_set_primitive_draw_range(mesh_id_t mesh_id, uint32_t index, uint32_t start, uint32_t count);
import_websg(mesh_set_primitive_hologram_material_enabled) int32_t websg_mesh_set_primitive_hologram_material_enabled(mesh_id_t mesh_id, uint32_t index, uint32_t enabled);

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

typedef struct AccessorFromProps {
  AccessorType type;
  AccessorComponentType component_type;
  uint32_t count;
  uint32_t normalized;
  uint32_t dynamic;
  WebSGFloatArray min; // Currently unused and optional but see spec for use.
  WebSGFloatArray max; // Currently unused and optional but see spec for use.
} AccessorFromProps;

// TODO: Add standard websg_create_accessor method that takes buffer views and support sparse accessors
import_websg(world_create_accessor_from) accessor_id_t websg_world_create_accessor_from(
  void *data,
  uint32_t byte_length,
  AccessorFromProps *props
);
import_websg(world_find_accessor_by_name) accessor_id_t websg_world_find_accessor_by_name(const char *name, uint32_t length);
import_websg(accessor_update_with) int32_t websg_accessor_update_with(
  accessor_id_t accessor_id,
  void *data,
  uint32_t length
);

/**
 * Material
 **/

typedef enum MaterialAlphaMode {
  MaterialAlphaMode_OPAQUE,
  MaterialAlphaMode_MASK,
  MaterialAlphaMode_BLEND,
} MaterialAlphaMode;

typedef struct MaterialTextureInfoProps {
  Extensions extensions;
  void *extras;
  texture_id_t texture;
  uint32_t tex_coord;
} MaterialTextureInfoProps;

typedef struct MaterialNormalTextureInfoProps {
  Extensions extensions;
  void *extras;
  texture_id_t texture;
  uint32_t tex_coord;
  float_t scale;
} MaterialNormalTextureInfoProps;

typedef struct MaterialOcclusionTextureInfoProps {
  Extensions extensions;
  void *extras;
  texture_id_t texture;
  uint32_t tex_coord;
  float_t strength;
} MaterialOcclusionTextureInfoProps;

typedef struct MaterialTextureTransformProps {
  Extensions extensions;
  void *extras;
  float_t offset[2];
  float_t rotation;
  float_t scale[2];
  uint32_t tex_coord;
} MaterialTextureTransformProps;

typedef struct MaterialUnlitProps {
  Extensions extensions;
  void *extras;
} MaterialUnlitProps;

typedef struct MaterialPbrMetallicRoughnessProps {
  Extensions extensions;
  void *extras;
  float_t base_color_factor[4];
  MaterialTextureInfoProps *base_color_texture;
  float_t metallic_factor;
  float_t roughness_factor;
  MaterialTextureInfoProps *metallic_roughness_texture;
  
} MaterialPbrMetallicRoughnessProps;

typedef struct MaterialProps {
  const char *name;
  Extensions extensions;
  void *extras;
  MaterialPbrMetallicRoughnessProps *pbr_metallic_roughness;
  MaterialNormalTextureInfoProps *normal_texture;
  MaterialOcclusionTextureInfoProps *occlusion_texture;
  MaterialTextureInfoProps *emissive_texture;
  float_t emissive_factor[3];
  MaterialAlphaMode alpha_mode;
  float_t alpha_cutoff;
  uint32_t double_sided;
} MaterialProps;

import_websg(world_create_material) material_id_t websg_world_create_material(MaterialProps *props);
import_websg(world_find_material_by_name) material_id_t websg_world_find_material_by_name(const char *name, uint32_t length);
import_websg(material_get_base_color_factor) int32_t websg_material_get_base_color_factor(material_id_t material_id, float_t *base_color_factor);
import_websg(material_set_base_color_factor) int32_t websg_material_set_base_color_factor(material_id_t material_id, float_t *base_color_factor);
import_websg(material_get_base_color_factor_element) float_t websg_material_get_base_color_factor_element(material_id_t material_id, uint32_t index);
import_websg(material_set_base_color_factor_element) int32_t websg_material_set_base_color_factor_element(material_id_t material_id, uint32_t index, float_t value);
import_websg(material_get_metallic_factor) float_t websg_material_get_metallic_factor(material_id_t material_id);
import_websg(material_set_metallic_factor) int32_t websg_material_set_metallic_factor(material_id_t material_id, float_t metallic_factor);
import_websg(material_get_roughness_factor) float_t websg_material_get_roughness_factor(material_id_t material_id);
import_websg(material_set_roughness_factor) int32_t websg_material_set_roughness_factor(material_id_t material_id, float_t roughness_factor);
import_websg(material_get_emissive_factor) int32_t websg_material_get_emissive_factor(material_id_t material_id, float_t *emissive_factor);
import_websg(material_set_emissive_factor) int32_t websg_material_set_emissive_factor(material_id_t material_id, float_t *emissive_factor);
import_websg(material_get_emissive_factor_element) float_t websg_material_get_emissive_factor_element(material_id_t material_id, uint32_t index);
import_websg(material_set_emissive_factor_element) int32_t websg_material_set_emissive_factor_element(material_id_t material_id, uint32_t index, float_t value);
import_websg(material_get_base_color_texture) texture_id_t websg_material_get_base_color_texture(material_id_t material_id);
import_websg(material_set_base_color_texture) int32_t websg_material_set_base_color_texture(material_id_t material_id, texture_id_t texture_id);

/**
 * Texture
 **/

import_websg(world_find_texture_by_name) texture_id_t websg_world_find_texture_by_name(const char *name, uint32_t length);

/**
 * Image
 **/

import_websg(world_find_image_by_name) image_id_t websg_world_find_image_by_name(const char *name, uint32_t length);

/**
 * Light
 **/

typedef enum LightType {
  LightType_Directional,
  LightType_Point,
  LightType_Spot,
} LightType;

typedef struct LightSpotProps {
  Extensions extensions;
  void *extras;
  float_t inner_cone_angle;
  float_t outer_cone_angle;
} LightSpotProps;

typedef struct LightProps {
  const char *name;
  Extensions extensions;
  void *extras;
  float_t color[3];
  float_t intensity;
  LightType type;
  float_t range;
  LightSpotProps spot;
} LightProps;

import_websg(world_create_light) light_id_t websg_world_create_light(LightProps *props);
import_websg(world_find_light_by_name) light_id_t websg_world_find_light_by_name(const char *name, uint32_t length);
import_websg(light_get_color) int32_t websg_light_get_color(light_id_t light_id, float_t *color);
import_websg(light_set_color) int32_t websg_light_set_color(light_id_t light_id, float_t *color);
import_websg(light_get_color_element) float_t websg_light_get_color_element(light_id_t light_id, uint32_t index);
import_websg(light_set_color_element) int32_t websg_light_set_color_element(light_id_t light_id, uint32_t index, float value);
import_websg(light_get_intensity) float_t websg_light_get_intensity(light_id_t light_id);
import_websg(light_set_intensity) int32_t websg_light_set_intensity(light_id_t light_id, float_t intensity);

/**
 * Interactable
 **/

typedef enum InteractableType {
  InteractableType_Interactable = 1,
  InteractableType_Grabbable = 2,
} InteractableType;

typedef struct InteractableProps {
  Extensions extensions;
  void *extras;
  InteractableType type;
} InteractableProps;

import_websg(node_add_interactable) int32_t websg_node_add_interactable(node_id_t node_id, InteractableProps *props);
import_websg(node_remove_interactable) int32_t websg_node_remove_interactable(node_id_t node_id);
import_websg(node_has_interactable) int32_t websg_node_has_interactable(node_id_t node_id);
import_websg(node_get_interactable_pressed) int32_t websg_node_get_interactable_pressed(node_id_t node_id);
import_websg(node_get_interactable_held) int32_t websg_node_get_interactable_held(node_id_t node_id);
import_websg(node_get_interactable_released) int32_t websg_node_get_interactable_released(node_id_t node_id);

/**
 * Collider
 */

typedef struct ExtensionNodeColliderRef {
  Extensions extensions;
  void *extras;
  collider_id_t collider;
} ExtensionNodeColliderRef;

typedef enum ColliderType {
  ColliderType_Box,
  ColliderType_Sphere,
  ColliderType_Capsule,
  ColliderType_Cylinder,
  ColliderType_Hull,
  ColliderType_Trimesh,
} ColliderType;

typedef struct ColliderProps {
  const char *name;
  Extensions extensions;
  void *extras;
  ColliderType type;
  uint32_t is_trigger;
  float_t size[3];
  float_t radius;
  float_t height;
  mesh_id_t mesh;
} ColliderProps;

import_websg(world_create_collider) collider_id_t websg_world_create_collider(ColliderProps *props);
import_websg(world_find_collider_by_name) collider_id_t websg_world_find_collider_by_name(const char *name, uint32_t length);

/**
 * PhysicsBody
 */

typedef enum PhysicsBodyType {
  PhysicsBodyType_Static,
  PhysicsBodyType_Kinematic,
  PhysicsBodyType_Rigid,
} PhysicsBodyType;

typedef struct PhysicsBodyProps {
  Extensions extensions;
  void *extras;
  PhysicsBodyType type;
  float_t mass;
  float_t linear_velocity[3];
  float_t angular_velocity[3];
  float_t inertia_tensor[9];
} PhysicsBodyProps;

import_websg(node_add_physics_body) int32_t websg_node_add_physics_body(node_id_t node_id, PhysicsBodyProps *props);
import_websg(node_remove_physics_body) int32_t websg_node_remove_physics_body(node_id_t node_id);
import_websg(node_has_physics_body) int32_t websg_node_has_physics_body(node_id_t node_id);
import_websg(physics_body_apply_impulse) int32_t websg_physics_body_apply_impulse(node_id_t node_id, float_t *impulse);

/**
 * CollisionListener
 **/

import_websg(world_create_collision_listener) collision_listener_id_t websg_world_create_collision_listener();
import_websg(collision_listener_dispose) int32_t websg_collision_listener_dispose(collision_listener_id_t listener_id);

import_websg(collisions_listener_get_collision_count) int32_t websg_collisions_listener_get_collision_count(collision_listener_id_t listener_id);

typedef struct CollisionItem {
  node_id_t node_a;
  node_id_t node_b;
  int32_t started;
} CollisionItem;

import_websg(collisions_listener_get_collisions) int32_t websg_collisions_listener_get_collisions(
  collision_listener_id_t listener_id,
  CollisionItem *collisions,
  uint32_t max_count
);

/**
 * UI Canvas
 **/

typedef struct UIExtensionNodeCanvasRef {
  Extensions extensions;
  void *extras;
  ui_canvas_id_t canvas;
} UIExtensionNodeCanvasRef;

typedef struct UICanvasProps {
  const char *name;
  Extensions extensions;
  void *extras;
  ui_element_id_t root;
  float_t size[2];
  float_t width;
  float_t height;
} UICanvasProps;

import_websg(world_create_ui_canvas) ui_canvas_id_t websg_world_create_ui_canvas(UICanvasProps *props);
import_websg(world_find_ui_canvas_by_name) light_id_t websg_world_find_ui_canvas_by_name(const char *name, uint32_t length);
import_websg(node_set_ui_canvas) int32_t websg_node_set_ui_canvas(node_id_t node_id, ui_canvas_id_t canvas_id);
import_websg(node_get_ui_canvas) ui_canvas_id_t websg_node_get_ui_canvas(node_id_t node_id);
import_websg(ui_canvas_get_root) ui_element_id_t websg_ui_canvas_get_root(ui_canvas_id_t canvas_id);
import_websg(ui_canvas_set_root) int32_t websg_ui_canvas_set_root(ui_canvas_id_t canvas_id, ui_element_id_t root_id);
import_websg(ui_canvas_get_size) int32_t websg_ui_canvas_get_size(ui_canvas_id_t canvas_id, float_t *size);
import_websg(ui_canvas_set_size) int32_t websg_ui_canvas_set_size(ui_canvas_id_t canvas_id, float_t *size);
import_websg(ui_canvas_get_size_element) float_t websg_ui_canvas_get_size_element(ui_canvas_id_t canvas_id, uint32_t index);
import_websg(ui_canvas_set_size_element) int32_t websg_ui_canvas_set_size_element(ui_canvas_id_t canvas_id, uint32_t index, float_t value);
import_websg(ui_canvas_get_width) float_t websg_ui_canvas_get_width(ui_canvas_id_t canvas_id);
import_websg(ui_canvas_set_width) int32_t websg_ui_canvas_set_width(ui_canvas_id_t canvas_id, float_t width);
import_websg(ui_canvas_get_height) float_t websg_ui_canvas_get_height(ui_canvas_id_t canvas_id);
import_websg(ui_canvas_set_height) int32_t websg_ui_canvas_set_height(ui_canvas_id_t canvas_id, float_t height);
import_websg(ui_canvas_redraw) int32_t websg_ui_canvas_redraw(ui_canvas_id_t canvas_id);

/**************
 * UI Element *
 **************/

typedef enum ElementType {
  ElementType_FLEX,
  ElementType_TEXT,
  ElementType_BUTTON,
  ElementType_IMAGE,
} ElementType;

typedef enum FlexDirection {
  FlexDirection_COLUMN,
  FlexDirection_COLUMN_REVERSE,
  FlexDirection_ROW,
  FlexDirection_ROW_REVERSE,
} FlexDirection;

typedef enum ElementPositionType {
  ElementPositionType_STATIC,
  ElementPositionType_RELATIVE,
  ElementPositionType_ABSOLUTE,
} ElementPositionType;

typedef enum FlexAlign {
  FlexAlign_AUTO,
  FlexAlign_FLEX_START,
  FlexAlign_CENTER,
  FlexAlign_FLEX_END,
  FlexAlign_STRETCH,
  FlexAlign_BASELINE,
  FlexAlign_SPACE_BETWEEN,
  FlexAlign_SPACE_AROUND,
} FlexAlign;

typedef enum FlexJustify {
  FlexJustify_FLEX_START,
  FlexJustify_CENTER,
  FlexJustify_FLEX_END,
  FlexJustify_SPACE_BETWEEN,
  FlexJustify_SPACE_AROUND,
  FlexJustify_SPACE_EVENLY,
} FlexJustify;

typedef enum FlexWrap {
  FlexWrap_NO_WRAP,
  FlexWrap_WRAP,
  FlexWrap_WRAP_REVERSE,
} FlexWrap;

typedef struct UIButtonProps {
  Extensions extensions;
  void *extras;
  WebSGString label;
} UIButtonProps;

typedef struct UITextProps {
  Extensions extensions;
  void *extras;
  WebSGString value;
  WebSGString font_family;
  WebSGString font_weight;
  WebSGString font_style;
  float_t font_size;
  float_t color[4];
} UITextProps;

typedef struct UIElementProps {
  const char *name;
  Extensions extensions;
  void *extras;
  ElementType type;
  float_t position[4];
  ElementPositionType position_type;
  FlexAlign align_content;
  FlexAlign align_items;
  FlexAlign align_self;
  FlexDirection flex_direction;
  FlexWrap flex_wrap;
  float_t flex_basis;
  float_t flex_grow;
  float_t flex_shrink;
  FlexJustify justify_content;
  float_t width;
  float_t height;
  float_t min_width;
  float_t min_height;
  float_t max_width;
  float_t max_height;
  float_t background_color[4];
  float_t border_color[4];
  float_t padding[4];
  float_t margin[4];
  float_t border_width[4];
  float_t border_radius[4];
  UIButtonProps *button;
  UITextProps *text;
} UIElementProps;

import_websg(world_create_ui_element) ui_element_id_t websg_world_create_ui_element(UIElementProps *props);
import_websg(world_find_ui_element_by_name) light_id_t websg_world_find_ui_element_by_name(const char *name, uint32_t length);
import_websg(ui_element_get_position_element) float_t websg_ui_element_get_position_element(ui_element_id_t ui_element_id, uint32_t index);
import_websg(ui_element_set_position_element) int32_t websg_ui_element_set_position_element(ui_element_id_t ui_element_id, uint32_t index, float_t value);
import_websg(ui_element_get_position) int32_t websg_ui_element_get_position(ui_element_id_t element_id, float_t *position);
import_websg(ui_element_set_position) int32_t websg_ui_element_set_position(ui_element_id_t element_id, float_t *position);
import_websg(ui_element_get_position_type) ElementPositionType websg_ui_element_get_position_type(ui_element_id_t element_id);
import_websg(ui_element_set_position_type) int32_t websg_ui_element_set_position_type(ui_element_id_t element_id, ElementPositionType position_type);
import_websg(ui_element_get_align_content) FlexAlign websg_ui_element_get_align_content(ui_element_id_t element_id);
import_websg(ui_element_set_align_content) int32_t websg_ui_element_set_align_content(ui_element_id_t element_id, FlexAlign align_content);
import_websg(ui_element_get_align_items) FlexAlign websg_ui_element_get_align_items(ui_element_id_t element_id);
import_websg(ui_element_set_align_items) int32_t websg_ui_element_set_align_items(ui_element_id_t element_id, FlexAlign align_items);
import_websg(ui_element_get_align_self) FlexAlign websg_ui_element_get_align_self(ui_element_id_t element_id);
import_websg(ui_element_set_align_self) int32_t websg_ui_element_set_align_self(ui_element_id_t element_id, FlexAlign align_self);
import_websg(ui_element_get_flex_direction) FlexDirection websg_ui_element_get_flex_direction(ui_element_id_t element_id);
import_websg(ui_element_set_flex_direction) int32_t websg_ui_element_set_flex_direction(ui_element_id_t element_id, FlexDirection flex_direction);
import_websg(ui_element_get_flex_wrap) FlexWrap websg_ui_element_get_flex_wrap(ui_element_id_t element_id);
import_websg(ui_element_set_flex_wrap) int32_t websg_ui_element_set_flex_wrap(ui_element_id_t element_id, FlexWrap flex_wrap);
import_websg(ui_element_set_flex_basis) int32_t websg_ui_element_set_flex_basis(ui_element_id_t element_id, float_t flex_basis);
import_websg(ui_element_get_flex_basis) float_t websg_ui_element_get_flex_basis(ui_element_id_t element_id);
import_websg(ui_element_set_flex_grow) int32_t websg_ui_element_set_flex_grow(ui_element_id_t element_id, float_t flex_grow);
import_websg(ui_element_get_flex_grow) float_t websg_ui_element_get_flex_grow(ui_element_id_t element_id);
import_websg(ui_element_set_flex_shrink) int32_t websg_ui_element_set_flex_shrink(ui_element_id_t element_id, float_t flex_shrink);
import_websg(ui_element_get_flex_shrink) float_t websg_ui_element_get_flex_shrink(ui_element_id_t element_id);
import_websg(ui_element_get_justify_content) FlexJustify websg_ui_element_get_justify_content(ui_element_id_t element_id);
import_websg(ui_element_set_justify_content) int32_t websg_ui_element_set_justify_content(ui_element_id_t element_id, FlexJustify justify_content);
import_websg(ui_element_set_width) int32_t websg_ui_element_set_width(ui_element_id_t element_id, float_t width);
import_websg(ui_element_get_width) float_t websg_ui_element_get_width(ui_element_id_t element_id);
import_websg(ui_element_set_height) int32_t websg_ui_element_set_height(ui_element_id_t element_id, float_t height);
import_websg(ui_element_get_height) float_t websg_ui_element_get_height(ui_element_id_t element_id);
import_websg(ui_element_set_min_width) int32_t websg_ui_element_set_min_width(ui_element_id_t element_id, float_t min_width);
import_websg(ui_element_get_min_width) float_t websg_ui_element_get_min_width(ui_element_id_t element_id);
import_websg(ui_element_set_min_height) int32_t websg_ui_element_set_min_height(ui_element_id_t element_id, float_t min_height);
import_websg(ui_element_get_min_height) float_t websg_ui_element_get_min_height(ui_element_id_t element_id);
import_websg(ui_element_set_max_width) int32_t websg_ui_element_set_max_width(ui_element_id_t element_id, float_t max_width);
import_websg(ui_element_get_max_width) float_t websg_ui_element_get_max_width(ui_element_id_t element_id);
import_websg(ui_element_set_max_height) int32_t websg_ui_element_set_max_height(ui_element_id_t element_id, float_t max_height);
import_websg(ui_element_get_max_height) float_t websg_ui_element_get_max_height(ui_element_id_t element_id);
import_websg(ui_element_get_background_color_element) float_t websg_ui_element_get_background_color_element(ui_element_id_t ui_element_id, uint32_t index);
import_websg(ui_element_set_background_color_element) int32_t websg_ui_element_set_background_color_element(ui_element_id_t ui_element_id, uint32_t index, float_t value);
import_websg(ui_element_get_background_color) int32_t websg_ui_element_get_background_color(ui_element_id_t element_id, float_t *background_color);
import_websg(ui_element_set_background_color) int32_t websg_ui_element_set_background_color(ui_element_id_t element_id, float_t *background_color);
import_websg(ui_element_get_border_color_element) float_t websg_ui_element_get_border_color_element(ui_element_id_t ui_element_id, uint32_t index);
import_websg(ui_element_set_border_color_element) int32_t websg_ui_element_set_border_color_element(ui_element_id_t ui_element_id, uint32_t index, float_t value);
import_websg(ui_element_get_border_color) int32_t websg_ui_element_get_border_color(ui_element_id_t element_id, float_t *border_color);
import_websg(ui_element_set_border_color) int32_t websg_ui_element_set_border_color(ui_element_id_t element_id, float_t *border_color);
import_websg(ui_element_get_padding_element) float_t websg_ui_element_get_padding_element(ui_element_id_t ui_element_id, uint32_t index);
import_websg(ui_element_set_padding_element) int32_t websg_ui_element_set_padding_element(ui_element_id_t ui_element_id, uint32_t index, float_t value);
import_websg(ui_element_get_padding) int32_t websg_ui_element_get_padding(ui_element_id_t element_id, float_t *padding);
import_websg(ui_element_set_padding) int32_t websg_ui_element_set_padding( ui_element_id_t element_id, float_t *padding);
import_websg(ui_element_get_margin_element) float_t websg_ui_element_get_margin_element(ui_element_id_t ui_element_id, uint32_t index);
import_websg(ui_element_set_margin_element) int32_t websg_ui_element_set_margin_element(ui_element_id_t ui_element_id, uint32_t index, float_t value);
import_websg(ui_element_get_margin) int32_t websg_ui_element_get_margin(ui_element_id_t element_id, float_t *margin);
import_websg(ui_element_set_margin) int32_t websg_ui_element_set_margin(ui_element_id_t element_id, float_t *margin);
import_websg(ui_element_get_border_width_element) float_t websg_ui_element_get_border_width_element(ui_element_id_t ui_element_id, uint32_t index);
import_websg(ui_element_set_border_width_element) int32_t websg_ui_element_set_border_width_element(ui_element_id_t ui_element_id, uint32_t index, float_t value);
import_websg(ui_element_get_border_width) int32_t websg_ui_element_get_border_width(ui_element_id_t element_id, float_t *border_width);
import_websg(ui_element_set_border_width) int32_t websg_ui_element_set_border_width(ui_element_id_t element_id, float_t *border_width);
import_websg(ui_element_get_border_radius_element) float_t websg_ui_element_get_border_radius_element(ui_element_id_t ui_element_id, uint32_t index);
import_websg(ui_element_set_border_radius_element) int32_t websg_ui_element_set_border_radius_element(ui_element_id_t ui_element_id, uint32_t index, float_t value);
import_websg(ui_element_get_border_radius) int32_t websg_ui_element_get_border_radius(ui_element_id_t element_id, float_t *border_radius);
import_websg(ui_element_set_border_radius) int32_t websg_ui_element_set_border_radius(ui_element_id_t element_id, float_t *border_radius);
import_websg(ui_element_get_element_type) ElementType websg_ui_element_get_element_type(ui_element_id_t element_id);
import_websg(ui_element_add_child) int32_t websg_ui_element_add_child(ui_element_id_t ui_element_id, ui_element_id_t child_id);
import_websg(ui_element_remove_child) int32_t websg_ui_element_remove_child(ui_element_id_t ui_element_id, ui_element_id_t child_id);
import_websg(ui_element_get_child_count) int32_t websg_ui_element_get_child_count(ui_element_id_t ui_element_id);
import_websg(ui_element_get_children) int32_t websg_ui_element_get_children(ui_element_id_t ui_element_id, ui_element_id_t *children, uint32_t max_count);
import_websg(ui_element_get_child) ui_element_id_t websg_ui_element_get_child(ui_element_id_t ui_element_id, uint32_t index);
import_websg(ui_element_get_parent) ui_element_id_t websg_ui_element_get_parent(ui_element_id_t ui_element_id);

/********************************
 * UI Button Element Properties *
 ********************************/

import_websg(ui_button_get_label_length) int32_t websg_ui_button_get_label_length(ui_element_id_t element_id);
import_websg(ui_button_get_label) int32_t websg_ui_button_get_label(ui_element_id_t element_id, const char *label, size_t length);
import_websg(ui_button_set_label) int32_t websg_ui_button_set_label(ui_element_id_t element_id, const char *label, size_t length);
import_websg(ui_button_get_pressed) int32_t websg_ui_button_get_pressed(ui_element_id_t element_id);
import_websg(ui_button_get_held) int32_t websg_ui_button_get_held(ui_element_id_t element_id);
import_websg(ui_button_get_released) int32_t websg_ui_button_get_released(ui_element_id_t element_id);

/******************************
 * UI Text Element Properties *
 ******************************/

import_websg(ui_text_get_value_length) int32_t websg_ui_text_get_value_length(ui_element_id_t element_id);
import_websg(ui_text_get_value) int32_t websg_ui_text_get_value(ui_element_id_t element_id, const char *value, size_t length);
import_websg(ui_text_set_value) int32_t websg_ui_text_set_value(ui_element_id_t element_id, const char *value, size_t length);
import_websg(ui_text_get_font_family_length) int32_t websg_ui_text_get_font_family_length(ui_element_id_t element_id);
import_websg(ui_text_get_font_family) int32_t websg_ui_text_get_font_family(ui_element_id_t element_id, const char *font_family, size_t length);
import_websg(ui_text_set_font_family) int32_t websg_ui_text_set_font_family(ui_element_id_t element_id, const char *font_family, size_t length);
import_websg(ui_text_get_font_style_length) int32_t websg_ui_text_get_font_style_length(ui_element_id_t element_id);
import_websg(ui_text_get_font_style) int32_t websg_ui_text_get_font_style(ui_element_id_t element_id, const char *font_style, size_t length);
import_websg(ui_text_set_font_style) int32_t websg_ui_text_set_font_style(ui_element_id_t element_id, const char *font_style, size_t length);
import_websg(ui_text_get_font_weight_length) int32_t websg_ui_text_get_font_weight_length(ui_element_id_t element_id);
import_websg(ui_text_get_font_weight) int32_t websg_ui_text_get_font_weight(ui_element_id_t element_id, const char *font_weight, size_t length);
import_websg(ui_text_set_font_weight) int32_t websg_ui_text_set_font_weight(ui_element_id_t element_id, const char *font_style, size_t length);
import_websg(ui_text_get_font_size) float_t websg_ui_text_get_font_size(ui_element_id_t element_id);
import_websg(ui_text_set_font_size) int32_t websg_ui_text_set_font_size(ui_element_id_t element_id, float_t font_size);
import_websg(ui_text_get_color) int32_t websg_ui_text_get_color(ui_element_id_t element_id, float_t *color);
import_websg(ui_text_set_color) int32_t websg_ui_text_set_color(ui_element_id_t element_id, float_t *color);
import_websg(ui_text_get_color_element) float_t websg_ui_text_get_color_element(ui_element_id_t ui_element_id, uint32_t index);
import_websg(ui_text_set_color_element) int32_t websg_ui_text_set_color_element(ui_element_id_t ui_element_id, uint32_t index, float_t value);


import_websg(get_primary_input_source_origin_element) float_t websg_get_primary_input_source_origin_element(uint32_t index);
import_websg(get_primary_input_source_direction_element) float_t websg_get_primary_input_source_direction_element(uint32_t index);

#endif
