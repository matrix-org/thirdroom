#ifndef __js_utils_h
#define __js_utils_h
#include "./quickjs/quickjs.h"

void *get_typed_array_data(JSContext *ctx, JSValue *value, size_t byte_length);

#endif
