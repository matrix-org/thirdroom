#include "./quickjs/quickjs.h"

#include <string.h>
#include "./quickjs/cutils.h"
#include "./quickjs/quickjs.h"
#include "../websg.h"
#include "./websg-js.h"
#include "./websg-network-js.h"

static JSValue js_get_environment_scene(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  scene_id_t scene_id = websg_get_environment_scene();

  if (scene_id == 0) {
    return JS_UNDEFINED;
  }

  return JS_NewUint32(ctx, scene_id);
}

static JSValue js_set_environment_scene(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  scene_id_t scene_id;

  if (JS_ToUint32(ctx, &scene_id, argv[0]) == -1) {
    return JS_EXCEPTION;
  }

  if (websg_set_environment_scene(scene_id) == -1) {
    JS_ThrowInternalError(ctx, "WebSG: Couldn't set environment scene.");
    return JS_EXCEPTION;
  }

  return JS_UNDEFINED;
}

static JSValue js_create_scene(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  scene_id_t scene_id = websg_create_scene();

  if (scene_id == 0) {
    JS_ThrowInternalError(ctx, "WebSG: Couldn't create scene.");
    return JS_EXCEPTION;
  }

  return JS_NewUint32(ctx, scene_id);
}

static JSValue js_scene_find_by_name(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {

  size_t length;
  const char* name = JS_ToCStringLen(ctx, &length, argv[0]);

  if (name == NULL) {
    return JS_EXCEPTION;
  }

  scene_id_t scene_id = websg_scene_find_by_name(name, length);

  if (scene_id == 0) {
    return JS_UNDEFINED;
  }

  return JS_NewUint32(ctx, scene_id);
}

static JSValue js_scene_add_node(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  scene_id_t scene_id;

  if (JS_ToUint32(ctx, &scene_id, argv[0]) == -1) {
    return JS_EXCEPTION;
  }

  node_id_t node_id;

  if (JS_ToUint32(ctx, &node_id, argv[1]) == -1) {
    return JS_EXCEPTION;
  }

  if (websg_scene_add_node(scene_id, node_id) == -1) {
    JS_ThrowInternalError(ctx, "WebSG: Couldn't add node to scene.");
    return JS_EXCEPTION;
  }

  return JS_UNDEFINED;
}

static JSValue js_scene_remove_node(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  scene_id_t scene_id;

  if (JS_ToUint32(ctx, &scene_id, argv[0]) == -1) {
    return JS_EXCEPTION;
  }

  node_id_t node_id;

  if (JS_ToUint32(ctx, &node_id, argv[1]) == -1) {
    return JS_EXCEPTION;
  }

  if (websg_scene_remove_node(scene_id, node_id) == -1) {
    JS_ThrowInternalError(ctx, "WebSG: Couldn't remove node from scene.");
    return JS_EXCEPTION;
  }

  return JS_UNDEFINED;
}

static JSValue js_scene_get_nodes(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  scene_id_t scene_id;

  if (JS_ToUint32(ctx, &scene_id, argv[0]) == -1) {
    return JS_EXCEPTION;
  }

  int32_t count = websg_scene_get_node_count(scene_id);

  if (count == -1) {
    JS_ThrowInternalError(ctx, "WebSG: Error getting scene node count.");
    return JS_EXCEPTION;
  }

  node_id_t *nodes = js_malloc(ctx, sizeof(node_id_t) * count);

  if (websg_scene_get_nodes(scene_id, nodes, count) == -1) {
    JS_ThrowInternalError(ctx, "WebSG: Error getting scene nodes.");
    return JS_EXCEPTION;
  }

  JSValue arr = JS_NewArray(ctx);

  for (int i = 0; i < count; i++) {
    JS_SetPropertyUint32(ctx, arr, i, JS_NewUint32(ctx, nodes[i]));
  }

  js_free(ctx, nodes);

  return arr;
}

static JSValue js_scene_get_node(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  scene_id_t scene_id;

  if (JS_ToUint32(ctx, &scene_id, argv[0]) == -1) {
    return JS_EXCEPTION;
  }

  uint32_t index;

  if (JS_ToUint32(ctx, &index, argv[1]) == -1) {
    return JS_EXCEPTION;
  }

  node_id_t node_id = websg_scene_get_node(scene_id, index);

  if (node_id == 0) {
    return JS_UNDEFINED;
  }

  return JS_NewUint32(ctx, node_id);
}

static JSValue js_create_node(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  node_id_t node_id = websg_create_node();

  if (node_id == 0) {
    JS_ThrowInternalError(ctx, "WebSG: Couldn't create node.");
    return JS_EXCEPTION;
  }

  return JS_NewUint32(ctx, node_id);
}

static JSValue js_node_find_by_name(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {

  size_t length;
  const char* name = JS_ToCStringLen(ctx, &length, argv[0]);

  if (name == NULL) {
    return JS_EXCEPTION;
  }

  node_id_t node_id = websg_node_find_by_name(name, length);

  if (node_id == 0) {
    return JS_UNDEFINED;
  }

  return JS_NewUint32(ctx, node_id);
}

static JSValue js_node_add_child(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  node_id_t node_id;

  if (JS_ToUint32(ctx, &node_id, argv[0]) == -1) {
    return JS_EXCEPTION;
  }

  node_id_t child_id;

  if (JS_ToUint32(ctx, &child_id, argv[1]) == -1) {
    return JS_EXCEPTION;
  }

  if (websg_node_add_child(node_id, child_id) == -1) {
    JS_ThrowInternalError(ctx, "WebSG: Couldn't add child to node.");
    return JS_EXCEPTION;
  }

  return JS_UNDEFINED;
}

static JSValue js_node_remove_child(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  node_id_t node_id;

  if (JS_ToUint32(ctx, &node_id, argv[0]) == -1) {
    return JS_EXCEPTION;
  }

  node_id_t child_id;

  if (JS_ToUint32(ctx, &child_id, argv[1]) == -1) {
    return JS_EXCEPTION;
  }

  if (websg_node_remove_child(node_id, child_id) == -1) {
    JS_ThrowInternalError(ctx, "WebSG: Couldn't remove child from node.");
    return JS_EXCEPTION;
  }

  return JS_UNDEFINED;
}

static JSValue js_node_get_children(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  node_id_t node_id;

  if (JS_ToUint32(ctx, &node_id, argv[0]) == -1) {
    return JS_EXCEPTION;
  }

  int32_t count = websg_node_get_child_count(node_id);

  if (count == -1) {
    JS_ThrowInternalError(ctx, "WebSG: Error getting node child count.");
    return JS_EXCEPTION;
  }

  node_id_t *children = js_malloc(ctx, sizeof(node_id_t) * count);

  if (websg_node_get_children(node_id, children, count) == -1) {
    JS_ThrowInternalError(ctx, "WebSG: Error getting node children.");
    return JS_EXCEPTION;
  }

  JSValue arr = JS_NewArray(ctx);

  for (int i = 0; i < count; i++) {
    JS_SetPropertyUint32(ctx, arr, i, JS_NewUint32(ctx, children[i]));
  }

  js_free(ctx, children);

  return arr;
}

static JSValue js_node_get_child(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  node_id_t node_id;

  if (JS_ToUint32(ctx, &node_id, argv[0]) == -1) {
    return JS_EXCEPTION;
  }

  uint32_t index;

  if (JS_ToUint32(ctx, &index, argv[1]) == -1) {
    return JS_EXCEPTION;
  }

  node_id_t child_id = websg_node_get_child(node_id, index);

  if (child_id == 0) {
    return JS_UNDEFINED;
  }

  return JS_NewUint32(ctx, child_id);
}

static JSValue js_node_get_parent(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  node_id_t node_id;

  if (JS_ToUint32(ctx, &node_id, argv[0]) == -1) {
    return JS_EXCEPTION;
  }

  node_id_t parent_id = websg_node_get_parent(node_id);

  if (parent_id == 0) {
    return JS_UNDEFINED;
  }

  return JS_NewUint32(ctx, parent_id);
}

static JSValue js_node_get_parent_scene(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  node_id_t node_id;

  if (JS_ToUint32(ctx, &node_id, argv[0]) == -1) {
    return JS_EXCEPTION;
  }

  scene_id_t parent_scene_id = websg_node_get_parent_scene(node_id);

  if (parent_scene_id == 0) {
    return JS_UNDEFINED;
  }

  return JS_NewUint32(ctx, parent_scene_id);
}

static JSValue js_node_get_position(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  node_id_t node_id;

  if (JS_ToUint32(ctx, &node_id, argv[0]) == -1) {
    return JS_EXCEPTION;
  }

  size_t view_byte_offset;
  size_t view_byte_length;
  size_t view_bytes_per_element;

  JSValue buffer = JS_GetTypedArrayBuffer(ctx, argv[1], &view_byte_offset, &view_byte_length, &view_bytes_per_element);

  if (JS_IsException(buffer)) {
    return JS_EXCEPTION;
  }

  if (view_byte_length < (sizeof(float_t) * 3)) {
    JS_ThrowRangeError(ctx, "WebSG: Invalid typed array length.");
    return JS_EXCEPTION;
  }

  size_t buffer_byte_length;
  uint8_t *data = JS_GetArrayBuffer(ctx, &buffer_byte_length, buffer);
  data += view_byte_offset;

  int32_t result = websg_node_get_position(node_id, (float_t *)data);

  if (result == -1) {
    JS_ThrowInternalError(ctx, "WebSG: Error getting position.");
    return JS_EXCEPTION;
  }

  return JS_DupValue(ctx, argv[1]);
}

static JSValue js_node_set_position(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  node_id_t node_id;

  if (JS_ToUint32(ctx, &node_id, argv[0]) == -1) {
    return JS_EXCEPTION;
  }

  size_t view_byte_offset;
  size_t view_byte_length;
  size_t view_bytes_per_element;

  JSValue buffer = JS_GetTypedArrayBuffer(ctx, argv[1], &view_byte_offset, &view_byte_length, &view_bytes_per_element);

  if (JS_IsException(buffer)) {
    return JS_EXCEPTION;
  }

  if (view_byte_length < (sizeof(float_t) * 3)) {
    JS_ThrowRangeError(ctx, "WebSG: Invalid typed array length.");
    return JS_EXCEPTION;
  }

  size_t buffer_byte_length;
  uint8_t *data = JS_GetArrayBuffer(ctx, &buffer_byte_length, buffer);
  data += view_byte_offset;

  int32_t result = websg_node_set_position(node_id, (float_t *)data);

  if (result == -1) {
    JS_ThrowInternalError(ctx, "WebSG: Error setting position.");
    return JS_EXCEPTION;
  }

  return JS_DupValue(ctx, argv[1]);
}

static JSValue js_node_get_quaternion(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  node_id_t node_id;

  if (JS_ToUint32(ctx, &node_id, argv[0]) == -1) {
    return JS_EXCEPTION;
  }

  size_t view_byte_offset;
  size_t view_byte_length;
  size_t view_bytes_per_element;

  JSValue buffer = JS_GetTypedArrayBuffer(ctx, argv[1], &view_byte_offset, &view_byte_length, &view_bytes_per_element);

  if (JS_IsException(buffer)) {
    return JS_EXCEPTION;
  }

  if (view_byte_length < (sizeof(float_t) * 4)) {
    JS_ThrowRangeError(ctx, "WebSG: Invalid typed array length.");
    return JS_EXCEPTION;
  }

  size_t buffer_byte_length;
  uint8_t *data = JS_GetArrayBuffer(ctx, &buffer_byte_length, buffer);
  data += view_byte_offset;

  int32_t result = websg_node_get_quaternion(node_id, (float_t *)data);

  if (result == -1) {
    JS_ThrowInternalError(ctx, "WebSG: Error getting quaternion.");
    return JS_EXCEPTION;
  }

  return JS_DupValue(ctx, argv[1]);
}

static JSValue js_node_set_quaternion(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  node_id_t node_id;

  if (JS_ToUint32(ctx, &node_id, argv[0]) == -1) {
    return JS_EXCEPTION;
  }

  size_t view_byte_offset;
  size_t view_byte_length;
  size_t view_bytes_per_element;

  JSValue buffer = JS_GetTypedArrayBuffer(ctx, argv[1], &view_byte_offset, &view_byte_length, &view_bytes_per_element);

  if (JS_IsException(buffer)) {
    return JS_EXCEPTION;
  }

  if (view_byte_length < (sizeof(float_t) * 4)) {
    JS_ThrowRangeError(ctx, "WebSG: Invalid typed array length.");
    return JS_EXCEPTION;
  }

  size_t buffer_byte_length;
  uint8_t *data = JS_GetArrayBuffer(ctx, &buffer_byte_length, buffer);
  data += view_byte_offset;

  int32_t result = websg_node_set_quaternion(node_id, (float_t *)data);

  if (result == -1) {
    JS_ThrowInternalError(ctx, "WebSG: Error setting quaternion.");
    return JS_EXCEPTION;
  }

  return JS_DupValue(ctx, argv[1]);
}

static JSValue js_node_get_scale(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  node_id_t node_id;

  if (JS_ToUint32(ctx, &node_id, argv[0]) == -1) {
    return JS_EXCEPTION;
  }

  size_t view_byte_offset;
  size_t view_byte_length;
  size_t view_bytes_per_element;

  JSValue buffer = JS_GetTypedArrayBuffer(ctx, argv[1], &view_byte_offset, &view_byte_length, &view_bytes_per_element);

  if (JS_IsException(buffer)) {
    return JS_EXCEPTION;
  }

  if (view_byte_length < (sizeof(float_t) * 3)) {
    JS_ThrowRangeError(ctx, "WebSG: Invalid typed array length.");
    return JS_EXCEPTION;
  }

  size_t buffer_byte_length;
  uint8_t *data = JS_GetArrayBuffer(ctx, &buffer_byte_length, buffer);
  data += view_byte_offset;

  int32_t result = websg_node_get_scale(node_id, (float_t *)data);

  if (result == -1) {
    JS_ThrowInternalError(ctx, "WebSG: Error getting scale.");
    return JS_EXCEPTION;
  }

  return JS_DupValue(ctx, argv[1]);
}

static JSValue js_node_set_scale(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  node_id_t node_id;

  if (JS_ToUint32(ctx, &node_id, argv[0]) == -1) {
    return JS_EXCEPTION;
  }

  size_t view_byte_offset;
  size_t view_byte_length;
  size_t view_bytes_per_element;

  JSValue buffer = JS_GetTypedArrayBuffer(ctx, argv[1], &view_byte_offset, &view_byte_length, &view_bytes_per_element);

  if (JS_IsException(buffer)) {
    return JS_EXCEPTION;
  }

  if (view_byte_length < (sizeof(float_t) * 3)) {
    JS_ThrowRangeError(ctx, "WebSG: Invalid typed array length.");
    return JS_EXCEPTION;
  }

  size_t buffer_byte_length;
  uint8_t *data = JS_GetArrayBuffer(ctx, &buffer_byte_length, buffer);
  data += view_byte_offset;

  int32_t result = websg_node_set_scale(node_id, (float_t *)data);

  if (result == -1) {
    JS_ThrowInternalError(ctx, "WebSG: Error setting scale.");
    return JS_EXCEPTION;
  }

  return JS_DupValue(ctx, argv[1]);
}

static JSValue js_node_get_local_matrix(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  node_id_t node_id;

  if (JS_ToUint32(ctx, &node_id, argv[0]) == -1) {
    return JS_EXCEPTION;
  }

  size_t view_byte_offset;
  size_t view_byte_length;
  size_t view_bytes_per_element;

  JSValue buffer = JS_GetTypedArrayBuffer(ctx, argv[1], &view_byte_offset, &view_byte_length, &view_bytes_per_element);

  if (JS_IsException(buffer)) {
    return JS_EXCEPTION;
  }

  if (view_byte_length < (sizeof(float_t) * 16)) {
    JS_ThrowRangeError(ctx, "WebSG: Invalid typed array length.");
    return JS_EXCEPTION;
  }

  size_t buffer_byte_length;
  uint8_t *data = JS_GetArrayBuffer(ctx, &buffer_byte_length, buffer);
  data += view_byte_offset;

  int32_t result = websg_node_get_local_matrix(node_id, (float_t *)data);

  if (result == -1) {
    JS_ThrowInternalError(ctx, "WebSG: Error getting localMatrix.");
    return JS_EXCEPTION;
  }

  return JS_DupValue(ctx, argv[1]);
}

static JSValue js_node_set_local_matrix(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  node_id_t node_id;

  if (JS_ToUint32(ctx, &node_id, argv[0]) == -1) {
    return JS_EXCEPTION;
  }

  size_t view_byte_offset;
  size_t view_byte_length;
  size_t view_bytes_per_element;

  JSValue buffer = JS_GetTypedArrayBuffer(ctx, argv[1], &view_byte_offset, &view_byte_length, &view_bytes_per_element);

  if (JS_IsException(buffer)) {
    return JS_EXCEPTION;
  }

  if (view_byte_length < (sizeof(float_t) * 16)) {
    JS_ThrowRangeError(ctx, "WebSG: Invalid typed array length.");
    return JS_EXCEPTION;
  }

  size_t buffer_byte_length;
  uint8_t *data = JS_GetArrayBuffer(ctx, &buffer_byte_length, buffer);
  data += view_byte_offset;

  int32_t result = websg_node_set_local_matrix(node_id, (float_t *)data);

  if (result == -1) {
    JS_ThrowInternalError(ctx, "WebSG: Error setting localMatrix.");
    return JS_EXCEPTION;
  }

  return JS_DupValue(ctx, argv[1]);
}

static JSValue js_node_get_world_matrix(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  node_id_t node_id;

  if (JS_ToUint32(ctx, &node_id, argv[0]) == -1) {
    return JS_EXCEPTION;
  }

  size_t view_byte_offset;
  size_t view_byte_length;
  size_t view_bytes_per_element;

  JSValue buffer = JS_GetTypedArrayBuffer(ctx, argv[1], &view_byte_offset, &view_byte_length, &view_bytes_per_element);

  if (JS_IsException(buffer)) {
    return JS_EXCEPTION;
  }

  if (view_byte_length < (sizeof(float_t) * 16)) {
    JS_ThrowRangeError(ctx, "WebSG: Invalid typed array length.");
    return JS_EXCEPTION;
  }

  size_t buffer_byte_length;
  uint8_t *data = JS_GetArrayBuffer(ctx, &buffer_byte_length, buffer);
  data += view_byte_offset;

  int32_t result = websg_node_get_world_matrix(node_id, (float_t *)data);

  if (result == -1) {
    JS_ThrowInternalError(ctx, "WebSG: Error getting worldMatrix.");
    return JS_EXCEPTION;
  }

  return JS_DupValue(ctx, argv[1]);
}

static JSValue js_node_get_visible(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  node_id_t node_id;

  if (JS_ToUint32(ctx, &node_id, argv[0]) == -1) {
    return JS_EXCEPTION;
  }

  int32_t result = websg_node_get_visible(node_id);

  return JS_NewBool(ctx, result);
}

static JSValue js_node_set_visible(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  node_id_t node_id;

  if (JS_ToUint32(ctx, &node_id, argv[0]) == -1) {
    return JS_EXCEPTION;
  }

  int32_t value = JS_ToBool(ctx, argv[1]);

  int32_t result = websg_node_set_visible(node_id, value);

  if (result == -1) {
    JS_ThrowInternalError(ctx, "WebSG: Error setting visible.");
    return JS_EXCEPTION;
  }

  return JS_UNDEFINED;
}

static JSValue js_node_get_is_static(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  node_id_t node_id;

  if (JS_ToUint32(ctx, &node_id, argv[0]) == -1) {
    return JS_EXCEPTION;
  }

  int32_t result = websg_node_get_is_static(node_id);

  return JS_NewBool(ctx, result);
}

static JSValue js_node_set_is_static(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  node_id_t node_id;

  if (JS_ToUint32(ctx, &node_id, argv[0]) == -1) {
    return JS_EXCEPTION;
  }

  int32_t value = JS_ToBool(ctx, argv[1]);

  int32_t result = websg_node_set_is_static(node_id, value);

  if (result == -1) {
    JS_ThrowInternalError(ctx, "WebSG: Error setting isStatic.");
    return JS_EXCEPTION;
  }

  return JS_UNDEFINED;
}

static JSValue js_node_get_mesh(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  node_id_t node_id;

  if (JS_ToUint32(ctx, &node_id, argv[0]) == -1) {
    return JS_EXCEPTION;
  }

  mesh_id_t mesh_id = websg_node_get_mesh(node_id);

  if (mesh_id == 0) {
    return JS_UNDEFINED;
  }

  return JS_NewUint32(ctx, mesh_id);
}

static JSValue js_node_set_mesh(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  node_id_t node_id;

  if (JS_ToUint32(ctx, &node_id, argv[0]) == -1) {
    return JS_EXCEPTION;
  }

  mesh_id_t mesh_id;

  if (JS_ToUint32(ctx, &mesh_id, argv[1]) == -1) {
    return JS_EXCEPTION;
  }

  int32_t result = websg_node_set_mesh(node_id, mesh_id);

  if (result == -1) {
    JS_ThrowInternalError(ctx, "WebSG: Error setting mesh.");
    return JS_EXCEPTION;
  }

  return JS_UNDEFINED;
}

static JSValue js_node_get_light(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  node_id_t node_id;

  if (JS_ToUint32(ctx, &node_id, argv[0]) == -1) {
    return JS_EXCEPTION;
  }

  light_id_t light_id = websg_node_get_light(node_id);

  if (light_id == 0) {
    return JS_UNDEFINED;
  }

  return JS_NewUint32(ctx, light_id);
}

static JSValue js_node_set_light(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  node_id_t node_id;

  if (JS_ToUint32(ctx, &node_id, argv[0]) == -1) {
    return JS_EXCEPTION;
  }

  light_id_t light_id;

  if (JS_ToUint32(ctx, &light_id, argv[1]) == -1) {
    return JS_EXCEPTION;
  }

  int32_t result = websg_node_set_light(node_id, light_id);

  if (result == -1) {
    JS_ThrowInternalError(ctx, "WebSG: Error setting light.");
    return JS_EXCEPTION;
  }

  return JS_UNDEFINED;
}

JSAtom POSITION;
JSAtom NORMAL;
JSAtom TANGENT;
JSAtom TEXCOORD_0;
JSAtom TEXCOORD_1;
JSAtom COLOR_0;
JSAtom JOINTS_0;
JSAtom WEIGHTS_0;

MeshPrimitiveAttribute get_primitive_attribute_from_atom(JSAtom atom) {
  if (atom == POSITION) {
    return MeshPrimitiveAttribute_POSITION;
  } else if (atom == NORMAL) {
    return MeshPrimitiveAttribute_NORMAL;
  } else if (atom == TANGENT) {
    return MeshPrimitiveAttribute_TANGENT;
  } else if (atom == TEXCOORD_0) {
    return MeshPrimitiveAttribute_TEXCOORD_0;
  } else if (atom == TEXCOORD_1) {
    return MeshPrimitiveAttribute_TEXCOORD_1;
  } else if (atom == COLOR_0) {
    return MeshPrimitiveAttribute_COLOR_0;
  } else if (atom == JOINTS_0) {
    return MeshPrimitiveAttribute_JOINTS_0;
  } else if (atom == WEIGHTS_0) {
    return MeshPrimitiveAttribute_WEIGHTS_0;
  } else {
    return -1;
  }
}

static JSValue js_create_mesh(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  JSValue lengthVal = JS_GetPropertyStr(ctx, argv[0], "length");

  if (JS_IsException(lengthVal)) {
    return JS_EXCEPTION;
  }

  uint32_t count = 0;

  if (JS_ToUint32(ctx, &count, lengthVal) == -1) {
    return JS_EXCEPTION;
  }

  JSValue primitives_arr = argv[0];
  MeshPrimitiveProps *primitives = js_mallocz(ctx, sizeof(MeshPrimitiveProps) * count);

  for (int i = 0; i < count; i++) {
    JSValue primitive_obj = JS_GetPropertyUint32(ctx, primitives_arr, i);

    MeshPrimitiveProps *props = &primitives[i];

    JSValue modeVal = JS_GetPropertyStr(ctx, primitive_obj, "mode");

    uint32_t mode;

    if (!JS_IsUndefined(modeVal)) {
      if (JS_ToUint32(ctx, &mode, modeVal) == -1) {
        return JS_EXCEPTION;
      }

      props->mode = (MeshPrimitiveMode)mode;
    } else {
      props->mode = MeshPrimitiveMode_TRIANGLES;
    }

    JSValue indicesVal = JS_GetPropertyStr(ctx, primitive_obj, "indices");

    if (!JS_IsUndefined(indicesVal)) {
      if (JS_ToUint32(ctx, &props->indices, indicesVal) == -1) {
        return JS_EXCEPTION;
      }
    }

    JSValue materialVal = JS_GetPropertyStr(ctx, primitive_obj, "material");

    if (!JS_IsUndefined(materialVal)) {
      if (JS_ToUint32(ctx, &props->material, materialVal) == -1) {
        return JS_EXCEPTION;
      }
    }

    JSValue attributes_obj = JS_GetPropertyStr(ctx, primitive_obj, "attributes");

    if (!JS_IsUndefined(attributes_obj)) {
      JSPropertyEnum *attribute_props;
      uint32_t attribute_count;

      if (
        JS_GetOwnPropertyNames(
          ctx,
          &attribute_props,
          &attribute_count,
          attributes_obj,
          JS_GPN_STRING_MASK | JS_GPN_ENUM_ONLY
        )
      ) {
        return JS_EXCEPTION;
      }

      MeshPrimitiveAttributeItem *attributes = js_mallocz(ctx, sizeof(MeshPrimitiveAttributeItem) * attribute_count);

      for(i = 0; i < attribute_count; i++) {
        JSAtom prop_name_atom = attribute_props[i].atom;
        MeshPrimitiveAttributeItem* attribute = &attributes[i];
        attribute->key = get_primitive_attribute_from_atom(prop_name_atom);
        JSValue attribute_prop = JS_GetProperty(ctx, attributes_obj, prop_name_atom);

        if (JS_ToUint32(ctx, &attribute->accessor_id, attribute_prop) == -1) {
          return JS_EXCEPTION;
        }
      }

      props->attribute_count = attribute_count;
      props->attributes = attributes;

      for(uint32_t i = 0; i < attribute_count; i++) {
        JS_FreeAtom(ctx, attribute_props[i].atom);
      }

      js_free(ctx, attribute_props);
    }
  }

  mesh_id_t mesh_id = websg_create_mesh(primitives, count);

  if (mesh_id == 0) {
    JS_ThrowInternalError(ctx, "WebSG: Couldn't create mesh.");
    return JS_EXCEPTION;
  }

  return JS_NewUint32(ctx, mesh_id);
}

static JSValue js_mesh_find_by_name(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {

  size_t length;
  const char* name = JS_ToCStringLen(ctx, &length, argv[0]);

  if (name == NULL) {
    return JS_EXCEPTION;
  }

  mesh_id_t mesh_id = websg_mesh_find_by_name(name, length);

  if (mesh_id == 0) {
    return JS_UNDEFINED;
  }

  return JS_NewUint32(ctx, mesh_id);
}

static JSValue js_mesh_get_primitive_count(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  mesh_id_t mesh_id;

  if (JS_ToUint32(ctx, &mesh_id, argv[0]) == -1) {
    return JS_EXCEPTION;
  }

  int32_t count = websg_mesh_get_primitive_count(mesh_id);

  if (count < 0) {
    JS_ThrowInternalError(ctx, "WebSG: Couldn't get primitive count.");
    return JS_EXCEPTION;
  }

  return JS_NewInt32(ctx, count);
}

static JSValue js_mesh_get_primitive_attribute(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  mesh_id_t mesh_id;

  if (JS_ToUint32(ctx, &mesh_id, argv[0]) == -1) {
    return JS_EXCEPTION;
  }

  uint32_t index;

  if (JS_ToUint32(ctx, &index, argv[1]) == -1) {
    return JS_EXCEPTION;
  }

  JSAtom attribute_atom = JS_ValueToAtom(ctx, argv[2]);

  if (attribute_atom == JS_ATOM_NULL) {
    JS_ThrowTypeError(ctx, "WebSG: invalid attribute type.");
    return JS_EXCEPTION;
  }

  MeshPrimitiveAttribute attribute = get_primitive_attribute_from_atom(attribute_atom);

  accessor_id_t accessor_id = websg_mesh_get_primitive_attribute(mesh_id, index, attribute);

  if (accessor_id == 0) {
    return JS_UNDEFINED;
  }

  return JS_NewUint32(ctx, accessor_id);
}

static JSValue js_mesh_get_primitive_indices(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  mesh_id_t mesh_id;

  if (JS_ToUint32(ctx, &mesh_id, argv[0]) == -1) {
    return JS_EXCEPTION;
  }

  uint32_t index;

  if (JS_ToUint32(ctx, &index, argv[1]) == -1) {
    return JS_EXCEPTION;
  }

  accessor_id_t accessor_id = websg_mesh_get_primitive_indices(mesh_id, index);

  if (accessor_id == 0) {
    return JS_UNDEFINED;
  }

  return JS_NewUint32(ctx, accessor_id);
}

static JSValue js_mesh_get_primitive_material(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  mesh_id_t mesh_id;

  if (JS_ToUint32(ctx, &mesh_id, argv[0]) == -1) {
    return JS_EXCEPTION;
  }

  uint32_t index;

  if (JS_ToUint32(ctx, &index, argv[1]) == -1) {
    return JS_EXCEPTION;
  }

  material_id_t material_id = websg_mesh_get_primitive_material(mesh_id, index);

  if (material_id == 0) {
    return JS_UNDEFINED;
  }

  return JS_NewUint32(ctx, material_id);
}

static JSValue js_mesh_get_primitive_mode(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  mesh_id_t mesh_id;

  if (JS_ToUint32(ctx, &mesh_id, argv[0]) == -1) {
    return JS_EXCEPTION;
  }

  uint32_t index;

  if (JS_ToUint32(ctx, &index, argv[1]) == -1) {
    return JS_EXCEPTION;
  }

  MeshPrimitiveMode mode = websg_mesh_get_primitive_mode(mesh_id, index);

  return JS_NewUint32(ctx, mode);
}

static JSValue js_mesh_set_primitive_draw_range(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  mesh_id_t mesh_id;

  if (JS_ToUint32(ctx, &mesh_id, argv[0]) == -1) {
    return JS_EXCEPTION;
  }

  uint32_t index;

  if (JS_ToUint32(ctx, &index, argv[1]) == -1) {
    return JS_EXCEPTION;
  }

  uint32_t start;

  if (JS_ToUint32(ctx, &start, argv[2]) == -1) {
    return JS_EXCEPTION;
  }

  uint32_t count;

  if (JS_ToUint32(ctx, &count, argv[3]) == -1) {
    return JS_EXCEPTION;
  }

  int32_t result = websg_mesh_set_primitive_draw_range(mesh_id, index, start, count);

  if (result == -1) {
    JS_ThrowInternalError(ctx, "WebSG: Error setting draw range.");
    return JS_EXCEPTION;
  }

  return JS_UNDEFINED;
}

JSAtom SCALAR;
JSAtom VEC2;
JSAtom VEC3;
JSAtom VEC4;
JSAtom MAT2;
JSAtom MAT3;
JSAtom MAT4;

AccessorType get_accessor_type_from_atom(JSAtom atom) {
  if (atom == SCALAR) {
    return AccessorType_SCALAR;
  } else if (atom == VEC2) {
    return AccessorType_VEC2;
  } else if (atom == VEC3) {
    return AccessorType_VEC3;
  } else if (atom == VEC4) {
    return AccessorType_VEC4;
  } else if (atom == MAT2) {
    return AccessorType_MAT2;
  } else if (atom == MAT3) {
    return AccessorType_MAT3;
  } else if (atom == MAT4) {
    return AccessorType_MAT4;
  } else {
    return -1;
  }
}

static JSValue js_create_accessor_from(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  size_t buffer_byte_length;
  uint8_t *data = JS_GetArrayBuffer(ctx, &buffer_byte_length, argv[0]);

  if (data == NULL) {
    return JS_EXCEPTION;
  }

  JSValue props_obj = argv[1];

  AccessorProps *props = js_malloc(ctx, sizeof(AccessorProps));

  JSValue type_val = JS_GetPropertyStr(ctx, props_obj, "type");

  if (JS_IsUndefined(type_val)) {
    JS_ThrowTypeError(ctx, "WebSG: Missing accessor type.");
    return JS_EXCEPTION;
  }

  AccessorType type = get_accessor_type_from_atom(JS_ValueToAtom(ctx, type_val));

  if (type == -1) {
    JS_ThrowTypeError(ctx, "WebSG: Invalid component type.");
    return JS_EXCEPTION;
  }

  props->type = type;

  JSValue component_type_val = JS_GetPropertyStr(ctx, props_obj, "componentType");

  if (JS_IsUndefined(component_type_val)) {
    JS_ThrowTypeError(ctx, "WebSG: Missing component type.");
    return JS_EXCEPTION;
  }

  uint32_t component_type;

  if (JS_ToUint32(ctx, &component_type, component_type_val) < 0) {
    return JS_EXCEPTION;
  }

  props->component_type = component_type;

  JSValue countVal = JS_GetPropertyStr(ctx, props_obj, "count");

  if (JS_IsUndefined(countVal)) {
    JS_ThrowTypeError(ctx, "WebSG: Missing accessor count.");
    return JS_EXCEPTION;
  }

  uint32_t count;

  if (JS_ToUint32(ctx, &count, countVal) < 0) {
    return JS_EXCEPTION;
  }

  props->count = count;

  JSValue normalized_val = JS_GetPropertyStr(ctx, props_obj, "normalized");

  if (!JS_IsUndefined(normalized_val)) {
    int normalized = JS_ToBool(ctx, normalized_val);

    if (normalized < 0) {
      return JS_EXCEPTION;
    }

    props->normalized = normalized;
  }

  JSValue dynamic_val = JS_GetPropertyStr(ctx, props_obj, "dynamic");

  if (!JS_IsUndefined(dynamic_val)) {
    int dynamic = JS_ToBool(ctx, dynamic_val);

    if (dynamic < 0) {
      return JS_EXCEPTION;
    }

    props->dynamic = dynamic;
  }

  accessor_id_t accessor_id = websg_create_accessor_from(data, buffer_byte_length, props);

  if (accessor_id == 0) {
    JS_ThrowInternalError(ctx, "WebSG: Couldn't create accessor.");
    return JS_EXCEPTION;
  }

  return JS_NewUint32(ctx, accessor_id);
}

static JSValue js_accessor_find_by_name(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {

  size_t length;
  const char* name = JS_ToCStringLen(ctx, &length, argv[0]);

  if (name == NULL) {
    return JS_EXCEPTION;
  }

  accessor_id_t accessor_id = websg_accessor_find_by_name(name, length);

  if (accessor_id == 0) {
    return JS_UNDEFINED;
  }

  return JS_NewUint32(ctx, accessor_id);
}

static JSValue js_accessor_update_with(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  accessor_id_t accessor_id;

  if (JS_ToUint32(ctx, &accessor_id, argv[0]) == -1) {
    return JS_EXCEPTION;
  }

  size_t buffer_byte_length;
  uint8_t *data = JS_GetArrayBuffer(ctx, &buffer_byte_length, argv[1]);

  if (data == NULL) {
    return JS_EXCEPTION;
  }

  int32_t result = websg_accessor_update_with(accessor_id, data, buffer_byte_length);

  if (result < 0) {
    JS_ThrowInternalError(ctx, "WebSG: Couldn't update accessor.");
    return JS_EXCEPTION;
  }

  return JS_UNDEFINED;
}

JSAtom standard;
JSAtom unlit;

MaterialType get_material_type_from_atom(JSAtom atom) {
  if (atom == standard) {
    return MaterialType_Standard;
  } else if (atom == unlit) {
    return MaterialType_Unlit;
  } else {
    return -1;
  }
}

static JSValue js_create_material(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  MaterialType material_type;
  
  if (JS_IsUndefined(argv[0])) {
    material_type = MaterialType_Standard;
  } else {
    material_type = get_material_type_from_atom(JS_ValueToAtom(ctx, argv[0]));
  }

  if (material_type == -1) {
    JS_ThrowTypeError(ctx, "WebSG: Unknown material type.");
    return JS_EXCEPTION;
  }

  material_id_t material_id = websg_create_material(material_type);

  if (material_id == 0) {
    JS_ThrowInternalError(ctx, "WebSG: Couldn't create material.");
    return JS_EXCEPTION;
  }

  return JS_NewUint32(ctx, material_id);
}

static JSValue js_material_find_by_name(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {

  size_t length;
  const char* name = JS_ToCStringLen(ctx, &length, argv[0]);

  if (name == NULL) {
    return JS_EXCEPTION;
  }

  material_id_t material_id = websg_material_find_by_name(name, length);

  if (material_id == 0) {
    return JS_UNDEFINED;
  }

  return JS_NewUint32(ctx, material_id);
}

static JSValue js_material_get_base_color_factor(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  material_id_t material_id;

  if (JS_ToUint32(ctx, &material_id, argv[0]) == -1) {
    return JS_EXCEPTION;
  }

  size_t view_byte_offset;
  size_t view_byte_length;
  size_t view_bytes_per_element;

  JSValue buffer = JS_GetTypedArrayBuffer(ctx, argv[1], &view_byte_offset, &view_byte_length, &view_bytes_per_element);

  if (JS_IsException(buffer)) {
    return JS_EXCEPTION;
  }

  if (view_byte_length < (sizeof(float_t) * 4)) {
    JS_ThrowRangeError(ctx, "WebSG: Invalid typed array length.");
    return JS_EXCEPTION;
  }

  size_t buffer_byte_length;
  uint8_t *data = JS_GetArrayBuffer(ctx, &buffer_byte_length, buffer);
  data += view_byte_offset;

  int32_t result = websg_material_get_base_color_factor(material_id, (float_t *)data);

  if (result == -1) {
    JS_ThrowInternalError(ctx, "WebSG: Error getting baseColorFactor.");
    return JS_EXCEPTION;
  }

  return JS_DupValue(ctx, argv[1]);
}

static JSValue js_material_set_base_color_factor(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  material_id_t material_id;

  if (JS_ToUint32(ctx, &material_id, argv[0]) == -1) {
    return JS_EXCEPTION;
  }

  size_t view_byte_offset;
  size_t view_byte_length;
  size_t view_bytes_per_element;

  JSValue buffer = JS_GetTypedArrayBuffer(ctx, argv[1], &view_byte_offset, &view_byte_length, &view_bytes_per_element);

  if (JS_IsException(buffer)) {
    return JS_EXCEPTION;
  }

  if (view_byte_length < (sizeof(float_t) * 4)) {
    JS_ThrowRangeError(ctx, "WebSG: Invalid typed array length.");
    return JS_EXCEPTION;
  }

  size_t buffer_byte_length;
  uint8_t *data = JS_GetArrayBuffer(ctx, &buffer_byte_length, buffer);
  data += view_byte_offset;

  int32_t result = websg_material_set_base_color_factor(material_id, (float_t *)data);

  if (result == -1) {
    JS_ThrowInternalError(ctx, "WebSG: Error setting baseColorFactor.");
    return JS_EXCEPTION;
  }

  return JS_DupValue(ctx, argv[1]);
}

static JSValue js_material_get_metallic_factor(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  material_id_t material_id;

  if (JS_ToUint32(ctx, &material_id, argv[0]) == -1) {
    return JS_EXCEPTION;
  }

  float_t result = websg_material_get_metallic_factor(material_id);

  return JS_NewFloat64(ctx, result);
}

static JSValue js_material_set_metallic_factor(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  material_id_t material_id;

  if (JS_ToUint32(ctx, &material_id, argv[0]) == -1) {
    return JS_EXCEPTION;
  }

  double_t value;

  if (JS_ToFloat64(ctx, &value, argv[1]) == -1) {
    return JS_EXCEPTION;
  }

  int32_t result = websg_material_set_metallic_factor(material_id, (float_t)value);

  if (result == -1) {
    JS_ThrowInternalError(ctx, "WebSG: Error setting metallicFactor.");
    return JS_EXCEPTION;
  }

  return JS_UNDEFINED;
}

static JSValue js_material_get_roughness_factor(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  material_id_t material_id;

  if (JS_ToUint32(ctx, &material_id, argv[0]) == -1) {
    return JS_EXCEPTION;
  }

  float_t result = websg_material_get_roughness_factor(material_id);

  return JS_NewFloat64(ctx, result);
}

static JSValue js_material_set_roughness_factor(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  material_id_t material_id;

  if (JS_ToUint32(ctx, &material_id, argv[0]) == -1) {
    return JS_EXCEPTION;
  }

  double_t value;

  if (JS_ToFloat64(ctx, &value, argv[1]) == -1) {
    return JS_EXCEPTION;
  }

  int32_t result = websg_material_set_roughness_factor(material_id, (float_t)value);

  if (result == -1) {
    JS_ThrowInternalError(ctx, "WebSG: Error setting roughnessFactor.");
    return JS_EXCEPTION;
  }

  return JS_UNDEFINED;
}

static JSValue js_material_get_emissive_factor(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  material_id_t material_id;

  if (JS_ToUint32(ctx, &material_id, argv[0]) == -1) {
    return JS_EXCEPTION;
  }

  size_t view_byte_offset;
  size_t view_byte_length;
  size_t view_bytes_per_element;

  JSValue buffer = JS_GetTypedArrayBuffer(ctx, argv[1], &view_byte_offset, &view_byte_length, &view_bytes_per_element);

  if (JS_IsException(buffer)) {
    return JS_EXCEPTION;
  }

  if (view_byte_length < (sizeof(float_t) * 3)) {
    JS_ThrowRangeError(ctx, "WebSG: Invalid typed array length.");
    return JS_EXCEPTION;
  }

  size_t buffer_byte_length;
  uint8_t *data = JS_GetArrayBuffer(ctx, &buffer_byte_length, buffer);
  data += view_byte_offset;

  int32_t result = websg_material_get_emissive_factor(material_id, (float_t *)data);

  if (result == -1) {
    JS_ThrowInternalError(ctx, "WebSG: Error getting emissiveFactor.");
    return JS_EXCEPTION;
  }

  return JS_DupValue(ctx, argv[1]);
}

static JSValue js_material_set_emissive_factor(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  material_id_t material_id;

  if (JS_ToUint32(ctx, &material_id, argv[0]) == -1) {
    return JS_EXCEPTION;
  }

  size_t view_byte_offset;
  size_t view_byte_length;
  size_t view_bytes_per_element;

  JSValue buffer = JS_GetTypedArrayBuffer(ctx, argv[1], &view_byte_offset, &view_byte_length, &view_bytes_per_element);

  if (JS_IsException(buffer)) {
    return JS_EXCEPTION;
  }

  if (view_byte_length < (sizeof(float_t) * 3)) {
    JS_ThrowRangeError(ctx, "WebSG: Invalid typed array length.");
    return JS_EXCEPTION;
  }

  size_t buffer_byte_length;
  uint8_t *data = JS_GetArrayBuffer(ctx, &buffer_byte_length, buffer);
  data += view_byte_offset;

  int32_t result = websg_material_set_emissive_factor(material_id, (float_t *)data);

  if (result == -1) {
    JS_ThrowInternalError(ctx, "WebSG: Error setting emissiveFactor.");
    return JS_EXCEPTION;
  }

  return JS_DupValue(ctx, argv[1]);
}

static JSValue js_material_get_base_color_texture(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  material_id_t material_id;

  if (JS_ToUint32(ctx, &material_id, argv[0]) == -1) {
    return JS_EXCEPTION;
  }

  texture_id_t texture_id = websg_material_get_base_color_texture(material_id);

  if (texture_id == 0) {
    return JS_UNDEFINED;
  }

  return JS_NewUint32(ctx, texture_id);
}

static JSValue js_material_set_base_color_texture(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  material_id_t material_id;

  if (JS_ToUint32(ctx, &material_id, argv[0]) == -1) {
    return JS_EXCEPTION;
  }

  texture_id_t texture_id;

  if (JS_ToUint32(ctx, &texture_id, argv[1]) == -1) {
    return JS_EXCEPTION;
  }

  int32_t result = websg_material_set_base_color_texture(material_id, texture_id);

  if (result == -1) {
    JS_ThrowInternalError(ctx, "WebSG: Error setting texture.");
    return JS_EXCEPTION;
  }

  return JS_UNDEFINED;
}

JSAtom directional;
JSAtom point;
JSAtom spot;

LightType get_light_type_from_atom(JSAtom atom) {
  if (atom == directional) {
    return LightType_Directional;
  } else if (atom == point) {
    return LightType_Point;
  } else if (atom == spot) {
    return LightType_Spot;
  } else {
    return -1;
  }
}

static JSValue js_create_light(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  LightType light_type = get_light_type_from_atom(JS_ValueToAtom(ctx, argv[0]));

  if (light_type == -1) {
    JS_ThrowTypeError(ctx, "WebSG: Unknown light type.");
    return JS_EXCEPTION;
  }

  light_id_t light_id = websg_create_light(light_type);

  if (light_id == 0) {
    JS_ThrowInternalError(ctx, "WebSG: Couldn't create light.");
    return JS_EXCEPTION;
  }

  return JS_NewUint32(ctx, light_id);
}

static JSValue js_light_get_color(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  light_id_t light_id;

  if (JS_ToUint32(ctx, &light_id, argv[0]) == -1) {
    return JS_EXCEPTION;
  }

  size_t view_byte_offset;
  size_t view_byte_length;
  size_t view_bytes_per_element;

  JSValue buffer = JS_GetTypedArrayBuffer(ctx, argv[1], &view_byte_offset, &view_byte_length, &view_bytes_per_element);

  if (JS_IsException(buffer)) {
    return JS_EXCEPTION;
  }

  if (view_byte_length < (sizeof(float_t) * 3)) {
    JS_ThrowRangeError(ctx, "WebSG: Invalid typed array length.");
    return JS_EXCEPTION;
  }

  size_t buffer_byte_length;
  uint8_t *data = JS_GetArrayBuffer(ctx, &buffer_byte_length, buffer);
  data += view_byte_offset;

  int32_t result = websg_light_get_color(light_id, (float_t *)data);

  if (result == -1) {
    JS_ThrowInternalError(ctx, "WebSG: Error getting color.");
    return JS_EXCEPTION;
  }

  return JS_DupValue(ctx, argv[1]);
}

static JSValue js_light_set_color(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  light_id_t light_id;

  if (JS_ToUint32(ctx, &light_id, argv[0]) == -1) {
    return JS_EXCEPTION;
  }

  size_t view_byte_offset;
  size_t view_byte_length;
  size_t view_bytes_per_element;

  JSValue buffer = JS_GetTypedArrayBuffer(ctx, argv[1], &view_byte_offset, &view_byte_length, &view_bytes_per_element);

  if (JS_IsException(buffer)) {
    return JS_EXCEPTION;
  }

  if (view_byte_length < (sizeof(float_t) * 3)) {
    JS_ThrowRangeError(ctx, "WebSG: Invalid typed array length.");
    return JS_EXCEPTION;
  }

  size_t buffer_byte_length;
  uint8_t *data = JS_GetArrayBuffer(ctx, &buffer_byte_length, buffer);
  data += view_byte_offset;

  int32_t result = websg_light_set_color(light_id, (float_t *)data);

  if (result == -1) {
    JS_ThrowInternalError(ctx, "WebSG: Error setting color.");
    return JS_EXCEPTION;
  }

  return JS_DupValue(ctx, argv[1]);
}

static JSValue js_light_get_intensity(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  light_id_t light_id;

  if (JS_ToUint32(ctx, &light_id, argv[0]) == -1) {
    return JS_EXCEPTION;
  }

  float_t result = websg_light_get_intensity(light_id);

  return JS_NewFloat64(ctx, result);
}

static JSValue js_light_set_intensity(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  light_id_t light_id;

  if (JS_ToUint32(ctx, &light_id, argv[0]) == -1) {
    return JS_EXCEPTION;
  }

  double_t value;

  if (JS_ToFloat64(ctx, &value, argv[1]) == -1) {
    return JS_EXCEPTION;
  }

  int32_t result = websg_light_set_intensity(light_id, (float_t)value);

  if (result == -1) {
    JS_ThrowInternalError(ctx, "WebSG: Error setting intensity.");
    return JS_EXCEPTION;
  }

  return JS_UNDEFINED;
}

static JSValue js_add_interactable(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  node_id_t node_id;

  if (JS_ToUint32(ctx, &node_id, argv[0]) == -1) {
    return JS_EXCEPTION;
  }

  // TODO: Add more types of interactables and make the interactable type optional with this as the default
  int32_t result = websg_add_interactable(node_id, InteractableType_Interactable);

  if (result == -1) {
    JS_ThrowInternalError(ctx, "WebSG: Error adding interactable.");
    return JS_EXCEPTION;
  }

  return JS_UNDEFINED;
}

static JSValue js_remove_interactable(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  node_id_t node_id;

  if (JS_ToUint32(ctx, &node_id, argv[0]) == -1) {
    return JS_EXCEPTION;
  }

  int32_t result = websg_remove_interactable(node_id);

  if (result == -1) {
    JS_ThrowInternalError(ctx, "WebSG: Error removing interactable.");
    return JS_EXCEPTION;
  }

  return JS_UNDEFINED;
}

static JSValue js_has_interactable(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  node_id_t node_id;

  if (JS_ToUint32(ctx, &node_id, argv[0]) == -1) {
    return JS_EXCEPTION;
  }

  int32_t result = websg_has_interactable(node_id);

  if (result == -1) {
    JS_ThrowInternalError(ctx, "WebSG: Error checking for interactable.");
    return JS_EXCEPTION;
  }

  return JS_NewBool(ctx, result);
}

static JSValue js_get_interactable_pressed(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  node_id_t node_id;

  if (JS_ToUint32(ctx, &node_id, argv[0]) == -1) {
    return JS_EXCEPTION;
  }

  int32_t result = websg_get_interactable_pressed(node_id);

  if (result == -1) {
    JS_ThrowInternalError(ctx, "WebSG: Error getting interactable pressed state.");
    return JS_EXCEPTION;
  }

  return JS_NewBool(ctx, result);
}

static JSValue js_get_interactable_held(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  node_id_t node_id;

  if (JS_ToUint32(ctx, &node_id, argv[0]) == -1) {
    return JS_EXCEPTION;
  }

  int32_t result = websg_get_interactable_held(node_id);

  if (result == -1) {
    JS_ThrowInternalError(ctx, "WebSG: Error getting interactable held state.");
    return JS_EXCEPTION;
  }

  return JS_NewBool(ctx, result);
}

static JSValue js_get_interactable_released(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  node_id_t node_id;

  if (JS_ToUint32(ctx, &node_id, argv[0]) == -1) {
    return JS_EXCEPTION;
  }

  int32_t result = websg_get_interactable_released(node_id);

  if (result == -1) {
    JS_ThrowInternalError(ctx, "WebSG: Error getting interactable released state.");
    return JS_EXCEPTION;
  }

  return JS_NewBool(ctx, result);
}

void js_define_websg_api(JSContext *ctx, JSValue *target) {
  JSValue websg = JS_NewObject(ctx);

  // Environment
  JS_SetPropertyStr(
    ctx,
    websg,
    "getEnvironmentScene",
    JS_NewCFunction(ctx, js_get_environment_scene, "getEnvironmentScene", 0)
  );
  JS_SetPropertyStr(
    ctx,
    websg,
    "setEnvironmentScene",
    JS_NewCFunction(ctx, js_set_environment_scene, "setEnvironmentScene", 1)
  );

  // Scene
  JS_SetPropertyStr(
    ctx,
    websg,
    "createScene",
    JS_NewCFunction(ctx, js_create_scene, "createScene", 0)
  );
  JS_SetPropertyStr(
    ctx,
    websg,
    "sceneFindByName",
    JS_NewCFunction(ctx, js_scene_find_by_name, "sceneFindByName", 1)
  );
  JS_SetPropertyStr(
    ctx,
    websg,
    "sceneAddNode",
    JS_NewCFunction(ctx, js_scene_add_node, "sceneAddNode", 2)
  );
  JS_SetPropertyStr(
    ctx,
    websg,
    "sceneRemoveNode",
    JS_NewCFunction(ctx, js_scene_remove_node, "sceneRemoveNode", 2)
  );
  JS_SetPropertyStr(
    ctx,
    websg,
    "sceneGetNodes",
    JS_NewCFunction(ctx, js_scene_get_nodes, "sceneGetNodes", 1)
  );
  JS_SetPropertyStr(
    ctx,
    websg,
    "sceneGetNode",
    JS_NewCFunction(ctx, js_scene_get_node, "sceneGetNode", 2)
  );

  // Node
  JS_SetPropertyStr(
    ctx,
    websg,
    "createNode",
    JS_NewCFunction(ctx, js_create_node, "createNode", 0)
  );
  JS_SetPropertyStr(
    ctx,
    websg,
    "nodeFindByName",
    JS_NewCFunction(ctx, js_node_find_by_name, "nodeFindByName", 1)
  );
  JS_SetPropertyStr(
    ctx,
    websg,
    "nodeAddChild",
    JS_NewCFunction(ctx, js_node_add_child, "nodeAddChild", 2)
  );
  JS_SetPropertyStr(
    ctx,
    websg,
    "nodeRemoveChild",
    JS_NewCFunction(ctx, js_node_remove_child, "nodeRemoveChild", 2)
  );
  JS_SetPropertyStr(
    ctx,
    websg,
    "nodeGetChildren",
    JS_NewCFunction(ctx, js_node_get_children, "nodeGetChildren", 1)
  );
  JS_SetPropertyStr(
    ctx,
    websg,
    "nodeGetChild",
    JS_NewCFunction(ctx, js_node_get_child, "nodeGetChild", 2)
  );
  JS_SetPropertyStr(
    ctx,
    websg,
    "nodeGetParent",
    JS_NewCFunction(ctx, js_node_get_parent, "nodeGetParent", 1)
  );
  JS_SetPropertyStr(
    ctx,
    websg,
    "nodeGetParentScene",
    JS_NewCFunction(ctx, js_node_get_parent_scene, "nodeGetParentScene", 1)
  );
  JS_SetPropertyStr(
    ctx,
    websg,
    "nodeGetPosition",
    JS_NewCFunction(ctx, js_node_get_position, "nodeGetPosition", 2)
  );
  JS_SetPropertyStr(
    ctx,
    websg,
    "nodeSetPosition",
    JS_NewCFunction(ctx, js_node_set_position, "nodeSetPosition", 2)
  );
  JS_SetPropertyStr(
    ctx,
    websg,
    "nodeGetQuaternion",
    JS_NewCFunction(ctx, js_node_get_quaternion, "nodeGetQuaternion", 2)
  );
  JS_SetPropertyStr(
    ctx,
    websg,
    "nodeSetQuaternion",
    JS_NewCFunction(ctx, js_node_set_quaternion, "nodeSetQuaternion", 2)
  );
  JS_SetPropertyStr(
    ctx,
    websg,
    "nodeGetScale",
    JS_NewCFunction(ctx, js_node_get_scale, "nodeGetScale", 2)
  );
  JS_SetPropertyStr(
    ctx,
    websg,
    "nodeSetScale",
    JS_NewCFunction(ctx, js_node_set_scale, "nodeSetScale", 2)
  );
  JS_SetPropertyStr(
    ctx,
    websg,
    "nodeGetLocalMatrix",
    JS_NewCFunction(ctx, js_node_get_local_matrix, "nodeGetLocalMatrix", 2)
  );
  JS_SetPropertyStr(
    ctx,
    websg,
    "nodeSetLocalMatrix",
    JS_NewCFunction(ctx, js_node_set_local_matrix, "nodeSetLocalMatrix", 2)
  );
  JS_SetPropertyStr(
    ctx,
    websg,
    "nodeGetWorldMatrix",
    JS_NewCFunction(ctx, js_node_get_world_matrix, "nodeGetWorldMatrix", 2)
  );
  JS_SetPropertyStr(
    ctx,
    websg,
    "nodeGetVisible",
    JS_NewCFunction(ctx, js_node_get_visible, "nodeGetVisible", 1)
  );
  JS_SetPropertyStr(
    ctx,
    websg,
    "nodeSetVisible",
    JS_NewCFunction(ctx, js_node_set_visible, "nodeSetVisible", 2)
  );
  JS_SetPropertyStr(
    ctx,
    websg,
    "nodeGetIsStatic",
    JS_NewCFunction(ctx, js_node_get_is_static, "nodeGetIsStatic", 1)
  );
  JS_SetPropertyStr(
    ctx,
    websg,
    "nodeSetIsStatic",
    JS_NewCFunction(ctx, js_node_set_is_static, "nodeSetIsStatic", 2)
  );
  JS_SetPropertyStr(
    ctx,
    websg,
    "nodeGetMesh",
    JS_NewCFunction(ctx, js_node_get_mesh, "nodeGetMesh", 1)
  );
  JS_SetPropertyStr(
    ctx,
    websg,
    "nodeSetMesh",
    JS_NewCFunction(ctx, js_node_set_mesh, "nodeSetMesh", 2)
  );
  JS_SetPropertyStr(
    ctx,
    websg,
    "nodeGetLight",
    JS_NewCFunction(ctx, js_node_get_light, "nodeGetLight", 1)
  );
  JS_SetPropertyStr(
    ctx,
    websg,
    "nodeSetLight",
    JS_NewCFunction(ctx, js_node_set_light, "nodeSetLight", 2)
  );

  // Mesh

  POSITION = JS_NewAtom(ctx, "POSITION");
  NORMAL = JS_NewAtom(ctx, "NORMAL");
  TANGENT = JS_NewAtom(ctx, "TANGENT");
  TEXCOORD_0 = JS_NewAtom(ctx, "TEXCOORD_0");
  TEXCOORD_1 = JS_NewAtom(ctx, "TEXCOORD_1");
  COLOR_0 = JS_NewAtom(ctx, "COLOR_0");
  JOINTS_0 = JS_NewAtom(ctx, "JOINTS_0");
  WEIGHTS_0 = JS_NewAtom(ctx, "WEIGHTS_0");

  JSValue mesh_primitive_attribute = JS_NewObject(ctx);
  JS_SetProperty(ctx, mesh_primitive_attribute, POSITION, JS_AtomToValue(ctx, POSITION));
  JS_SetProperty(ctx, mesh_primitive_attribute, NORMAL, JS_AtomToValue(ctx, NORMAL));
  JS_SetProperty(ctx, mesh_primitive_attribute, TEXCOORD_0, JS_AtomToValue(ctx, TEXCOORD_0));
  JS_SetProperty(ctx, mesh_primitive_attribute, TEXCOORD_1, JS_AtomToValue(ctx, TEXCOORD_1));
  JS_SetProperty(ctx, mesh_primitive_attribute, COLOR_0, JS_AtomToValue(ctx, COLOR_0));
  JS_SetProperty(ctx, mesh_primitive_attribute, JOINTS_0, JS_AtomToValue(ctx, JOINTS_0));
  JS_SetProperty(ctx, mesh_primitive_attribute, WEIGHTS_0, JS_AtomToValue(ctx, WEIGHTS_0));
  JS_SetPropertyStr(ctx, websg, "MeshPrimitiveAttribute", mesh_primitive_attribute);

  JSValue mesh_primitive_mode = JS_NewObject(ctx);
  JS_SetPropertyStr(ctx, mesh_primitive_mode, "POINTS", JS_NewUint32(ctx, 0));
  JS_SetPropertyStr(ctx, mesh_primitive_mode, "LINES", JS_NewUint32(ctx, 1));
  JS_SetPropertyStr(ctx, mesh_primitive_mode, "LINE_LOOP", JS_NewUint32(ctx, 2));
  JS_SetPropertyStr(ctx, mesh_primitive_mode, "LINE_STRIP", JS_NewUint32(ctx, 3));
  JS_SetPropertyStr(ctx, mesh_primitive_mode, "TRIANGLES", JS_NewUint32(ctx, 4));
  JS_SetPropertyStr(ctx, mesh_primitive_mode, "TRIANGLE_STRIP", JS_NewUint32(ctx, 5));
  JS_SetPropertyStr(ctx, mesh_primitive_mode, "TRIANGLE_FAN", JS_NewUint32(ctx, 6));
  JS_SetPropertyStr(ctx, websg, "MeshPrimitiveMode", mesh_primitive_mode);

  JS_SetPropertyStr(
    ctx,
    websg,
    "createMesh",
    JS_NewCFunction(ctx, js_create_mesh, "createMesh", 1)
  );
  JS_SetPropertyStr(
    ctx,
    websg,
    "meshFindByName",
    JS_NewCFunction(ctx, js_mesh_find_by_name, "meshFindByName", 1)
  );
  JS_SetPropertyStr(
    ctx,
    websg,
    "meshGetPrimitiveCount",
    JS_NewCFunction(ctx, js_mesh_get_primitive_count, "meshGetPrimitiveCount", 1)
  );
  JS_SetPropertyStr(
    ctx,
    websg,
    "meshGetPrimitiveAttribute",
    JS_NewCFunction(ctx, js_mesh_get_primitive_attribute, "meshGetPrimitiveAttribute", 3)
  );
  JS_SetPropertyStr(
    ctx,
    websg,
    "meshGetPrimitiveIndices",
    JS_NewCFunction(ctx, js_mesh_get_primitive_indices, "meshGetPrimitiveIndices", 2)
  );
  JS_SetPropertyStr(
    ctx,
    websg,
    "meshGetPrimitiveMaterial",
    JS_NewCFunction(ctx, js_mesh_get_primitive_material, "meshGetPrimitiveMaterial", 2)
  );
  JS_SetPropertyStr(
    ctx,
    websg,
    "meshGetPrimitiveMode",
    JS_NewCFunction(ctx, js_mesh_get_primitive_mode, "meshGetPrimitiveMode", 2)
  );
  JS_SetPropertyStr(
    ctx,
    websg,
    "meshSetPrimitiveDrawRange",
    JS_NewCFunction(ctx, js_mesh_set_primitive_draw_range, "meshSetPrimitiveDrawRange", 4)
  );

  // Accessor

  SCALAR = JS_NewAtom(ctx, "SCALAR");
  VEC2 = JS_NewAtom(ctx, "VEC2");
  VEC3 = JS_NewAtom(ctx, "VEC3");
  VEC4 = JS_NewAtom(ctx, "VEC4");
  MAT2 = JS_NewAtom(ctx, "MAT2");
  MAT3 = JS_NewAtom(ctx, "MAT3");
  MAT4 = JS_NewAtom(ctx, "MAT4");

  JSValue accessor_type = JS_NewObject(ctx);
  JS_SetProperty(ctx, accessor_type, SCALAR, JS_AtomToValue(ctx, SCALAR));
  JS_SetProperty(ctx, accessor_type, VEC2, JS_AtomToValue(ctx, VEC2));
  JS_SetProperty(ctx, accessor_type, VEC3, JS_AtomToValue(ctx, VEC3));
  JS_SetProperty(ctx, accessor_type, VEC4, JS_AtomToValue(ctx, VEC4));
  JS_SetProperty(ctx, accessor_type, MAT2, JS_AtomToValue(ctx, MAT2));
  JS_SetProperty(ctx, accessor_type, MAT3, JS_AtomToValue(ctx, MAT3));
  JS_SetProperty(ctx, accessor_type, MAT4, JS_AtomToValue(ctx, MAT4));
  JS_SetPropertyStr(ctx, websg, "AccessorType", accessor_type);

  JSValue accessor_component_type = JS_NewObject(ctx);
  JS_SetPropertyStr(ctx, accessor_component_type, "Int8", JS_NewUint32(ctx, 5120));
  JS_SetPropertyStr(ctx, accessor_component_type, "Uint8", JS_NewUint32(ctx, 5121));
  JS_SetPropertyStr(ctx, accessor_component_type, "Int16", JS_NewUint32(ctx, 5122));
  JS_SetPropertyStr(ctx, accessor_component_type, "Uint16", JS_NewUint32(ctx, 5123));
  JS_SetPropertyStr(ctx, accessor_component_type, "Uint32", JS_NewUint32(ctx, 5125));
  JS_SetPropertyStr(ctx, accessor_component_type, "Float32", JS_NewUint32(ctx, 5126));
  JS_SetPropertyStr(ctx, websg, "AccessorComponentType", accessor_component_type);

  JS_SetPropertyStr(
    ctx,
    websg,
    "createAccessorFrom",
    JS_NewCFunction(ctx, js_create_accessor_from, "createAccessorFrom", 2)
  );
  JS_SetPropertyStr(
    ctx,
    websg,
    "accessorFindByName",
    JS_NewCFunction(ctx, js_accessor_find_by_name, "accessorFindByName", 1)
  );
  JS_SetPropertyStr(
    ctx,
    websg,
    "accessorUpdateWith",
    JS_NewCFunction(ctx, js_accessor_update_with, "accessorUpdateWith", 2)
  );

  // Material

  standard = JS_NewAtom(ctx, "standard");
  unlit = JS_NewAtom(ctx, "unlit");

  JS_SetPropertyStr(
    ctx,
    websg,
    "createMaterial",
    JS_NewCFunction(ctx, js_create_material, "createMaterial", 1)
  );
  JS_SetPropertyStr(
    ctx,
    websg,
    "materialFindByName",
    JS_NewCFunction(ctx, js_material_find_by_name, "materialFindByName", 1)
  );
  JS_SetPropertyStr(
    ctx,
    websg,
    "materialGetBaseColorFactor",
    JS_NewCFunction(ctx, js_material_get_base_color_factor, "materialGetBaseColorFactor", 2)
  );
  JS_SetPropertyStr(
    ctx,
    websg,
    "materialSetBaseColorFactor",
    JS_NewCFunction(ctx, js_material_set_base_color_factor, "materialSetBaseColorFactor", 2)
  );
  JS_SetPropertyStr(
    ctx,
    websg,
    "materialGetMetallicFactor",
    JS_NewCFunction(ctx, js_material_get_metallic_factor, "materialGetMetallicFactor", 1)
  );
  JS_SetPropertyStr(
    ctx,
    websg,
    "materialSetMetallicFactor",
    JS_NewCFunction(ctx, js_material_set_metallic_factor, "materialSetMetallicFactor", 2)
  );
  JS_SetPropertyStr(
    ctx,
    websg,
    "materialGetRoughnessFactor",
    JS_NewCFunction(ctx, js_material_get_roughness_factor, "materialGetRoughnessFactor", 1)
  );
  JS_SetPropertyStr(
    ctx,
    websg,
    "materialSetRoughnessFactor",
    JS_NewCFunction(ctx, js_material_set_roughness_factor, "materialSetRoughnessFactor", 2)
  );
  JS_SetPropertyStr(
    ctx,
    websg,
    "materialGetEmissiveFactor",
    JS_NewCFunction(ctx, js_material_get_emissive_factor, "materialGetEmissiveFactor", 2)
  );
  JS_SetPropertyStr(
    ctx,
    websg,
    "materialSetEmissiveFactor",
    JS_NewCFunction(ctx, js_material_set_emissive_factor, "materialSetEmissiveFactor", 2)
  );
  JS_SetPropertyStr(
    ctx,
    websg,
    "materialGetBaseColorTexture",
    JS_NewCFunction(ctx, js_material_get_base_color_texture, "materialGetBaseColorTexture", 1)
  );
  JS_SetPropertyStr(
    ctx,
    websg,
    "materialSetBaseColorTexture",
    JS_NewCFunction(ctx, js_material_set_base_color_texture, "materialSetBaseColorTexture", 2)
  );

  // Light

  directional = JS_NewAtom(ctx, "directional");
  point = JS_NewAtom(ctx, "point");
  spot = JS_NewAtom(ctx, "spot");

  JS_SetPropertyStr(
    ctx,
    websg,
    "createLight",
    JS_NewCFunction(ctx, js_create_light, "createLight", 1)
  );
  JS_SetPropertyStr(
    ctx,
    websg,
    "lightGetColor",
    JS_NewCFunction(ctx, js_light_get_color, "lightGetColor", 2)
  );
  JS_SetPropertyStr(
    ctx,
    websg,
    "lightSetColor",
    JS_NewCFunction(ctx, js_light_set_color, "lightSetColor", 2)
  );
  JS_SetPropertyStr(
    ctx,
    websg,
    "lightGetIntensity",
    JS_NewCFunction(ctx, js_light_get_intensity, "lightGetIntensity", 1)
  );
  JS_SetPropertyStr(
    ctx,
    websg,
    "lightSetIntensity",
    JS_NewCFunction(ctx, js_light_set_intensity, "lightSetIntensity", 1)
  );

  // Interactable

  JS_SetPropertyStr(
    ctx,
    websg,
    "addInteractable",
    JS_NewCFunction(ctx, js_add_interactable, "addInteractable", 1)
  );
  JS_SetPropertyStr(
    ctx,
    websg,
    "removeInteractable",
    JS_NewCFunction(ctx, js_remove_interactable, "removeInteractable", 1)
  );
  JS_SetPropertyStr(
    ctx,
    websg,
    "hasInteractable",
    JS_NewCFunction(ctx, js_has_interactable, "hasInteractable", 1)
  );
  JS_SetPropertyStr(
    ctx,
    websg,
    "getInteractablePressed",
    JS_NewCFunction(ctx, js_get_interactable_pressed, "getInteractablePressed", 1)
  );
  JS_SetPropertyStr(
    ctx,
    websg,
    "getInteractableHeld",
    JS_NewCFunction(ctx, js_get_interactable_held, "getInteractableHeld", 1)
  );
  JS_SetPropertyStr(
    ctx,
    websg,
    "getInteractableReleased",
    JS_NewCFunction(ctx, js_get_interactable_released, "getInteractableReleased", 1)
  );

  js_define_websg_network_api(ctx, &websg);
  JS_SetPropertyStr(ctx, *target, "WebSG", websg);
}