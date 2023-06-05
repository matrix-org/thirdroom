#include <string.h>
#include "../quickjs/cutils.h"
#include "../quickjs/quickjs.h"
#include "../../websg.h"
#include "./vector3.h"
#include "../utils/array.h"

JSClassID js_websg_vector3_class_id;

static void js_websg_vector3_finalizer(JSRuntime *rt, JSValue val) {
  WebSGVector3Data *vec3_data = JS_GetOpaque(val, js_websg_vector3_class_id);

  if (vec3_data) {
    js_free_rt(rt, vec3_data->elements);
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

  return JS_NewFloat64(ctx, vec3_data->get(vec3_data->resource_id, index));
}

static JSValue js_websg_vector3_set(JSContext *ctx, JSValueConst this_val, JSValueConst arg, int index) {
  WebSGVector3Data *vec3_data = JS_GetOpaque(this_val, js_websg_vector3_class_id);

  if (vec3_data->read_only == 1) {
    return JS_ThrowTypeError(ctx, "Vector3 is marked as read only.");
  }

  double_t value;

  if (JS_ToFloat64(ctx, &value, arg) == -1) {
    return JS_EXCEPTION;
  }

  if (vec3_data->set == NULL) {
    vec3_data->elements[index] = (float_t)value;
    return JS_UNDEFINED;
  }

  if (vec3_data->set(vec3_data->resource_id, index, (float_t)value) < 0) {
    JS_ThrowInternalError(ctx, "Failed to set Vector3 value");
    return JS_EXCEPTION;
  }

  return JS_UNDEFINED;
}

static JSValue js_websg_vector3_set_array(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  WebSGVector3Data *vec3_data = JS_GetOpaque(this_val, js_websg_vector3_class_id);

  if (vec3_data->read_only == 1) {
    return JS_ThrowTypeError(ctx, "Vector3 is marked as read only.");
  }

  if (js_get_float_array_like(ctx, argv[0], vec3_data->elements, 3) < 0) {
    return JS_EXCEPTION;
  }

  if (vec3_data->set_array == NULL) {
    return JS_DupValue(ctx, this_val);
  }

  if (vec3_data->set_array(vec3_data->resource_id, vec3_data->elements) < 0) {
    JS_ThrowInternalError(ctx, "Failed to set Vector3 value");
    return JS_EXCEPTION;
  }

  return JS_DupValue(ctx, this_val);
}

static JSValue js_websg_vector3_set_scalar(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  WebSGVector3Data *vec3_data = JS_GetOpaque(this_val, js_websg_vector3_class_id);

  if (vec3_data->read_only == 1) {
    return JS_ThrowTypeError(ctx, "Vector3 is marked as read only.");
  }

  double scalar;

  if (JS_ToFloat64(ctx, &scalar, argv[0]) == -1) {
    return JS_EXCEPTION;
  }

  vec3_data->elements[0] = (float_t)scalar;
  vec3_data->elements[1] = (float_t)scalar;
  vec3_data->elements[2] = (float_t)scalar;

  if (vec3_data->set_array == NULL) {
    return JS_DupValue(ctx, this_val);
  }

  if (vec3_data->set_array(vec3_data->resource_id, vec3_data->elements) < 0) {
    JS_ThrowInternalError(ctx, "Failed to set Vector3 value");
    return JS_EXCEPTION;
  }

  return JS_DupValue(ctx, this_val);
}

static JSValue js_websg_vector3_add(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  WebSGVector3Data *vec3_data = JS_GetOpaque(this_val, js_websg_vector3_class_id);

  if (vec3_data->read_only == 1) {
    return JS_ThrowTypeError(ctx, "Vector3 is marked as read only.");
  }

  float_t vec3[3];

  if (js_get_float_array_like(ctx, argv[0], vec3, 3) < 0) {
    return JS_EXCEPTION;
  }

  vec3_data->elements[0] += vec3[0];
  vec3_data->elements[1] += vec3[1];
  vec3_data->elements[2] += vec3[2];

  if (vec3_data->set_array == NULL) {
    return JS_DupValue(ctx, this_val);
  }

  if (vec3_data->set_array(vec3_data->resource_id, vec3_data->elements) < 0) {
    JS_ThrowInternalError(ctx, "Failed to set Vector3 value");
    return JS_EXCEPTION;
  }

  return JS_DupValue(ctx, this_val);
}

static JSValue js_websg_vector3_add_scaled_vector(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  WebSGVector3Data *vec3_data = JS_GetOpaque(this_val, js_websg_vector3_class_id);

  if (vec3_data->read_only == 1) {
    return JS_ThrowTypeError(ctx, "Vector3 is marked as read only.");
  }

  float_t vec3[3];

  if (js_get_float_array_like(ctx, argv[0], vec3, 3) < 0) {
    return JS_EXCEPTION;
  }

  double scalar;

  if (JS_ToFloat64(ctx, &scalar, argv[1]) == -1) {
    return JS_EXCEPTION;
  }

  vec3_data->elements[0] += vec3[0] * (float_t)scalar;
  vec3_data->elements[1] += vec3[1] * (float_t)scalar;
  vec3_data->elements[2] += vec3[2] * (float_t)scalar;

  if (vec3_data->set_array == NULL) {
    return JS_DupValue(ctx, this_val);
  }

  if (vec3_data->set_array(vec3_data->resource_id, vec3_data->elements) < 0) {
    JS_ThrowInternalError(ctx, "Failed to set Vector3 value");
    return JS_EXCEPTION;
  }

  return JS_DupValue(ctx, this_val);
}

static JSValue js_websg_vector3_add_vectors(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  WebSGVector3Data *vec3_data = JS_GetOpaque(this_val, js_websg_vector3_class_id);

  if (vec3_data->read_only == 1) {
    return JS_ThrowTypeError(ctx, "Vector3 is marked as read only.");
  }

  float_t vec3A[3];

  if (js_get_float_array_like(ctx, argv[0], vec3A, 3) < 0) {
    return JS_EXCEPTION;
  }

  float_t vec3B[3];

  if (js_get_float_array_like(ctx, argv[1], vec3B, 3) < 0) {
    return JS_EXCEPTION;
  }

  vec3_data->elements[0] = vec3A[0] + vec3B[0];
  vec3_data->elements[1] = vec3A[1] + vec3B[1];
  vec3_data->elements[2] = vec3A[2] + vec3B[2];

  if (vec3_data->set_array == NULL) {
    return JS_DupValue(ctx, this_val);
  }

  if (vec3_data->set_array(vec3_data->resource_id, vec3_data->elements) < 0) {
    JS_ThrowInternalError(ctx, "Failed to set Vector3 value");
    return JS_EXCEPTION;
  }

  return JS_DupValue(ctx, this_val);
}

static JSValue js_websg_vector3_subtract(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  WebSGVector3Data *vec3_data = JS_GetOpaque(this_val, js_websg_vector3_class_id);

  if (vec3_data->read_only == 1) {
    return JS_ThrowTypeError(ctx, "Vector3 is marked as read only.");
  }

  float_t vec3[3];

  if (js_get_float_array_like(ctx, argv[0], vec3, 3) < 0) {
    return JS_EXCEPTION;
  }

  vec3_data->elements[0] -= vec3[0];
  vec3_data->elements[1] -= vec3[1];
  vec3_data->elements[2] -= vec3[2];

  if (vec3_data->set_array == NULL) {
    return JS_DupValue(ctx, this_val);
  }

  if (vec3_data->set_array(vec3_data->resource_id, vec3_data->elements) < 0) {
    JS_ThrowInternalError(ctx, "Failed to set Vector3 value");
    return JS_EXCEPTION;
  }

  return JS_DupValue(ctx, this_val);
}

static JSValue js_websg_vector3_subtract_scaled_vector(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  WebSGVector3Data *vec3_data = JS_GetOpaque(this_val, js_websg_vector3_class_id);

  if (vec3_data->read_only == 1) {
    return JS_ThrowTypeError(ctx, "Vector3 is marked as read only.");
  }

  float_t vec3[3];

  if (js_get_float_array_like(ctx, argv[0], vec3, 3) < 0) {
    return JS_EXCEPTION;
  }

  double scalar;

  if (JS_ToFloat64(ctx, &scalar, argv[1]) == -1) {
    return JS_EXCEPTION;
  }

  vec3_data->elements[0] -= vec3[0] * (float_t)scalar;
  vec3_data->elements[1] -= vec3[1] * (float_t)scalar;
  vec3_data->elements[2] -= vec3[2] * (float_t)scalar;

  if (vec3_data->set_array == NULL) {
    return JS_DupValue(ctx, this_val);
  }

  if (vec3_data->set_array(vec3_data->resource_id, vec3_data->elements) < 0) {
    JS_ThrowInternalError(ctx, "Failed to set Vector3 value");
    return JS_EXCEPTION;
  }

  return JS_DupValue(ctx, this_val);
}

static JSValue js_websg_vector3_subtract_vectors(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  WebSGVector3Data *vec3_data = JS_GetOpaque(this_val, js_websg_vector3_class_id);

  if (vec3_data->read_only == 1) {
    return JS_ThrowTypeError(ctx, "Vector3 is marked as read only.");
  }

  float_t vec3A[3];

  if (js_get_float_array_like(ctx, argv[0], vec3A, 3) < 0) {
    return JS_EXCEPTION;
  }

  float_t vec3B[3];

  if (js_get_float_array_like(ctx, argv[1], vec3B, 3) < 0) {
    return JS_EXCEPTION;
  }

  vec3_data->elements[0] = vec3A[0] - vec3B[0];
  vec3_data->elements[1] = vec3A[1] - vec3B[1];
  vec3_data->elements[2] = vec3A[2] - vec3B[2];

  if (vec3_data->set_array == NULL) {
    return JS_DupValue(ctx, this_val);
  }

  if (vec3_data->set_array(vec3_data->resource_id, vec3_data->elements) < 0) {
    JS_ThrowInternalError(ctx, "Failed to set Vector3 value");
    return JS_EXCEPTION;
  }

  return JS_DupValue(ctx, this_val);
}

static JSValue js_websg_vector3_multiply(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  WebSGVector3Data *vec3_data = JS_GetOpaque(this_val, js_websg_vector3_class_id);

  if (vec3_data->read_only == 1) {
    return JS_ThrowTypeError(ctx, "Vector3 is marked as read only.");
  }

  float_t vec3[3];

  if (js_get_float_array_like(ctx, argv[0], vec3, 3) < 0) {
    return JS_EXCEPTION;
  }

  vec3_data->elements[0] *= vec3[0];
  vec3_data->elements[1] *= vec3[1];
  vec3_data->elements[2] *= vec3[2];

  if (vec3_data->set_array == NULL) {
    return JS_DupValue(ctx, this_val);
  }

  if (vec3_data->set_array(vec3_data->resource_id, vec3_data->elements) < 0) {
    JS_ThrowInternalError(ctx, "Failed to set Vector3 value");
    return JS_EXCEPTION;
  }

  return JS_DupValue(ctx, this_val);
}

static JSValue js_websg_vector3_multiply_vectors(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  WebSGVector3Data *vec3_data = JS_GetOpaque(this_val, js_websg_vector3_class_id);

  if (vec3_data->read_only == 1) {
    return JS_ThrowTypeError(ctx, "Vector3 is marked as read only.");
  }

  float_t vec3A[3];

  if (js_get_float_array_like(ctx, argv[0], vec3A, 3) < 0) {
    return JS_EXCEPTION;
  }

  float_t vec3B[3];

  if (js_get_float_array_like(ctx, argv[1], vec3B, 3) < 0) {
    return JS_EXCEPTION;
  }

  vec3_data->elements[0] = vec3A[0] * vec3B[0];
  vec3_data->elements[1] = vec3A[1] * vec3B[1];
  vec3_data->elements[2] = vec3A[2] * vec3B[2];

  if (vec3_data->set_array == NULL) {
    return JS_DupValue(ctx, this_val);
  }

  if (vec3_data->set_array(vec3_data->resource_id, vec3_data->elements) < 0) {
    JS_ThrowInternalError(ctx, "Failed to set Vector3 value");
    return JS_EXCEPTION;
  }

  return JS_DupValue(ctx, this_val);
}

static JSValue js_websg_vector3_multiply_scalar(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  WebSGVector3Data *vec3_data = JS_GetOpaque(this_val, js_websg_vector3_class_id);

  if (vec3_data->read_only == 1) {
    return JS_ThrowTypeError(ctx, "Vector3 is marked as read only.");
  }

  double scalar;

  if (JS_ToFloat64(ctx, &scalar, argv[0]) == -1) {
    return JS_EXCEPTION;
  }

  vec3_data->elements[0] *= (float_t)scalar;
  vec3_data->elements[1] *= (float_t)scalar;
  vec3_data->elements[2] *= (float_t)scalar;

  if (vec3_data->set_array == NULL) {
    return JS_DupValue(ctx, this_val);
  }

  if (vec3_data->set_array(vec3_data->resource_id, vec3_data->elements) < 0) {
    JS_ThrowInternalError(ctx, "Failed to set Vector3 value");
    return JS_EXCEPTION;
  }

  return JS_DupValue(ctx, this_val);
}

static JSValue js_websg_vector3_divide(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  WebSGVector3Data *vec3_data = JS_GetOpaque(this_val, js_websg_vector3_class_id);

  if (vec3_data->read_only == 1) {
    return JS_ThrowTypeError(ctx, "Vector3 is marked as read only.");
  }

  float_t vec3[3];

  if (js_get_float_array_like(ctx, argv[0], vec3, 3) < 0) {
    return JS_EXCEPTION;
  }

  vec3_data->elements[0] /= vec3[0];
  vec3_data->elements[1] /= vec3[1];
  vec3_data->elements[2] /= vec3[2];

  if (vec3_data->set_array == NULL) {
    return JS_DupValue(ctx, this_val);
  }

  if (vec3_data->set_array(vec3_data->resource_id, vec3_data->elements) < 0) {
    JS_ThrowInternalError(ctx, "Failed to set Vector3 value");
    return JS_EXCEPTION;
  }

  return JS_DupValue(ctx, this_val);
}

static JSValue js_websg_vector3_divide_scalar(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  WebSGVector3Data *vec3_data = JS_GetOpaque(this_val, js_websg_vector3_class_id);

  if (vec3_data->read_only == 1) {
    return JS_ThrowTypeError(ctx, "Vector3 is marked as read only.");
  }

  double scalar;

  if (JS_ToFloat64(ctx, &scalar, argv[0]) == -1) {
    return JS_EXCEPTION;
  }

  float_t one_over_scalar = 1.0f / (float_t)scalar;

  vec3_data->elements[0] *= one_over_scalar;
  vec3_data->elements[1] *= one_over_scalar;
  vec3_data->elements[2] *= one_over_scalar;

  if (vec3_data->set_array == NULL) {
    return JS_DupValue(ctx, this_val);
  }

  if (vec3_data->set_array(vec3_data->resource_id, vec3_data->elements) < 0) {
    JS_ThrowInternalError(ctx, "Failed to set Vector3 value");
    return JS_EXCEPTION;
  }

  return JS_DupValue(ctx, this_val);
}

static JSValue js_websg_vector3_divide_vectors(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  WebSGVector3Data *vec3_data = JS_GetOpaque(this_val, js_websg_vector3_class_id);

  float_t vec3A[3];

  if (js_get_float_array_like(ctx, argv[0], vec3A, 3) < 0) {
    return JS_EXCEPTION;
  }

  float_t vec3B[3];

  if (js_get_float_array_like(ctx, argv[1], vec3B, 3) < 0) {
    return JS_EXCEPTION;
  }

  vec3_data->elements[0] = vec3A[0] / vec3B[0];
  vec3_data->elements[1] = vec3A[1] / vec3B[1];
  vec3_data->elements[2] = vec3A[2] / vec3B[2];

  if (vec3_data->set_array == NULL) {
    return JS_DupValue(ctx, this_val);
  }

  if (vec3_data->set_array(vec3_data->resource_id, vec3_data->elements) < 0) {
    JS_ThrowInternalError(ctx, "Failed to set Vector3 value");
    return JS_EXCEPTION;
  }

  return JS_DupValue(ctx, this_val);
}

static JSValue js_websg_vector3_to_string(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  WebSGVector3Data *vec3_data = JS_GetOpaque(this_val, js_websg_vector3_class_id);

  JSValue global = JS_GetGlobalObject(ctx);
  JSValue arrayClass = JS_GetPropertyStr(ctx, global, "Array");
  JSValue arrayProto = JS_GetPropertyStr(ctx, arrayClass, "prototype");
  JSValue joinFn = JS_GetPropertyStr(ctx, arrayProto, "join");
  JSValue str = JS_Call(ctx, joinFn, this_val, 0, NULL);
  JS_FreeValue(ctx, joinFn);
  JS_FreeValue(ctx, arrayProto);
  JS_FreeValue(ctx, arrayClass);

  return str;
}

static const JSCFunctionListEntry js_websg_vector3_proto_funcs[] = {
  JS_CGETSET_MAGIC_DEF("0", js_websg_vector3_get, js_websg_vector3_set, 0),
  JS_CGETSET_MAGIC_DEF("1", js_websg_vector3_get, js_websg_vector3_set, 1),
  JS_CGETSET_MAGIC_DEF("2", js_websg_vector3_get, js_websg_vector3_set, 2),
  JS_CGETSET_MAGIC_DEF("x", js_websg_vector3_get, js_websg_vector3_set, 0),
  JS_CGETSET_MAGIC_DEF("y", js_websg_vector3_get, js_websg_vector3_set, 1),
  JS_CGETSET_MAGIC_DEF("z", js_websg_vector3_get, js_websg_vector3_set, 2),
  JS_PROP_INT32_DEF("length", 3, JS_PROP_ENUMERABLE),
  JS_CFUNC_DEF("set", 1, js_websg_vector3_set_array),
  JS_CFUNC_DEF("setScalar", 1, js_websg_vector3_set_scalar),
  JS_CFUNC_DEF("add", 1, js_websg_vector3_add),
  JS_CFUNC_DEF("addVectors", 2, js_websg_vector3_add_vectors),
  JS_CFUNC_DEF("addScaledVector", 2, js_websg_vector3_add_scaled_vector),
  JS_CFUNC_DEF("subtract", 1, js_websg_vector3_subtract),
  JS_CFUNC_DEF("subtractVectors", 2, js_websg_vector3_subtract_vectors),
  JS_CFUNC_DEF("subtractScaledVector", 2, js_websg_vector3_subtract_scaled_vector),
  JS_CFUNC_DEF("multiply", 1, js_websg_vector3_multiply),
  JS_CFUNC_DEF("multiplyVectors", 2, js_websg_vector3_multiply_vectors),
  JS_CFUNC_DEF("multiplyScalar", 1, js_websg_vector3_multiply_scalar),
  JS_CFUNC_DEF("divide", 1, js_websg_vector3_divide),
  JS_CFUNC_DEF("divideScalar", 1, js_websg_vector3_divide_scalar),
  JS_CFUNC_DEF("divideVectors", 2, js_websg_vector3_divide_vectors),
  JS_CFUNC_DEF("toString", 0, js_websg_vector3_to_string),
  JS_PROP_STRING_DEF("[Symbol.toStringTag]", "Vector3", JS_PROP_CONFIGURABLE),
};

static JSValue js_websg_vector3_constructor(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  JSValue obj = JS_NewObjectClass(ctx, js_websg_vector3_class_id);

  if (JS_IsException(obj)) {
    return obj;
  }

  WebSGVector3Data *vec3_data = js_mallocz(ctx, sizeof(WebSGVector3Data));

  if (!vec3_data) {
    return JS_EXCEPTION;
  }

  vec3_data->elements = js_mallocz(ctx, sizeof(float_t) * 3);
  vec3_data->read_only = 0;
  vec3_data->resource_id = 0;
  vec3_data->set_array = NULL;

  if (argc == 1) {
    if (js_get_float_array_like(ctx, argv[0], vec3_data->elements, 3) < 0) {
      JS_FreeValue(ctx, obj);
      return JS_EXCEPTION;
    }
  } else if (argc == 3) {
    double vec3[3];

    if (JS_ToFloat64(ctx, &vec3[0], argv[0]) == -1) {
      JS_FreeValue(ctx, obj);
      return JS_EXCEPTION;
    }

    if (JS_ToFloat64(ctx, &vec3[1], argv[1]) == -1) {
      JS_FreeValue(ctx, obj);
      return JS_EXCEPTION;
    }

    if (JS_ToFloat64(ctx, &vec3[2], argv[2]) == -1) {
      JS_FreeValue(ctx, obj);
      return JS_EXCEPTION;
    }

    vec3_data->elements[0] = (float_t)vec3[0];
    vec3_data->elements[1] = (float_t)vec3[1];
    vec3_data->elements[2] = (float_t)vec3[2];
  }

  JS_SetOpaque(obj, vec3_data);

  return obj;
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
    3,
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

JSValue js_websg_create_vector3(JSContext *ctx, float* elements) {
  JSValue vector3 = JS_NewObjectClass(ctx, js_websg_vector3_class_id);
  WebSGVector3Data *vector3_data = js_mallocz(ctx, sizeof(WebSGVector3Data));
  vector3_data->elements = elements;
  JS_SetOpaque(vector3, vector3_data);
  return vector3;
}

JSValue js_websg_new_vector3_get_set(
  JSContext *ctx,
  uint32_t resource_id,
  float_t (*get)(uint32_t resource_id, uint32_t index),
  int32_t (*set)(uint32_t resource_id, uint32_t index, float_t value),
  int32_t (*set_array)(uint32_t resource_id, float_t *array),
  int read_only
) {
  JSValue vector3 = JS_NewObjectClass(ctx, js_websg_vector3_class_id);

  WebSGVector3Data *vec3_data = js_mallocz(ctx, sizeof(WebSGVector3Data));
  vec3_data->elements = js_mallocz(ctx, sizeof(float_t) * 3);
  vec3_data->get = get;
  vec3_data->set = set;
  vec3_data->set_array = set_array;
  vec3_data->read_only = read_only;
  vec3_data->resource_id = resource_id;

  JS_SetOpaque(vector3, vec3_data);

  return vector3;
}

int js_websg_define_vector3_prop(
  JSContext *ctx,
  JSValue obj,
  const char *name,
  uint32_t resource_id,
  float_t (*get)(uint32_t resource_id, uint32_t index),
  int32_t (*set)(uint32_t resource_id, uint32_t index, float_t value),
  int32_t (*set_array)(uint32_t resource_id, float_t *array)
) {
  JSValue prop = js_websg_new_vector3_get_set(ctx, resource_id, get, set, set_array, 0);
  return JS_DefinePropertyValueStr(ctx, obj, name, prop, JS_PROP_ENUMERABLE);
}

int js_websg_define_vector3_prop_read_only(
  JSContext *ctx,
  JSValue obj,
  const char *name,
  uint32_t resource_id,
  float_t (*get)(uint32_t resource_id, uint32_t index)
) {
  JSValue prop = js_websg_new_vector3_get_set(ctx, resource_id, get, NULL, NULL, 1);
  return JS_DefinePropertyValueStr(ctx, obj, name, prop, JS_PROP_ENUMERABLE);
}