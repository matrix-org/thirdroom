#include <string.h>
#include "./quickjs/cutils.h"
#include "./quickjs/quickjs.h"
#include "../websg.h"
#include "./js-utils.h"
#include "./websg-node-js.h"
#include "./websg-scene-js.h"
#include "./websg-node-iterator-js.h"
#include "./websg-vector3-js.h"

static JSClassDef websg_node_class = {
  "WebSGNode"
};

static JSValue js_websg_node_add_child(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  node_id_t node_id = js_get_own_opaque_id(this_val, websg_node_class_id);

  node_id_t child_id = js_get_opaque_id(ctx, argv[0], websg_node_class_id);

  if (!node_id) {
    return JS_EXCEPTION;
  }

  if (websg_node_add_child(node_id, child_id) == -1) {
    JS_ThrowInternalError(ctx, "WebSG: Couldn't add child node.");
    return JS_EXCEPTION;
  }

  return this_val;
}

static JSValue js_websg_node_remove_child(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  node_id_t node_id = js_get_own_opaque_id(this_val, websg_node_class_id);

  node_id_t child_id = js_get_opaque_id(ctx, argv[0], websg_node_class_id);

  if (!node_id) {
    return JS_EXCEPTION;
  }

  if (websg_node_remove_child(node_id, child_id) == -1) {
    JS_ThrowInternalError(ctx, "WebSG: Couldn't remove child node.");
    return JS_EXCEPTION;
  }

  return this_val;
}

static JSValue js_websg_node_get_child(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  node_id_t node_id = js_get_own_opaque_id(this_val, websg_node_class_id);

  uint32_t index;

  if (JS_ToUint32(ctx, &index, argv[0]) == -1) {
    return JS_EXCEPTION;
  }

  node_id_t child_id = websg_node_get_child(node_id, index);

  if (child_id == 0) {
    return JS_UNDEFINED;
  }

  return js_websg_get_node_by_id(ctx, child_id);
}


JSValue js_websg_node_children(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  node_id_t node_id = js_get_own_opaque_id(this_val, websg_node_class_id);

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

  return js_websg_create_node_iterator(ctx, children, count);
}

static JSValue js_websg_node_parent(JSContext *ctx, JSValueConst this_val) {
  node_id_t node_id = js_get_own_opaque_id(this_val, websg_node_class_id);

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

static float_t js_websg_node_get_position_element(uint32_t node_id, float_t *position, int index) {
  websg_node_get_position(node_id, position);
  return position[index];
}

static void js_websg_node_set_position_element(uint32_t node_id, float_t *position, int index, float_t value) {
  position[index] = value;
  websg_node_set_position(node_id, position);
}

// Implement the addChild and removeChild methods
static const JSCFunctionListEntry websg_node_proto_funcs[] = {
  JS_CFUNC_DEF("addChild", 1, js_websg_node_add_child),
  JS_CFUNC_DEF("removeChild", 1, js_websg_node_remove_child),
  JS_CFUNC_DEF("getChild", 1, js_websg_node_get_child),
  JS_CFUNC_DEF("children", 0, js_websg_node_children),
  JS_CGETSET_DEF("parent", js_websg_node_parent, NULL),
  JS_PROP_STRING_DEF("[Symbol.toStringTag]", "WebSGNode", JS_PROP_CONFIGURABLE),
};

void js_define_websg_node(JSContext *ctx) {
  JS_NewClassID(&websg_node_class_id);
  JS_NewClass(JS_GetRuntime(ctx), websg_node_class_id, &websg_node_class);
  JSValue node_proto = JS_NewObject(ctx);
  JS_SetPropertyFunctionList(ctx, node_proto, websg_node_proto_funcs, countof(websg_node_proto_funcs));
  JS_SetClassProto(ctx, websg_node_class_id, node_proto);
}

JSValue js_websg_create_node(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  node_id_t node_id = websg_create_node();

  if (node_id == 0) {
    JS_ThrowInternalError(ctx, "WebSG: Couldn't create node.");
    return JS_EXCEPTION;
  }

  JSValue node = JS_NewObjectClass(ctx, websg_node_class_id);

  if (JS_IsException(node)) {
    return node;
  }

  js_set_opaque_id(node, node_id);

  js_websg_define_vector3_prop(
    ctx,
    node,
    "position",
    node_id,
    &js_websg_node_get_position_element,
    &js_websg_node_set_position_element
  );

  WebSGContext *websg = JS_GetContextOpaque(ctx);

  JS_SetPropertyUint32(ctx, websg->nodes, node_id, node);

  return node;
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


JSValue js_websg_get_node_by_id(JSContext *ctx, node_id_t node_id) {
  WebSGContext *websg = JS_GetContextOpaque(ctx);

  JSValue node = JS_GetPropertyUint32(ctx, websg->nodes, node_id);

  if (!JS_IsUndefined(node)) {
    return JS_DupValue(ctx, node);
  }

  node = JS_NewObjectClass(ctx, websg_node_class_id);

  if (JS_IsException(node)) {
    return node;
  }

  js_set_opaque_id(node, node_id);

  JS_SetPropertyUint32(ctx, websg->nodes, node_id, node);
  
  return JS_DupValue(ctx, node);
}