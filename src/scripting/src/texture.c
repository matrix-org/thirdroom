#include <emscripten.h>
#include <emscripten/console.h>
#include <math.h>
#include <stdbool.h>
#include <string.h>

#include "../include/quickjs/cutils.h"
#include "../include/quickjs/quickjs.h"

#include "jsutils.h"
#include "websg.h"
#include "texture.h"
#include "image.h"

/**
 * WebSG.Texture
 */

typedef struct JSTexture {
  Texture *texture;
  JSValue source;
} JSTexture;

JSClassID js_texture_class_id;

static JSValue js_texture_constructor(JSContext *ctx, JSValueConst new_target, int argc, JSValueConst *argv) {
  Image *source = JS_GetOpaque(argv[0], js_image_class_id);

  if (argc < 3 || !source || !JS_IsNumber(argv[1]) || !JS_IsNumber(argv[2])) {
    JS_ThrowTypeError(ctx, "new Texture() expects 3 arguments: source, sampler, and encoding.");
  }

  int32_t sampler;

  if (JS_ToInt32(ctx, &sampler, argv[1])) {
    return JS_EXCEPTION;
  }
  
  int32_t encoding;

  if (JS_ToInt32(ctx, &encoding, argv[2])) {
    return JS_EXCEPTION;
  }

  Texture *texture = websg_create_texture(source, (Sampler*)sampler, (TextureEncoding)encoding);
  JSValue textureObj = JS_UNDEFINED;
  JSValue proto = JS_GetPropertyStr(ctx, new_target, "prototype");

  if (JS_IsException(proto)) {
    websg_dispose_texture(texture);
    JS_FreeValue(ctx, textureObj);
    return JS_EXCEPTION;
  }
    
  textureObj = JS_NewObjectProtoClass(ctx, proto, js_texture_class_id);
  JS_FreeValue(ctx, proto);

  if (JS_IsException(textureObj)) {
    websg_dispose_texture(texture);
    JS_FreeValue(ctx, textureObj);
    return JS_EXCEPTION;
  }

  JSTexture *jsTexture = js_malloc(ctx, sizeof(JSTexture));
  jsTexture->texture = texture;
  jsTexture->source = JS_DupValue(ctx, argv[0]);
  JS_SetOpaque(textureObj, jsTexture);

  return textureObj;
}

static JSValue js_texture_get_name(JSContext *ctx, JSValueConst this_val) {
  JSTexture *jsTexture = JS_GetOpaque2(ctx, this_val, js_texture_class_id);

  if (!jsTexture) {
    return JS_EXCEPTION;
  } else {
    return JS_NewString(ctx, jsTexture->texture->name);
  }
}

static JSValue js_texture_set_name(JSContext *ctx, JSValueConst this_val, JSValue val) {
  JSTexture *jsTexture = JS_GetOpaque2(ctx, this_val, js_texture_class_id);

  if (!jsTexture) {
    return JS_EXCEPTION;
  } else {
    websg_set_texture_name(jsTexture->texture, JS_ToCString(ctx, val));
    return JS_UNDEFINED;
  }
}

static JSValue js_texture_get_encoding(JSContext *ctx, JSValueConst this_val) {
  JSTexture *jsTexture = JS_GetOpaque2(ctx, this_val, js_texture_class_id);

  if (!jsTexture) {
    return JS_EXCEPTION;
  } else {
    return JS_NewUint32(ctx, jsTexture->texture->encoding);
  }
}

static void js_texture_finalizer(JSRuntime *rt, JSValue val) {
  JSTexture *jsTexture = JS_GetOpaque(val, js_texture_class_id);
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

  JS_NewClassID(&js_texture_class_id);
  JS_NewClass(rt, js_texture_class_id, &js_texture_class);

  JSValue texture_proto = JS_NewObject(ctx);
  JS_SetPropertyFunctionList(ctx, texture_proto, js_texture_proto_funcs, countof(js_texture_proto_funcs));
  
  JSValue texture_class = JS_NewCFunction2(ctx, js_texture_constructor, "Texture", 1, JS_CFUNC_constructor, 1);
  JS_SetConstructor(ctx, texture_class, texture_proto);
  JS_SetClassProto(ctx, js_texture_class_id, texture_proto);

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

  JSValue textureObj = JS_NewObjectClass(ctx, js_texture_class_id);
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

  JSTexture *jsTexture = JS_GetOpaque2(ctx, val, js_texture_class_id);

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