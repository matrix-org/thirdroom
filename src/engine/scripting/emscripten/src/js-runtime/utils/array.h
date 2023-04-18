#ifndef __js_utils_exception_h
#define __js_utils_exception_h
#include <math.h>
#include <stdint.h>
#include "../quickjs/quickjs.h"

int js_get_float_array_like(JSContext *ctx, JSValue arr, float_t * elements, int length);

int js_get_int_array_like(JSContext *ctx, JSValue arr, uint32_t *elements, int length);

#endif
