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
#include "image.h"
#include "buffer-view.h"

/**
 * WebSG.Image
 */

JSClassID js_image_class_id;

static JSValue js_image_constructor(JSContext *ctx, JSValueConst new_target, int argc, JSValueConst *argv) {
  Image *image = js_mallocz(ctx, sizeof(Image));

  

  if (websg_create_resource(ResourceType_Image, image)) {
    return JS_EXCEPTION;
  }

  return create_image_from_ptr(ctx, image);
}


static JSValue js_image_get_name(JSContext *ctx, JSValueConst this_val) {
  Image *image = JS_GetOpaque2(ctx, this_val, js_image_class_id);

  if (!image) {
    return JS_EXCEPTION;
  } else {
    JSValue val;
    val = JS_NewString(ctx, image->name);
    return val;
  }
}


static JSValue js_image_set_name(JSContext *ctx, JSValueConst this_val, JSValue val) {
  Image *image = JS_GetOpaque2(ctx, this_val, js_image_class_id);

  if (!image) {
    return JS_EXCEPTION;
  } else {
    image->name = JS_ToCString(ctx, val);
    return JS_UNDEFINED;
  }
}


static JSValue js_image_get_uri(JSContext *ctx, JSValueConst this_val) {
  Image *image = JS_GetOpaque2(ctx, this_val, js_image_class_id);

  if (!image) {
    return JS_EXCEPTION;
  } else {
    JSValue val;
    val = JS_NewString(ctx, image->uri);
    return val;
  }
}


static JSValue js_image_get_mime_type(JSContext *ctx, JSValueConst this_val) {
  Image *image = JS_GetOpaque2(ctx, this_val, js_image_class_id);

  if (!image) {
    return JS_EXCEPTION;
  } else {
    JSValue val;
    val = JS_NewString(ctx, image->mime_type);
    return val;
  }
}


static JSValue js_image_get_buffer_view(JSContext *ctx, JSValueConst this_val) {
  Image *image = JS_GetOpaque2(ctx, this_val, js_image_class_id);

  if (!image) {
    return JS_EXCEPTION;
  } else {
    JSValue val;
    val = create_buffer_view_from_ptr(ctx, image->buffer_view);
    return val;
  }
}


static JSValue js_image_get_flip_y(JSContext *ctx, JSValueConst this_val) {
  Image *image = JS_GetOpaque2(ctx, this_val, js_image_class_id);

  if (!image) {
    return JS_EXCEPTION;
  } else {
    JSValue val;
    val = JS_NewBool(ctx, image->flip_y);
    return val;
  }
}




static JSValue js_image_dispose(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  Image *image = JS_GetOpaque(this_val, js_image_class_id);
  websg_dispose_resource(image);
  js_free(ctx, image);
  return JS_UNDEFINED;
}

static JSClassDef js_image_class = {
  "Image"
};

static const JSCFunctionListEntry js_image_proto_funcs[] = {
  JS_CGETSET_DEF("name", js_image_get_name, js_image_set_name),
  JS_CGETSET_DEF("uri", js_image_get_uri, NULL),
  JS_CGETSET_DEF("mimeType", js_image_get_mime_type, NULL),
  JS_CGETSET_DEF("bufferView", js_image_get_buffer_view, NULL),
  JS_CGETSET_DEF("flipY", js_image_get_flip_y, NULL),
  JS_CFUNC_DEF("dispose", 0, js_image_dispose),
  JS_PROP_STRING_DEF("[Symbol.toStringTag]", "Image", JS_PROP_CONFIGURABLE),
};

static JSValue js_define_image_class(JSContext *ctx) {
  JSRuntime *rt = JS_GetRuntime(ctx);

  JS_NewClassID(&js_image_class_id);
  JS_NewClass(rt, js_image_class_id, &js_image_class);

  JSValue image_proto = JS_NewObject(ctx);
  JS_SetPropertyFunctionList(ctx, image_proto, js_image_proto_funcs, countof(js_image_proto_funcs));
  
  JSValue image_class = JS_NewCFunction2(ctx, js_image_constructor, "Image", 1, JS_CFUNC_constructor, 1);
  JS_SetConstructor(ctx, image_class, image_proto);
  JS_SetClassProto(ctx, js_image_class_id, image_proto);

  return image_class;
}

/**
 * WebSG.Image related functions
*/

static JSValue js_get_image_by_name(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  const char *name = JS_ToCString(ctx, argv[0]);
  Image *image = websg_get_resource_by_name(ResourceType_Image, name);
  JS_FreeCString(ctx, name);
  return create_image_from_ptr(ctx, image);
}

JSValue create_image_from_ptr(JSContext *ctx, Image *image) {
  if (!image) {
    return JS_UNDEFINED;
  }

  JSValue val = get_js_val_from_ptr(ctx, image);

  if (JS_IsUndefined(val)) {
    val = JS_NewObjectClass(ctx, js_image_class_id);
    
    JS_SetOpaque(val, image);
    set_js_val_from_ptr(ctx, image, val);
  }

  return val;
}

void js_define_image_api(JSContext *ctx, JSValue *target) {
  JS_SetPropertyStr(ctx, *target, "Image", js_define_image_class(ctx));
  JS_SetPropertyStr(
    ctx,
    *target,
    "getImageByName",
    JS_NewCFunction(ctx, js_get_image_by_name, "getImageByName", 1)
  );
}