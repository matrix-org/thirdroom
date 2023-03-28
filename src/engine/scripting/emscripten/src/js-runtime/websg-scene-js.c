#include <string.h>
#include "./quickjs/cutils.h"
#include "./quickjs/quickjs.h"
#include "../websg.h"
#include "./js-utils.h"
#include "./websg-scene-js.h"
#include "./websg-node-js.h"
#include "./websg-node-iterator-js.h"

static void js_websg_scene_finalizer(JSRuntime *rt, JSValue val) {
  WebSGSceneData *scene_data = JS_GetOpaque(val, websg_scene_class_id);

  if (scene_data) {
    js_free_rt(rt, scene_data);
  }
}

static JSClassDef websg_scene_class = {
  "WebSGScene",
  .finalizer = js_websg_scene_finalizer
};

static JSValue js_websg_scene_add_node(
  JSContext *ctx,
  JSValueConst this_val,
  int argc,
  JSValueConst *argv
) {
  WebSGSceneData *scene_data = JS_GetOpaque(this_val, websg_scene_class_id);

  WebSGNodeData *node_data = JS_GetOpaque2(ctx, argv[0], websg_node_class_id);

  if (node_data == NULL) {
    return JS_EXCEPTION;
  }

  if (websg_scene_add_node(scene_data->scene_id, node_data->node_id) == -1) {
    JS_ThrowInternalError(ctx, "WebSG: Couldn't add node to scene.");
    return JS_EXCEPTION;
  }

  return this_val;
}

static JSValue js_websg_scene_remove_node(
  JSContext *ctx,
  JSValueConst this_val,
  int argc,
  JSValueConst *argv
) {
  WebSGSceneData *scene_data = JS_GetOpaque(this_val, websg_scene_class_id);

  WebSGNodeData *node_data = JS_GetOpaque2(ctx, argv[0], websg_node_class_id);

  if (node_data == NULL) {
    return JS_EXCEPTION;
  }

  if (websg_scene_remove_node(scene_data->scene_id, node_data->node_id) == -1) {
    JS_ThrowInternalError(ctx, "WebSG: Couldn't remove node from scene.");
    return JS_EXCEPTION;
  }

  return this_val;
}

static JSValue js_websg_scene_nodes(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  WebSGSceneData *scene_data = JS_GetOpaque(this_val, websg_scene_class_id);

  int32_t count = websg_scene_get_node_count(scene_data->scene_id);

  if (count == -1) {
    JS_ThrowInternalError(ctx, "WebSG: Error getting scene node count.");
    return JS_EXCEPTION;
  }

  node_id_t *nodes = js_malloc(ctx, sizeof(node_id_t) * count);

  if (websg_scene_get_nodes(scene_data->scene_id, nodes, count) == -1) {
    JS_ThrowInternalError(ctx, "WebSG: Error getting scene nodes.");
    return JS_EXCEPTION;
  }

  return js_websg_create_node_iterator(ctx, nodes, count);
}

static JSValue js_websg_scene_get_node(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  WebSGSceneData *scene_data = JS_GetOpaque(this_val, websg_scene_class_id);

  uint32_t index;

  if (JS_ToUint32(ctx, &index, argv[0]) == -1) {
    return JS_EXCEPTION;
  }

  node_id_t node_id = websg_scene_get_node(scene_data->scene_id, index);

  if (node_id == 0) {
    return JS_UNDEFINED;
  }

  return js_websg_get_node_by_id(ctx, node_id);
}

static const JSCFunctionListEntry websg_scene_proto_funcs[] = {
  JS_CFUNC_DEF("addNode", 1, js_websg_scene_add_node),
  JS_CFUNC_DEF("removeNode", 1, js_websg_scene_remove_node),
  JS_CFUNC_DEF("getNode", 1, js_websg_scene_get_node),
  JS_CFUNC_DEF("nodes", 0, js_websg_scene_nodes),
  JS_PROP_STRING_DEF("[Symbol.toStringTag]", "WebSGScene", JS_PROP_CONFIGURABLE),
};

void js_define_websg_scene(JSContext *ctx) {
  JS_NewClassID(&websg_scene_class_id);
  JS_NewClass(JS_GetRuntime(ctx), websg_scene_class_id, &websg_scene_class);
  JSValue scene_proto = JS_NewObject(ctx);
  JS_SetPropertyFunctionList(ctx, scene_proto, websg_scene_proto_funcs, countof(websg_scene_proto_funcs));
  JS_SetClassProto(ctx, websg_scene_class_id, scene_proto);
}

JSValue js_websg_find_scene_by_name(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  size_t length;
  const char* name = JS_ToCStringLen(ctx, &length, argv[0]);

  if (name == NULL) {
    return JS_EXCEPTION;
  }

  scene_id_t scene_id = websg_scene_find_by_name(name, length);

  if (scene_id == 0) {
    return JS_UNDEFINED;
  }

  return js_websg_get_scene_by_id(ctx, scene_id);
}

JSValue js_websg_new_scene_instance(JSContext *ctx, WebSGContext *websg, scene_id_t scene_id) {
  JSValue scene = JS_NewObjectClass(ctx, websg_scene_class_id);

  if (JS_IsException(scene)) {
    return scene;
  }

  WebSGSceneData *scene_data = js_mallocz(ctx, sizeof(WebSGSceneData));
  scene_data->scene_id = scene_id;

  JS_SetOpaque(scene, scene_data);

  JS_SetPropertyUint32(ctx, websg->scenes, scene_id, JS_DupValue(ctx, scene));
  
  return scene;
}

JSValue js_websg_create_scene(JSContext *ctx, JSValue this_val, int argc, JSValue *argv) {
  WebSGContext *websg = JS_GetContextOpaque(ctx);

  scene_id_t scene_id = websg_create_scene();

  if (scene_id == 0) {
    JS_ThrowInternalError(ctx, "WebSG: Couldn't create scene.");
    return JS_EXCEPTION;
  }

  return js_websg_new_scene_instance(ctx, websg, scene_id);
}

JSValue js_websg_get_scene_by_id(JSContext *ctx, scene_id_t scene_id) {
  WebSGContext *websg = JS_GetContextOpaque(ctx);

  JSValue scene = JS_GetPropertyUint32(ctx, websg->scenes, scene_id);

  if (!JS_IsUndefined(scene)) {
    return JS_DupValue(ctx, scene);
  }

  return js_websg_new_scene_instance(ctx, websg, scene_id);
}
