#include <emscripten.h>
#include <emscripten/console.h>
#include <math.h>
#include <stdbool.h>
#include <string.h>

#include "../include/quickjs/cutils.h"
#include "../include/quickjs/quickjs.h"

#include "jsutils.h"
#include "websg.h"
#include "sampler.h"

/**
 * WebSG.Texture
 */

typedef struct JSSampler {
  Sampler *sampler;
} JSSampler;

JSClassID js_sampler_class_id;

static JSValue js_sampler_constructor(JSContext *ctx, JSValueConst new_target, int argc, JSValueConst *argv) {
  int32_t magFilter = 0;

  if (argc > 0 && JS_ToInt32(ctx, &magFilter, argv[0])) {
    JS_ThrowTypeError(ctx, "magFilter should be an integer.");
  }

  int32_t minFilter = 0;

  if (argc > 1 && JS_ToInt32(ctx, &minFilter, argv[1])) {
    JS_ThrowTypeError(ctx, "minFilter should be an integer.");
  }

  int32_t wrapS = 0;

  if (argc > 2 && JS_ToInt32(ctx, &wrapS, argv[2])) {
    JS_ThrowTypeError(ctx, "wrapS should be an integer.");
  }

  int32_t wrapT = 0;

  if (argc > 3 && JS_ToInt32(ctx, &wrapT, argv[3])) {
    JS_ThrowTypeError(ctx, "wrapT should be an integer.");
  }

  int32_t mapping = 0;

  if (argc > 4 && JS_ToInt32(ctx, &mapping, argv[4])) {
    JS_ThrowTypeError(ctx, "mapping should be an integer.");
  }

  Sampler *sampler = websg_create_sampler(magFilter, minFilter, wrapS, wrapT, mapping);
  JSValue samplerObj = JS_UNDEFINED;
  JSValue proto = JS_GetPropertyStr(ctx, new_target, "prototype");

  if (JS_IsException(proto)) {
    websg_dispose_sampler(sampler);
    JS_FreeValue(ctx, samplerObj);
    return JS_EXCEPTION;
  }
    
  samplerObj = JS_NewObjectProtoClass(ctx, proto, js_sampler_class_id);
  JS_FreeValue(ctx, proto);

  if (JS_IsException(samplerObj)) {
    websg_dispose_sampler(sampler);
    JS_FreeValue(ctx, samplerObj);
    return JS_EXCEPTION;
  }

  JSSampler *jsSampler = js_malloc(ctx, sizeof(JSSampler));
  jsSampler->sampler = sampler;
  JS_SetOpaque(samplerObj, jsSampler);

  return samplerObj;
}

static JSValue js_texture_get_name(JSContext *ctx, JSValueConst this_val) {
  JSTexture *jsTexture = JS_GetOpaque2(ctx, this_val, js_sampler_class_id);

  if (!jsTexture) {
    return JS_EXCEPTION;
  } else {
    return JS_NewString(ctx, jsTexture->texture->name);
  }
}

static JSValue js_texture_set_name(JSContext *ctx, JSValueConst this_val, JSValue val) {
  JSTexture *jsTexture = JS_GetOpaque2(ctx, this_val, js_sampler_class_id);

  if (!jsTexture) {
    return JS_EXCEPTION;
  } else {
    websg_set_texture_name(jsTexture->texture, JS_ToCString(ctx, val));
    return JS_UNDEFINED;
  }
}

static JSValue js_texture_get_encoding(JSContext *ctx, JSValueConst this_val) {
  JSTexture *jsTexture = JS_GetOpaque2(ctx, this_val, js_sampler_class_id);

  if (!jsTexture) {
    return JS_EXCEPTION;
  } else {
    return JS_NewUint32(ctx, jsTexture->texture->encoding);
  }
}

static void js_texture_finalizer(JSRuntime *rt, JSValue val) {
  JSTexture *jsTexture = JS_GetOpaque(val, js_sampler_class_id);
  websg_dispose_texture(jsTexture->texture);
  js_free_rt(rt, jsTexture);
}

static JSClassDef js_texture_class = {
  "Texture",
  .finalizer = js_texture_finalizer
};

static const JSCFunctionListEntry js_texture_proto_funcs[] = {
  JS_CGETSET_DEF("name", js_texture_get_name, js_texture_set_name),
  JS_CGETSET_DEF("encoding", js_texture_get_encoding, NULL),
  JS_PROP_STRING_DEF("[Symbol.toStringTag]", "Texture", JS_PROP_CONFIGURABLE),
};

static JSValue js_define_texture_class(JSContext *ctx) {
  JSRuntime *rt = JS_GetRuntime(ctx);

  JS_NewClassID(&js_sampler_class_id);
  JS_NewClass(rt, js_sampler_class_id, &js_texture_class);

  JSValue texture_proto = JS_NewObject(ctx);
  JS_SetPropertyFunctionList(ctx, texture_proto, js_texture_proto_funcs, countof(js_texture_proto_funcs));
  
  JSValue texture_class = JS_NewCFunction2(ctx, js_sampler_constructor, "Texture", 1, JS_CFUNC_constructor, 1);
  JS_SetConstructor(ctx, texture_class, texture_proto);
  JS_SetClassProto(ctx, js_sampler_class_id, texture_proto);

  return texture_class;
}

/**
 * WebSG texture related functions
*/

static JSValue js_get_texture_by_name(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  const char *name = JS_ToCString(ctx, argv[0]);
  Texture *texture = websg_get_texture_by_name(name);
  JS_FreeCString(ctx, name);
  // TODO: Look up existing JS texture objects before creating a new one
  return create_texture_from_ptr(ctx, texture);
}

JSValue create_texture_from_ptr(JSContext *ctx, Texture *texture) {
  if (!texture) {
    return JS_UNDEFINED;
  }

  JSValue textureObj = JS_NewObjectClass(ctx, js_sampler_class_id);
  JSTexture *jsTexture = js_malloc(ctx, sizeof(JSTexture));
  jsTexture->texture = texture;
  jsTexture->source = create_image_from_ptr(ctx, texture->source);
  JS_SetOpaque(textureObj, jsTexture);

  return textureObj;
}

Texture *get_texture_from_js_val(JSContext *ctx, JSValue val) {
  if (JS_IsUndefined(val) || JS_IsNull(val)) {
    return NULL;
  }

  JSTexture *jsTexture = JS_GetOpaque2(ctx, val, js_sampler_class_id);

  if (!jsTexture) {
    return NULL;
  }

  return jsTexture->texture;
}

void js_define_texture_api(JSContext *ctx, JSValue *target) {
  JS_SetPropertyStr(ctx, *target, "Texture", js_define_texture_class(ctx));
  JS_SetPropertyStr(
    ctx,
    *target,
    "getTextureByName",
    JS_NewCFunction(ctx, js_get_texture_by_name, "getTextureByName", 1)
  );
}