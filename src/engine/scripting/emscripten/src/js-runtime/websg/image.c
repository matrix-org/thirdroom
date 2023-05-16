#include <string.h>
#include "../quickjs/cutils.h"
#include "../quickjs/quickjs.h"
#include "../../websg.h"
#include "./websg-js.h"
#include "./image.h"

JSClassID js_websg_image_class_id;

/**
 * Class Definition
 **/

static void js_websg_image_finalizer(JSRuntime *rt, JSValue val) {
  WebSGImageData *image_data = JS_GetOpaque(val, js_websg_image_class_id);

  if (image_data) {
    js_free_rt(rt, image_data);
  }
}

static JSClassDef js_websg_image_class = {
  "Image",
  .finalizer = js_websg_image_finalizer
};

static const JSCFunctionListEntry js_websg_image_proto_funcs[] = {
  JS_PROP_STRING_DEF("[Symbol.toStringTag]", "Image", JS_PROP_CONFIGURABLE),
};

static JSValue js_websg_image_constructor(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  return JS_ThrowTypeError(ctx, "Illegal Constructor.");
}

void js_websg_define_image(JSContext *ctx, JSValue websg) {
  JS_NewClassID(&js_websg_image_class_id);
  JS_NewClass(JS_GetRuntime(ctx), js_websg_image_class_id, &js_websg_image_class);
  JSValue image_proto = JS_NewObject(ctx);
  JS_SetPropertyFunctionList(ctx, image_proto, js_websg_image_proto_funcs, countof(js_websg_image_proto_funcs));
  JS_SetClassProto(ctx, js_websg_image_class_id, image_proto);

  JSValue constructor = JS_NewCFunction2(
    ctx,
    js_websg_image_constructor,
    "Image",
    0,
    JS_CFUNC_constructor,
    0
  );
  JS_SetConstructor(ctx, constructor, image_proto);
  JS_SetPropertyStr(
    ctx,
    websg,
    "Image",
    constructor
  );
}

JSValue js_websg_new_image_instance(JSContext *ctx, WebSGWorldData *world_data, image_id_t image_id) {
  JSValue image = JS_NewObjectClass(ctx, js_websg_image_class_id);

  if (JS_IsException(image)) {
    return image;
  }

  WebSGImageData *image_data = js_mallocz(ctx, sizeof(WebSGImageData));
  image_data->world_data = world_data;
  image_data->image_id = image_id;
  JS_SetOpaque(image, image_data);

  JS_SetPropertyUint32(ctx, world_data->images, image_id, JS_DupValue(ctx, image));
  
  return image;
}

/**
 * Public Methods
 **/

JSValue js_websg_get_image_by_id(JSContext *ctx, WebSGWorldData *world_data, image_id_t image_id) {
  JSValue image = JS_GetPropertyUint32(ctx, world_data->images, image_id);

  if (!JS_IsUndefined(image)) {
    return JS_DupValue(ctx, image);
  }

  return js_websg_new_image_instance(ctx, world_data, image_id);
}

/**
 * World Methods
 **/


JSValue js_websg_world_find_image_by_name(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  WebSGWorldData *world_data = JS_GetOpaque(this_val, js_websg_world_class_id);

  size_t length;
  const char* name = JS_ToCStringLen(ctx, &length, argv[0]);

  if (name == NULL) {
    return JS_EXCEPTION;
  }

  image_id_t image_id = websg_world_find_image_by_name(name, length);

  if (image_id == 0) {
    return JS_UNDEFINED;
  }

  return js_websg_get_image_by_id(ctx, world_data, image_id);
}
