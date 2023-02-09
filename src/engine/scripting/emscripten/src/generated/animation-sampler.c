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
#include "animation-sampler.h"
#include "accessor.h"

/**
 * WebSG.AnimationSampler
 */

JSClassID js_animation_sampler_class_id;

static JSValue js_animation_sampler_constructor(JSContext *ctx, JSValueConst new_target, int argc, JSValueConst *argv) {
  AnimationSampler *animation_sampler = js_mallocz(ctx, sizeof(AnimationSampler));

  

  if (websg_create_resource(ResourceType_AnimationSampler, animation_sampler)) {
    return JS_EXCEPTION;
  }

  return create_animation_sampler_from_ptr(ctx, animation_sampler);
}


static JSValue js_animation_sampler_get_input(JSContext *ctx, JSValueConst this_val) {
  AnimationSampler *animation_sampler = JS_GetOpaque2(ctx, this_val, js_animation_sampler_class_id);

  if (!animation_sampler) {
    return JS_EXCEPTION;
  } else {
    JSValue val;
    val = create_accessor_from_ptr(ctx, animation_sampler->input);
    return val;
  }
}


static JSValue js_animation_sampler_get_interpolation(JSContext *ctx, JSValueConst this_val) {
  AnimationSampler *animation_sampler = JS_GetOpaque2(ctx, this_val, js_animation_sampler_class_id);

  if (!animation_sampler) {
    return JS_EXCEPTION;
  } else {
    JSValue val;
    val = JS_NewUint32(ctx, animation_sampler->interpolation);
    return val;
  }
}


static JSValue js_animation_sampler_get_output(JSContext *ctx, JSValueConst this_val) {
  AnimationSampler *animation_sampler = JS_GetOpaque2(ctx, this_val, js_animation_sampler_class_id);

  if (!animation_sampler) {
    return JS_EXCEPTION;
  } else {
    JSValue val;
    val = create_accessor_from_ptr(ctx, animation_sampler->output);
    return val;
  }
}




static JSValue js_animation_sampler_dispose(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  AnimationSampler *animation_sampler = JS_GetOpaque(this_val, js_animation_sampler_class_id);
  websg_dispose_resource(animation_sampler);
  js_free(ctx, animation_sampler);
  return JS_UNDEFINED;
}

static JSClassDef js_animation_sampler_class = {
  "AnimationSampler"
};

static const JSCFunctionListEntry js_animation_sampler_proto_funcs[] = {
  JS_CGETSET_DEF("input", js_animation_sampler_get_input, NULL),
  JS_CGETSET_DEF("interpolation", js_animation_sampler_get_interpolation, NULL),
  JS_CGETSET_DEF("output", js_animation_sampler_get_output, NULL),
  JS_CFUNC_DEF("dispose", 0, js_animation_sampler_dispose),
  JS_PROP_STRING_DEF("[Symbol.toStringTag]", "AnimationSampler", JS_PROP_CONFIGURABLE),
};

static JSValue js_define_animation_sampler_class(JSContext *ctx) {
  JSRuntime *rt = JS_GetRuntime(ctx);

  JS_NewClassID(&js_animation_sampler_class_id);
  JS_NewClass(rt, js_animation_sampler_class_id, &js_animation_sampler_class);

  JSValue animation_sampler_proto = JS_NewObject(ctx);
  JS_SetPropertyFunctionList(ctx, animation_sampler_proto, js_animation_sampler_proto_funcs, countof(js_animation_sampler_proto_funcs));
  
  JSValue animation_sampler_class = JS_NewCFunction2(ctx, js_animation_sampler_constructor, "AnimationSampler", 1, JS_CFUNC_constructor, 1);
  JS_SetConstructor(ctx, animation_sampler_class, animation_sampler_proto);
  JS_SetClassProto(ctx, js_animation_sampler_class_id, animation_sampler_proto);

  return animation_sampler_class;
}

/**
 * WebSG.AnimationSampler related functions
*/

static JSValue js_get_animation_sampler_by_name(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  const char *name = JS_ToCString(ctx, argv[0]);
  AnimationSampler *animation_sampler = websg_get_resource_by_name(ResourceType_AnimationSampler, name);
  JS_FreeCString(ctx, name);
  return create_animation_sampler_from_ptr(ctx, animation_sampler);
}

JSValue create_animation_sampler_from_ptr(JSContext *ctx, AnimationSampler *animation_sampler) {
  if (!animation_sampler) {
    return JS_UNDEFINED;
  }

  JSValue val = get_js_val_from_ptr(ctx, animation_sampler);

  if (JS_IsUndefined(val)) {
    val = JS_NewObjectClass(ctx, js_animation_sampler_class_id);
    
    JS_SetOpaque(val, animation_sampler);
    set_js_val_from_ptr(ctx, animation_sampler, val);
  }

  return val;
}

void js_define_animation_sampler_api(JSContext *ctx, JSValue *target) {
  JS_SetPropertyStr(ctx, *target, "AnimationSampler", js_define_animation_sampler_class(ctx));
  JS_SetPropertyStr(
    ctx,
    *target,
    "getAnimationSamplerByName",
    JS_NewCFunction(ctx, js_get_animation_sampler_by_name, "getAnimationSamplerByName", 1)
  );
}