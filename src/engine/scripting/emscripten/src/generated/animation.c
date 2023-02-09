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
#include "animation.h"
#include "animation-channel.h"
#include "animation-sampler.h"

/**
 * WebSG.Animation
 */

JSClassID js_animation_class_id;

static JSValue js_animation_constructor(JSContext *ctx, JSValueConst new_target, int argc, JSValueConst *argv) {
  Animation *animation = js_mallocz(ctx, sizeof(Animation));

  

  if (websg_create_resource(ResourceType_Animation, animation)) {
    return JS_EXCEPTION;
  }

  return create_animation_from_ptr(ctx, animation);
}


static JSValue js_animation_get_name(JSContext *ctx, JSValueConst this_val) {
  Animation *animation = JS_GetOpaque2(ctx, this_val, js_animation_class_id);

  if (!animation) {
    return JS_EXCEPTION;
  } else {
    JSValue val;
    val = JS_NewString(ctx, animation->name);
    return val;
  }
}


static JSValue js_animation_set_name(JSContext *ctx, JSValueConst this_val, JSValue val) {
  Animation *animation = JS_GetOpaque2(ctx, this_val, js_animation_class_id);

  if (!animation) {
    return JS_EXCEPTION;
  } else {
    animation->name = JS_ToCString(ctx, val);
    return JS_UNDEFINED;
  }
}

static JSValue js_animation_channels(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  Animation *animation = JS_GetOpaque2(ctx, this_val, js_animation_class_id);

  if (!animation) {
    return JS_EXCEPTION;
  } else {
    return JS_NewRefArrayIterator(ctx, (JSValue (*)(JSContext *ctx, void *res))&create_animation_channel_from_ptr, (void **)animation->channels, countof(animation->channels));
  }
}

static JSValue js_animation_add_channel(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  Animation *animation = JS_GetOpaque2(ctx, this_val, js_animation_class_id);

  if (!animation) {
    return JS_EXCEPTION;
  } else {
    return JS_AddRefArrayItem(ctx, js_animation_channel_class_id, (void **)animation->channels, countof(animation->channels), argv[0]);
  }
}

static JSValue js_animation_remove_channel(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  Animation *animation = JS_GetOpaque2(ctx, this_val, js_animation_class_id);

  if (!animation) {
    return JS_EXCEPTION;
  } else {
    return JS_RemoveRefArrayItem(ctx, js_animation_channel_class_id, (void **)animation->channels, countof(animation->channels), argv[0]);
  }
}
static JSValue js_animation_samplers(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  Animation *animation = JS_GetOpaque2(ctx, this_val, js_animation_class_id);

  if (!animation) {
    return JS_EXCEPTION;
  } else {
    return JS_NewRefArrayIterator(ctx, (JSValue (*)(JSContext *ctx, void *res))&create_animation_sampler_from_ptr, (void **)animation->samplers, countof(animation->samplers));
  }
}

static JSValue js_animation_add_sampler(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  Animation *animation = JS_GetOpaque2(ctx, this_val, js_animation_class_id);

  if (!animation) {
    return JS_EXCEPTION;
  } else {
    return JS_AddRefArrayItem(ctx, js_animation_sampler_class_id, (void **)animation->samplers, countof(animation->samplers), argv[0]);
  }
}

static JSValue js_animation_remove_sampler(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  Animation *animation = JS_GetOpaque2(ctx, this_val, js_animation_class_id);

  if (!animation) {
    return JS_EXCEPTION;
  } else {
    return JS_RemoveRefArrayItem(ctx, js_animation_sampler_class_id, (void **)animation->samplers, countof(animation->samplers), argv[0]);
  }
}



static JSValue js_animation_dispose(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  Animation *animation = JS_GetOpaque(this_val, js_animation_class_id);
  websg_dispose_resource(animation);
  js_free(ctx, animation);
  return JS_UNDEFINED;
}

static JSClassDef js_animation_class = {
  "Animation"
};

static const JSCFunctionListEntry js_animation_proto_funcs[] = {
  JS_CGETSET_DEF("name", js_animation_get_name, js_animation_set_name),
  JS_CFUNC_DEF("channels", 0, js_animation_channels),
  JS_CFUNC_DEF("addChannel", 1, js_animation_add_channel),
  JS_CFUNC_DEF("removeChannel", 1, js_animation_remove_channel),
  JS_CFUNC_DEF("samplers", 0, js_animation_samplers),
  JS_CFUNC_DEF("addSampler", 1, js_animation_add_sampler),
  JS_CFUNC_DEF("removeSampler", 1, js_animation_remove_sampler),
  JS_CFUNC_DEF("dispose", 0, js_animation_dispose),
  JS_PROP_STRING_DEF("[Symbol.toStringTag]", "Animation", JS_PROP_CONFIGURABLE),
};

static JSValue js_define_animation_class(JSContext *ctx) {
  JSRuntime *rt = JS_GetRuntime(ctx);

  JS_NewClassID(&js_animation_class_id);
  JS_NewClass(rt, js_animation_class_id, &js_animation_class);

  JSValue animation_proto = JS_NewObject(ctx);
  JS_SetPropertyFunctionList(ctx, animation_proto, js_animation_proto_funcs, countof(js_animation_proto_funcs));
  
  JSValue animation_class = JS_NewCFunction2(ctx, js_animation_constructor, "Animation", 1, JS_CFUNC_constructor, 1);
  JS_SetConstructor(ctx, animation_class, animation_proto);
  JS_SetClassProto(ctx, js_animation_class_id, animation_proto);

  return animation_class;
}

/**
 * WebSG.Animation related functions
*/

static JSValue js_get_animation_by_name(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  const char *name = JS_ToCString(ctx, argv[0]);
  Animation *animation = websg_get_resource_by_name(ResourceType_Animation, name);
  JS_FreeCString(ctx, name);
  return create_animation_from_ptr(ctx, animation);
}

JSValue create_animation_from_ptr(JSContext *ctx, Animation *animation) {
  if (!animation) {
    return JS_UNDEFINED;
  }

  JSValue val = get_js_val_from_ptr(ctx, animation);

  if (JS_IsUndefined(val)) {
    val = JS_NewObjectClass(ctx, js_animation_class_id);
    
    JS_SetOpaque(val, animation);
    set_js_val_from_ptr(ctx, animation, val);
  }

  return val;
}

void js_define_animation_api(JSContext *ctx, JSValue *target) {
  JS_SetPropertyStr(ctx, *target, "Animation", js_define_animation_class(ctx));
  JS_SetPropertyStr(
    ctx,
    *target,
    "getAnimationByName",
    JS_NewCFunction(ctx, js_get_animation_by_name, "getAnimationByName", 1)
  );
}