#ifndef __jsutils_h
#define __jsutils_h
#include <math.h>

#include "../include/quickjs/quickjs.h"

JSValue JS_CreateFloat32Array(JSContext *ctx, float_t *target, int size);

int JS_DefineReadOnlyPropertyValueStr(JSContext *ctx, JSValueConst this_obj, const char *prop, JSValue val);

#endif