#include "../quickjs/cutils.h"
#include "../quickjs/quickjs.h"
#include "../../websg.h"
#include "./rgb.h"
#include "../utils/array.h"

JSClassID js_websg_rgb_class_id;

static void js_websg_rgb_finalizer(JSRuntime *rt, JSValue val) {
  WebSGRGBData *rgb_data = JS_GetOpaque(val, js_websg_rgb_class_id);

  if (rgb_data) {
    js_free_rt(rt, rgb_data->elements);
    js_free_rt(rt, rgb_data);
  }
}

static JSClassDef js_websg_rgb_class = {
  "RGB",
  .finalizer = js_websg_rgb_finalizer
};

static JSValue js_websg_rgb_get(JSContext *ctx, JSValueConst this_val, int index) {
  WebSGRGBData *rgb_data = JS_GetOpaque(this_val, js_websg_rgb_class_id);

  if (rgb_data->get == NULL) {
    return JS_NewFloat64(ctx, rgb_data->elements[index]);
  }

  return JS_NewFloat64(ctx, rgb_data->get(rgb_data->resource_id, index));
}

static JSValue js_websg_rgb_set(JSContext *ctx, JSValueConst this_val, JSValueConst arg, int index) {
  WebSGRGBData *rgb_data = JS_GetOpaque(this_val, js_websg_rgb_class_id);

  double_t value;

  if (JS_ToFloat64(ctx, &value, arg) == -1) {
    return JS_EXCEPTION;
  }

  if (rgb_data->set == NULL) {
    rgb_data->elements[index] = (float_t)value;
    return JS_UNDEFINED;
  }

  if (rgb_data->set(rgb_data->resource_id, index, (float_t)value) < 0) {
    JS_ThrowInternalError(ctx, "Failed to set RGB value");
    return JS_EXCEPTION;
  }

  return JS_UNDEFINED;
}

static JSValue js_websg_rgb_set_array(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  WebSGRGBData *rgb_data = JS_GetOpaque(this_val, js_websg_rgb_class_id);


  if (js_get_float_array_like(ctx, argv[0], rgb_data->elements, 3) < 0) {
    return JS_EXCEPTION;
  }

  if (rgb_data->set_array == NULL) {
    return JS_DupValue(ctx, this_val);
  }

  if (rgb_data->set_array(rgb_data->resource_id, rgb_data->elements) < 0) {
    JS_ThrowInternalError(ctx, "Failed to set RGB value");
    return JS_EXCEPTION;
  }

  return JS_DupValue(ctx, this_val);
}

static const JSCFunctionListEntry js_websg_rgb_proto_funcs[] = {
  JS_CGETSET_MAGIC_DEF("0", js_websg_rgb_get, js_websg_rgb_set, 0),
  JS_CGETSET_MAGIC_DEF("1", js_websg_rgb_get, js_websg_rgb_set, 1),
  JS_CGETSET_MAGIC_DEF("2", js_websg_rgb_get, js_websg_rgb_set, 2),
  JS_CGETSET_MAGIC_DEF("r", js_websg_rgb_get, js_websg_rgb_set, 0),
  JS_CGETSET_MAGIC_DEF("g", js_websg_rgb_get, js_websg_rgb_set, 1),
  JS_CGETSET_MAGIC_DEF("b", js_websg_rgb_get, js_websg_rgb_set, 2),
  JS_CFUNC_DEF("set", 1, js_websg_rgb_set_array),
  JS_PROP_INT32_DEF("length", 3, JS_PROP_ENUMERABLE),
  JS_PROP_STRING_DEF("[Symbol.toStringTag]", "RGB", JS_PROP_CONFIGURABLE),
};

static JSValue js_websg_rgb_constructor(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  return JS_ThrowTypeError(ctx, "Illegal Constructor.");
}

void js_websg_define_rgb(JSContext *ctx, JSValue websg) {
  JS_NewClassID(&js_websg_rgb_class_id);
  JS_NewClass(JS_GetRuntime(ctx), js_websg_rgb_class_id, &js_websg_rgb_class);
  JSValue rgb_proto = JS_NewObject(ctx);
  JS_SetPropertyFunctionList(ctx, rgb_proto, js_websg_rgb_proto_funcs, countof(js_websg_rgb_proto_funcs));
  JS_SetClassProto(ctx, js_websg_rgb_class_id, rgb_proto);

  JSValue constructor = JS_NewCFunction2(
    ctx,
    js_websg_rgb_constructor,
    "RGB",
    0,
    JS_CFUNC_constructor,
    0
  );
  JS_SetConstructor(ctx, constructor, rgb_proto);
  JS_SetPropertyStr(
    ctx,
    websg,
    "RGB",
    constructor
  );
}

JSValue js_websg_create_rgb(JSContext *ctx, float* elements) {
  JSValue rgb = JS_NewObjectClass(ctx, js_websg_rgb_class_id);
  WebSGRGBData *rgb_data = js_mallocz(ctx, sizeof(WebSGRGBData));
  rgb_data->elements = elements;
  return rgb;
}

JSValue js_websg_new_rgb_get_set(
  JSContext *ctx,
  uint32_t resource_id,
  float_t (*get)(uint32_t resource_id, uint32_t index),
  int32_t (*set)(uint32_t resource_id, uint32_t index, float_t value),
  int32_t (*set_array)(uint32_t resource_id, float_t *array)
) {
  JSValue rgb = JS_NewObjectClass(ctx, js_websg_rgb_class_id);

  WebSGRGBData *rgb_data = js_mallocz(ctx, sizeof(WebSGRGBData));
  rgb_data->elements = js_mallocz(ctx, sizeof(float_t) * 3);
  rgb_data->get = get;
  rgb_data->set = set;
  rgb_data->set_array = set_array;
  rgb_data->resource_id = resource_id;

  JS_SetOpaque(rgb, rgb_data);

  return rgb;
}

int js_websg_define_rgb_prop(
  JSContext *ctx,
  JSValue obj,
  const char *name,
  uint32_t resource_id,
  float_t (*get)(uint32_t resource_id, uint32_t index),
  int32_t (*set)(uint32_t resource_id, uint32_t index, float_t value),
  int32_t (*set_array)(uint32_t resource_id, float_t *array)
) {
  JSValue prop = js_websg_new_rgb_get_set(ctx, resource_id, get, set, set_array);
  return JS_DefinePropertyValueStr(ctx, obj, name, prop, JS_PROP_ENUMERABLE);
}