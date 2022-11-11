#include <emscripten.h>
#include <emscripten/console.h>
#include <math.h>
#include <stdbool.h>
#include <string.h>

#include "../include/quickjs/cutils.h"
#include "../include/quickjs/quickjs.h"

#include "jsutils.h"
#include "websg.h"
#include "image.h"

/**
 * WebSG.Image
 */

typedef struct JSImage {
  Image *image;
} JSImage;

static JSValue js_image_constructor(JSContext *ctx, JSValueConst new_target, int argc, JSValueConst *argv) {
  JSImage *jsImage;
  
  if (argc == 1 || (argc == 2 && JS_IsBool(argv[1]))) {
    const char *uri;
    bool flipY = false;

    if (!JS_IsString(argv[0])) {
      JS_ThrowTypeError(ctx, "new Image(): uri must be a string.");
    }

    uri = JS_ToCString(ctx, argv[0]);

    if (argc == 2) {
      flipY = JS_ToBool(ctx, argv[1]);
    }

    jsImage = js_malloc(ctx, sizeof(JSImage));
    jsImage->image = websg_create_image_from_uri(uri, flipY);
  } else if ((argc == 2 && JS_IsString(argv[1])) || (argc == 3 && JS_IsBool(argv[2]))) {
    BufferView *bufferView;
    const char *mimeType;
    bool flipY = false;

    int32_t bufferViewAddr;

    if (JS_ToInt32(ctx, &bufferViewAddr, argv[0])) {
      return JS_EXCEPTION;
    }

    bufferView = (BufferView*)bufferViewAddr;

    if (!JS_IsString(argv[1])) {
      JS_ThrowTypeError(ctx, "new Image(): mimeType must be a string.");
    }

    mimeType = JS_ToCString(ctx, argv[1]);

    if (argc == 3) {
      flipY = JS_ToBool(ctx, argv[2]);
    }

    jsImage = js_malloc(ctx, sizeof(JSImage));
    jsImage->image = websg_create_image_from_buffer_view(bufferView, mimeType, flipY);
  } else {
    JS_ThrowTypeError(ctx, "new Image(): invalid arguments.");
  }

  JSValue imageObj = JS_UNDEFINED;
  JSValue proto = JS_GetPropertyStr(ctx, new_target, "prototype");

  if (JS_IsException(proto)) {
    websg_dispose_image(jsImage->image);
    JS_FreeValue(ctx, imageObj);
    return JS_EXCEPTION;
  }
    
  imageObj = JS_NewObjectProtoClass(ctx, proto, js_image_class_id);
  JS_FreeValue(ctx, proto);

  if (JS_IsException(imageObj)) {
    websg_dispose_image(jsImage->image);
    JS_FreeValue(ctx, imageObj);
    return JS_EXCEPTION;
  }

  JS_SetOpaque(imageObj, jsImage);

  return imageObj;
}

static JSValue js_image_get_name(JSContext *ctx, JSValueConst this_val) {
  JSImage *jsImage = JS_GetOpaque2(ctx, this_val, js_image_class_id);

  if (!jsImage) {
    return JS_EXCEPTION;
  } else {
    return JS_NewString(ctx, jsImage->image->name);
  }
}

static JSValue js_image_set_name(JSContext *ctx, JSValueConst this_val, JSValue val) {
  JSImage *jsImage = JS_GetOpaque2(ctx, this_val, js_image_class_id);

  if (!jsImage) {
    return JS_EXCEPTION;
  } else {
    websg_set_image_name(jsImage->image, JS_ToCString(ctx, val));
    return JS_UNDEFINED;
  }
}

static JSValue js_image_get_uri(JSContext *ctx, JSValueConst this_val) {
  JSImage *jsImage = JS_GetOpaque2(ctx, this_val, js_image_class_id);

  if (!jsImage) {
    return JS_EXCEPTION;
  } else {
    return JS_NewString(ctx, jsImage->image->uri);
  }
}

static JSValue js_image_get_mime_type(JSContext *ctx, JSValueConst this_val) {
  JSImage *jsImage = JS_GetOpaque2(ctx, this_val, js_image_class_id);

  if (!jsImage) {
    return JS_EXCEPTION;
  } else {
    return JS_NewString(ctx, jsImage->image->mime_type);
  }
}

static JSValue js_image_get_flip_y(JSContext *ctx, JSValueConst this_val) {
  JSImage *jsImage = JS_GetOpaque2(ctx, this_val, js_image_class_id);

  if (!jsImage) {
    return JS_EXCEPTION;
  } else {
    return JS_NewBool(ctx, jsImage->image->flip_y);
  }
}

static void js_image_finalizer(JSRuntime *rt, JSValue val) {
  JSImage *jsImage = JS_GetOpaque(val, js_image_class_id);
  websg_dispose_image(jsImage->image);
  js_free_rt(rt, jsImage);
}

static JSClassDef js_image_class = {
  "Image",
  .finalizer = js_image_finalizer
};

static const JSCFunctionListEntry js_image_proto_funcs[] = {
  JS_CGETSET_DEF("name", js_image_get_name, js_image_set_name),
  JS_CGETSET_DEF("uri", js_image_get_uri, NULL),
  JS_CGETSET_DEF("mimeType", js_image_get_mime_type, NULL),
  JS_CGETSET_DEF("flipY", js_image_get_flip_y, NULL),
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
 * WebSG image related functions
*/

static JSValue js_get_image_by_name(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  const char *name = JS_ToCString(ctx, argv[0]);
  Image *image = websg_get_image_by_name(name);
  JS_FreeCString(ctx, name);
  return create_image_from_ptr(ctx, image);
}

JSValue create_image_from_ptr(JSContext *ctx, Image *image) {
  if (!image) {
    return JS_UNDEFINED;
  }

  JSValue imageObj = JS_NewObjectClass(ctx, js_image_class_id);
  JSImage *jsImage = js_malloc(ctx, sizeof(JSImage));
  jsImage->image = image;
  JS_SetOpaque(imageObj, jsImage);

  return imageObj;
}

Image *get_image_from_js_val(JSContext *ctx, JSValue val) {
  if (JS_IsUndefined(val) || JS_IsNull(val)) {
    return NULL;
  }

  JSImage *jsImage = JS_GetOpaque2(ctx, val, js_image_class_id);

  if (!jsImage) {
    return NULL;
  }

  return jsImage->image;
}

void js_define_image_api(JSContext *ctx, JSValue *target) {
  JS_SetPropertyStr(ctx, *target, "Image", js_define_image_class(ctx));
  JS_SetPropertyStr(
    ctx,
    *target,
    "geImageByName",
    JS_NewCFunction(ctx, js_get_image_by_name, "geImageByName", 1)
  );
}