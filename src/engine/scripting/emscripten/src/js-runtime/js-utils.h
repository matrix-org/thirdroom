#ifndef __js_utils_h
#define __js_utils_h
#include "./quickjs/quickjs.h"

void *get_typed_array_data(JSContext *ctx, JSValue *value, size_t byte_length);

void js_set_opaque_id(JSValue obj, uint32_t id);

uint32_t js_get_own_opaque_id(JSValue obj, JSClassID class_id);

uint32_t js_get_opaque_id(JSContext *ctx, JSValue obj, JSClassID class_id);

typedef struct WebSGContext {
  JSValue scenes;
  JSValue nodes;
} WebSGContext;

#endif
