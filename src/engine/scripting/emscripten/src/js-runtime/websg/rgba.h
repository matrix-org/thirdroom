#ifndef __websg_rgba_js_h
#define __websg_rgba_js_h
#include <math.h>
#include "../quickjs/quickjs.h"

typedef struct WebSGRGBAData {
  uint32_t resource_id;
  float_t elements[4];
  float_t (*get)(uint32_t resource_id, float_t *elements, int index);
  void (*set)(uint32_t resource_id, float_t *element, int index, float_t value);
} WebSGRGBAData;

extern JSClassID js_websg_rgba_class_id;

void js_websg_define_rgba(JSContext *ctx, JSValue websg);

int js_websg_define_rgba_prop(
  JSContext *ctx,
  JSValue obj,
  const char *name,
  uint32_t resource_id,
  float_t (*get)(uint32_t resource_id, float_t *elements, int index),
  void (*set)(uint32_t resource_id, float_t *elements, int index, float_t value)
);

#endif
