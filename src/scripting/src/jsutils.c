#include <emscripten.h>
#include <emscripten/console.h>
#include <math.h>
#include <stdbool.h>
#include <string.h>

#include "../include/quickjs/cutils.h"
#include "../include/quickjs/quickjs.h"
#include "jsutils.h"
#include "websg.h"

JSValue JS_CreateFloat32Array(JSContext *ctx, float_t *target, int size) {
  JSValue global = JS_GetGlobalObject(ctx);
  JSValue float32ArrayConstructor = JS_GetPropertyStr(ctx, global, "Float32Array");
  JSValue arrayBuffer = JS_NewArrayBuffer(ctx, (uint8_t *)target, size * 4, NULL, NULL, false);
  JSValue offset = JS_NewUint32(ctx, 0);
  JSValue arrSize = JS_NewUint32(ctx, size);
  JSValue args[] = { arrayBuffer, offset, arrSize };
  JSValue float32Array = JS_CallConstructor(ctx, float32ArrayConstructor, 3, args);
  JS_FreeValue(ctx, float32ArrayConstructor);
  JS_FreeValue(ctx, offset);
  JS_FreeValue(ctx, arrSize);
  JS_FreeValue(ctx, global);
  return float32Array;
}

int JS_DefineReadOnlyPropertyValueStr(JSContext *ctx, JSValueConst this_obj, const char *prop, JSValue val) {
  JSAtom atom;
  int ret;
  atom = JS_NewAtom(ctx, prop);
  ret = JS_DefineProperty(
    ctx,
    this_obj,
    atom,
    val,
    JS_UNDEFINED,
    JS_UNDEFINED,
    JS_PROP_HAS_VALUE | JS_PROP_HAS_ENUMERABLE
  );
  JS_FreeValue(ctx, val);
  JS_FreeAtom(ctx, atom);
  return ret;
}