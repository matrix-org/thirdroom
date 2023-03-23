#ifndef __websg_vector3_js_h
#define __websg_vector3_js_h
#include <math.h>
#include "./quickjs/quickjs.h"

static JSClassID websg_vector3_class_id;

void js_websg_define_vector3(JSContext *ctx);

JSValue js_websg_new_vector3_get_set(
  JSContext *ctx,
  uint32_t resource_id,
  float_t (*get)(uint32_t resource_id, float_t *elements, int index),
  void (*set)(uint32_t resource_id, float_t *elements, int index, float_t value)
);

int js_websg_define_vector3_prop(
  JSContext *ctx,
  JSValue obj,
  const char *name,
  uint32_t resource_id,
  float_t (*get)(uint32_t resource_id, float_t *elements, int index),
  void (*set)(uint32_t resource_id, float_t *elements, int index, float_t value)
);

#endif
