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

  u_int32_t index;

  if (JS_ToUint32(ctx, &index, argv[1]) == -1) {
    return JS_EXCEPTION;
  }

  node_id_t node_id = websg_scene_get_node(scene_id, index);

  if (node_id == 0) {
    return JS_UNDEFINED;
  }

  return JS_NewUint32(ctx, node_id);
}

void js_define_websg_api(JSContext *ctx, JSValue *target) {
  JSValue websg = JS_NewObject(ctx);

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
    JS_NewCFunction(ctx, js_scene_add_node, "sceneRemoveNode", 2)
  );
  JS_SetPropertyStr(
    ctx,
    websg,
    "sceneGetNodes",
    JS_NewCFunction(ctx, js_scene_get_nodes, "sceneGetNodes", 0)
  );
  JS_SetPropertyStr(
    ctx,
    websg,
    "sceneGetNode",
    JS_NewCFunction(ctx, js_scene_get_node, "sceneGetNode", 0)
  );

  js_define_websg_network_api(ctx, &websg);
  JS_SetPropertyStr(ctx, *target, "WebSG", websg);
}