#include <string.h>
#include "../quickjs/cutils.h"
#include "../quickjs/quickjs.h"
#include "../../websg.h"
#include "./vector4.h"
#include "../utils/array.h"

JSClassID js_websg_vector4_class_id;

static void js_websg_vector4_finalizer(JSRuntime *rt, JSValue val) {
  WebSGVector4Data *vec4_data = JS_GetOpaque(val, js_websg_vector4_class_id);

  if (vec4_data) {
    js_free_rt(rt, vec4_data->elements);
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

  return JS_NewFloat64(ctx, vec4_data->get(vec4_data->resource_id, index));
}

static JSValue js_websg_vector4_set(JSContext *ctx, JSValueConst this_val, JSValueConst arg, int index) {
  WebSGVector4Data *vec4_data = JS_GetOpaque(this_val, js_websg_vector4_class_id);

  double_t value;

  if (JS_ToFloat64(ctx, &value, arg) == -1) {
    return JS_EXCEPTION;
  }

  if (vec4_data->set(vec4_data->resource_id, index, (float_t)value) < 0) {
    JS_ThrowInternalError(ctx, "Failed to set Vector4 value");
    return JS_EXCEPTION;
  }

  vec4_data->set(vec4_data->resource_id, index, (float_t)value);

  return JS_UNDEFINED;
}

static JSValue js_websg_vector4_set_array(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  WebSGVector4Data *vec4_data = JS_GetOpaque(this_val, js_websg_vector4_class_id);

  if (js_get_float_array_like(ctx, argv[0], vec4_data->elements, 4) < 0) {
    return JS_EXCEPTION;
  }

  if (vec4_data->set_array == NULL) {
    return JS_DupValue(ctx, this_val);
  }

  if (vec4_data->set_array(vec4_data->resource_id, vec4_data->elements) < 0) {
    JS_ThrowInternalError(ctx, "Failed to set Vector4 value");
    return JS_EXCEPTION;
  }

  return JS_DupValue(ctx, this_val);
}

static JSValue js_websg_vector4_set_scalar(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  WebSGVector4Data *vec4_data = JS_GetOpaque(this_val, js_websg_vector4_class_id);

  double scalar;

  if (JS_ToFloat64(ctx, &scalar, argv[0]) == -1) {
    return JS_EXCEPTION;
  }

  vec4_data->elements[0] = (float_t)scalar;
  vec4_data->elements[1] = (float_t)scalar;
  vec4_data->elements[2] = (float_t)scalar;
  vec4_data->elements[3] = (float_t)scalar;

  if (vec4_data->set_array == NULL) {
    return JS_DupValue(ctx, this_val);
  }

  if (vec4_data->set_array(vec4_data->resource_id, vec4_data->elements) < 0) {
    JS_ThrowInternalError(ctx, "Failed to set Vector4 value");
    return JS_EXCEPTION;
  }

  return JS_DupValue(ctx, this_val);
}

static JSValue js_websg_vector4_add(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  WebSGVector4Data *vec4_data = JS_GetOpaque(this_val, js_websg_vector4_class_id);

  float_t vec4[4];

  if (js_get_float_array_like(ctx, argv[0], vec4, 4) < 0) {
    return JS_EXCEPTION;
  }

  vec4_data->elements[0] += vec4[0];
  vec4_data->elements[1] += vec4[1];
  vec4_data->elements[2] += vec4[2];
  vec4_data->elements[3] += vec4[3];

  if (vec4_data->set_array == NULL) {
    return JS_DupValue(ctx, this_val);
  }

  if (vec4_data->set_array(vec4_data->resource_id, vec4_data->elements) < 0) {
    JS_ThrowInternalError(ctx, "Failed to set Vector4 value");
    return JS_EXCEPTION;
  }

  return JS_DupValue(ctx, this_val);
}

static JSValue js_websg_vector4_add_scaled_vector(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  WebSGVector4Data *vec4_data = JS_GetOpaque(this_val, js_websg_vector4_class_id);

  float_t vec4[4];

  if (js_get_float_array_like(ctx, argv[0], vec4, 4) < 0) {
    return JS_EXCEPTION;
  }

  double scalar;

  if (JS_ToFloat64(ctx, &scalar, argv[1]) == -1) {
    return JS_EXCEPTION;
  }

  vec4_data->elements[0] += vec4[0] * (float_t)scalar;
  vec4_data->elements[1] += vec4[1] * (float_t)scalar;
  vec4_data->elements[2] += vec4[2] * (float_t)scalar;
  vec4_data->elements[3] += vec4[3] * (float_t)scalar;

  if (vec4_data->set_array == NULL) {
    return JS_DupValue(ctx, this_val);
  }

  if (vec4_data->set_array(vec4_data->resource_id, vec4_data->elements) < 0) {
    JS_ThrowInternalError(ctx, "Failed to set Vector4 value");
    return JS_EXCEPTION;
  }

  return JS_DupValue(ctx, this_val);
}

static JSValue js_websg_vector4_add_vectors(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  WebSGVector4Data *vec4_data = JS_GetOpaque(this_val, js_websg_vector4_class_id);

  float_t vec4A[4];

  if (js_get_float_array_like(ctx, argv[0], vec4A, 4) < 0) {
    return JS_EXCEPTION;
  }

  float_t vec4B[4];

  if (js_get_float_array_like(ctx, argv[1], vec4B, 4) < 0) {
    return JS_EXCEPTION;
  }

  vec4_data->elements[0] = vec4A[0] + vec4B[0];
  vec4_data->elements[1] = vec4A[1] + vec4B[1];
  vec4_data->elements[2] = vec4A[2] + vec4B[2];
  vec4_data->elements[3] = vec4A[3] + vec4B[3];

  if (vec4_data->set_array == NULL) {
    return JS_DupValue(ctx, this_val);
  }

  if (vec4_data->set_array(vec4_data->resource_id, vec4_data->elements) < 0) {
    JS_ThrowInternalError(ctx, "Failed to set Vector4 value");
    return JS_EXCEPTION;
  }

  return JS_DupValue(ctx, this_val);
}

static JSValue js_websg_vector4_subtract(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  WebSGVector4Data *vec4_data = JS_GetOpaque(this_val, js_websg_vector4_class_id);

  float_t vec4[4];

  if (js_get_float_array_like(ctx, argv[0], vec4, 4) < 0) {
    return JS_EXCEPTION;
  }

  vec4_data->elements[0] -= vec4[0];
  vec4_data->elements[1] -= vec4[1];
  vec4_data->elements[2] -= vec4[2];
  vec4_data->elements[3] -= vec4[3];

  if (vec4_data->set_array == NULL) {
    return JS_DupValue(ctx, this_val);
  }

  if (vec4_data->set_array(vec4_data->resource_id, vec4_data->elements) < 0) {
    JS_ThrowInternalError(ctx, "Failed to set Vector4 value");
    return JS_EXCEPTION;
  }

  return JS_DupValue(ctx, this_val);
}

static JSValue js_websg_vector4_subtract_scaled_vector(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  WebSGVector4Data *vec4_data = JS_GetOpaque(this_val, js_websg_vector4_class_id);

  float_t vec4[4];

  if (js_get_float_array_like(ctx, argv[0], vec4, 4) < 0) {
    return JS_EXCEPTION;
  }

  double scalar;

  if (JS_ToFloat64(ctx, &scalar, argv[1]) == -1) {
    return JS_EXCEPTION;
  }

  vec4_data->elements[0] -= vec4[0] * (float_t)scalar;
  vec4_data->elements[1] -= vec4[1] * (float_t)scalar;
  vec4_data->elements[2] -= vec4[2] * (float_t)scalar;
  vec4_data->elements[3] -= vec4[3] * (float_t)scalar;

  if (vec4_data->set_array == NULL) {
    return JS_DupValue(ctx, this_val);
  }

  if (vec4_data->set_array(vec4_data->resource_id, vec4_data->elements) < 0) {
    JS_ThrowInternalError(ctx, "Failed to set Vector4 value");
    return JS_EXCEPTION;
  }

  return JS_DupValue(ctx, this_val);
}

static JSValue js_websg_vector4_subtract_vectors(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  WebSGVector4Data *vec4_data = JS_GetOpaque(this_val, js_websg_vector4_class_id);

  float_t vec4A[4];

  if (js_get_float_array_like(ctx, argv[0], vec4A, 4) < 0) {
    return JS_EXCEPTION;
  }

  float_t vec4B[4];

  if (js_get_float_array_like(ctx, argv[1], vec4B, 4) < 0) {
    return JS_EXCEPTION;
  }

  vec4_data->elements[0] = vec4A[0] - vec4B[0];
  vec4_data->elements[1] = vec4A[1] - vec4B[1];
  vec4_data->elements[2] = vec4A[2] - vec4B[2];
  vec4_data->elements[3] = vec4A[3] - vec4B[3];

  if (vec4_data->set_array == NULL) {
    return JS_DupValue(ctx, this_val);
  }

  if (vec4_data->set_array(vec4_data->resource_id, vec4_data->elements) < 0) {
    JS_ThrowInternalError(ctx, "Failed to set Vector4 value");
    return JS_EXCEPTION;
  }

  return JS_DupValue(ctx, this_val);
}

static JSValue js_websg_vector4_multiply(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  WebSGVector4Data *vec4_data = JS_GetOpaque(this_val, js_websg_vector4_class_id);

  float_t vec4[4];

  if (js_get_float_array_like(ctx, argv[0], vec4, 4) < 0) {
    return JS_EXCEPTION;
  }

  vec4_data->elements[0] *= vec4[0];
  vec4_data->elements[1] *= vec4[1];
  vec4_data->elements[2] *= vec4[2];
  vec4_data->elements[3] *= vec4[3];

  if (vec4_data->set_array == NULL) {
    return JS_DupValue(ctx, this_val);
  }

  if (vec4_data->set_array(vec4_data->resource_id, vec4_data->elements) < 0) {
    JS_ThrowInternalError(ctx, "Failed to set Vector4 value");
    return JS_EXCEPTION;
  }

  return JS_DupValue(ctx, this_val);
}

static JSValue js_websg_vector4_multiply_vectors(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  WebSGVector4Data *vec4_data = JS_GetOpaque(this_val, js_websg_vector4_class_id);

  float_t vec4A[4];

  if (js_get_float_array_like(ctx, argv[0], vec4A, 4) < 0) {
    return JS_EXCEPTION;
  }

  float_t vec4B[4];

  if (js_get_float_array_like(ctx, argv[1], vec4B, 4) < 0) {
    return JS_EXCEPTION;
  }

  vec4_data->elements[0] = vec4A[0] * vec4B[0];
  vec4_data->elements[1] = vec4A[1] * vec4B[1];
  vec4_data->elements[2] = vec4A[2] * vec4B[2];
  vec4_data->elements[3] = vec4A[3] * vec4B[3];

  if (vec4_data->set_array == NULL) {
    return JS_DupValue(ctx, this_val);
  }

  if (vec4_data->set_array(vec4_data->resource_id, vec4_data->elements) < 0) {
    JS_ThrowInternalError(ctx, "Failed to set Vector4 value");
    return JS_EXCEPTION;
  }

  return JS_DupValue(ctx, this_val);
}

static JSValue js_websg_vector4_multiply_scalar(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  WebSGVector4Data *vec4_data = JS_GetOpaque(this_val, js_websg_vector4_class_id);

  double scalar;

  if (JS_ToFloat64(ctx, &scalar, argv[0]) == -1) {
    return JS_EXCEPTION;
  }

  vec4_data->elements[0] *= (float_t)scalar;
  vec4_data->elements[1] *= (float_t)scalar;
  vec4_data->elements[2] *= (float_t)scalar;
  vec4_data->elements[3] *= (float_t)scalar;

  if (vec4_data->set_array == NULL) {
    return JS_DupValue(ctx, this_val);
  }

  if (vec4_data->set_array(vec4_data->resource_id, vec4_data->elements) < 0) {
    JS_ThrowInternalError(ctx, "Failed to set Vector4 value");
    return JS_EXCEPTION;
  }

  return JS_DupValue(ctx, this_val);
}

static JSValue js_websg_vector4_divide(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  WebSGVector4Data *vec4_data = JS_GetOpaque(this_val, js_websg_vector4_class_id);


  float_t vec4[4];

  if (js_get_float_array_like(ctx, argv[0], vec4, 4) < 0) {
    return JS_EXCEPTION;
  }

  vec4_data->elements[0] /= vec4[0];
  vec4_data->elements[1] /= vec4[1];
  vec4_data->elements[2] /= vec4[2];
  vec4_data->elements[3] /= vec4[3];

  if (vec4_data->set_array == NULL) {
    return JS_DupValue(ctx, this_val);
  }

  if (vec4_data->set_array(vec4_data->resource_id, vec4_data->elements) < 0) {
    JS_ThrowInternalError(ctx, "Failed to set Vector4 value");
    return JS_EXCEPTION;
  }

  return JS_DupValue(ctx, this_val);
}

static JSValue js_websg_vector4_divide_scalar(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  WebSGVector4Data *vec4_data = JS_GetOpaque(this_val, js_websg_vector4_class_id);


  double scalar;

  if (JS_ToFloat64(ctx, &scalar, argv[0]) == -1) {
    return JS_EXCEPTION;
  }

  float_t one_over_scalar = 1.0f / (float_t)scalar;

  vec4_data->elements[0] *= one_over_scalar;
  vec4_data->elements[1] *= one_over_scalar;
  vec4_data->elements[2] *= one_over_scalar;
  vec4_data->elements[3] *= one_over_scalar;

  if (vec4_data->set_array == NULL) {
    return JS_DupValue(ctx, this_val);
  }

  if (vec4_data->set_array(vec4_data->resource_id, vec4_data->elements) < 0) {
    JS_ThrowInternalError(ctx, "Failed to set Vector4 value");
    return JS_EXCEPTION;
  }

  return JS_DupValue(ctx, this_val);
}

static JSValue js_websg_vector4_divide_vectors(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  WebSGVector4Data *vec4_data = JS_GetOpaque(this_val, js_websg_vector4_class_id);

  float_t vec4A[4];

  if (js_get_float_array_like(ctx, argv[0], vec4A, 4) < 0) {
    return JS_EXCEPTION;
  }

  float_t vec4B[4];

  if (js_get_float_array_like(ctx, argv[1], vec4B, 4) < 0) {
    return JS_EXCEPTION;
  }

  vec4_data->elements[0] = vec4A[0] / vec4B[0];
  vec4_data->elements[1] = vec4A[1] / vec4B[1];
  vec4_data->elements[2] = vec4A[2] / vec4B[2];
  vec4_data->elements[3] = vec4A[3] / vec4B[3];

  if (vec4_data->set_array == NULL) {
    return JS_DupValue(ctx, this_val);
  }

  if (vec4_data->set_array(vec4_data->resource_id, vec4_data->elements) < 0) {
    JS_ThrowInternalError(ctx, "Failed to set Vector4 value");
    return JS_EXCEPTION;
  }

  return JS_DupValue(ctx, this_val);
}

static JSValue js_websg_vector4_to_string(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  WebSGVector4Data *vec4_data = JS_GetOpaque(this_val, js_websg_vector4_class_id);

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

static const JSCFunctionListEntry js_websg_vector4_proto_funcs[] = {
  JS_CGETSET_MAGIC_DEF("0", js_websg_vector4_get, js_websg_vector4_set, 0),
  JS_CGETSET_MAGIC_DEF("1", js_websg_vector4_get, js_websg_vector4_set, 1),
  JS_CGETSET_MAGIC_DEF("2", js_websg_vector4_get, js_websg_vector4_set, 2),
  JS_CGETSET_MAGIC_DEF("3", js_websg_vector4_get, js_websg_vector4_set, 3),
  JS_CGETSET_MAGIC_DEF("x", js_websg_vector4_get, js_websg_vector4_set, 0),
  JS_CGETSET_MAGIC_DEF("y", js_websg_vector4_get, js_websg_vector4_set, 1),
  JS_CGETSET_MAGIC_DEF("z", js_websg_vector4_get, js_websg_vector4_set, 2),
  JS_CGETSET_MAGIC_DEF("w", js_websg_vector4_get, js_websg_vector4_set, 3),
  JS_CGETSET_MAGIC_DEF("top", js_websg_vector4_get, js_websg_vector4_set, 0),
  JS_CGETSET_MAGIC_DEF("right", js_websg_vector4_get, js_websg_vector4_set, 1),
  JS_CGETSET_MAGIC_DEF("bottom", js_websg_vector4_get, js_websg_vector4_set, 2),
  JS_CGETSET_MAGIC_DEF("left", js_websg_vector4_get, js_websg_vector4_set, 3),
  JS_PROP_INT32_DEF("length", 4, JS_PROP_ENUMERABLE),
  JS_CFUNC_DEF("set", 1, js_websg_vector4_set_array),
  JS_CFUNC_DEF("setScalar", 1, js_websg_vector4_set_scalar),
  JS_CFUNC_DEF("add", 1, js_websg_vector4_add),
  JS_CFUNC_DEF("addVectors", 2, js_websg_vector4_add_vectors),
  JS_CFUNC_DEF("addScaledVector", 2, js_websg_vector4_add_scaled_vector),
  JS_CFUNC_DEF("subtract", 1, js_websg_vector4_subtract),
  JS_CFUNC_DEF("subtractVectors", 2, js_websg_vector4_subtract_vectors),
  JS_CFUNC_DEF("subtractScaledVector", 2, js_websg_vector4_subtract_scaled_vector),
  JS_CFUNC_DEF("multiply", 1, js_websg_vector4_multiply),
  JS_CFUNC_DEF("multiplyVectors", 2, js_websg_vector4_multiply_vectors),
  JS_CFUNC_DEF("multiplyScalar", 1, js_websg_vector4_multiply_scalar),
  JS_CFUNC_DEF("divide", 1, js_websg_vector4_divide),
  JS_CFUNC_DEF("divideScalar", 1, js_websg_vector4_divide_scalar),
  JS_CFUNC_DEF("divideVectors", 2, js_websg_vector4_divide_vectors),
  JS_CFUNC_DEF("toString", 0, js_websg_vector4_to_string),
  JS_PROP_STRING_DEF("[Symbol.toStringTag]", "Vector4", JS_PROP_CONFIGURABLE),
};

static JSValue js_websg_vector4_constructor(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  JSValue obj = JS_NewObjectClass(ctx, js_websg_vector4_class_id);

  if (JS_IsException(obj)) {
    return obj;
  }

  WebSGVector4Data *vec4_data = js_mallocz(ctx, sizeof(WebSGVector4Data));

  if (!vec4_data) {
    return JS_EXCEPTION;
  }

  vec4_data->elements = js_mallocz(ctx, sizeof(float_t) * 4);
  vec4_data->resource_id = 0;
  vec4_data->set_array = NULL;

  if (argc == 1) {
    if (js_get_float_array_like(ctx, argv[0], vec4_data->elements, 4) < 0) {
      JS_FreeValue(ctx, obj);
      return JS_EXCEPTION;
    }
  } else if (argc == 4) {
    double vec4[4];

    if (JS_ToFloat64(ctx, &vec4[0], argv[0]) == -1) {
      JS_FreeValue(ctx, obj);
      return JS_EXCEPTION;
    }

    if (JS_ToFloat64(ctx, &vec4[1], argv[1]) == -1) {
      JS_FreeValue(ctx, obj);
      return JS_EXCEPTION;
    }

    if (JS_ToFloat64(ctx, &vec4[2], argv[2]) == -1) {
      JS_FreeValue(ctx, obj);
      return JS_EXCEPTION;
    }

    if (JS_ToFloat64(ctx, &vec4[3], argv[3]) == -1) {
      JS_FreeValue(ctx, obj);
      return JS_EXCEPTION;
    }

    vec4_data->elements[0] = (float_t)vec4[0];
    vec4_data->elements[1] = (float_t)vec4[1];
    vec4_data->elements[2] = (float_t)vec4[2];
    vec4_data->elements[3] = (float_t)vec4[3];
  }

  JS_SetOpaque(obj, vec4_data);

  return obj;
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
    4,
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

JSValue js_websg_create_vector4(JSContext *ctx, float* elements) {
  JSValue vector4 = JS_NewObjectClass(ctx, js_websg_vector4_class_id);
  WebSGVector4Data *vector4_data = js_mallocz(ctx, sizeof(WebSGVector4Data));
  vector4_data->elements = elements;
  return vector4;
}

JSValue js_websg_new_vector4_get_set(
  JSContext *ctx,
  uint32_t resource_id,
  float_t (*get)(uint32_t resource_id, uint32_t index),
  int32_t (*set)(uint32_t resource_id, uint32_t index, float_t value),
  int32_t (*set_array)(uint32_t resource_id, float_t *array)
) {
  JSValue vector4 = JS_NewObjectClass(ctx, js_websg_vector4_class_id);

  WebSGVector4Data *vec4_data = js_mallocz(ctx, sizeof(WebSGVector4Data));
  vec4_data->elements = js_mallocz(ctx, sizeof(float_t) * 4);
  vec4_data->get = get;
  vec4_data->set = set;
  vec4_data->set_array = set_array;
  vec4_data->resource_id = resource_id;

  JS_SetOpaque(vector4, vec4_data);

  return vector4;
}

int js_websg_define_vector4_prop(
  JSContext *ctx,
  JSValue obj,
  const char *name,
  uint32_t resource_id,
  float_t (*get)(uint32_t resource_id, uint32_t index),
  int32_t (*set)(uint32_t resource_id, uint32_t index, float_t value),
  int32_t (*set_array)(uint32_t resource_id, float_t *array)
) {
  JSValue prop = js_websg_new_vector4_get_set(ctx, resource_id, get, set, set_array);
  return JS_DefinePropertyValueStr(ctx, obj, name, prop, JS_PROP_ENUMERABLE);
}