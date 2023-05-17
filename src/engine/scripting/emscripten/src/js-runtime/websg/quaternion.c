#include <string.h>
#include "../quickjs/cutils.h"
#include "../quickjs/quickjs.h"
#include "../../websg.h"
#include "./quaternion.h"
#include "../utils/array.h"

JSClassID js_websg_quaternion_class_id;

static void js_websg_quaternion_finalizer(JSRuntime *rt, JSValue val) {
  WebSGQuaternionData *quat_data = JS_GetOpaque(val, js_websg_quaternion_class_id);

  if (quat_data) {
    js_free_rt(rt, quat_data->elements);
    js_free_rt(rt, quat_data);
  }
}

static JSClassDef js_websg_quaternion_class = {
  "Quaternion",
  .finalizer = js_websg_quaternion_finalizer
};

static JSValue js_websg_quaternion_get(JSContext *ctx, JSValueConst this_val, int index) {
  WebSGQuaternionData *quat_data = JS_GetOpaque(this_val, js_websg_quaternion_class_id);

  if (quat_data->get == NULL) {
    return JS_NewFloat64(ctx, quat_data->elements[index]);
  }

  return JS_NewFloat64(ctx, quat_data->get(quat_data->resource_id, index));
}

static JSValue js_websg_quaternion_set(JSContext *ctx, JSValueConst this_val, JSValueConst arg, int index) {
  WebSGQuaternionData *quat_data = JS_GetOpaque(this_val, js_websg_quaternion_class_id);

  if (quat_data->read_only == 1) {
    return JS_ThrowTypeError(ctx, "Quaternion is marked as read only.");
  }

  double_t value;

  if (JS_ToFloat64(ctx, &value, arg) == -1) {
    return JS_EXCEPTION;
  }

  if (quat_data->set == NULL) {
    quat_data->elements[index] = (float_t)value;
    return JS_UNDEFINED;
  }

  if (quat_data->set(quat_data->resource_id, index, (float_t)value) < 0) {
    JS_ThrowInternalError(ctx, "Failed to set Quaternion value");
    return JS_EXCEPTION;
  }

  return JS_UNDEFINED;
}

static JSValue js_websg_quaternion_set_array(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  WebSGQuaternionData *quat_data = JS_GetOpaque(this_val, js_websg_quaternion_class_id);

  if (quat_data->read_only == 1) {
    return JS_ThrowTypeError(ctx, "Quaternion is marked as read only.");
  }

  if (js_get_float_array_like(ctx, argv[0], quat_data->elements, 4) < 0) {
    return JS_EXCEPTION;
  }

  if (quat_data->set_array == NULL) {
    return JS_DupValue(ctx, this_val);
  }

  if (quat_data->set_array(quat_data->resource_id, quat_data->elements) < 0) {
    JS_ThrowInternalError(ctx, "Failed to set Quaternion value");
    return JS_EXCEPTION;
  }

  return JS_DupValue(ctx, this_val);
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
  JS_CFUNC_DEF("set", 1, js_websg_quaternion_set_array),
  JS_PROP_INT32_DEF("length", 4, JS_PROP_ENUMERABLE),
  JS_PROP_STRING_DEF("[Symbol.toStringTag]", "Quaternion", JS_PROP_CONFIGURABLE),
};

static JSValue js_websg_quaternion_constructor(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  return JS_ThrowTypeError(ctx, "Illegal Constructor.");
}

void js_websg_define_quaternion(JSContext *ctx, JSValue websg) {
  JS_NewClassID(&js_websg_quaternion_class_id);
  JS_NewClass(JS_GetRuntime(ctx), js_websg_quaternion_class_id, &js_websg_quaternion_class);
  JSValue quaternion_proto = JS_NewObject(ctx);
  JS_SetPropertyFunctionList(
    ctx,
    quaternion_proto,
    js_websg_quaternion_proto_funcs,
    countof(js_websg_quaternion_proto_funcs)
  );
  JS_SetClassProto(ctx, js_websg_quaternion_class_id, quaternion_proto);

  JSValue constructor = JS_NewCFunction2(
    ctx,
    js_websg_quaternion_constructor,
    "Quaternion",
    0,
    JS_CFUNC_constructor,
    0
  );
  JS_SetConstructor(ctx, constructor, quaternion_proto);
  JS_SetPropertyStr(
    ctx,
    websg,
    "Quaternion",
    constructor
  );
}

JSValue js_websg_create_quaternion(JSContext *ctx, float* elements) {
  JSValue quaternion = JS_NewObjectClass(ctx, js_websg_quaternion_class_id);
  WebSGQuaternionData *quat_data = js_mallocz(ctx, sizeof(WebSGQuaternionData));
  quat_data->elements = elements;
  return quaternion;
}

JSValue js_websg_new_quaternion_get_set(
  JSContext *ctx,
  uint32_t resource_id,
  float_t (*get)(uint32_t resource_id, uint32_t index),
  int32_t (*set)(uint32_t resource_id, uint32_t index, float_t value),
  int32_t (*set_array)(uint32_t resource_id, float_t *array),
  int read_only
) {
  JSValue quaternion = JS_NewObjectClass(ctx, js_websg_quaternion_class_id);

  WebSGQuaternionData *quat_data = js_mallocz(ctx, sizeof(WebSGQuaternionData));
  quat_data->elements = js_mallocz(ctx, sizeof(float_t) * 4);
  quat_data->get = get;
  quat_data->set = set;
  quat_data->set_array = set_array;
  quat_data->read_only = read_only;
  quat_data->resource_id = resource_id;

  JS_SetOpaque(quaternion, quat_data);

  return quaternion;
}

int js_websg_define_quaternion_prop(
  JSContext *ctx,
  JSValue obj,
  const char *name,
  uint32_t resource_id,
  float_t (*get)(uint32_t resource_id, uint32_t index),
  int32_t (*set)(uint32_t resource_id, uint32_t index, float_t value),
  int32_t (*set_array)(uint32_t resource_id, float_t *array)
) {
  JSValue prop = js_websg_new_quaternion_get_set(ctx, resource_id, get, set, set_array, 0);
  return JS_DefinePropertyValueStr(ctx, obj, name, prop, JS_PROP_ENUMERABLE);
}

int js_websg_define_quaternion_prop_read_only(
  JSContext *ctx,
  JSValue obj,
  const char *name,
  uint32_t resource_id,
  float_t (*get)(uint32_t resource_id, uint32_t index)
) {
  JSValue prop = js_websg_new_quaternion_get_set(ctx, resource_id, get, NULL, NULL, 1);
  return JS_DefinePropertyValueStr(ctx, obj, name, prop, JS_PROP_ENUMERABLE);
}