#include <string.h>
#include "../quickjs/cutils.h"
#include "../quickjs/quickjs.h"
#include "../../websg.h"
#include "./websg-js.h"
#include "./texture.h"

JSClassID js_websg_texture_class_id;

/**
 * Class Definition
 **/

static void js_websg_texture_finalizer(JSRuntime *rt, JSValue val) {
  WebSGTextureData *texture_data = JS_GetOpaque(val, js_websg_texture_class_id);

  if (texture_data) {
    js_free_rt(rt, texture_data);
  }
}

static JSClassDef js_websg_texture_class = {
  "Texture",
  .finalizer = js_websg_texture_finalizer
};

static const JSCFunctionListEntry js_websg_texture_proto_funcs[] = {
  JS_PROP_STRING_DEF("[Symbol.toStringTag]", "Texture", JS_PROP_CONFIGURABLE),
};

static JSValue js_websg_texture_constructor(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  return JS_ThrowTypeError(ctx, "Illegal Constructor.");
}

void js_websg_define_texture(JSContext *ctx, JSValue websg) {
  JS_NewClassID(&js_websg_texture_class_id);
  JS_NewClass(JS_GetRuntime(ctx), js_websg_texture_class_id, &js_websg_texture_class);
  JSValue texture_proto = JS_NewObject(ctx);
  JS_SetPropertyFunctionList(ctx, texture_proto, js_websg_texture_proto_funcs, countof(js_websg_texture_proto_funcs));
  JS_SetClassProto(ctx, js_websg_texture_class_id, texture_proto);

  JSValue constructor = JS_NewCFunction2(
    ctx,
    js_websg_texture_constructor,
    "Texture",
    0,
    JS_CFUNC_constructor,
    0
  );
  JS_SetConstructor(ctx, constructor, texture_proto);
  JS_SetPropertyStr(
    ctx,
    websg,
    "Texture",
    constructor
  );
}

JSValue js_websg_new_texture_instance(JSContext *ctx, WebSGWorldData *world_data, texture_id_t texture_id) {
  JSValue texture = JS_NewObjectClass(ctx, js_websg_texture_class_id);

  if (JS_IsException(texture)) {
    return texture;
  }

  WebSGTextureData *texture_data = js_mallocz(ctx, sizeof(WebSGTextureData));
  texture_data->world_data = world_data;
  texture_data->texture_id = texture_id;
  JS_SetOpaque(texture, texture_data);

  JS_SetPropertyUint32(ctx, world_data->textures, texture_id, JS_DupValue(ctx, texture));
  
  return texture;
}

/**
 * Public Methods
 **/

JSValue js_websg_get_texture_by_id(JSContext *ctx, WebSGWorldData *world_data, texture_id_t texture_id) {
  JSValue texture = JS_GetPropertyUint32(ctx, world_data->textures, texture_id);

  if (!JS_IsUndefined(texture)) {
    return JS_DupValue(ctx, texture);
  }

  return js_websg_new_texture_instance(ctx, world_data, texture_id);
}

/**
 * World Methods
 **/


JSValue js_websg_world_find_texture_by_name(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  WebSGWorldData *world_data = JS_GetOpaque(this_val, js_websg_world_class_id);

  size_t length;
  const char* name = JS_ToCStringLen(ctx, &length, argv[0]);

  if (name == NULL) {
    return JS_EXCEPTION;
  }

  texture_id_t texture_id = websg_world_find_texture_by_name(name, length);

  if (texture_id == 0) {
    return JS_UNDEFINED;
  }

  return js_websg_get_texture_by_id(ctx, world_data, texture_id);
}
