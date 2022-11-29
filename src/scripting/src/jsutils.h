#ifndef __jsutils_h
#define __jsutils_h
#include <math.h>

#include "../include/quickjs/quickjs.h"
#include "./generated/websg.h"

JSValue JS_CreateFloat32Array(JSContext *ctx, float_t *target, int size);
int JS_ToFloat32(JSContext *ctx, float_t *pres, JSValueConst val);
JSValue JS_CreateArrayBuffer(JSContext *ctx, ArrayBuffer array_buffer);

int JS_DefineReadOnlyPropertyValueStr(JSContext *ctx, JSValueConst this_obj, const char *prop, JSValue val);

int JS_ToRefArray(JSContext *ctx, JSValue value, JSClassID class_id, void **arr, int capacity);

int JS_DefineReadOnlyFloat32ArrayProperty(JSContext *ctx, JSValueConst this_obj, const char *prop, void *arr, int size);
int JS_DefineReadOnlyArrayBufferProperty(JSContext *ctx, JSValueConst this_obj, const char *prop, ArrayBuffer array_buffer);

JSValue JS_NewRefArrayIterator(
  JSContext *ctx,
  JSValue (*fn_ptr)(JSContext *ctx, void *res),
  void **arr,
  int size
);
JSValue JS_AddRefArrayItem(JSContext *ctx, JSClassID class_id, void **arr, int size, JSValue item);
JSValue JS_RemoveRefArrayItem(JSContext *ctx, JSClassID class_id, void **arr, int size, JSValue item);
void JS_DefineRefArrayIterator(JSContext *ctx);

// JSValue JS_NewNodeIterator(JSContext *ctx, Node *first_node);
// void JS_DefineNodeIterator(JSContext *ctx);

JSValue JS_NewRefMapIterator(
  JSContext *ctx,
  JSValue (*fn_ptr)(JSContext *ctx, void *res),
  void **arr,
  int size
);
void JS_DefineRefMapIterator(JSContext *ctx);
JSValue JS_GetRefMapItem(JSContext *ctx, JSValue (*fn_ptr)(JSContext *ctx, void *res), void **arr, int size, JSValue key);
JSValue JS_SetRefMapItem(JSContext *ctx, void **arr, int size, JSValue key, JSValue item);
JSValue JS_DeleteRefMapItem(JSContext *ctx, void **arr, int size, JSValue key);

#endif