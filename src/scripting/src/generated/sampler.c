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
#include "sampler.h"

/**
 * WebSG.Sampler
 */

JSClassID js_sampler_class_id;

static JSValue js_sampler_constructor(JSContext *ctx, JSValueConst new_target, int argc, JSValueConst *argv) {
  Sampler *sampler = js_mallocz(ctx, sizeof(Sampler));

  

  if (websg_create_resource(ResourceType_Sampler, sampler)) {
    return JS_EXCEPTION;
  }

  return create_sampler_from_ptr(ctx, sampler);
}


static JSValue js_sampler_get_name(JSContext *ctx, JSValueConst this_val) {
  Sampler *sampler = JS_GetOpaque2(ctx, this_val, js_sampler_class_id);

  if (!sampler) {
    return JS_EXCEPTION;
  } else {
    JSValue val;
    val = JS_NewString(ctx, sampler->name);
    return val;
  }
}


static JSValue js_sampler_set_name(JSContext *ctx, JSValueConst this_val, JSValue val) {
  Sampler *sampler = JS_GetOpaque2(ctx, this_val, js_sampler_class_id);

  if (!sampler) {
    return JS_EXCEPTION;
  } else {
    sampler->name = JS_ToCString(ctx, val);
    return JS_UNDEFINED;
  }
}


static JSValue js_sampler_get_mag_filter(JSContext *ctx, JSValueConst this_val) {
  Sampler *sampler = JS_GetOpaque2(ctx, this_val, js_sampler_class_id);

  if (!sampler) {
    return JS_EXCEPTION;
  } else {
    JSValue val;
    val = JS_NewUint32(ctx, sampler->mag_filter);
    return val;
  }
}


static JSValue js_sampler_get_min_filter(JSContext *ctx, JSValueConst this_val) {
  Sampler *sampler = JS_GetOpaque2(ctx, this_val, js_sampler_class_id);

  if (!sampler) {
    return JS_EXCEPTION;
  } else {
    JSValue val;
    val = JS_NewUint32(ctx, sampler->min_filter);
    return val;
  }
}


static JSValue js_sampler_get_wrap_s(JSContext *ctx, JSValueConst this_val) {
  Sampler *sampler = JS_GetOpaque2(ctx, this_val, js_sampler_class_id);

  if (!sampler) {
    return JS_EXCEPTION;
  } else {
    JSValue val;
    val = JS_NewUint32(ctx, sampler->wrap_s);
    return val;
  }
}


static JSValue js_sampler_get_wrap_t(JSContext *ctx, JSValueConst this_val) {
  Sampler *sampler = JS_GetOpaque2(ctx, this_val, js_sampler_class_id);

  if (!sampler) {
    return JS_EXCEPTION;
  } else {
    JSValue val;
    val = JS_NewUint32(ctx, sampler->wrap_t);
    return val;
  }
}


static JSValue js_sampler_get_mapping(JSContext *ctx, JSValueConst this_val) {
  Sampler *sampler = JS_GetOpaque2(ctx, this_val, js_sampler_class_id);

  if (!sampler) {
    return JS_EXCEPTION;
  } else {
    JSValue val;
    val = JS_NewUint32(ctx, sampler->mapping);
    return val;
  }
}




static JSValue js_sampler_dispose(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  Sampler *sampler = JS_GetOpaque(this_val, js_sampler_class_id);
  websg_dispose_resource(sampler);
  js_free(ctx, sampler);
  return JS_UNDEFINED;
}

static JSClassDef js_sampler_class = {
  "Sampler"
};

static const JSCFunctionListEntry js_sampler_proto_funcs[] = {
  JS_CGETSET_DEF("name", js_sampler_get_name, js_sampler_set_name),
  JS_CGETSET_DEF("magFilter", js_sampler_get_mag_filter, NULL),
  JS_CGETSET_DEF("minFilter", js_sampler_get_min_filter, NULL),
  JS_CGETSET_DEF("wrapS", js_sampler_get_wrap_s, NULL),
  JS_CGETSET_DEF("wrapT", js_sampler_get_wrap_t, NULL),
  JS_CGETSET_DEF("mapping", js_sampler_get_mapping, NULL),
  JS_CFUNC_DEF("dispose", 0, js_sampler_dispose),
  JS_PROP_STRING_DEF("[Symbol.toStringTag]", "Sampler", JS_PROP_CONFIGURABLE),
};

static JSValue js_define_sampler_class(JSContext *ctx) {
  JSRuntime *rt = JS_GetRuntime(ctx);

  JS_NewClassID(&js_sampler_class_id);
  JS_NewClass(rt, js_sampler_class_id, &js_sampler_class);

  JSValue sampler_proto = JS_NewObject(ctx);
  JS_SetPropertyFunctionList(ctx, sampler_proto, js_sampler_proto_funcs, countof(js_sampler_proto_funcs));
  
  JSValue sampler_class = JS_NewCFunction2(ctx, js_sampler_constructor, "Sampler", 1, JS_CFUNC_constructor, 1);
  JS_SetConstructor(ctx, sampler_class, sampler_proto);
  JS_SetClassProto(ctx, js_sampler_class_id, sampler_proto);

  return sampler_class;
}

/**
 * WebSG.Sampler related functions
*/

static JSValue js_get_sampler_by_name(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  const char *name = JS_ToCString(ctx, argv[0]);
  Sampler *sampler = websg_get_resource_by_name(ResourceType_Sampler, name);
  JS_FreeCString(ctx, name);
  return create_sampler_from_ptr(ctx, sampler);
}

JSValue create_sampler_from_ptr(JSContext *ctx, Sampler *sampler) {
  if (!sampler) {
    return JS_UNDEFINED;
  }

  JSValue val = get_js_val_from_ptr(ctx, sampler);

  if (JS_IsUndefined(val)) {
    val = JS_NewObjectClass(ctx, js_sampler_class_id);
    
    JS_SetOpaque(val, sampler);
    set_js_val_from_ptr(ctx, sampler, val);
  }

  return val;
}

void js_define_sampler_api(JSContext *ctx, JSValue *target) {
  JS_SetPropertyStr(ctx, *target, "Sampler", js_define_sampler_class(ctx));
  JS_SetPropertyStr(
    ctx,
    *target,
    "getSamplerByName",
    JS_NewCFunction(ctx, js_get_sampler_by_name, "getSamplerByName", 1)
  );
}