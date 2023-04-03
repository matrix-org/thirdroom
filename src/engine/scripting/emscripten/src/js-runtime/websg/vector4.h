#ifndef __websg_vector4_js_h
#define __websg_vector4_js_h
#include <math.h>
#include "../quickjs/quickjs.h"

typedef struct WebSGVector4Data {
  uint32_t resource_id;
  float_t elements[4];
  float_t (*get)(uint32_t resource_id, float_t *elements, int index);
  void (*set)(uint32_t resource_id, float_t *element, int index, float_t value);
} WebSGVector4Data;

static JSClassID js_websg_vector4_class_id;

void js_websg_define_vector4(JSContext *ctx, JSValue websg);

int js_websg_define_vector4_prop(
  JSContext *ctx,
  JSValue obj,
  const char *name,
  uint32_t resource_id,
  float_t (*get)(uint32_t resource_id, float_t *elements, int index),
  void (*set)(uint32_t resource_id, float_t *elements, int index, float_t value)
);

#endif
