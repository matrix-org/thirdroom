#ifndef __websg_rgb_js_h
#define __websg_rgb_js_h
#include <math.h>
#include "../quickjs/quickjs.h"

typedef struct WebSGRGBData {
  uint32_t resource_id;
  float_t elements[3];
  float_t (*get)(uint32_t resource_id, float_t *elements, int index);
  void (*set)(uint32_t resource_id, float_t *element, int index, float_t value);
} WebSGRGBData;

static JSClassID js_websg_rgb_class_id;

void js_websg_define_rgb(JSContext *ctx, JSValue websg);

int js_websg_define_rgb_prop(
  JSContext *ctx,
  JSValue obj,
  const char *name,
  uint32_t resource_id,
  float_t (*get)(uint32_t resource_id, float_t *elements, int index),
  void (*set)(uint32_t resource_id, float_t *elements, int index, float_t value)
);

#endif
