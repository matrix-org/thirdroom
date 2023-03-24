#include <string.h>
#include "./quickjs/cutils.h"
#include "./quickjs/quickjs.h"
#include "../websg.h"
#include "./js-utils.h"
#include "./websg-quaternion-js.h"

typedef struct WebSGQuaternionData {
  uint32_t resource_id;
  float_t elements[4];
  float_t (*get)(uint32_t resource_id, float_t *elements, int index);
  void (*set)(uint32_t resource_id, float_t *element, int index, float_t value);
} WebSGQuaternionData;

static void js_websg_quaternion_finalizer(JSRuntime *rt, JSValue val) {
  WebSGQuaternionData *quat_data = JS_GetOpaque(val, websg_quaternion_class_id);

  if (quat_data) {
    js_free_rt(rt, quat_data);
  }
}

static JSClassDef websg_quaternion_class = {
  "Quaternion",
  .finalizer = js_websg_quaternion_finalizer
};

static JSValue js_websg_quaternion_get(JSContext *ctx, JSValueConst this_val, int index) {
  WebSGQuaternionData *quat_data = JS_GetOpaque(this_val, websg_quaternion_class_id);

  if (quat_data->get == NULL) {
    return JS_NewFloat64(ctx, quat_data->elements[index]);
  }

  return JS_NewFloat64(ctx, quat_data->get(quat_data->resource_id, quat_data->elements, index));
}

static JSValue js_websg_quaternion_set(JSContext *ctx, JSValueConst this_val, JSValueConst arg, int index) {
  WebSGQuaternionData *quat_data = JS_GetOpaque(this_val, websg_quaternion_class_id);

  double_t value;

  if (JS_ToFloat64(ctx, &value, arg) == -1) {
    return JS_EXCEPTION;
  }

  if (quat_data->set == NULL) {
    quat_data->elements[index] = (float_t)value;
    return JS_UNDEFINED;
  }

  quat_data->set(quat_data->resource_id, quat_data->elements, index, (float_t)value);

  return JS_UNDEFINED;
}

static const JSCFunctionListEntry js_websg_quaternion_proto_funcs[] = {
  JS_CGETSET_MAGIC_DEF("0", js_websg_quaternion_get, js_websg_quaternion_set, 0),
  JS_CGETSET_MAGIC_DEF("1", js_websg_quaternion_get, js_websg_quaternion_set, 1),
  JS_CGETSET_MAGIC_DEF("2", js_websg_quaternion_get, js_websg_quaternion_set, 2),
  JS_CGETSET_MAGIC_DEF("3", js_websg_quaternion_get, js_websg_quaternion_set, 3),
  JS_CGETSET_MAGIC_DEF("x", js_websg_quaternion_get, js_websg_quaternion_set, 0),
  JS_CGETSET_MAGIC_DEF("y", js_websg_quaternion_get, js_websg_quaternion_set, 1),
  JS_CGETSET_MAGIC_DEF("z", js_websg_quaternion_get, js_websg_quaternion_set, 2),
  JS_CGETSET_MAGIC_DEF("w", js_websg_quaternion_get, js_websg_quaternion_set, 3),
  JS_PROP_INT32_DEF("length", 4, JS_PROP_ENUMERABLE),
};

void js_websg_define_quaternion(JSContext *ctx) {
  JS_NewClassID(&websg_quaternion_class_id);
  JS_NewClass(JS_GetRuntime(ctx), websg_quaternion_class_id, &websg_quaternion_class);
  JSValue world_proto = JS_NewObject(ctx);
  JS_SetPropertyFunctionList(ctx, world_proto, js_websg_quaternion_proto_funcs, countof(js_websg_quaternion_proto_funcs));
  JS_SetClassProto(ctx, websg_quaternion_class_id, world_proto);
}

JSValue js_websg_new_quaternion_get_set(
  JSContext *ctx,
  uint32_t resource_id,
  float_t (*get)(uint32_t resource_id, float_t *elements, int index),
  void (*set)(uint32_t resource_id, float_t *elements, int index, float_t value)
) {
  JSValue quaternion = JS_NewObjectClass(ctx, websg_quaternion_class_id);

  WebSGQuaternionData *quat_data = js_mallocz(ctx, sizeof(WebSGQuaternionData));
  quat_data->get = get;
  quat_data->set = set;
  quat_data->resource_id = resource_id;

  JS_SetOpaque(quaternion, quat_data);

  return quaternion;
}

int js_websg_define_quaternion_prop(
  JSContext *ctx,
  JSValue obj,
  const char *name,
  uint32_t resource_id,
  float_t (*get)(uint32_t resource_id, float_t *elements, int index),
  void (*set)(uint32_t resource_id, float_t *elements, int index, float_t value)
) {
  JSValue prop = js_websg_new_quaternion_get_set(ctx, resource_id, get, set);
  return JS_DefinePropertyValueStr(ctx, obj, name, prop, JS_PROP_ENUMERABLE);
}