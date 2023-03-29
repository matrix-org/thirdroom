#include <math.h>
#include "../quickjs/quickjs.h"

int js_get_float_array_like(JSContext *ctx, JSValue arr, float_t *elements, int length) {
  for (int i = 0; i < length; i++) {
    JSValue el = JS_GetPropertyUint32(ctx, arr, i);

    if (JS_IsException(el)) {
      return -1;
    }

    double element;

    if (JS_ToFloat64(ctx, &element, el) < 0) {
      return -1;
    }

    elements[i] = (float_t)element;
  }

  return 0;
}

int js_get_int_array_like(JSContext *ctx, JSValue arr, uint32_t *elements, int length) {
  for (int i = 0; i < length; i++) {
    JSValue el = JS_GetPropertyUint32(ctx, arr, i);

    if (JS_IsException(el)) {
      return -1;
    }

    if (JS_ToUint32(ctx, &elements[i], el) < 0) {
      return -1;
    }
  }

  return 0;
}