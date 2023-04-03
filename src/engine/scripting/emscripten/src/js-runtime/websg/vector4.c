#include <string.h>
#include "../quickjs/cutils.h"
#include "../quickjs/quickjs.h"
#include "../../websg.h"
#include "./vector4.h"

static void js_websg_vector4_finalizer(JSRuntime *rt, JSValue val) {
  WebSGVector4Data *vec4_data = JS_GetOpaque(val, js_websg_vector4_class_id);

  if (vec4_data) {
    js_free_rt(rt, vec4_data);
  }
}

static JSClassDef js_websg_vector4_class = {
  "Vector4",
  .finalizer = js_websg_vector4_finalizer
};

static JSValue js_websg_vector4_get(JSContext *ctx, JSValueConst this_val, int index) {
  WebSGVector4Data *vec4_data = JS_GetOpaque(this_val, js_websg_vector4_class_id);

  if (vec4_data->get == NULL) {
    return JS_NewFloat64(ctx, vec4_data->elements[index]);
  }

  return JS_NewFloat64(ctx, vec4_data->get(vec4_data->resource_id, vec4_data->elements, index));
}

static JSValue js_websg_vector4_set(JSContext *ctx, JSValueConst this_val, JSValueConst arg, int index) {
  WebSGVector4Data *vec4_data = JS_GetOpaque(this_val, js_websg_vector4_class_id);

  double_t value;

  if (JS_ToFloat64(ctx, &value, arg) == -1) {
    return JS_EXCEPTION;
  }

  if (vec4_data->set == NULL) {
    vec4_data->elements[index] = (float_t)value;
    return JS_UNDEFINED;
  }

  vec4_data->set(vec4_data->resource_id, vec4_data->elements, index, (float_t)value);

  return JS_UNDEFINED;
}

static const JSCFunctionListEntry js_websg_vector4_proto_funcs[] = {
  JS_CGETSET_MAGIC_DEF("0", js_websg_vector4_get, js_websg_vector4_set, 0),
  JS_CGETSET_MAGIC_DEF("1", js_websg_vector4_get, js_websg_vector4_set, 1),
  JS_CGETSET_MAGIC_DEF("2", js_websg_vector4_get, js_websg_vector4_set, 2),
  JS_CGETSET_MAGIC_DEF("3", js_websg_vector4_get, js_websg_vector4_set, 2),
  JS_CGETSET_MAGIC_DEF("x", js_websg_vector4_get, js_websg_vector4_set, 0),
  JS_CGETSET_MAGIC_DEF("y", js_websg_vector4_get, js_websg_vector4_set, 1),
  JS_CGETSET_MAGIC_DEF("z", js_websg_vector4_get, js_websg_vector4_set, 2),
  JS_CGETSET_MAGIC_DEF("w", js_websg_vector4_get, js_websg_vector4_set, 3),
  JS_CGETSET_MAGIC_DEF("top", js_websg_vector4_get, js_websg_vector4_set, 0),
  JS_CGETSET_MAGIC_DEF("right", js_websg_vector4_get, js_websg_vector4_set, 1),
  JS_CGETSET_MAGIC_DEF("bottom", js_websg_vector4_get, js_websg_vector4_set, 2),
  JS_CGETSET_MAGIC_DEF("left", js_websg_vector4_get, js_websg_vector4_set, 3),
  JS_PROP_INT32_DEF("length", 4, JS_PROP_ENUMERABLE),
};

static JSValue js_websg_vector4_constructor(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  return JS_ThrowTypeError(ctx, "Illegal Constructor.");
}

void js_websg_define_vector4(JSContext *ctx, JSValue websg) {
  JS_NewClassID(&js_websg_vector4_class_id);
  JS_NewClass(JS_GetRuntime(ctx), js_websg_vector4_class_id, &js_websg_vector4_class);
  JSValue vector4_proto = JS_NewObject(ctx);
  JS_SetPropertyFunctionList(ctx, vector4_proto, js_websg_vector4_proto_funcs, countof(js_websg_vector4_proto_funcs));
  JS_SetClassProto(ctx, js_websg_vector4_class_id, vector4_proto);

  JSValue constructor = JS_NewCFunction2(
    ctx,
    js_websg_vector4_constructor,
    "Vector4",
    0,
    JS_CFUNC_constructor,
    0
  );
  JS_SetConstructor(ctx, constructor, vector4_proto);
  JS_SetPropertyStr(
    ctx,
    websg,
    "Vector4",
    constructor
  );
}

JSValue js_websg_new_vector4_get_set(
  JSContext *ctx,
  uint32_t resource_id,
  float_t (*get)(uint32_t resource_id, float_t *elements, int index),
  void (*set)(uint32_t resource_id, float_t *elements, int index, float_t value)
) {
  JSValue vector4 = JS_NewObjectClass(ctx, js_websg_vector4_class_id);

  WebSGVector4Data *vec4_data = js_mallocz(ctx, sizeof(WebSGVector4Data));
  vec4_data->get = get;
  vec4_data->set = set;
  vec4_data->resource_id = resource_id;

  JS_SetOpaque(vector4, vec4_data);

  return vector4;
}

int js_websg_define_vector4_prop(
  JSContext *ctx,
  JSValue obj,
  const char *name,
  uint32_t resource_id,
  float_t (*get)(uint32_t resource_id, float_t *elements, int index),
  void (*set)(uint32_t resource_id, float_t *elements, int index, float_t value)
) {
  JSValue prop = js_websg_new_vector4_get_set(ctx, resource_id, get, set);
  return JS_DefinePropertyValueStr(ctx, obj, name, prop, JS_PROP_ENUMERABLE);
}