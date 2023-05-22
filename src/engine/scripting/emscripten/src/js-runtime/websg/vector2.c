#include <string.h>
#include "../quickjs/cutils.h"
#include "../quickjs/quickjs.h"
#include "../../websg.h"
#include "./vector2.h"
#include "../utils/array.h"

JSClassID js_websg_vector2_class_id;

static void js_websg_vector2_finalizer(JSRuntime *rt, JSValue val) {
  WebSGVector2Data *vec2_data = JS_GetOpaque(val, js_websg_vector2_class_id);

  if (vec2_data) {
    js_free_rt(rt, vec2_data->elements);
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

  return JS_NewFloat64(ctx, vec2_data->get(vec2_data->resource_id, index));
}

static JSValue js_websg_vector2_set(JSContext *ctx, JSValueConst this_val, JSValueConst arg, int index) {
  WebSGVector2Data *vec2_data = JS_GetOpaque(this_val, js_websg_vector2_class_id);

  double_t value;

  if (JS_ToFloat64(ctx, &value, arg) == -1) {
    return JS_EXCEPTION;
  }

  if (vec2_data->set(vec2_data->resource_id, index, (float_t)value) < 0) {
    JS_ThrowInternalError(ctx, "Failed to set Vector2 value");
    return JS_EXCEPTION;
  }

  return JS_UNDEFINED;
}

static JSValue js_websg_vector2_set_array(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  WebSGVector2Data *vec2_data = JS_GetOpaque(this_val, js_websg_vector2_class_id);

  if (js_get_float_array_like(ctx, argv[0], vec2_data->elements, 2) < 0) {
    return JS_EXCEPTION;
  }

  if (vec2_data->set_array == NULL) {
    return JS_DupValue(ctx, this_val);
  }

  if (vec2_data->set_array(vec2_data->resource_id, vec2_data->elements) < 0) {
    JS_ThrowInternalError(ctx, "Failed to set Vector2 value");
    return JS_EXCEPTION;
  }

  return JS_DupValue(ctx, this_val);
}

static JSValue js_websg_vector2_set_scalar(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  WebSGVector2Data *vec2_data = JS_GetOpaque(this_val, js_websg_vector2_class_id);

  double scalar;

  if (JS_ToFloat64(ctx, &scalar, argv[0]) == -1) {
    return JS_EXCEPTION;
  }

  vec2_data->elements[0] = (float_t)scalar;
  vec2_data->elements[1] = (float_t)scalar;

  if (vec2_data->set_array == NULL) {
    return JS_DupValue(ctx, this_val);
  }

  if (vec2_data->set_array(vec2_data->resource_id, vec2_data->elements) < 0) {
    JS_ThrowInternalError(ctx, "Failed to set Vector2 value");
    return JS_EXCEPTION;
  }

  return JS_DupValue(ctx, this_val);
}

static JSValue js_websg_vector2_add(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  WebSGVector2Data *vec2_data = JS_GetOpaque(this_val, js_websg_vector2_class_id);

  float_t vec2[2];

  if (js_get_float_array_like(ctx, argv[0], vec2, 2) < 0) {
    return JS_EXCEPTION;
  }

  vec2_data->elements[0] += vec2[0];
  vec2_data->elements[1] += vec2[1];

  if (vec2_data->set_array == NULL) {
    return JS_DupValue(ctx, this_val);
  }

  if (vec2_data->set_array(vec2_data->resource_id, vec2_data->elements) < 0) {
    JS_ThrowInternalError(ctx, "Failed to set Vector2 value");
    return JS_EXCEPTION;
  }

  return JS_DupValue(ctx, this_val);
}

static JSValue js_websg_vector2_add_scaled_vector(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  WebSGVector2Data *vec2_data = JS_GetOpaque(this_val, js_websg_vector2_class_id);

  float_t vec2[2];

  if (js_get_float_array_like(ctx, argv[0], vec2, 2) < 0) {
    return JS_EXCEPTION;
  }

  double scalar;

  if (JS_ToFloat64(ctx, &scalar, argv[1]) == -1) {
    return JS_EXCEPTION;
  }

  vec2_data->elements[0] += vec2[0] * (float_t)scalar;
  vec2_data->elements[1] += vec2[1] * (float_t)scalar;

  if (vec2_data->set_array == NULL) {
    return JS_DupValue(ctx, this_val);
  }

  if (vec2_data->set_array(vec2_data->resource_id, vec2_data->elements) < 0) {
    JS_ThrowInternalError(ctx, "Failed to set Vector2 value");
    return JS_EXCEPTION;
  }

  return JS_DupValue(ctx, this_val);
}

static JSValue js_websg_vector2_add_vectors(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  WebSGVector2Data *vec2_data = JS_GetOpaque(this_val, js_websg_vector2_class_id);

  float_t *vec2A = malloc(sizeof(float_t) * 2);

  if (js_get_float_array_like(ctx, argv[0], vec2A, 2) < 0) {
    js_free(ctx, vec2A);
    return JS_EXCEPTION;
  }

  float_t *vec2B = malloc(sizeof(float_t) * 2);

  if (js_get_float_array_like(ctx, argv[1], vec2B, 2) < 0) {
    js_free(ctx, vec2A);
    js_free(ctx, vec2B);
    return JS_EXCEPTION;
  }

  vec2_data->elements[0] = vec2A[0] + vec2B[0];
  vec2_data->elements[1] = vec2A[1] + vec2B[1];

  js_free(ctx, vec2A);
  js_free(ctx, vec2B);

  if (vec2_data->set_array == NULL) {
    return JS_DupValue(ctx, this_val);
  }

  if (vec2_data->set_array(vec2_data->resource_id, vec2_data->elements) < 0) {
    JS_ThrowInternalError(ctx, "Failed to set Vector2 value");
    return JS_EXCEPTION;
  }

  return JS_DupValue(ctx, this_val);
}

static JSValue js_websg_vector2_subtract(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  WebSGVector2Data *vec2_data = JS_GetOpaque(this_val, js_websg_vector2_class_id);

  float_t vec2[2];

  if (js_get_float_array_like(ctx, argv[0], vec2, 2) < 0) {
    return JS_EXCEPTION;
  }

  vec2_data->elements[0] -= vec2[0];
  vec2_data->elements[1] -= vec2[1];

  if (vec2_data->set_array == NULL) {
    return JS_DupValue(ctx, this_val);
  }

  if (vec2_data->set_array(vec2_data->resource_id, vec2_data->elements) < 0) {
    JS_ThrowInternalError(ctx, "Failed to set Vector2 value");
    return JS_EXCEPTION;
  }

  return JS_DupValue(ctx, this_val);
}

static JSValue js_websg_vector2_subtract_scaled_vector(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  WebSGVector2Data *vec2_data = JS_GetOpaque(this_val, js_websg_vector2_class_id);

  float_t vec2[2];

  if (js_get_float_array_like(ctx, argv[0], vec2, 2) < 0) {
    return JS_EXCEPTION;
  }

  double scalar;

  if (JS_ToFloat64(ctx, &scalar, argv[1]) == -1) {
    return JS_EXCEPTION;
  }

  vec2_data->elements[0] -= vec2[0] * (float_t)scalar;
  vec2_data->elements[1] -= vec2[1] * (float_t)scalar;

  if (vec2_data->set_array == NULL) {
    return JS_DupValue(ctx, this_val);
  }

  if (vec2_data->set_array(vec2_data->resource_id, vec2_data->elements) < 0) {
    JS_ThrowInternalError(ctx, "Failed to set Vector2 value");
    return JS_EXCEPTION;
  }

  return JS_DupValue(ctx, this_val);
}

static JSValue js_websg_vector2_subtract_vectors(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  WebSGVector2Data *vec2_data = JS_GetOpaque(this_val, js_websg_vector2_class_id);

  float_t vec2A[2];

  if (js_get_float_array_like(ctx, argv[0], vec2A, 2) < 0) {
    return JS_EXCEPTION;
  }

  float_t vec2B[2];

  if (js_get_float_array_like(ctx, argv[1], vec2B, 2) < 0) {
    return JS_EXCEPTION;
  }

  vec2_data->elements[0] = vec2A[0] - vec2B[0];
  vec2_data->elements[1] = vec2A[1] - vec2B[1];

  if (vec2_data->set_array == NULL) {
    return JS_DupValue(ctx, this_val);
  }

  if (vec2_data->set_array(vec2_data->resource_id, vec2_data->elements) < 0) {
    JS_ThrowInternalError(ctx, "Failed to set Vector2 value");
    return JS_EXCEPTION;
  }

  return JS_DupValue(ctx, this_val);
}

static JSValue js_websg_vector2_multiply(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  WebSGVector2Data *vec2_data = JS_GetOpaque(this_val, js_websg_vector2_class_id);

  float_t vec2[2];

  if (js_get_float_array_like(ctx, argv[0], vec2, 2) < 0) {
    return JS_EXCEPTION;
  }

  vec2_data->elements[0] *= vec2[0];
  vec2_data->elements[1] *= vec2[1];

  if (vec2_data->set_array == NULL) {
    return JS_DupValue(ctx, this_val);
  }

  if (vec2_data->set_array(vec2_data->resource_id, vec2_data->elements) < 0) {
    JS_ThrowInternalError(ctx, "Failed to set Vector2 value");
    return JS_EXCEPTION;
  }

  return JS_DupValue(ctx, this_val);
}

static JSValue js_websg_vector2_multiply_vectors(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  WebSGVector2Data *vec2_data = JS_GetOpaque(this_val, js_websg_vector2_class_id);

  float_t vec2A[2];

  if (js_get_float_array_like(ctx, argv[0], vec2A, 2) < 0) {
    return JS_EXCEPTION;
  }

  float_t vec2B[2];

  if (js_get_float_array_like(ctx, argv[1], vec2B, 2) < 0) {
    return JS_EXCEPTION;
  }

  vec2_data->elements[0] = vec2A[0] * vec2B[0];
  vec2_data->elements[1] = vec2A[1] * vec2B[1];

  if (vec2_data->set_array == NULL) {
    return JS_DupValue(ctx, this_val);
  }

  if (vec2_data->set_array(vec2_data->resource_id, vec2_data->elements) < 0) {
    JS_ThrowInternalError(ctx, "Failed to set Vector2 value");
    return JS_EXCEPTION;
  }

  return JS_DupValue(ctx, this_val);
}

static JSValue js_websg_vector2_multiply_scalar(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  WebSGVector2Data *vec2_data = JS_GetOpaque(this_val, js_websg_vector2_class_id);

  double scalar;

  if (JS_ToFloat64(ctx, &scalar, argv[0]) == -1) {
    return JS_EXCEPTION;
  }

  vec2_data->elements[0] *= (float_t)scalar;
  vec2_data->elements[1] *= (float_t)scalar;

  if (vec2_data->set_array == NULL) {
    return JS_DupValue(ctx, this_val);
  }

  if (vec2_data->set_array(vec2_data->resource_id, vec2_data->elements) < 0) {
    JS_ThrowInternalError(ctx, "Failed to set Vector2 value");
    return JS_EXCEPTION;
  }

  return JS_DupValue(ctx, this_val);
}

static JSValue js_websg_vector2_divide(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  WebSGVector2Data *vec2_data = JS_GetOpaque(this_val, js_websg_vector2_class_id);


  float_t vec2[2];

  if (js_get_float_array_like(ctx, argv[0], vec2, 2) < 0) {
    return JS_EXCEPTION;
  }

  vec2_data->elements[0] /= vec2[0];
  vec2_data->elements[1] /= vec2[1];

  if (vec2_data->set_array == NULL) {
    return JS_DupValue(ctx, this_val);
  }

  if (vec2_data->set_array(vec2_data->resource_id, vec2_data->elements) < 0) {
    JS_ThrowInternalError(ctx, "Failed to set Vector2 value");
    return JS_EXCEPTION;
  }

  return JS_DupValue(ctx, this_val);
}

static JSValue js_websg_vector2_divide_scalar(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  WebSGVector2Data *vec2_data = JS_GetOpaque(this_val, js_websg_vector2_class_id);


  double scalar;

  if (JS_ToFloat64(ctx, &scalar, argv[0]) == -1) {
    return JS_EXCEPTION;
  }

  float_t one_over_scalar = 1.0f / (float_t)scalar;

  vec2_data->elements[0] *= one_over_scalar;
  vec2_data->elements[1] *= one_over_scalar;

  if (vec2_data->set_array == NULL) {
    return JS_DupValue(ctx, this_val);
  }

  if (vec2_data->set_array(vec2_data->resource_id, vec2_data->elements) < 0) {
    JS_ThrowInternalError(ctx, "Failed to set Vector2 value");
    return JS_EXCEPTION;
  }

  return JS_DupValue(ctx, this_val);
}

static JSValue js_websg_vector2_divide_vectors(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  WebSGVector2Data *vec2_data = JS_GetOpaque(this_val, js_websg_vector2_class_id);

  float_t vec2A[2];

  if (js_get_float_array_like(ctx, argv[0], vec2A, 2) < 0) {
    return JS_EXCEPTION;
  }

  float_t vec2B[2];

  if (js_get_float_array_like(ctx, argv[1], vec2B, 2) < 0) {
    return JS_EXCEPTION;
  }

  vec2_data->elements[0] = vec2A[0] / vec2B[0];
  vec2_data->elements[1] = vec2A[1] / vec2B[1];

  if (vec2_data->set_array == NULL) {
    return JS_DupValue(ctx, this_val);
  }

  if (vec2_data->set_array(vec2_data->resource_id, vec2_data->elements) < 0) {
    JS_ThrowInternalError(ctx, "Failed to set Vector2 value");
    return JS_EXCEPTION;
  }

  return JS_DupValue(ctx, this_val);
}

static JSValue js_websg_vector2_to_string(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  WebSGVector2Data *vec2_data = JS_GetOpaque(this_val, js_websg_vector2_class_id);

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

static const JSCFunctionListEntry js_websg_vector2_proto_funcs[] = {
  JS_CGETSET_MAGIC_DEF("0", js_websg_vector2_get, js_websg_vector2_set, 0),
  JS_CGETSET_MAGIC_DEF("1", js_websg_vector2_get, js_websg_vector2_set, 1),
  JS_CGETSET_MAGIC_DEF("x", js_websg_vector2_get, js_websg_vector2_set, 0),
  JS_CGETSET_MAGIC_DEF("y", js_websg_vector2_get, js_websg_vector2_set, 1),
  JS_CGETSET_MAGIC_DEF("width", js_websg_vector2_get, js_websg_vector2_set, 0),
  JS_CGETSET_MAGIC_DEF("height", js_websg_vector2_get, js_websg_vector2_set, 1),
  JS_PROP_INT32_DEF("length", 2, JS_PROP_ENUMERABLE),
  JS_CFUNC_DEF("set", 1, js_websg_vector2_set_array),
  JS_CFUNC_DEF("setScalar", 1, js_websg_vector2_set_scalar),
  JS_CFUNC_DEF("add", 1, js_websg_vector2_add),
  JS_CFUNC_DEF("addVectors", 2, js_websg_vector2_add_vectors),
  JS_CFUNC_DEF("addScaledVector", 2, js_websg_vector2_add_scaled_vector),
  JS_CFUNC_DEF("subtract", 1, js_websg_vector2_subtract),
  JS_CFUNC_DEF("subtractVectors", 2, js_websg_vector2_subtract_vectors),
  JS_CFUNC_DEF("subtractScaledVector", 2, js_websg_vector2_subtract_scaled_vector),
  JS_CFUNC_DEF("multiply", 1, js_websg_vector2_multiply),
  JS_CFUNC_DEF("multiplyVectors", 2, js_websg_vector2_multiply_vectors),
  JS_CFUNC_DEF("multiplyScalar", 1, js_websg_vector2_multiply_scalar),
  JS_CFUNC_DEF("divide", 1, js_websg_vector2_divide),
  JS_CFUNC_DEF("divideScalar", 1, js_websg_vector2_divide_scalar),
  JS_CFUNC_DEF("divideVectors", 2, js_websg_vector2_divide_vectors),
  JS_CFUNC_DEF("toString", 0, js_websg_vector2_to_string),
  JS_PROP_STRING_DEF("[Symbol.toStringTag]", "Vector2", JS_PROP_CONFIGURABLE),
};

static JSValue js_websg_vector2_constructor(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  JSValue obj = JS_NewObjectClass(ctx, js_websg_vector2_class_id);

  if (JS_IsException(obj)) {
    return obj;
  }

  WebSGVector2Data *vec2_data = js_mallocz(ctx, sizeof(WebSGVector2Data));

  if (!vec2_data) {
    return JS_EXCEPTION;
  }

  vec2_data->elements = js_mallocz(ctx, sizeof(float_t) * 2);
  vec2_data->resource_id = 0;
  vec2_data->get = NULL;
  vec2_data->set = NULL;
  vec2_data->set_array = NULL;

  if (argc == 1) {
    if (js_get_float_array_like(ctx, argv[0], vec2_data->elements, 2) < 0) {
      JS_FreeValue(ctx, obj);
      return JS_EXCEPTION;
    }
  } else if (argc == 2) {
    double vec2[2];

    if (JS_ToFloat64(ctx, &vec2[0], argv[0]) == -1) {
      JS_FreeValue(ctx, obj);
      return JS_EXCEPTION;
    }

    if (JS_ToFloat64(ctx, &vec2[1], argv[1]) == -1) {
      JS_FreeValue(ctx, obj);
      return JS_EXCEPTION;
    }

    vec2_data->elements[0] = (float_t)vec2[0];
    vec2_data->elements[1] = (float_t)vec2[1];
  }

  JS_SetOpaque(obj, vec2_data);

  return obj;
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
    2,
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

JSValue js_websg_create_vector2(JSContext *ctx, float* elements) {
  JSValue vector2 = JS_NewObjectClass(ctx, js_websg_vector2_class_id);
  WebSGVector2Data *vec2_data = js_mallocz(ctx, sizeof(WebSGVector2Data));
  vec2_data->elements = elements;
  return vector2;
}

JSValue js_websg_new_vector2_get_set(
  JSContext *ctx,
  uint32_t resource_id,
  float_t (*get)(uint32_t resource_id, uint32_t index),
  int32_t (*set)(uint32_t resource_id, uint32_t index, float_t value),
  int32_t (*set_array)(uint32_t resource_id, float_t *array)
) {
  JSValue vector2 = JS_NewObjectClass(ctx, js_websg_vector2_class_id);

  WebSGVector2Data *vec2_data = js_mallocz(ctx, sizeof(WebSGVector2Data));
  vec2_data->elements = js_mallocz(ctx, sizeof(float_t) * 2);
  vec2_data->get = get;
  vec2_data->set = set;
  vec2_data->set_array = set_array;
  vec2_data->resource_id = resource_id;

  JS_SetOpaque(vector2, vec2_data);

  return vector2;
}

int js_websg_define_vector2_prop(
  JSContext *ctx,
  JSValue obj,
  const char *name,
  uint32_t resource_id,
  float_t (*get)(uint32_t resource_id, uint32_t index),
  int32_t (*set)(uint32_t resource_id, uint32_t index, float_t value),
  int32_t (*set_array)(uint32_t resource_id, float_t *array)
) {
  JSValue prop = js_websg_new_vector2_get_set(ctx, resource_id, get, set, set_array);
  return JS_DefinePropertyValueStr(ctx, obj, name, prop, JS_PROP_ENUMERABLE);
}