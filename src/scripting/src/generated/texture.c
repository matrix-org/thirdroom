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
#include "texture.h"
#include "sampler.h"
#include "image.h"

/**
 * WebSG.Texture
 */

JSClassID js_texture_class_id;

static JSValue js_texture_constructor(JSContext *ctx, JSValueConst new_target, int argc, JSValueConst *argv) {
  Texture *texture = js_mallocz(ctx, sizeof(Texture));

  

  if (websg_create_resource(ResourceType_Texture, texture)) {
    return JS_EXCEPTION;
  }

  return create_texture_from_ptr(ctx, texture);
}


static JSValue js_texture_get_name(JSContext *ctx, JSValueConst this_val) {
  Texture *texture = JS_GetOpaque2(ctx, this_val, js_texture_class_id);

  if (!texture) {
    return JS_EXCEPTION;
  } else {
    JSValue val;
    val = JS_NewString(ctx, texture->name);
    return val;
  }
}


static JSValue js_texture_set_name(JSContext *ctx, JSValueConst this_val, JSValue val) {
  Texture *texture = JS_GetOpaque2(ctx, this_val, js_texture_class_id);

  if (!texture) {
    return JS_EXCEPTION;
  } else {
    texture->name = JS_ToCString(ctx, val);
    return JS_UNDEFINED;
  }
}


static JSValue js_texture_get_sampler(JSContext *ctx, JSValueConst this_val) {
  Texture *texture = JS_GetOpaque2(ctx, this_val, js_texture_class_id);

  if (!texture) {
    return JS_EXCEPTION;
  } else {
    JSValue val;
    val = create_sampler_from_ptr(ctx, texture->sampler);
    return val;
  }
}


static JSValue js_texture_get_source(JSContext *ctx, JSValueConst this_val) {
  Texture *texture = JS_GetOpaque2(ctx, this_val, js_texture_class_id);

  if (!texture) {
    return JS_EXCEPTION;
  } else {
    JSValue val;
    val = create_image_from_ptr(ctx, texture->source);
    return val;
  }
}


static JSValue js_texture_get_encoding(JSContext *ctx, JSValueConst this_val) {
  Texture *texture = JS_GetOpaque2(ctx, this_val, js_texture_class_id);

  if (!texture) {
    return JS_EXCEPTION;
  } else {
    JSValue val;
    val = JS_NewUint32(ctx, texture->encoding);
    return val;
  }
}




static JSValue js_texture_dispose(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  Texture *texture = JS_GetOpaque(this_val, js_texture_class_id);
  websg_dispose_resource(texture);
  js_free(ctx, texture);
  return JS_UNDEFINED;
}

static JSClassDef js_texture_class = {
  "Texture"
};

static const JSCFunctionListEntry js_texture_proto_funcs[] = {
  JS_CGETSET_DEF("name", js_texture_get_name, js_texture_set_name),
  JS_CGETSET_DEF("sampler", js_texture_get_sampler, NULL),
  JS_CGETSET_DEF("source", js_texture_get_source, NULL),
  JS_CGETSET_DEF("encoding", js_texture_get_encoding, NULL),
  JS_CFUNC_DEF("dispose", 0, js_texture_dispose),
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
 * WebSG.Texture related functions
*/

static JSValue js_get_texture_by_name(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  const char *name = JS_ToCString(ctx, argv[0]);
  Texture *texture = websg_get_resource_by_name(ResourceType_Texture, name);
  JS_FreeCString(ctx, name);
  return create_texture_from_ptr(ctx, texture);
}

JSValue create_texture_from_ptr(JSContext *ctx, Texture *texture) {
  if (!texture) {
    return JS_UNDEFINED;
  }

  JSValue val = get_js_val_from_ptr(ctx, texture);

  if (JS_IsUndefined(val)) {
    val = JS_NewObjectClass(ctx, js_texture_class_id);
    
    JS_SetOpaque(val, texture);
    set_js_val_from_ptr(ctx, texture, val);
  }

  return val;
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