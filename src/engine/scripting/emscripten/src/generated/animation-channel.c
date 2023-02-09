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
#include "animation-channel.h"
#include "animation-sampler.h"
#include "node.h"

/**
 * WebSG.AnimationChannel
 */

JSClassID js_animation_channel_class_id;

static JSValue js_animation_channel_constructor(JSContext *ctx, JSValueConst new_target, int argc, JSValueConst *argv) {
  AnimationChannel *animation_channel = js_mallocz(ctx, sizeof(AnimationChannel));

  

  if (websg_create_resource(ResourceType_AnimationChannel, animation_channel)) {
    return JS_EXCEPTION;
  }

  return create_animation_channel_from_ptr(ctx, animation_channel);
}


static JSValue js_animation_channel_get_sampler(JSContext *ctx, JSValueConst this_val) {
  AnimationChannel *animation_channel = JS_GetOpaque2(ctx, this_val, js_animation_channel_class_id);

  if (!animation_channel) {
    return JS_EXCEPTION;
  } else {
    JSValue val;
    val = create_animation_sampler_from_ptr(ctx, animation_channel->sampler);
    return val;
  }
}




static JSValue js_animation_channel_dispose(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  AnimationChannel *animation_channel = JS_GetOpaque(this_val, js_animation_channel_class_id);
  websg_dispose_resource(animation_channel);
  js_free(ctx, animation_channel);
  return JS_UNDEFINED;
}

static JSClassDef js_animation_channel_class = {
  "AnimationChannel"
};

static const JSCFunctionListEntry js_animation_channel_proto_funcs[] = {
  JS_CGETSET_DEF("sampler", js_animation_channel_get_sampler, NULL),
  JS_CFUNC_DEF("dispose", 0, js_animation_channel_dispose),
  JS_PROP_STRING_DEF("[Symbol.toStringTag]", "AnimationChannel", JS_PROP_CONFIGURABLE),
};

static JSValue js_define_animation_channel_class(JSContext *ctx) {
  JSRuntime *rt = JS_GetRuntime(ctx);

  JS_NewClassID(&js_animation_channel_class_id);
  JS_NewClass(rt, js_animation_channel_class_id, &js_animation_channel_class);

  JSValue animation_channel_proto = JS_NewObject(ctx);
  JS_SetPropertyFunctionList(ctx, animation_channel_proto, js_animation_channel_proto_funcs, countof(js_animation_channel_proto_funcs));
  
  JSValue animation_channel_class = JS_NewCFunction2(ctx, js_animation_channel_constructor, "AnimationChannel", 1, JS_CFUNC_constructor, 1);
  JS_SetConstructor(ctx, animation_channel_class, animation_channel_proto);
  JS_SetClassProto(ctx, js_animation_channel_class_id, animation_channel_proto);

  return animation_channel_class;
}

/**
 * WebSG.AnimationChannel related functions
*/

static JSValue js_get_animation_channel_by_name(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  const char *name = JS_ToCString(ctx, argv[0]);
  AnimationChannel *animation_channel = websg_get_resource_by_name(ResourceType_AnimationChannel, name);
  JS_FreeCString(ctx, name);
  return create_animation_channel_from_ptr(ctx, animation_channel);
}

JSValue create_animation_channel_from_ptr(JSContext *ctx, AnimationChannel *animation_channel) {
  if (!animation_channel) {
    return JS_UNDEFINED;
  }

  JSValue val = get_js_val_from_ptr(ctx, animation_channel);

  if (JS_IsUndefined(val)) {
    val = JS_NewObjectClass(ctx, js_animation_channel_class_id);
    
    JS_SetOpaque(val, animation_channel);
    set_js_val_from_ptr(ctx, animation_channel, val);
  }

  return val;
}

void js_define_animation_channel_api(JSContext *ctx, JSValue *target) {
  JS_SetPropertyStr(ctx, *target, "AnimationChannel", js_define_animation_channel_class(ctx));
  JS_SetPropertyStr(
    ctx,
    *target,
    "getAnimationChannelByName",
    JS_NewCFunction(ctx, js_get_animation_channel_by_name, "getAnimationChannelByName", 1)
  );
}