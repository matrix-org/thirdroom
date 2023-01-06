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
#include "environment.h"
#include "scene.h"

/**
 * WebSG.Environment
 */

JSClassID js_environment_class_id;

static JSValue js_environment_constructor(JSContext *ctx, JSValueConst new_target, int argc, JSValueConst *argv) {
  Environment *environment = js_mallocz(ctx, sizeof(Environment));

  

  if (websg_create_resource(ResourceType_Environment, environment)) {
    return JS_EXCEPTION;
  }

  return create_environment_from_ptr(ctx, environment);
}


static JSValue js_environment_get_active_scene(JSContext *ctx, JSValueConst this_val) {
  Environment *environment = JS_GetOpaque2(ctx, this_val, js_environment_class_id);

  if (!environment) {
    return JS_EXCEPTION;
  } else {
    JSValue val;
    val = create_scene_from_ptr(ctx, environment->active_scene);
    return val;
  }
}


static JSValue js_environment_set_active_scene(JSContext *ctx, JSValueConst this_val, JSValue val) {
  Environment *environment = JS_GetOpaque2(ctx, this_val, js_environment_class_id);

  if (!environment) {
    return JS_EXCEPTION;
  } else {
    environment->active_scene = JS_GetOpaque(val, js_scene_class_id);
    return JS_UNDEFINED;
  }
}




static JSValue js_environment_dispose(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  Environment *environment = JS_GetOpaque(this_val, js_environment_class_id);
  websg_dispose_resource(environment);
  js_free(ctx, environment);
  return JS_UNDEFINED;
}

static JSClassDef js_environment_class = {
  "Environment"
};

static const JSCFunctionListEntry js_environment_proto_funcs[] = {
  JS_CGETSET_DEF("activeScene", js_environment_get_active_scene, js_environment_set_active_scene),
  JS_CFUNC_DEF("dispose", 0, js_environment_dispose),
  JS_PROP_STRING_DEF("[Symbol.toStringTag]", "Environment", JS_PROP_CONFIGURABLE),
};

static JSValue js_define_environment_class(JSContext *ctx) {
  JSRuntime *rt = JS_GetRuntime(ctx);

  JS_NewClassID(&js_environment_class_id);
  JS_NewClass(rt, js_environment_class_id, &js_environment_class);

  JSValue environment_proto = JS_NewObject(ctx);
  JS_SetPropertyFunctionList(ctx, environment_proto, js_environment_proto_funcs, countof(js_environment_proto_funcs));
  
  JSValue environment_class = JS_NewCFunction2(ctx, js_environment_constructor, "Environment", 1, JS_CFUNC_constructor, 1);
  JS_SetConstructor(ctx, environment_class, environment_proto);
  JS_SetClassProto(ctx, js_environment_class_id, environment_proto);

  return environment_class;
}

/**
 * WebSG.Environment related functions
*/

static JSValue js_get_environment_by_name(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  const char *name = JS_ToCString(ctx, argv[0]);
  Environment *environment = websg_get_resource_by_name(ResourceType_Environment, name);
  JS_FreeCString(ctx, name);
  return create_environment_from_ptr(ctx, environment);
}

JSValue create_environment_from_ptr(JSContext *ctx, Environment *environment) {
  if (!environment) {
    return JS_UNDEFINED;
  }

  JSValue val = get_js_val_from_ptr(ctx, environment);

  if (JS_IsUndefined(val)) {
    val = JS_NewObjectClass(ctx, js_environment_class_id);
    
    JS_SetOpaque(val, environment);
    set_js_val_from_ptr(ctx, environment, val);
  }

  return val;
}

void js_define_environment_api(JSContext *ctx, JSValue *target) {
  JS_SetPropertyStr(ctx, *target, "Environment", js_define_environment_class(ctx));
  JS_SetPropertyStr(
    ctx,
    *target,
    "getEnvironmentByName",
    JS_NewCFunction(ctx, js_get_environment_by_name, "getEnvironmentByName", 1)
  );
}