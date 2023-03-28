#include <string.h>
#include "./quickjs/cutils.h"
#include "./quickjs/quickjs.h"
#include "../websg.h"
#include "./js-utils.h"
#include "./websg-world-js.h"
#include "./websg-scene-js.h"
#include "./websg-node-js.h"
#include "./websg-mesh-js.h"
#include "./websg-light-js.h"
#include "./websg-collider-js.h"

static JSClassDef websg_world_class = {
  "WebSGWorld"
};

static JSValue js_websg_world_get_environment(JSContext *ctx, JSValueConst this_val) {
  scene_id_t scene_id = websg_get_environment_scene();

  if (scene_id == 0) {
    return JS_UNDEFINED;
  }

  return js_websg_get_scene_by_id(ctx, scene_id);
}

static JSValue js_websg_world_set_environment(JSContext *ctx, JSValueConst this_val, JSValueConst environment) {
  WebSGSceneData *scene_data = JS_GetOpaque(environment, websg_scene_class_id);

  if (scene_data == NULL) {
    return JS_EXCEPTION;
  }

  if (websg_set_environment_scene(scene_data->scene_id) == -1) {
    JS_ThrowInternalError(ctx, "WebSG: Couldn't set environment scene.");
    return JS_EXCEPTION;
  }

  return JS_UNDEFINED;
}

static JSValue js_websg_world_find_scene_by_name(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {

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

static JSValue js_websg_world_find_node_by_name(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {

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


static const JSCFunctionListEntry websg_world_proto_funcs[] = {
  JS_CGETSET_DEF("environment", js_websg_world_get_environment, js_websg_world_set_environment),
  JS_CFUNC_DEF("createScene", 0, js_websg_create_scene),
  JS_CFUNC_DEF("createNode", 0, js_websg_create_node),
  JS_CFUNC_DEF("createMesh", 1, js_websg_create_mesh),
  JS_CFUNC_DEF("createBoxMesh", 1, js_websg_create_box_mesh),
  JS_CFUNC_DEF("createLight", 1, js_websg_create_light),
  JS_CFUNC_DEF("createCollider", 1, js_websg_create_collider),
  JS_CFUNC_DEF("findSceneByName", 1, js_websg_find_scene_by_name),
  JS_CFUNC_DEF("findNodeByName", 1, js_websg_find_node_by_name),
  JS_CFUNC_DEF("findMeshByName", 1, js_websg_find_mesh_by_name),
  JS_CFUNC_DEF("findLightByName", 1, js_websg_find_light_by_name),
  JS_CFUNC_DEF("findColliderByName", 1, js_websg_find_collider_by_name),
  JS_PROP_STRING_DEF("[Symbol.toStringTag]", "WebSGWorld", JS_PROP_CONFIGURABLE),
};

void js_define_websg_world(JSContext *ctx) {
  JS_NewClassID(&websg_world_class_id);
  JS_NewClass(JS_GetRuntime(ctx), websg_world_class_id, &websg_world_class);
  JSValue world_proto = JS_NewObject(ctx);
  JS_SetPropertyFunctionList(ctx, world_proto, websg_world_proto_funcs, countof(websg_world_proto_funcs));
  JS_SetClassProto(ctx, websg_world_class_id, world_proto);
}

JSValue js_new_websg_world(JSContext *ctx) {
  JSValue world = JS_NewObjectClass(ctx, websg_world_class_id);

  if (JS_IsException(world)) {
    return world;
  }

  return world;
}