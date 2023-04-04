#ifndef __websg_quaternion_js_h
#define __websg_quaternion_js_h
#include <math.h>
#include "../quickjs/quickjs.h"

typedef struct WebSGQuaternionData {
  uint32_t resource_id;
  float_t elements[4];
  float_t (*get)(uint32_t resource_id, float_t *elements, int index);
  void (*set)(uint32_t resource_id, float_t *element, int index, float_t value);
} WebSGQuaternionData;

extern JSClassID js_websg_quaternion_class_id;

void js_websg_define_quaternion(JSContext *ctx, JSValue websg);

int js_websg_define_quaternion_prop(
  JSContext *ctx,
  JSValue obj,
  const char *name,
  uint32_t resource_id,
  float_t (*get)(uint32_t resource_id, float_t *elements, int index),
  void (*set)(uint32_t resource_id, float_t *elements, int index, float_t value)
);

#endif
