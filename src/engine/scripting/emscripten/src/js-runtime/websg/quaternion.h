#ifndef __websg_quaternion_js_h
#define __websg_quaternion_js_h
#include <math.h>
#include "../quickjs/quickjs.h"

typedef struct WebSGQuaternionData {
  uint32_t resource_id;
  float_t *elements;
  int read_only;
  float_t (*get)(uint32_t resource_id, uint32_t index);
  int32_t (*set)(uint32_t resource_id, uint32_t index, float_t value);
  int32_t (*set_array)(uint32_t resource_id, float_t *array);
} WebSGQuaternionData;

extern JSClassID js_websg_quaternion_class_id;

void js_websg_define_quaternion(JSContext *ctx, JSValue websg);

JSValue js_websg_create_quaternion(JSContext *ctx, float* elements);

int js_websg_define_quaternion_prop(
  JSContext *ctx,
  JSValue obj,
  const char *name,
  uint32_t resource_id,
  float_t (*get)(uint32_t resource_id, uint32_t index),
  int32_t (*set)(uint32_t resource_id, uint32_t index, float_t value),
  int32_t (*set_array)(uint32_t resource_id, float_t *array)
);

int js_websg_define_quaternion_prop_read_only(
  JSContext *ctx,
  JSValue obj,
  const char *name,
  uint32_t resource_id,
  float_t (*get)(uint32_t resource_id, uint32_t index)
);

#endif
