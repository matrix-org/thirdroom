#include <string.h>
#include "../quickjs/cutils.h"
#include "../quickjs/quickjs.h"
#include "../../websg.h"
#include "./scene.h"
#include "./node.h"
#include "./node-iterator.h"

JSClassID js_websg_scene_class_id;

/**
 * Class Definition
 **/

static void js_websg_scene_finalizer(JSRuntime *rt, JSValue val) {
  WebSGSceneData *scene_data = JS_GetOpaque(val, js_websg_scene_class_id);

  if (scene_data) {
    js_free_rt(rt, scene_data);
  }
}

static JSClassDef websg_scene_class = {
  "Scene",
  .finalizer = js_websg_scene_finalizer
};

static JSValue js_websg_scene_add_node(
  JSContext *ctx,
  JSValueConst this_val,
  int argc,
  JSValueConst *argv
) {
  WebSGSceneData *scene_data = JS_GetOpaque(this_val, js_websg_scene_class_id);

  WebSGNodeData *node_data = JS_GetOpaque2(ctx, argv[0], js_websg_node_class_id);

  if (node_data == NULL) {
    return JS_EXCEPTION;
  }

  if (websg_scene_add_node(scene_data->scene_id, node_data->node_id) == -1) {
    JS_ThrowInternalError(ctx, "WebSG: Couldn't add node to scene.");
    return JS_EXCEPTION;
  }

  return JS_DupValue(ctx, this_val);
}

static JSValue js_websg_scene_remove_node(
  JSContext *ctx,
  JSValueConst this_val,
  int argc,
  JSValueConst *argv
) {
  WebSGSceneData *scene_data = JS_GetOpaque(this_val, js_websg_scene_class_id);

  WebSGNodeData *node_data = JS_GetOpaque2(ctx, argv[0], js_websg_node_class_id);

  if (node_data == NULL) {
    return JS_EXCEPTION;
  }

  if (websg_scene_remove_node(scene_data->scene_id, node_data->node_id) == -1) {
    JS_ThrowInternalError(ctx, "WebSG: Couldn't remove node from scene.");
    return JS_EXCEPTION;
  }

  return JS_DupValue(ctx, this_val);
}

static JSValue js_websg_scene_nodes(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  WebSGSceneData *scene_data = JS_GetOpaque(this_val, js_websg_scene_class_id);

  int32_t count = websg_scene_get_node_count(scene_data->scene_id);

  if (count == -1) {
    JS_ThrowInternalError(ctx, "WebSG: Error getting scene node count.");
    return JS_EXCEPTION;
  }

  node_id_t *nodes = js_mallocz(ctx, sizeof(node_id_t) * count);

  if (websg_scene_get_nodes(scene_data->scene_id, nodes, count) == -1) {
    JS_ThrowInternalError(ctx, "WebSG: Error getting scene nodes.");
    return JS_EXCEPTION;
  }

  return js_websg_create_node_iterator(ctx, scene_data->world_data, nodes, count);
}

static JSValue js_websg_scene_get_node(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  WebSGSceneData *scene_data = JS_GetOpaque(this_val, js_websg_scene_class_id);

  uint32_t index;

  if (JS_ToUint32(ctx, &index, argv[0]) == -1) {
    return JS_EXCEPTION;
  }

  node_id_t node_id = websg_scene_get_node(scene_data->scene_id, index);

  if (node_id == 0) {
    return JS_UNDEFINED;
  }

  return js_websg_get_node_by_id(ctx, scene_data->world_data, node_id);
}

static const JSCFunctionListEntry websg_scene_proto_funcs[] = {
  JS_CFUNC_DEF("addNode", 1, js_websg_scene_add_node),
  JS_CFUNC_DEF("removeNode", 1, js_websg_scene_remove_node),
  JS_CFUNC_DEF("getNode", 1, js_websg_scene_get_node),
  JS_CFUNC_DEF("nodes", 0, js_websg_scene_nodes),
  JS_PROP_STRING_DEF("[Symbol.toStringTag]", "Scene", JS_PROP_CONFIGURABLE),
};

static JSValue js_websg_scene_constructor(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  return JS_ThrowTypeError(ctx, "Illegal Constructor.");
}

void js_websg_define_scene(JSContext *ctx, JSValue websg) {
  JS_NewClassID(&js_websg_scene_class_id);
  JS_NewClass(JS_GetRuntime(ctx), js_websg_scene_class_id, &websg_scene_class);
  JSValue scene_proto = JS_NewObject(ctx);
  JS_SetPropertyFunctionList(ctx, scene_proto, websg_scene_proto_funcs, countof(websg_scene_proto_funcs));
  JS_SetClassProto(ctx, js_websg_scene_class_id, scene_proto);

  JSValue constructor = JS_NewCFunction2(
    ctx,
    js_websg_scene_constructor,
    "Scene",
    0,
    JS_CFUNC_constructor,
    0
  );
  JS_SetConstructor(ctx, constructor, scene_proto);
  JS_SetPropertyStr(
    ctx,
    websg,
    "Scene",
    constructor
  );
}

JSValue js_websg_new_scene_instance(JSContext *ctx, WebSGWorldData *world_data, scene_id_t scene_id) {
  JSValue scene = JS_NewObjectClass(ctx, js_websg_scene_class_id);

  if (JS_IsException(scene)) {
    return scene;
  }

  WebSGSceneData *scene_data = js_mallocz(ctx, sizeof(WebSGSceneData));
  scene_data->world_data = world_data;
  scene_data->scene_id = scene_id;

  JS_SetOpaque(scene, scene_data);

  JS_SetPropertyUint32(ctx, world_data->scenes, scene_id, JS_DupValue(ctx, scene));
  
  return scene;
}

/**
 * Public Methods
 **/

JSValue js_websg_get_scene_by_id(JSContext *ctx, WebSGWorldData *world_data, scene_id_t scene_id) {
  JSValue scene = JS_GetPropertyUint32(ctx, world_data->scenes, scene_id);

  if (!JS_IsUndefined(scene)) {
    return JS_DupValue(ctx, scene);
  }

  return js_websg_new_scene_instance(ctx, world_data, scene_id);
}

/**
 * World Methods
 **/

JSValue js_websg_world_find_scene_by_name(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  WebSGWorldData *world_data = JS_GetOpaque(this_val, js_websg_world_class_id);

  size_t length;
  const char* name = JS_ToCStringLen(ctx, &length, argv[0]);

  if (name == NULL) {
    return JS_EXCEPTION;
  }

  scene_id_t scene_id = websg_world_find_scene_by_name(name, length);

  if (scene_id == 0) {
    return JS_UNDEFINED;
  }

  return js_websg_get_scene_by_id(ctx, world_data, scene_id);
}

JSValue js_websg_world_create_scene(JSContext *ctx, JSValue this_val, int argc, JSValue *argv) {
  WebSGWorldData *world_data = JS_GetOpaque(this_val, js_websg_world_class_id);

  SceneProps *props = js_mallocz(ctx, sizeof(SceneProps));

  if (!JS_IsUndefined(argv[0])) {
    JSValue name_val = JS_GetPropertyStr(ctx, argv[0], "name");

    if (!JS_IsUndefined(name_val)) {
      props->name = JS_ToCString(ctx, name_val);

      if (props->name == NULL) {
        js_free(ctx, props);
        return JS_EXCEPTION;
      }
    }
  }

  scene_id_t scene_id = websg_world_create_scene(props);

  js_free(ctx, props);

  if (scene_id == 0) {
    JS_ThrowInternalError(ctx, "WebSG: Couldn't create scene.");
    return JS_EXCEPTION;
  }

  return js_websg_new_scene_instance(ctx, world_data, scene_id);
}
