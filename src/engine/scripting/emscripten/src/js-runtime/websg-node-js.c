#include <string.h>
#include "./quickjs/cutils.h"
#include "./quickjs/quickjs.h"
#include "../websg.h"
#include "./js-utils.h"
#include "./websg-node-js.h"
#include "./websg-scene-js.h"
#include "./websg-mesh-js.h"
#include "./websg-light-js.h"
#include "./websg-collider-js.h"
#include "./websg-interactable-js.h"
#include "./websg-node-iterator-js.h"
#include "./websg-vector3-js.h"
#include "./websg-quaternion-js.h"
#include "./websg-matrix4-js.h"

static void js_websg_node_finalizer(JSRuntime *rt, JSValue val) {
  WebSGNodeData *node_data = JS_GetOpaque(val, websg_node_class_id);

  if (node_data) {
    JS_FreeValueRT(rt, node_data->interactable);
    js_free_rt(rt, node_data);
  }
}

static JSClassDef websg_node_class = {
  "WebSGNode",
  .finalizer = js_websg_node_finalizer
};

static JSValue js_websg_node_add_child(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  WebSGNodeData *node_data = JS_GetOpaque(this_val, websg_node_class_id);

  node_id_t node_id = node_data->node_id;

  WebSGNodeData *child_data = JS_GetOpaque2(ctx, argv[0], websg_node_class_id);

  if (child_data == NULL) {
    return JS_EXCEPTION;
  }

  if (websg_node_add_child(node_id, child_data->node_id) == -1) {
    JS_ThrowInternalError(ctx, "WebSG: Couldn't add child node.");
    return JS_EXCEPTION;
  }

  return this_val;
}

static JSValue js_websg_node_remove_child(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  WebSGNodeData *node_data = JS_GetOpaque(this_val, websg_node_class_id);

  node_id_t node_id = node_data->node_id;

  WebSGNodeData *child_data = JS_GetOpaque2(ctx, argv[0], websg_node_class_id);

  if (child_data == NULL) {
    return JS_EXCEPTION;
  }

  if (websg_node_remove_child(node_id, child_data->node_id) == -1) {
    JS_ThrowInternalError(ctx, "WebSG: Couldn't remove child node.");
    return JS_EXCEPTION;
  }

  return this_val;
}

static JSValue js_websg_node_get_child(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  WebSGNodeData *node_data = JS_GetOpaque(this_val, websg_node_class_id);

  uint32_t index;

  if (JS_ToUint32(ctx, &index, argv[0]) == -1) {
    return JS_EXCEPTION;
  }

  node_id_t child_id = websg_node_get_child(node_data->node_id, index);

  if (child_id == 0) {
    return JS_UNDEFINED;
  }

  return js_websg_get_node_by_id(ctx, child_id);
}


JSValue js_websg_node_children(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  WebSGNodeData *node_data = JS_GetOpaque(this_val, websg_node_class_id);

  int32_t count = websg_node_get_child_count(node_data->node_id);

  if (count == -1) {
    JS_ThrowInternalError(ctx, "WebSG: Error getting node child count.");
    return JS_EXCEPTION;
  }

  node_id_t *children = js_malloc(ctx, sizeof(node_id_t) * count);

  if (websg_node_get_children(node_data->node_id, children, count) == -1) {
    JS_ThrowInternalError(ctx, "WebSG: Error getting node children.");
    return JS_EXCEPTION;
  }

  return js_websg_create_node_iterator(ctx, children, count);
}

static JSValue js_websg_node_parent(JSContext *ctx, JSValueConst this_val) {
  WebSGNodeData *node_data = JS_GetOpaque(this_val, websg_node_class_id);

  node_id_t node_id = node_data->node_id;

  node_id_t parent_id = websg_node_get_parent(node_id);

  if (parent_id != 0) {
    return js_websg_get_node_by_id(ctx, parent_id);
  }

  scene_id_t parent_scene_id = websg_node_get_parent_scene(node_id);

  if (parent_scene_id != 0) {
    return js_websg_get_scene_by_id(ctx, parent_scene_id);
  }

  return JS_UNDEFINED;
}

static JSValue js_websg_node_get_is_static(JSContext *ctx, JSValueConst this_val) {
  WebSGNodeData *node_data = JS_GetOpaque(this_val, websg_node_class_id);
  uint32_t result = websg_node_get_is_static(node_data->node_id);
  return JS_NewBool(ctx, result);
}

static JSValue js_websg_node_set_is_static(JSContext *ctx, JSValueConst this_val, JSValueConst arg) {
  WebSGNodeData *node_data = JS_GetOpaque(this_val, websg_node_class_id);

  int32_t value = JS_ToBool(ctx, arg);

  if (value < 0) {
    return JS_EXCEPTION;
  }

  int32_t result = websg_node_set_is_static(node_data->node_id, value);

  if (result == -1) {
    JS_ThrowInternalError(ctx, "WebSG: Error setting isStatic.");
    return JS_EXCEPTION;
  }

  return JS_UNDEFINED;
}

static JSValue js_websg_node_get_visible(JSContext *ctx, JSValueConst this_val) {
  WebSGNodeData *node_data = JS_GetOpaque(this_val, websg_node_class_id);
  uint32_t result = websg_node_get_visible(node_data->node_id);
  return JS_NewBool(ctx, result);
}

static JSValue js_websg_node_set_visible(JSContext *ctx, JSValueConst this_val, JSValueConst arg) {
  WebSGNodeData *node_data = JS_GetOpaque(this_val, websg_node_class_id);

  int32_t value = JS_ToBool(ctx, arg);

  if (value < 0) {
    return JS_EXCEPTION;
  }

  int32_t result = websg_node_set_visible(node_data->node_id, value);

  if (result == -1) {
    JS_ThrowInternalError(ctx, "WebSG: Error setting visible.");
    return JS_EXCEPTION;
  }

  return JS_UNDEFINED;
}

static JSValue js_websg_node_get_mesh(JSContext *ctx, JSValueConst this_val) {
  WebSGNodeData *node_data = JS_GetOpaque(this_val, websg_node_class_id);
  mesh_id_t result = websg_node_get_mesh(node_data->node_id);
  return JS_NewBool(ctx, result);
}

static JSValue js_websg_node_set_mesh(JSContext *ctx, JSValueConst this_val, JSValueConst arg) {
  WebSGNodeData *node_data = JS_GetOpaque(this_val, websg_node_class_id);

  WebSGMeshData *mesh_data = JS_GetOpaque2(ctx, arg, websg_mesh_class_id);

  if (mesh_data == NULL) {
    return JS_EXCEPTION;
  }

  if (websg_node_set_mesh(node_data->node_id, mesh_data->mesh_id) == -1) {
    JS_ThrowInternalError(ctx, "WebSG: Couldn't set mesh.");
    return JS_EXCEPTION;
  }

  return JS_UNDEFINED;
}

static JSValue js_websg_node_get_light(JSContext *ctx, JSValueConst this_val) {
  WebSGNodeData *node_data = JS_GetOpaque(this_val, websg_node_class_id);
  light_id_t result = websg_node_get_light(node_data->node_id);
  return JS_NewBool(ctx, result);
}

static JSValue js_websg_node_set_light(JSContext *ctx, JSValueConst this_val, JSValueConst arg) {
  WebSGNodeData *node_data = JS_GetOpaque(this_val, websg_node_class_id);

  WebSGLightData *light_data = JS_GetOpaque2(ctx, arg, websg_light_class_id);

  if (light_data == NULL) {
    return JS_EXCEPTION;
  }

  if (websg_node_set_light(node_data->node_id, light_data->light_id) == -1) {
    JS_ThrowInternalError(ctx, "WebSG: Couldn't set light.");
    return JS_EXCEPTION;
  }

  return JS_UNDEFINED;
}

static JSValue js_websg_node_get_collider(JSContext *ctx, JSValueConst this_val) {
  WebSGNodeData *node_data = JS_GetOpaque(this_val, websg_node_class_id);
  collider_id_t result = websg_node_get_collider(node_data->node_id);
  return JS_NewBool(ctx, result);
}

static JSValue js_websg_node_set_collider(JSContext *ctx, JSValueConst this_val, JSValueConst arg) {
  WebSGNodeData *node_data = JS_GetOpaque(this_val, websg_node_class_id);

  WebSGColliderData *collider_data = JS_GetOpaque2(ctx, arg, websg_collider_class_id);

  if (collider_data == NULL) {
    return JS_EXCEPTION;
  }

  if (websg_node_set_collider(node_data->node_id, collider_data->collider_id) == -1) {
    JS_ThrowInternalError(ctx, "WebSG: Couldn't set collider.");
    return JS_EXCEPTION;
  }

  return JS_UNDEFINED;
}

static float_t js_websg_node_get_position_element(uint32_t node_id, float_t *position, int index) {
  websg_node_get_position(node_id, position);
  return position[index];
}

static void js_websg_node_set_position_element(uint32_t node_id, float_t *position, int index, float_t value) {
  websg_node_get_position(node_id, position);
  position[index] = value;
  websg_node_set_position(node_id, position);
}

static float_t js_websg_node_get_quaternion_element(uint32_t node_id, float_t *quaternion, int index) {
  websg_node_get_quaternion(node_id, quaternion);
  return quaternion[index];
}

static void js_websg_node_set_quaternion_element(uint32_t node_id, float_t *quaternion, int index, float_t value) {
  websg_node_get_quaternion(node_id, quaternion);
  quaternion[index] = value;
  websg_node_set_quaternion(node_id, quaternion);
}

static float_t js_websg_node_get_scale_element(uint32_t node_id, float_t *scale, int index) {
  websg_node_get_scale(node_id, scale);
  return scale[index];
}

static void js_websg_node_set_scale_element(uint32_t node_id, float_t *scale, int index, float_t value) {
  websg_node_get_scale(node_id, scale);
  scale[index] = value;
  websg_node_set_scale(node_id, scale);
}

static float_t js_websg_node_get_local_matrix_element(uint32_t node_id, float_t *local_matrix, int index) {
  websg_node_get_local_matrix(node_id, local_matrix);
  return local_matrix[index];
}

static void js_websg_node_set_local_matrix_element(uint32_t node_id, float_t *local_matrix, int index, float_t value) {
  websg_node_get_local_matrix(node_id, local_matrix);
  local_matrix[index] = value;
  websg_node_set_local_matrix(node_id, local_matrix);
}

static float_t js_websg_node_get_world_matrix_element(uint32_t node_id, float_t *world_matrix, int index) {
  websg_node_get_world_matrix(node_id, world_matrix);
  return world_matrix[index];
}

// Implement the addChild and removeChild methods
static const JSCFunctionListEntry websg_node_proto_funcs[] = {
  JS_CFUNC_DEF("addChild", 1, js_websg_node_add_child),
  JS_CFUNC_DEF("removeChild", 1, js_websg_node_remove_child),
  JS_CFUNC_DEF("getChild", 1, js_websg_node_get_child),
  JS_CFUNC_DEF("children", 0, js_websg_node_children),
  JS_CGETSET_DEF("parent", js_websg_node_parent, NULL),
  JS_CGETSET_DEF("isStatic", js_websg_node_get_is_static, js_websg_node_set_is_static),
  JS_CGETSET_DEF("visible", js_websg_node_get_is_static, js_websg_node_set_is_static),
  JS_CGETSET_DEF("mesh", js_websg_node_get_mesh, js_websg_node_set_mesh),
  JS_CGETSET_DEF("light", js_websg_node_get_light, js_websg_node_set_light),
  JS_CGETSET_DEF("collider", js_websg_node_get_collider, js_websg_node_set_collider),
  JS_CFUNC_DEF("addInteractable", 1, js_websg_node_add_interactable),
  JS_CFUNC_DEF("getInteractable", 0, js_websg_node_get_interactable),
  JS_CFUNC_DEF("removeInteractable", 0, js_websg_node_remove_interactable),
  JS_CFUNC_DEF("hasInteractable", 0, js_websg_node_has_interactable),
  JS_PROP_STRING_DEF("[Symbol.toStringTag]", "WebSGNode", JS_PROP_CONFIGURABLE),
};

void js_define_websg_node(JSContext *ctx) {
  JS_NewClassID(&websg_node_class_id);
  JS_NewClass(JS_GetRuntime(ctx), websg_node_class_id, &websg_node_class);
  JSValue node_proto = JS_NewObject(ctx);
  JS_SetPropertyFunctionList(ctx, node_proto, websg_node_proto_funcs, countof(websg_node_proto_funcs));
  JS_SetClassProto(ctx, websg_node_class_id, node_proto);
}

JSValue js_websg_find_node_by_name(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  size_t length;
  const char* name = JS_ToCStringLen(ctx, &length, argv[0]);

  if (name == NULL) {
    return JS_EXCEPTION;
  }

  node_id_t node_id = websg_node_find_by_name(name, length);

  if (node_id == 0) {
    return JS_UNDEFINED;
  }

  return js_websg_get_node_by_id(ctx, node_id);
}

JSValue js_websg_new_node_instance(JSContext *ctx, WebSGContext *websg, node_id_t node_id) {
  JSValue node = JS_NewObjectClass(ctx, websg_node_class_id);

  if (JS_IsException(node)) {
    return node;
  }

  js_websg_define_vector3_prop(
    ctx,
    node,
    "position",
    node_id,
    &js_websg_node_get_position_element,
    &js_websg_node_set_position_element
  );

  js_websg_define_quaternion_prop(
    ctx,
    node,
    "quaternion",
    node_id,
    &js_websg_node_get_quaternion_element,
    &js_websg_node_set_quaternion_element
  );

  js_websg_define_vector3_prop(
    ctx,
    node,
    "scale",
    node_id,
    &js_websg_node_get_scale_element,
    &js_websg_node_set_scale_element
  );

  js_websg_define_matrix4_prop(
    ctx,
    node,
    "localMatrix",
    node_id,
    &js_websg_node_get_local_matrix_element,
    &js_websg_node_set_local_matrix_element
  );

  js_websg_define_matrix4_prop_read_only(
    ctx,
    node,
    "worldMatrix",
    node_id,
    &js_websg_node_get_local_matrix_element
  );

  WebSGNodeData *node_data = js_mallocz(ctx, sizeof(WebSGNodeData));
  node_data->node_id = node_id;
  node_data->interactable = JS_UNDEFINED;

  JS_SetOpaque(node, node_data);

  JS_SetPropertyUint32(ctx, websg->nodes, node_id, JS_DupValue(ctx, node));

  return node;
}

JSValue js_websg_create_node(JSContext *ctx, JSValue this_val, int argc, JSValue *argv) {
  WebSGContext *websg = JS_GetContextOpaque(ctx);

  node_id_t node_id = websg_create_node();

  if (node_id == 0) {
    JS_ThrowInternalError(ctx, "WebSG: Couldn't create node.");
    return JS_EXCEPTION;
  }

  return js_websg_new_node_instance(ctx, websg, node_id);
}

JSValue js_websg_get_node_by_id(JSContext *ctx, node_id_t node_id) {
  WebSGContext *websg = JS_GetContextOpaque(ctx);

  JSValue node = JS_GetPropertyUint32(ctx, websg->nodes, node_id);

  if (!JS_IsUndefined(node)) {
    return JS_DupValue(ctx, node);
  }

  return js_websg_new_node_instance(ctx, websg, node_id);
}