#include <emscripten.h>
#include <emscripten/console.h>
#include <math.h>
#include <stdbool.h>
#include <string.h>

#include "../include/quickjs/cutils.h"
#include "../include/quickjs/quickjs.h"
#include "jsutils.h"
#include "script-context.h"
#include "./generated/websg.h"
#include "./generated/node.h"

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

JSValue JS_CreateArrayBuffer(JSContext *ctx, ArrayBuffer array_buffer) {
  return JS_NewArrayBuffer(ctx, array_buffer.buf, array_buffer.size, NULL, NULL, false);;
}

int JS_ToFloat32(JSContext *ctx, float_t *pres, JSValueConst val) {
  double f64Val;
  
  int res = JS_ToFloat64(ctx, &f64Val, val);

  *pres = (float_t) f64Val;

  return res;
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

int JS_DefineReadOnlyFloat32ArrayProperty(JSContext *ctx, JSValueConst this_obj, const char *prop, void *arr, int size)
{
  JSValue val = JS_CreateFloat32Array(ctx, arr, size);
  return JS_DefineReadOnlyPropertyValueStr(ctx, this_obj, prop, val);
}


int JS_DefineReadOnlyArrayBufferProperty(JSContext *ctx, JSValueConst this_obj, const char *prop, ArrayBuffer array_buffer)
{
  JSValue val = JS_CreateArrayBuffer(ctx, array_buffer);
  return JS_DefineReadOnlyPropertyValueStr(ctx, this_obj, prop, val);
}

int JS_GetArrayLength(JSContext *ctx, JSValue value) {
  JSValue lenVal = JS_GetPropertyStr(ctx, value, "length");

  if (JS_IsException(lenVal)) {
    JS_FreeValue(ctx, lenVal);
    return -1;
  }

  int len;
  
  JS_ToInt32(ctx, &len, lenVal);

  return len;
}

/**
 * RefArrayIterator
 */

typedef struct JSRefArrayIteratorData {
    void **arr;
    JSValue (*fn_ptr)(JSContext *ctx, void *res);
    uint32_t idx;
    uint32_t size;
} JSRefArrayIteratorData;

static JSClassID js_ref_array_iterator_class_id;

static void js_ref_array_iterator_finalizer(JSRuntime *rt, JSValue val) {
  JSRefArrayIteratorData *it = JS_GetOpaque(val, js_ref_array_iterator_class_id);

  if (it) {
    js_free_rt(rt, it);
  }
}

static JSClassDef js_ref_array_iterator_class = {
  "RefArrayIterator",
  .finalizer = js_ref_array_iterator_finalizer
};

static JSValue js_ref_array_iterator_next(
  JSContext *ctx,
  JSValueConst this_val,
  int argc,
  JSValueConst *argv,
  BOOL *pdone,
  int magic
) {
  JSRefArrayIteratorData *it = JS_GetOpaque2(ctx, this_val, js_ref_array_iterator_class_id);

  if (!it) {
    *pdone = FALSE;
    return JS_EXCEPTION;
  }

  if (it->idx >= it->size) {
    *pdone = TRUE;
    return JS_UNDEFINED;
  }

  void *resource = it->arr[it->idx];

  if (resource == NULL) {
    *pdone = TRUE;
    return JS_UNDEFINED;
  }

  *pdone = FALSE;
  JSValue val = (*it->fn_ptr)(ctx, resource);

  if (JS_IsException(val)) {
    return JS_EXCEPTION;
  }

  it->idx = it->idx + 1;

  return val;
}

static JSValue js_ref_array_iterator(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  return JS_DupValue(ctx, this_val);
}

static const JSCFunctionListEntry js_ref_array_iterator_proto_funcs[] = {
  JS_ITERATOR_NEXT_DEF("next", 0, js_ref_array_iterator_next, 0),
  JS_PROP_STRING_DEF("[Symbol.toStringTag]", "RefArrayIterator", JS_PROP_CONFIGURABLE),
  JS_CFUNC_DEF("[Symbol.iterator]", 0, js_ref_array_iterator),
};

JSValue JS_NewRefArrayIterator(
  JSContext *ctx,
  JSValue (*fn_ptr)(JSContext *ctx, void *res),
  void **arr,
  int size
) {
  JSValue iter_obj = JS_NewObjectClass(ctx, js_ref_array_iterator_class_id);

  if (JS_IsException(iter_obj)) {
    return JS_EXCEPTION;
  }

  JSRefArrayIteratorData *it = js_malloc(ctx, sizeof(JSRefArrayIteratorData));
  
  if (!it) {
    JS_FreeValue(ctx, iter_obj);
    return JS_EXCEPTION;
  }

  it->fn_ptr = fn_ptr;
  it->arr = arr;
  it->idx = 0;
  it->size = size;

  JS_SetOpaque(iter_obj, it);

  return iter_obj;
}

void JS_DefineRefArrayIterator(JSContext *ctx) {
  JSRuntime *rt = JS_GetRuntime(ctx);

  JS_NewClassID(&js_ref_array_iterator_class_id);
  JS_NewClass(rt, js_ref_array_iterator_class_id, &js_ref_array_iterator_class);

  JSValue ref_arr_proto = JS_NewObject(ctx);
  JS_SetPropertyFunctionList(
    ctx,
    ref_arr_proto,
    js_ref_array_iterator_proto_funcs,
    countof(js_ref_array_iterator_proto_funcs)
  );

  JS_SetClassProto(ctx, js_ref_array_iterator_class_id, ref_arr_proto);
}

JSValue JS_AddRefArrayItem(JSContext *ctx, JSClassID class_id, void **arr, int size, JSValue item) {
  void* ref = JS_GetOpaque2(ctx, item, class_id);

  for (int i = 0; i < size; i++) {
    if (!arr[i]) {
      arr[i] = ref;
      return JS_UNDEFINED;
    }
  }

  JS_ThrowRangeError(ctx, "RefArray full");

  return JS_EXCEPTION;
}

JSValue JS_RemoveRefArrayItem(JSContext *ctx, JSClassID class_id, void **arr, int size, JSValue item) {
  void* ref = JS_GetOpaque2(ctx, item, class_id);

  for (int i = 0; i < size; i++) {
    if (arr[i] == ref) {
      // TODO: Free JSValue
      arr[i] = 0;
      return JS_TRUE;
    }

    if (!arr[i]) {
      return JS_FALSE;
    }
  }

  return JS_FALSE;
}

int JS_ToRefArray(JSContext *ctx, JSValue value, JSClassID class_id, void **arr, int size) {
  // TODO: Handle Iterators
  if (JS_IsArray(ctx, value) != true) {
    return -1;
  }

  for (int i = 0; i < size && i < JS_GetArrayLength(ctx, value); i++) {
    JSValue el = JS_GetPropertyUint32(ctx, value, i);
    void* ref = JS_GetOpaque2(ctx, el, class_id);

    if (!ref) {
      break;
    }

    arr[i] = ref;
  }

  return 0;
}

/**
 * RefMap
 */

typedef struct JSRefMapIteratorData {
    void **arr;
    JSValue (*fn_ptr)(JSContext *ctx, void *res);
    uint32_t idx;
    uint32_t size;
} JSRefMapIteratorData;

static JSClassID js_ref_map_iterator_class_id;

static void js_ref_map_iterator_finalizer(JSRuntime *rt, JSValue val) {
  JSRefMapIteratorData *it = JS_GetOpaque(val, js_ref_map_iterator_class_id);

  if (it) {
    js_free_rt(rt, it);
  }
}

static JSClassDef js_ref_map_iterator_class = {
  "RefMapIterator",
  .finalizer = js_ref_map_iterator_finalizer
};

static JSValue js_ref_map_iterator_next(
  JSContext *ctx,
  JSValueConst this_val,
  int argc,
  JSValueConst *argv,
  BOOL *pdone,
  int magic
) {
  JSRefMapIteratorData *it = JS_GetOpaque2(ctx, this_val, js_ref_map_iterator_class_id);

  if (!it) {
    *pdone = FALSE;
    return JS_EXCEPTION;
  }

  void *resource = it->arr[it->idx];
  
  while(!resource && it->idx < it->size) {
    it->idx = it->idx + 1;
    resource = it->arr[it->idx];
  }

  if (it->idx >= it->size) {
    *pdone = TRUE;
    return JS_UNDEFINED;
  }

  *pdone = FALSE;

  JSValue key = JS_NewUint32(ctx, it->idx);
  JSValue val = (*it->fn_ptr)(ctx, resource);

  if (JS_IsException(val)) {
    return JS_EXCEPTION;
  }

  JSValue arr = JS_NewArray(ctx);

  if (JS_IsException(arr)) {
    return JS_EXCEPTION;
  }

  if (JS_SetPropertyUint32(ctx, arr, 0, key)) {
    JS_FreeValue(ctx, arr);
    return JS_EXCEPTION;
  }

  if (JS_SetPropertyUint32(ctx, arr, 1, val)) {
    JS_FreeValue(ctx, arr);
    return JS_EXCEPTION;
  }

  return arr;
}

static JSValue js_ref_map_iterator(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  return JS_DupValue(ctx, this_val);
}

static const JSCFunctionListEntry js_ref_map_iterator_proto_funcs[] = {
  JS_ITERATOR_NEXT_DEF("next", 0, js_ref_map_iterator_next, 0),
  JS_PROP_STRING_DEF("[Symbol.toStringTag]", "RefMapIterator", JS_PROP_CONFIGURABLE),
  JS_CFUNC_DEF("[Symbol.iterator]", 0, js_ref_map_iterator),
};

JSValue JS_NewRefMapIterator(
  JSContext *ctx,
  JSValue (*fn_ptr)(JSContext *ctx, void *res),
  void **arr,
  int size
) {
  JSValue iter_obj = JS_NewObjectClass(ctx, js_ref_map_iterator_class_id);

  if (JS_IsException(iter_obj)) {
    return JS_EXCEPTION;
  }

  JSRefMapIteratorData *it = js_malloc(ctx, sizeof(JSRefMapIteratorData));
  
  if (!it) {
    JS_FreeValue(ctx, iter_obj);
    return JS_EXCEPTION;
  }

  it->fn_ptr = fn_ptr;
  it->arr = arr;
  it->idx = 0;
  it->size = size;

  JS_SetOpaque(iter_obj, it);

  return iter_obj;
}

void JS_DefineRefMapIterator(JSContext *ctx) {
  JSRuntime *rt = JS_GetRuntime(ctx);

  JS_NewClassID(&js_ref_map_iterator_class_id);
  JS_NewClass(rt, js_ref_map_iterator_class_id, &js_ref_map_iterator_class);

  JSValue ref_map_proto = JS_NewObject(ctx);
  JS_SetPropertyFunctionList(
    ctx,
    ref_map_proto,
    js_ref_map_iterator_proto_funcs,
    countof(js_ref_map_iterator_proto_funcs)
  );

  JS_SetClassProto(ctx, js_ref_map_iterator_class_id, ref_map_proto);
}

JSValue JS_GetRefMapItem(JSContext *ctx, JSValue (*fn_ptr)(JSContext *ctx, void *res), void **arr, int size, JSValue key) {
   int32_t idx;

  if (JS_ToInt32(ctx, &idx, key)) {
    return JS_EXCEPTION;
  }

  if (idx < 0 || idx > size - 1) {
    JS_ThrowRangeError(ctx, "Index is out of range");
    return JS_EXCEPTION;
  }

  if (!arr[idx]) {
    return JS_UNDEFINED;
  }

  return fn_ptr(ctx, arr[idx]);
}

JSValue JS_SetRefMapItem(JSContext *ctx, void **arr, int size, JSValue key, JSValue item) {
  int32_t idx;

  if (JS_ToInt32(ctx, &idx, key)) {
    return JS_EXCEPTION;
  }

  if (idx < 0 || idx > size - 1) {
    JS_ThrowRangeError(ctx, "Index is out of range");
    return JS_EXCEPTION;
  }

  if (!arr[idx]) {
    return JS_FALSE;
  }

  arr[idx] = 0;

  return JS_TRUE;
}

JSValue JS_DeleteRefMapItem(JSContext *ctx, void **arr, int size, JSValue key) {
  int32_t idx;

  if (JS_ToInt32(ctx, &idx, key)) {
    return JS_EXCEPTION;
  }

  if (idx < 0 || idx > size - 1) {
    JS_ThrowRangeError(ctx, "Index is out of range");
    return JS_EXCEPTION;
  }
 
  if (!arr[idx]) {
    return JS_FALSE;
  }

  arr[idx] = 0;

  return JS_TRUE;
}

/**
 * SceneNodesIterator
 */

// typedef struct JSNodeIteratorData {
//     Node *cur;
// } JSNodeIteratorData;

// static JSClassID js_node_iterator_class_id;

// static void js_node_iterator_finalizer(JSRuntime *rt, JSValue val) {
//   JSNodeIteratorData *it = JS_GetOpaque(val, js_node_iterator_class_id);

//   if (it) {
//     js_free_rt(rt, it);
//   }
// }

// static JSClassDef js_node_iterator_class = {
//   "NodeIterator",
//   .finalizer = js_node_iterator_finalizer
// };

// static JSValue js_node_iterator_next(
//   JSContext *ctx,
//   JSValueConst this_val,
//   int argc,
//   JSValueConst *argv,
//   BOOL *pdone,
//   int magic
// ) {
//   JSNodeIteratorData *it = JS_GetOpaque2(ctx, this_val, js_node_iterator_class_id);

//   if (!it) {
//     *pdone = FALSE;
//     return JS_EXCEPTION;
//   }

//   if (!it->cur) {
//     *pdone = TRUE;
//     return JS_UNDEFINED;
//   }

//   *pdone = FALSE;
//   JSValue val = create_node_from_ptr(ctx, it->cur);

//   if (JS_IsException(val)) {
//     return JS_EXCEPTION;
//   }

//   it->cur = it->cur->next_sibling;

//   return val;
// }

// static const JSCFunctionListEntry js_node_iterator_proto_funcs[] = {
//   JS_ITERATOR_NEXT_DEF("next", 0, js_node_iterator_next, 0),
//   JS_PROP_STRING_DEF("[Symbol.toStringTag]", "NodeIterator", JS_PROP_CONFIGURABLE),
// };

// JSValue JS_NewNodeIterator(
//   JSContext *ctx,
//   Node *first_node
// ) {
//   JSValue iter_obj = JS_NewObjectClass(ctx, js_node_iterator_class_id);

//   if (JS_IsException(iter_obj)) {
//     return JS_EXCEPTION;
//   }

//   JSNodeIteratorData *it = js_malloc(ctx, sizeof(JSNodeIteratorData));
  
//   if (!it) {
//     JS_FreeValue(ctx, iter_obj);
//     return JS_EXCEPTION;
//   }

//   it->cur = first_node;

//   JS_SetOpaque(iter_obj, it);

//   return iter_obj;
// }

// void JS_DefineNodeIterator(JSContext *ctx) {
//   JSRuntime *rt = JS_GetRuntime(ctx);

//   JS_NewClassID(&js_node_iterator_class_id);
//   JS_NewClass(rt, js_node_iterator_class_id, &js_node_iterator_class);

//   JSValue ref_arr_proto = JS_NewObject(ctx);
//   JS_SetPropertyFunctionList(
//     ctx,
//     ref_arr_proto,
//     js_node_iterator_proto_funcs,
//     countof(js_node_iterator_proto_funcs)
//   );

//   JS_SetClassProto(ctx, js_node_iterator_class_id, ref_arr_proto);
// }

