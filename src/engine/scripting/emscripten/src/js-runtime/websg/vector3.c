#include <string.h>
#include "../quickjs/cutils.h"
#include "../quickjs/quickjs.h"
#include "../../websg.h"
#include "./vector3.h"

static void js_websg_vector3_finalizer(JSRuntime *rt, JSValue val) {
  WebSGVector3Data *vec3_data = JS_GetOpaque(val, js_websg_vector3_class_id);

  if (vec3_data) {
    js_free_rt(rt, vec3_data);
  }
}

static JSClassDef js_websg_vector3_class = {
  "Vector3",
  .finalizer = js_websg_vector3_finalizer
};

static JSValue js_websg_vector3_get(JSContext *ctx, JSValueConst this_val, int index) {
  WebSGVector3Data *vec3_data = JS_GetOpaque(this_val, js_websg_vector3_class_id);

  if (vec3_data->get == NULL) {
    return JS_NewFloat64(ctx, vec3_data->elements[index]);
  }

  return JS_NewFloat64(ctx, vec3_data->get(vec3_data->resource_id, vec3_data->elements, index));
}

static JSValue js_websg_vector3_set(JSContext *ctx, JSValueConst this_val, JSValueConst arg, int index) {
  WebSGVector3Data *vec3_data = JS_GetOpaque(this_val, js_websg_vector3_class_id);

  double_t value;

  if (JS_ToFloat64(ctx, &value, arg) == -1) {
    return JS_EXCEPTION;
  }

  if (vec3_data->set == NULL) {
    vec3_data->elements[index] = (float_t)value;
    return JS_UNDEFINED;
  }

  vec3_data->set(vec3_data->resource_id, vec3_data->elements, index, (float_t)value);

  return JS_UNDEFINED;
}

static const JSCFunctionListEntry js_websg_vector3_proto_funcs[] = {
  JS_CGETSET_MAGIC_DEF("0", js_websg_vector3_get, js_websg_vector3_set, 0),
  JS_CGETSET_MAGIC_DEF("1", js_websg_vector3_get, js_websg_vector3_set, 1),
  JS_CGETSET_MAGIC_DEF("2", js_websg_vector3_get, js_websg_vector3_set, 2),
  JS_CGETSET_MAGIC_DEF("x", js_websg_vector3_get, js_websg_vector3_set, 0),
  JS_CGETSET_MAGIC_DEF("y", js_websg_vector3_get, js_websg_vector3_set, 1),
  JS_CGETSET_MAGIC_DEF("z", js_websg_vector3_get, js_websg_vector3_set, 2),
  JS_PROP_INT32_DEF("length", 3, JS_PROP_ENUMERABLE),
};

static JSValue js_websg_vector3_constructor(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  return JS_ThrowTypeError(ctx, "Illegal Constructor.");
}

void js_websg_define_vector3(JSContext *ctx, JSValue websg) {
  JS_NewClassID(&js_websg_vector3_class_id);
  JS_NewClass(JS_GetRuntime(ctx), js_websg_vector3_class_id, &js_websg_vector3_class);
  JSValue vector3_proto = JS_NewObject(ctx);
  JS_SetPropertyFunctionList(ctx, vector3_proto, js_websg_vector3_proto_funcs, countof(js_websg_vector3_proto_funcs));
  JS_SetClassProto(ctx, js_websg_vector3_class_id, vector3_proto);

  JSValue constructor = JS_NewCFunction2(
    ctx,
    js_websg_vector3_constructor,
    "Vector3",
    0,
    JS_CFUNC_constructor,
    0
  );
  JS_SetConstructor(ctx, constructor, vector3_proto);
  JS_SetPropertyStr(
    ctx,
    websg,
    "Vector3",
    constructor
  );
}

JSValue js_websg_new_vector3_get_set(
  JSContext *ctx,
  uint32_t resource_id,
  float_t (*get)(uint32_t resource_id, float_t *elements, int index),
  void (*set)(uint32_t resource_id, float_t *elements, int index, float_t value)
) {
  JSValue vector3 = JS_NewObjectClass(ctx, js_websg_vector3_class_id);

  WebSGVector3Data *vec3_data = js_mallocz(ctx, sizeof(WebSGVector3Data));
  vec3_data->get = get;
  vec3_data->set = set;
  vec3_data->resource_id = resource_id;

  JS_SetOpaque(vector3, vec3_data);

  return vector3;
}

int js_websg_define_vector3_prop(
  JSContext *ctx,
  JSValue obj,
  const char *name,
  uint32_t resource_id,
  float_t (*get)(uint32_t resource_id, float_t *elements, int index),
  void (*set)(uint32_t resource_id, float_t *elements, int index, float_t value)
) {
  JSValue prop = js_websg_new_vector3_get_set(ctx, resource_id, get, set);
  return JS_DefinePropertyValueStr(ctx, obj, name, prop, JS_PROP_ENUMERABLE);
}