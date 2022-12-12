#include <emscripten.h>
#include <emscripten/console.h>
#include <math.h>
#include <stdbool.h>
#include <string.h>

#include "../../include/quickjs/cutils.h"
#include "../../include/quickjs/quickjs.h"

#include "../jsutils.h"
#include "../websg-utils.h"
#include "../script-context.h"
#include "websg.h"
#include "sparse-accessor.h"
#include "buffer-view.h"

/**
 * WebSG.SparseAccessor
 */

JSClassID js_sparse_accessor_class_id;

static JSValue js_sparse_accessor_constructor(JSContext *ctx, JSValueConst new_target, int argc, JSValueConst *argv) {
  SparseAccessor *sparse_accessor = js_mallocz(ctx, sizeof(SparseAccessor));

  

  if (websg_create_resource(ResourceType_SparseAccessor, sparse_accessor)) {
    return JS_EXCEPTION;
  }

  return create_sparse_accessor_from_ptr(ctx, sparse_accessor);
}


static JSValue js_sparse_accessor_get_count(JSContext *ctx, JSValueConst this_val) {
  SparseAccessor *sparse_accessor = JS_GetOpaque2(ctx, this_val, js_sparse_accessor_class_id);

  if (!sparse_accessor) {
    return JS_EXCEPTION;
  } else {
    JSValue val;
    val = JS_NewUint32(ctx, sparse_accessor->count);
    return val;
  }
}


static JSValue js_sparse_accessor_get_indices_buffer_view(JSContext *ctx, JSValueConst this_val) {
  SparseAccessor *sparse_accessor = JS_GetOpaque2(ctx, this_val, js_sparse_accessor_class_id);

  if (!sparse_accessor) {
    return JS_EXCEPTION;
  } else {
    JSValue val;
    val = create_buffer_view_from_ptr(ctx, sparse_accessor->indices_buffer_view);
    return val;
  }
}


static JSValue js_sparse_accessor_get_indices_byte_offset(JSContext *ctx, JSValueConst this_val) {
  SparseAccessor *sparse_accessor = JS_GetOpaque2(ctx, this_val, js_sparse_accessor_class_id);

  if (!sparse_accessor) {
    return JS_EXCEPTION;
  } else {
    JSValue val;
    val = JS_NewUint32(ctx, sparse_accessor->indices_byte_offset);
    return val;
  }
}


static JSValue js_sparse_accessor_get_indices_component_type(JSContext *ctx, JSValueConst this_val) {
  SparseAccessor *sparse_accessor = JS_GetOpaque2(ctx, this_val, js_sparse_accessor_class_id);

  if (!sparse_accessor) {
    return JS_EXCEPTION;
  } else {
    JSValue val;
    val = JS_NewUint32(ctx, sparse_accessor->indices_component_type);
    return val;
  }
}


static JSValue js_sparse_accessor_get_values_buffer_view(JSContext *ctx, JSValueConst this_val) {
  SparseAccessor *sparse_accessor = JS_GetOpaque2(ctx, this_val, js_sparse_accessor_class_id);

  if (!sparse_accessor) {
    return JS_EXCEPTION;
  } else {
    JSValue val;
    val = create_buffer_view_from_ptr(ctx, sparse_accessor->values_buffer_view);
    return val;
  }
}


static JSValue js_sparse_accessor_get_values_byte_offset(JSContext *ctx, JSValueConst this_val) {
  SparseAccessor *sparse_accessor = JS_GetOpaque2(ctx, this_val, js_sparse_accessor_class_id);

  if (!sparse_accessor) {
    return JS_EXCEPTION;
  } else {
    JSValue val;
    val = JS_NewUint32(ctx, sparse_accessor->values_byte_offset);
    return val;
  }
}




static JSValue js_sparse_accessor_dispose(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  SparseAccessor *sparse_accessor = JS_GetOpaque(this_val, js_sparse_accessor_class_id);
  websg_dispose_resource(sparse_accessor);
  js_free(ctx, sparse_accessor);
  return JS_UNDEFINED;
}

static JSClassDef js_sparse_accessor_class = {
  "SparseAccessor"
};

static const JSCFunctionListEntry js_sparse_accessor_proto_funcs[] = {
  JS_CGETSET_DEF("count", js_sparse_accessor_get_count, NULL),
  JS_CGETSET_DEF("indicesBufferView", js_sparse_accessor_get_indices_buffer_view, NULL),
  JS_CGETSET_DEF("indicesByteOffset", js_sparse_accessor_get_indices_byte_offset, NULL),
  JS_CGETSET_DEF("indicesComponentType", js_sparse_accessor_get_indices_component_type, NULL),
  JS_CGETSET_DEF("valuesBufferView", js_sparse_accessor_get_values_buffer_view, NULL),
  JS_CGETSET_DEF("valuesByteOffset", js_sparse_accessor_get_values_byte_offset, NULL),
  JS_CFUNC_DEF("dispose", 0, js_sparse_accessor_dispose),
  JS_PROP_STRING_DEF("[Symbol.toStringTag]", "SparseAccessor", JS_PROP_CONFIGURABLE),
};

static JSValue js_define_sparse_accessor_class(JSContext *ctx) {
  JSRuntime *rt = JS_GetRuntime(ctx);

  JS_NewClassID(&js_sparse_accessor_class_id);
  JS_NewClass(rt, js_sparse_accessor_class_id, &js_sparse_accessor_class);

  JSValue sparse_accessor_proto = JS_NewObject(ctx);
  JS_SetPropertyFunctionList(ctx, sparse_accessor_proto, js_sparse_accessor_proto_funcs, countof(js_sparse_accessor_proto_funcs));
  
  JSValue sparse_accessor_class = JS_NewCFunction2(ctx, js_sparse_accessor_constructor, "SparseAccessor", 1, JS_CFUNC_constructor, 1);
  JS_SetConstructor(ctx, sparse_accessor_class, sparse_accessor_proto);
  JS_SetClassProto(ctx, js_sparse_accessor_class_id, sparse_accessor_proto);

  return sparse_accessor_class;
}

/**
 * WebSG.SparseAccessor related functions
*/

static JSValue js_get_sparse_accessor_by_name(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  const char *name = JS_ToCString(ctx, argv[0]);
  SparseAccessor *sparse_accessor = websg_get_resource_by_name(ResourceType_SparseAccessor, name);
  JS_FreeCString(ctx, name);
  return create_sparse_accessor_from_ptr(ctx, sparse_accessor);
}

JSValue create_sparse_accessor_from_ptr(JSContext *ctx, SparseAccessor *sparse_accessor) {
  if (!sparse_accessor) {
    return JS_UNDEFINED;
  }

  JSValue val = get_js_val_from_ptr(ctx, sparse_accessor);

  if (JS_IsUndefined(val)) {
    val = JS_NewObjectClass(ctx, js_sparse_accessor_class_id);
    
    JS_SetOpaque(val, sparse_accessor);
    set_js_val_from_ptr(ctx, sparse_accessor, val);
  }

  return val;
}

void js_define_sparse_accessor_api(JSContext *ctx, JSValue *target) {
  JS_SetPropertyStr(ctx, *target, "SparseAccessor", js_define_sparse_accessor_class(ctx));
  JS_SetPropertyStr(
    ctx,
    *target,
    "getSparseAccessorByName",
    JS_NewCFunction(ctx, js_get_sparse_accessor_by_name, "getSparseAccessorByName", 1)
  );
}