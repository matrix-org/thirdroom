#include <string.h>
#include "../quickjs/cutils.h"
#include "../quickjs/quickjs.h"
#include "../../websg.h"
#include "./vector2.h"

static void js_websg_vector2_finalizer(JSRuntime *rt, JSValue val) {
  WebSGVector2Data *vec2_data = JS_GetOpaque(val, js_websg_vector2_class_id);

  if (vec2_data) {
    js_free_rt(rt, vec2_data);
  }
}

static JSClassDef js_websg_vector2_class = {
  "Vector2",
  .finalizer = js_websg_vector2_finalizer
};

static JSValue js_websg_vector2_get(JSContext *ctx, JSValueConst this_val, int index) {
  WebSGVector2Data *vec2_data = JS_GetOpaque(this_val, js_websg_vector2_class_id);

  if (vec2_data->get == NULL) {
    return JS_NewFloat64(ctx, vec2_data->elements[index]);
  }

  return JS_NewFloat64(ctx, vec2_data->get(vec2_data->resource_id, vec2_data->elements, index));
}

static JSValue js_websg_vector2_set(JSContext *ctx, JSValueConst this_val, JSValueConst arg, int index) {
  WebSGVector2Data *vec2_data = JS_GetOpaque(this_val, js_websg_vector2_class_id);

  double_t value;

  if (JS_ToFloat64(ctx, &value, arg) == -1) {
    return JS_EXCEPTION;
  }

  if (vec2_data->set == NULL) {
    vec2_data->elements[index] = (float_t)value;
    return JS_UNDEFINED;
  }

  vec2_data->set(vec2_data->resource_id, vec2_data->elements, index, (float_t)value);

  return JS_UNDEFINED;
}

static const JSCFunctionListEntry js_websg_vector2_proto_funcs[] = {
  JS_CGETSET_MAGIC_DEF("0", js_websg_vector2_get, js_websg_vector2_set, 0),
  JS_CGETSET_MAGIC_DEF("1", js_websg_vector2_get, js_websg_vector2_set, 1),
  JS_CGETSET_MAGIC_DEF("x", js_websg_vector2_get, js_websg_vector2_set, 0),
  JS_CGETSET_MAGIC_DEF("y", js_websg_vector2_get, js_websg_vector2_set, 1),
  JS_CGETSET_MAGIC_DEF("width", js_websg_vector2_get, js_websg_vector2_set, 0),
  JS_CGETSET_MAGIC_DEF("height", js_websg_vector2_get, js_websg_vector2_set, 1),
  JS_PROP_INT32_DEF("length", 3, JS_PROP_ENUMERABLE),
};

static JSValue js_websg_vector2_constructor(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  return JS_ThrowTypeError(ctx, "Illegal Constructor.");
}

void js_websg_define_vector2(JSContext *ctx, JSValue websg) {
  JS_NewClassID(&js_websg_vector2_class_id);
  JS_NewClass(JS_GetRuntime(ctx), js_websg_vector2_class_id, &js_websg_vector2_class);
  JSValue vector2_proto = JS_NewObject(ctx);
  JS_SetPropertyFunctionList(ctx, vector2_proto, js_websg_vector2_proto_funcs, countof(js_websg_vector2_proto_funcs));
  JS_SetClassProto(ctx, js_websg_vector2_class_id, vector2_proto);

  JSValue constructor = JS_NewCFunction2(
    ctx,
    js_websg_vector2_constructor,
    "Vector2",
    0,
    JS_CFUNC_constructor,
    0
  );
  JS_SetConstructor(ctx, constructor, vector2_proto);
  JS_SetPropertyStr(
    ctx,
    websg,
    "Vector2",
    constructor
  );
}

JSValue js_websg_new_vector2_get_set(
  JSContext *ctx,
  uint32_t resource_id,
  float_t (*get)(uint32_t resource_id, float_t *elements, int index),
  void (*set)(uint32_t resource_id, float_t *elements, int index, float_t value)
) {
  JSValue vector2 = JS_NewObjectClass(ctx, js_websg_vector2_class_id);

  WebSGVector2Data *vec2_data = js_mallocz(ctx, sizeof(WebSGVector2Data));
  vec2_data->get = get;
  vec2_data->set = set;
  vec2_data->resource_id = resource_id;

  JS_SetOpaque(vector2, vec2_data);

  return vector2;
}

int js_websg_define_vector2_prop(
  JSContext *ctx,
  JSValue obj,
  const char *name,
  uint32_t resource_id,
  float_t (*get)(uint32_t resource_id, float_t *elements, int index),
  void (*set)(uint32_t resource_id, float_t *elements, int index, float_t value)
) {
  JSValue prop = js_websg_new_vector2_get_set(ctx, resource_id, get, set);
  return JS_DefinePropertyValueStr(ctx, obj, name, prop, JS_PROP_ENUMERABLE);
}