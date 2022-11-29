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
#include "reflection-probe.h"
#include "texture.h"

/**
 * WebSG.ReflectionProbe
 */

JSClassID js_reflection_probe_class_id;

static JSValue js_reflection_probe_constructor(JSContext *ctx, JSValueConst new_target, int argc, JSValueConst *argv) {
  ReflectionProbe *reflection_probe = js_mallocz(ctx, sizeof(ReflectionProbe));

  

  if (websg_create_resource(ResourceType_ReflectionProbe, reflection_probe)) {
    return JS_EXCEPTION;
  }

  return create_reflection_probe_from_ptr(ctx, reflection_probe);
}


static JSValue js_reflection_probe_get_name(JSContext *ctx, JSValueConst this_val) {
  ReflectionProbe *reflection_probe = JS_GetOpaque2(ctx, this_val, js_reflection_probe_class_id);

  if (!reflection_probe) {
    return JS_EXCEPTION;
  } else {
    JSValue val;
    val = JS_NewString(ctx, reflection_probe->name);
    return val;
  }
}


static JSValue js_reflection_probe_set_name(JSContext *ctx, JSValueConst this_val, JSValue val) {
  ReflectionProbe *reflection_probe = JS_GetOpaque2(ctx, this_val, js_reflection_probe_class_id);

  if (!reflection_probe) {
    return JS_EXCEPTION;
  } else {
    reflection_probe->name = JS_ToCString(ctx, val);
    return JS_UNDEFINED;
  }
}


static JSValue js_reflection_probe_get_reflection_probe_texture(JSContext *ctx, JSValueConst this_val) {
  ReflectionProbe *reflection_probe = JS_GetOpaque2(ctx, this_val, js_reflection_probe_class_id);

  if (!reflection_probe) {
    return JS_EXCEPTION;
  } else {
    JSValue val;
    val = create_texture_from_ptr(ctx, reflection_probe->reflection_probe_texture);
    return val;
  }
}




static JSValue js_reflection_probe_dispose(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  ReflectionProbe *reflection_probe = JS_GetOpaque(this_val, js_reflection_probe_class_id);
  websg_dispose_resource(reflection_probe);
  js_free(ctx, reflection_probe);
  return JS_UNDEFINED;
}

static JSClassDef js_reflection_probe_class = {
  "ReflectionProbe"
};

static const JSCFunctionListEntry js_reflection_probe_proto_funcs[] = {
  JS_CGETSET_DEF("name", js_reflection_probe_get_name, js_reflection_probe_set_name),
  JS_CGETSET_DEF("reflectionProbeTexture", js_reflection_probe_get_reflection_probe_texture, NULL),
  JS_CFUNC_DEF("dispose", 0, js_reflection_probe_dispose),
  JS_PROP_STRING_DEF("[Symbol.toStringTag]", "ReflectionProbe", JS_PROP_CONFIGURABLE),
};

static JSValue js_define_reflection_probe_class(JSContext *ctx) {
  JSRuntime *rt = JS_GetRuntime(ctx);

  JS_NewClassID(&js_reflection_probe_class_id);
  JS_NewClass(rt, js_reflection_probe_class_id, &js_reflection_probe_class);

  JSValue reflection_probe_proto = JS_NewObject(ctx);
  JS_SetPropertyFunctionList(ctx, reflection_probe_proto, js_reflection_probe_proto_funcs, countof(js_reflection_probe_proto_funcs));
  
  JSValue reflection_probe_class = JS_NewCFunction2(ctx, js_reflection_probe_constructor, "ReflectionProbe", 1, JS_CFUNC_constructor, 1);
  JS_SetConstructor(ctx, reflection_probe_class, reflection_probe_proto);
  JS_SetClassProto(ctx, js_reflection_probe_class_id, reflection_probe_proto);

  return reflection_probe_class;
}

/**
 * WebSG.ReflectionProbe related functions
*/

static JSValue js_get_reflection_probe_by_name(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  const char *name = JS_ToCString(ctx, argv[0]);
  ReflectionProbe *reflection_probe = websg_get_resource_by_name(ResourceType_ReflectionProbe, name);
  JS_FreeCString(ctx, name);
  return create_reflection_probe_from_ptr(ctx, reflection_probe);
}

JSValue create_reflection_probe_from_ptr(JSContext *ctx, ReflectionProbe *reflection_probe) {
  if (!reflection_probe) {
    return JS_UNDEFINED;
  }

  JSValue val = get_js_val_from_ptr(ctx, reflection_probe);

  if (JS_IsUndefined(val)) {
    val = JS_NewObjectClass(ctx, js_reflection_probe_class_id);
    JS_DefineReadOnlyFloat32ArrayProperty(ctx, val, "size", reflection_probe->size, 3);
    JS_SetOpaque(val, reflection_probe);
    set_js_val_from_ptr(ctx, reflection_probe, val);
  }

  return val;
}

void js_define_reflection_probe_api(JSContext *ctx, JSValue *target) {
  JS_SetPropertyStr(ctx, *target, "ReflectionProbe", js_define_reflection_probe_class(ctx));
  JS_SetPropertyStr(
    ctx,
    *target,
    "getReflectionProbeByName",
    JS_NewCFunction(ctx, js_get_reflection_probe_by_name, "getReflectionProbeByName", 1)
  );
}