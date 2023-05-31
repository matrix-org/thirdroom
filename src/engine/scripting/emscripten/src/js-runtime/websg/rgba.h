#ifndef __websg_rgba_js_h
#define __websg_rgba_js_h
#include <math.h>
#include "../quickjs/quickjs.h"

typedef struct WebSGRGBAData {
  uint32_t resource_id;
  float_t *elements;
  float_t (*get)(uint32_t resource_id, uint32_t index);
  int32_t (*set)(uint32_t resource_id, uint32_t index, float_t value);
  int32_t (*set_array)(uint32_t resource_id, float_t *array);
} WebSGRGBAData;

extern JSClassID js_websg_rgba_class_id;

void js_websg_define_rgba(JSContext *ctx, JSValue websg);

JSValue js_websg_create_rgba(JSContext *ctx, float* elements);

int js_websg_define_rgba_prop(
  JSContext *ctx,
  JSValue obj,
  const char *name,
  uint32_t resource_id,
  float_t (*get)(uint32_t resource_id, uint32_t index),
  int32_t (*set)(uint32_t resource_id, uint32_t index, float_t value),
  int32_t (*set_array)(uint32_t resource_id, float_t *array)
);

#endif
