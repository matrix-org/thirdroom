#ifndef __websg_matrix4_js_h
#define __websg_matrix4_js_h
#include <math.h>
#include "../quickjs/quickjs.h"

typedef struct WebSGMatrix4Data {
  uint32_t resource_id;
  float_t elements[16];
  int read_only;
  float_t (*get)(uint32_t resource_id, float_t *elements, int index);
  void (*set)(uint32_t resource_id, float_t *element, int index, float_t value);
} WebSGMatrix4Data;

static JSClassID js_websg_matrix4_class_id;

void js_websg_define_matrix4(JSContext *ctx, JSValue websg);

int js_websg_define_matrix4_prop(
  JSContext *ctx,
  JSValue obj,
  const char *name,
  uint32_t resource_id,
  float_t (*get)(uint32_t resource_id, float_t *elements, int index),
  void (*set)(uint32_t resource_id, float_t *elements, int index, float_t value)
);

int js_websg_define_matrix4_prop_read_only(
  JSContext *ctx,
  JSValue obj,
  const char *name,
  uint32_t resource_id,
  float_t (*get)(uint32_t resource_id, float_t *elements, int index)
);

#endif
