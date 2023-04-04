#include "../quickjs/cutils.h"
#include "../quickjs/quickjs.h"
#include "../../websg.h"
#include "./rgba.h"

static void js_websg_rgba_finalizer(JSRuntime *rt, JSValue val) {
  WebSGRGBAData *rgba_data = JS_GetOpaque(val, js_websg_rgba_class_id);

  if (rgba_data) {
    js_free_rt(rt, rgba_data);
  }
}

static JSClassDef js_websg_rgba_class = {
  "RGBA",
  .finalizer = js_websg_rgba_finalizer
};

static JSValue js_websg_rgba_get(JSContext *ctx, JSValueConst this_val, int index) {
  WebSGRGBAData *rgba_data = JS_GetOpaque(this_val, js_websg_rgba_class_id);

  if (rgba_data->get == NULL) {
    return JS_NewFloat64(ctx, rgba_data->elements[index]);
  }

  return JS_NewFloat64(ctx, rgba_data->get(rgba_data->resource_id, rgba_data->elements, index));
}

static JSValue js_websg_rgba_set(JSContext *ctx, JSValueConst this_val, JSValueConst arg, int index) {
  WebSGRGBAData *rgba_data = JS_GetOpaque(this_val, js_websg_rgba_class_id);

  double_t value;

  if (JS_ToFloat64(ctx, &value, arg) == -1) {
    return JS_EXCEPTION;
  }

  if (rgba_data->set == NULL) {
    rgba_data->elements[index] = (float_t)value;
    return JS_UNDEFINED;
  }

  rgba_data->set(rgba_data->resource_id, rgba_data->elements, index, (float_t)value);

  return JS_UNDEFINED;
}

static const JSCFunctionListEntry js_websg_rgba_proto_funcs[] = {
  JS_CGETSET_MAGIC_DEF("0", js_websg_rgba_get, js_websg_rgba_set, 0),
  JS_CGETSET_MAGIC_DEF("1", js_websg_rgba_get, js_websg_rgba_set, 1),
  JS_CGETSET_MAGIC_DEF("2", js_websg_rgba_get, js_websg_rgba_set, 2),
  JS_CGETSET_MAGIC_DEF("3", js_websg_rgba_get, js_websg_rgba_set, 3),
  JS_CGETSET_MAGIC_DEF("r", js_websg_rgba_get, js_websg_rgba_set, 0),
  JS_CGETSET_MAGIC_DEF("g", js_websg_rgba_get, js_websg_rgba_set, 1),
  JS_CGETSET_MAGIC_DEF("b", js_websg_rgba_get, js_websg_rgba_set, 2),
  JS_CGETSET_MAGIC_DEF("a", js_websg_rgba_get, js_websg_rgba_set, 3),
  JS_PROP_INT32_DEF("length", 4, JS_PROP_ENUMERABLE),
};

static JSValue js_websg_rgba_constructor(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  return JS_ThrowTypeError(ctx, "Illegal Constructor.");
}

void js_websg_define_rgba(JSContext *ctx, JSValue websg) {
  JS_NewClassID(&js_websg_rgba_class_id);
  JS_NewClass(JS_GetRuntime(ctx), js_websg_rgba_class_id, &js_websg_rgba_class);
  JSValue rgba_proto = JS_NewObject(ctx);
  JS_SetPropertyFunctionList(ctx, rgba_proto, js_websg_rgba_proto_funcs, countof(js_websg_rgba_proto_funcs));
  JS_SetClassProto(ctx, js_websg_rgba_class_id, rgba_proto);

  JSValue constructor = JS_NewCFunction2(
    ctx,
    js_websg_rgba_constructor,
    "RGBA",
    0,
    JS_CFUNC_constructor,
    0
  );
  JS_SetConstructor(ctx, constructor, rgba_proto);
  JS_SetPropertyStr(
    ctx,
    websg,
    "RGBA",
    constructor
  );
}

JSValue js_websg_new_rgba_get_set(
  JSContext *ctx,
  uint32_t resource_id,
  float_t (*get)(uint32_t resource_id, float_t *elements, int index),
  void (*set)(uint32_t resource_id, float_t *elements, int index, float_t value)
) {
  JSValue rgb = JS_NewObjectClass(ctx, js_websg_rgba_class_id);

  WebSGRGBAData *rgba_data = js_mallocz(ctx, sizeof(WebSGRGBAData));
  rgba_data->get = get;
  rgba_data->set = set;
  rgba_data->resource_id = resource_id;

  JS_SetOpaque(rgb, rgba_data);

  return rgb;
}

int js_websg_define_rgba_prop(
  JSContext *ctx,
  JSValue obj,
  const char *name,
  uint32_t resource_id,
  float_t (*get)(uint32_t resource_id, float_t *elements, int index),
  void (*set)(uint32_t resource_id, float_t *elements, int index, float_t value)
) {
  JSValue prop = js_websg_new_rgba_get_set(ctx, resource_id, get, set);
  return JS_DefinePropertyValueStr(ctx, obj, name, prop, JS_PROP_ENUMERABLE);
}