#include <emscripten.h>
#include <emscripten/console.h>
#include <math.h>
#include <stdbool.h>
#include <string.h>

#include "../../include/quickjs/cutils.h"
#include "../../include/quickjs/quickjs.h"

#include "../jsutils.h"
#include "../websg-utils.h"
#include "../script-context.h"
#include "websg.h"
#include "world.h"
#include "environment.h"
#include "node.h"
#include "scene.h"

/**
 * WebSG.World
 */

JSClassID js_world_class_id;

static JSValue js_world_constructor(JSContext *ctx, JSValueConst new_target, int argc, JSValueConst *argv) {
  World *world = js_mallocz(ctx, sizeof(World));

  

  if (websg_create_resource(ResourceType_World, world)) {
    return JS_EXCEPTION;
  }

  return create_world_from_ptr(ctx, world);
}


static JSValue js_world_get_active_camera_node(JSContext *ctx, JSValueConst this_val) {
  World *world = JS_GetOpaque2(ctx, this_val, js_world_class_id);

  if (!world) {
    return JS_EXCEPTION;
  } else {
    JSValue val;
    val = create_node_from_ptr(ctx, world->active_camera_node);
    return val;
  }
}


static JSValue js_world_set_active_camera_node(JSContext *ctx, JSValueConst this_val, JSValue val) {
  World *world = JS_GetOpaque2(ctx, this_val, js_world_class_id);

  if (!world) {
    return JS_EXCEPTION;
  } else {
    world->active_camera_node = JS_GetOpaque(val, js_node_class_id);
    return JS_UNDEFINED;
  }
}




static JSValue js_world_dispose(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  World *world = JS_GetOpaque(this_val, js_world_class_id);
  websg_dispose_resource(world);
  js_free(ctx, world);
  return JS_UNDEFINED;
}

static JSClassDef js_world_class = {
  "World"
};

static const JSCFunctionListEntry js_world_proto_funcs[] = {
  JS_CGETSET_DEF("activeCameraNode", js_world_get_active_camera_node, js_world_set_active_camera_node),
  JS_CFUNC_DEF("dispose", 0, js_world_dispose),
  JS_PROP_STRING_DEF("[Symbol.toStringTag]", "World", JS_PROP_CONFIGURABLE),
};

static JSValue js_define_world_class(JSContext *ctx) {
  JSRuntime *rt = JS_GetRuntime(ctx);

  JS_NewClassID(&js_world_class_id);
  JS_NewClass(rt, js_world_class_id, &js_world_class);

  JSValue world_proto = JS_NewObject(ctx);
  JS_SetPropertyFunctionList(ctx, world_proto, js_world_proto_funcs, countof(js_world_proto_funcs));
  
  JSValue world_class = JS_NewCFunction2(ctx, js_world_constructor, "World", 1, JS_CFUNC_constructor, 1);
  JS_SetConstructor(ctx, world_class, world_proto);
  JS_SetClassProto(ctx, js_world_class_id, world_proto);

  return world_class;
}

/**
 * WebSG.World related functions
*/

static JSValue js_get_world_by_name(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  const char *name = JS_ToCString(ctx, argv[0]);
  World *world = websg_get_resource_by_name(ResourceType_World, name);
  JS_FreeCString(ctx, name);
  return create_world_from_ptr(ctx, world);
}

JSValue create_world_from_ptr(JSContext *ctx, World *world) {
  if (!world) {
    return JS_UNDEFINED;
  }

  JSValue val = get_js_val_from_ptr(ctx, world);

  if (JS_IsUndefined(val)) {
    val = JS_NewObjectClass(ctx, js_world_class_id);
    
    JS_SetOpaque(val, world);
    set_js_val_from_ptr(ctx, world, val);
  }

  return val;
}

void js_define_world_api(JSContext *ctx, JSValue *target) {
  JS_SetPropertyStr(ctx, *target, "World", js_define_world_class(ctx));
  JS_SetPropertyStr(
    ctx,
    *target,
    "getWorldByName",
    JS_NewCFunction(ctx, js_get_world_by_name, "getWorldByName", 1)
  );
}