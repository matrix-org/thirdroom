#ifndef __websg_vector4_js_h
#define __websg_vector4_js_h
#include <math.h>
#include "../quickjs/quickjs.h"

typedef struct WebSGVector4Data {
  uint32_t resource_id;
  float_t *elements;
  float_t (*get)(uint32_t resource_id, uint32_t index);
  int32_t (*set)(uint32_t resource_id, uint32_t index, float_t value);
  int32_t (*set_array)(uint32_t resource_id, float_t *array);
} WebSGVector4Data;

extern JSClassID js_websg_vector4_class_id;

void js_websg_define_vector4(JSContext *ctx, JSValue websg);

JSValue js_websg_create_vector4(JSContext *ctx, float* elements);

int js_websg_define_vector4_prop(
  JSContext *ctx,
  JSValue obj,
  const char *name,
  uint32_t resource_id,
  float_t (*get)(uint32_t resource_id, uint32_t index),
  int32_t (*set)(uint32_t resource_id, uint32_t index, float_t value),
  int32_t (*set_array)(uint32_t resource_id, float_t *array)
);

#endif
