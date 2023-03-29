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
typedef uint32_t material_id_t;
typedef uint32_t texture_id_t;
typedef uint32_t light_id_t;
typedef uint32_t collider_id_t;

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
import_websg(node_set_is_static_recursive) int32_t websg_node_set_is_static_recursive(
  node_id_t node_id,
  uint32_t is_static
);

// Node Refs

import_websg(node_get_mesh) mesh_id_t websg_node_get_mesh(node_id_t node_id);
import_websg(node_set_mesh) int32_t websg_node_set_mesh(node_id_t node_id, mesh_id_t mesh_id);

import_websg(node_get_light) light_id_t websg_node_get_light(node_id_t node_id);
import_websg(node_set_light) int32_t websg_node_set_light(node_id_t node_id, light_id_t light_id);

import_websg(node_get_collider) collider_id_t websg_node_get_collider(node_id_t node_id);
import_websg(node_set_collider) int32_t websg_node_set_collider(node_id_t node_id, collider_id_t collider_id);

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

typedef struct BoxMeshProps {
  float_t size[3];
  uint32_t segments[3];
  material_id_t material;
} BoxMeshProps;

import_websg(create_mesh) mesh_id_t websg_create_mesh(MeshPrimitiveProps *primitives, uint32_t count);
import_websg(create_box_mesh) mesh_id_t websg_create_box_mesh(BoxMeshProps *props);
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
import_websg(mesh_set_primitive_material) int32_t websg_mesh_set_primitive_material(
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
import_websg(mesh_set_primitive_hologram_material_enabled) int32_t websg_mesh_set_primitive_hologram_material_enabled(
  mesh_id_t mesh_id,
  uint32_t index,
  uint32_t enabled
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
 * Texture
 **/

import_websg(texture_find_by_name) texture_id_t websg_texture_find_by_name(const char *name, uint32_t length);

/**
 * Light
 **/

typedef enum LightType {
  LightType_Directional,
  LightType_Point,
  LightType_Spot,
} LightType;

import_websg(light_find_by_name) light_id_t websg_light_find_by_name(const char *name, uint32_t length);
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

/**
 * Collider
 */

typedef enum ColliderType {
  ColliderType_Box,
  ColliderType_Sphere,
  ColliderType_Capsule,
  ColliderType_Cylinder,
  ColliderType_Hull,
  ColliderType_Trimesh,
} ColliderType;

typedef struct ColliderProps {
  ColliderType type;
  uint32_t is_trigger;
  float_t size[3];
  float_t radius;
  float_t height;
  mesh_id_t mesh;
} ColliderProps;

import_websg(create_collider) collider_id_t websg_create_collider(ColliderProps *props);
import_websg(collider_find_by_name) collider_id_t websg_collider_find_by_name(const char *name, uint32_t length);

/**
 * PhysicsBody
 */

typedef enum PhysicsBodyType {
  PhysicsBodyType_Static,
  PhysicsBodyType_Kinematic,
  PhysicsBodyType_Rigid,
} PhysicsBodyType;

typedef struct PhysicsBodyProps {
  PhysicsBodyType type;
  float_t linear_velocity[3];
  float_t angular_velocity[3];
  float_t inertia_tensor[9];
} PhysicsBodyProps;

import_websg(add_physics_body) int32_t websg_add_physics_body(node_id_t node_id, PhysicsBodyProps *props);
import_websg(remove_physics_body) int32_t websg_remove_physics_body(node_id_t node_id);
import_websg(has_physics_body) int32_t websg_has_physics_body(node_id_t node_id);

typedef uint32_t ui_canvas_id_t;
typedef uint32_t ui_flex_id_t;
typedef uint32_t ui_button_id_t;
typedef uint32_t ui_text_id_t;

/**
 * UI Canvas
 **/

typedef struct UICanvasProps {
  float_t width;
  float_t height;
  float_t pixel_density;
} UICanvasProps;

import_websg(create_ui_canvas) ui_canvas_id_t websg_create_ui_canvas(UICanvasProps *props);
import_websg(node_set_ui_canvas) int32_t websg_node_set_ui_canvas(node_id_t node_id, ui_canvas_id_t canvas_id);
import_websg(ui_canvas_set_root) int32_t websg_ui_canvas_set_root(ui_canvas_id_t canvas_id, ui_flex_id_t root_id);
import_websg(ui_canvas_set_width) int32_t websg_ui_canvas_set_width(ui_canvas_id_t canvas_id, float_t width);
import_websg(ui_canvas_set_height) int32_t websg_ui_canvas_set_height(ui_canvas_id_t canvas_id, float_t height);
import_websg(ui_canvas_set_pixel_density) int32_t websg_ui_canvas_set_pixel_density(ui_canvas_id_t canvas_id, float_t pixel_density);
import_websg(ui_canvas_redraw) int32_t websg_ui_canvas_redraw(ui_canvas_id_t canvas_id);

/**
 * UI Flex
 **/

typedef enum FlexDirection {
  FlexDirection_COLUMN,
  FlexDirection_COLUMN_REVERSE,
  FlexDirection_ROW,
  FlexDirection_ROW_REVERSE,
} FlexDirection;

typedef enum FlexEdge {
  FlexEdge_LEFT,
  FlexEdge_TOP,
  FlexEdge_RIGHT,
  FlexEdge_BOTTOM,
} FlexEdge;

typedef struct UIFlexProps {
  float_t width;
  float_t height;
  FlexDirection flex_direction;
  float_t background_color[4];
  float_t border_color[4];
  float_t padding[4];
  float_t margin[4];
} UIFlexProps;

import_websg(create_ui_flex) ui_flex_id_t websg_ui_create_flex(UIFlexProps *props);
import_websg(ui_flex_set_flex_direction) int32_t websg_ui_flex_set_flex_direction(ui_flex_id_t flex_id, FlexDirection flex_direction);
import_websg(ui_flex_set_width) int32_t websg_ui_flex_set_width(ui_flex_id_t flex_id, float_t width);
import_websg(ui_flex_set_height) int32_t websg_ui_flex_set_height(ui_flex_id_t flex_id, float_t height);
import_websg(ui_flex_set_background_color) int32_t websg_ui_flex_set_background_color(ui_flex_id_t flex_id, float_t *color);
import_websg(ui_flex_set_border_color) int32_t websg_ui_flex_set_border_color(ui_flex_id_t flex_id, float_t *color);
import_websg(ui_flex_set_padding) int32_t websg_ui_flex_set_padding(ui_flex_id_t flex_id, float_t *padding);
import_websg(ui_flex_set_margin) int32_t websg_ui_flex_set_margin(ui_flex_id_t flex_id, float_t *margin);
import_websg(ui_flex_add_child) int32_t websg_ui_flex_add_child(ui_flex_id_t parent_id, ui_flex_id_t child_id);
import_websg(ui_flex_add_text) int32_t websg_ui_flex_add_text(ui_flex_id_t parent_id, ui_text_id_t text_id);
import_websg(ui_flex_add_button) int32_t websg_ui_flex_add_button(ui_flex_id_t parent_id, ui_button_id_t button_id);

/**
 * UI Button
 **/

import_websg(create_ui_button) ui_button_id_t websg_ui_create_button(const char *label, size_t length);
import_websg(ui_button_set_label) int32_t websg_ui_button_set_label(ui_button_id_t btn_id, char *label, size_t length);
import_websg(ui_button_get_pressed) int32_t websg_ui_button_get_pressed(ui_button_id_t btn_id);
import_websg(ui_button_get_held) int32_t websg_ui_button_get_held(ui_button_id_t btn_id);
import_websg(ui_button_get_released) int32_t websg_ui_button_get_released(ui_button_id_t btn_id);

/**
 * UI Text
 **/

typedef struct UITextProps {
  float_t font_size;
  float_t color[4];

  const char *value;
  uint32_t value_length;

  const char *font_family;
  uint32_t font_family_length;

  const char *font_weight;
  uint32_t font_weight_length;

  const char *font_style;
  uint32_t font_style_length;
} UITextProps;

import_websg(create_ui_text) ui_text_id_t websg_ui_create_text(UITextProps *props);
import_websg(ui_text_set_value) int32_t websg_ui_text_set_value(ui_text_id_t txt_id, const char *value, size_t length);
import_websg(ui_text_set_font_size) int32_t websg_ui_text_set_font_size(ui_text_id_t txt_id, float_t font_size);
import_websg(ui_text_set_font_family) int32_t websg_ui_text_set_font_family(ui_text_id_t txt_id, const char *family, size_t length);
import_websg(ui_text_set_font_style) int32_t websg_ui_text_set_font_style(ui_text_id_t txt_id, const char *style, size_t length);
import_websg(ui_text_set_color) int32_t websg_ui_text_set_color(ui_text_id_t txt_id, float_t *color);
/**
 * Orbiting
*/

typedef struct CameraRigOptions {
  float_t pitch;
  float_t yaw;
  float_t zoom;
} CameraRigOptions;

import_websg(start_orbit) int32_t websg_start_orbit(node_id_t node_id, CameraRigOptions *options);
import_websg(stop_orbit) int32_t websg_stop_orbit();


#endif
