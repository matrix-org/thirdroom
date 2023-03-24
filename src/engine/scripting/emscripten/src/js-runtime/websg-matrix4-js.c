#include <string.h>
#include "./quickjs/cutils.h"
#include "./quickjs/quickjs.h"
#include "../websg.h"
#include "./js-utils.h"
#include "./websg-matrix4-js.h"

typedef struct WebSGMatrix4Data {
  uint32_t resource_id;
  float_t elements[16];
  int read_only;
  float_t (*get)(uint32_t resource_id, float_t *elements, int index);
  void (*set)(uint32_t resource_id, float_t *element, int index, float_t value);

} WebSGMatrix4Data;

static void js_websg_matrix4_finalizer(JSRuntime *rt, JSValue val) {
  WebSGMatrix4Data *matrix_data = JS_GetOpaque(val, websg_matrix4_class_id);

  if (matrix_data) {
    js_free_rt(rt, matrix_data);
  }
}

static JSClassDef websg_matrix4_class = {
  "Matrix4",
  .finalizer = js_websg_matrix4_finalizer
};

static JSValue js_websg_matrix4_get(JSContext *ctx, JSValueConst this_val, int index) {
  WebSGMatrix4Data *matrix_data = JS_GetOpaque(this_val, websg_matrix4_class_id);

  if (matrix_data->get == NULL) {
    return JS_NewFloat64(ctx, matrix_data->elements[index]);
  }

  return JS_NewFloat64(ctx, matrix_data->get(matrix_data->resource_id, matrix_data->elements, index));
}

static JSValue js_websg_matrix4_set(JSContext *ctx, JSValueConst this_val, JSValueConst arg, int index) {
  WebSGMatrix4Data *matrix_data = JS_GetOpaque(this_val, websg_matrix4_class_id);

  if (matrix_data->read_only == 1) {
    return JS_ThrowTypeError(ctx, "Matrix4 is marked as read only.");
  }

  double_t value;

  if (JS_ToFloat64(ctx, &value, arg) == -1) {
    return JS_EXCEPTION;
  }

  if (matrix_data->set == NULL) {
    matrix_data->elements[index] = (float_t)value;
    return JS_UNDEFINED;
  }

  matrix_data->set(matrix_data->resource_id, matrix_data->elements, index, (float_t)value);

  return JS_UNDEFINED;
}

static const JSCFunctionListEntry js_websg_matrix4_proto_funcs[] = {
  JS_CGETSET_MAGIC_DEF("0", js_websg_matrix4_get, js_websg_matrix4_set, 0),
  JS_CGETSET_MAGIC_DEF("1", js_websg_matrix4_get, js_websg_matrix4_set, 1),
  JS_CGETSET_MAGIC_DEF("2", js_websg_matrix4_get, js_websg_matrix4_set, 2),
  JS_CGETSET_MAGIC_DEF("3", js_websg_matrix4_get, js_websg_matrix4_set, 3),
  JS_CGETSET_MAGIC_DEF("4", js_websg_matrix4_get, js_websg_matrix4_set, 4),
  JS_CGETSET_MAGIC_DEF("5", js_websg_matrix4_get, js_websg_matrix4_set, 5),
  JS_CGETSET_MAGIC_DEF("6", js_websg_matrix4_get, js_websg_matrix4_set, 6),
  JS_CGETSET_MAGIC_DEF("7", js_websg_matrix4_get, js_websg_matrix4_set, 7),
  JS_CGETSET_MAGIC_DEF("8", js_websg_matrix4_get, js_websg_matrix4_set, 8),
  JS_CGETSET_MAGIC_DEF("9", js_websg_matrix4_get, js_websg_matrix4_set, 9),
  JS_CGETSET_MAGIC_DEF("10", js_websg_matrix4_get, js_websg_matrix4_set, 10),
  JS_CGETSET_MAGIC_DEF("11", js_websg_matrix4_get, js_websg_matrix4_set, 11),
  JS_CGETSET_MAGIC_DEF("12", js_websg_matrix4_get, js_websg_matrix4_set, 12),
  JS_CGETSET_MAGIC_DEF("13", js_websg_matrix4_get, js_websg_matrix4_set, 13),
  JS_CGETSET_MAGIC_DEF("14", js_websg_matrix4_get, js_websg_matrix4_set, 14),
  JS_CGETSET_MAGIC_DEF("15", js_websg_matrix4_get, js_websg_matrix4_set, 15),
  JS_PROP_INT32_DEF("length", 16, JS_PROP_ENUMERABLE),
};

void js_websg_define_matrix4(JSContext *ctx) {
  JS_NewClassID(&websg_matrix4_class_id);
  JS_NewClass(JS_GetRuntime(ctx), websg_matrix4_class_id, &websg_matrix4_class);
  JSValue world_proto = JS_NewObject(ctx);
  JS_SetPropertyFunctionList(ctx, world_proto, js_websg_matrix4_proto_funcs, countof(js_websg_matrix4_proto_funcs));
  JS_SetClassProto(ctx, websg_matrix4_class_id, world_proto);
}

JSValue js_websg_new_matrix4_get_set(
  JSContext *ctx,
  uint32_t resource_id,
  float_t (*get)(uint32_t resource_id, float_t *elements, int index),
  void (*set)(uint32_t resource_id, float_t *elements, int index, float_t value),
  int read_only
) {
  JSValue matrix4 = JS_NewObjectClass(ctx, websg_matrix4_class_id);

  WebSGMatrix4Data *matrix_data = js_mallocz(ctx, sizeof(WebSGMatrix4Data));
  matrix_data->get = get;
  matrix_data->set = set;
  matrix_data->read_only = read_only;
  matrix_data->resource_id = resource_id;

  JS_SetOpaque(matrix4, matrix_data);

  return matrix4;
}

int js_websg_define_matrix4_prop(
  JSContext *ctx,
  JSValue obj,
  const char *name,
  uint32_t resource_id,
  float_t (*get)(uint32_t resource_id, float_t *elements, int index),
  void (*set)(uint32_t resource_id, float_t *elements, int index, float_t value)
) {
  JSValue prop = js_websg_new_matrix4_get_set(ctx, resource_id, get, set, 0);
  return JS_DefinePropertyValueStr(ctx, obj, name, prop, JS_PROP_ENUMERABLE);
}

int js_websg_define_matrix4_prop_read_only(
  JSContext *ctx,
  JSValue obj,
  const char *name,
  uint32_t resource_id,
  float_t (*get)(uint32_t resource_id, float_t *elements, int index)
) {
  JSValue prop = js_websg_new_matrix4_get_set(ctx, resource_id, get, NULL, 1);
  return JS_DefinePropertyValueStr(ctx, obj, name, prop, JS_PROP_ENUMERABLE);
}