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
#include "accessor.h"
#include "buffer-view.h"
#include "sparse-accessor.h"

/**
 * WebSG.Accessor
 */

JSClassID js_accessor_class_id;

static JSValue js_accessor_constructor(JSContext *ctx, JSValueConst new_target, int argc, JSValueConst *argv) {
  Accessor *accessor = js_mallocz(ctx, sizeof(Accessor));

  

  if (websg_create_resource(ResourceType_Accessor, accessor)) {
    return JS_EXCEPTION;
  }

  return create_accessor_from_ptr(ctx, accessor);
}


static JSValue js_accessor_get_name(JSContext *ctx, JSValueConst this_val) {
  Accessor *accessor = JS_GetOpaque2(ctx, this_val, js_accessor_class_id);

  if (!accessor) {
    return JS_EXCEPTION;
  } else {
    JSValue val;
    val = JS_NewString(ctx, accessor->name);
    return val;
  }
}


static JSValue js_accessor_set_name(JSContext *ctx, JSValueConst this_val, JSValue val) {
  Accessor *accessor = JS_GetOpaque2(ctx, this_val, js_accessor_class_id);

  if (!accessor) {
    return JS_EXCEPTION;
  } else {
    accessor->name = JS_ToCString(ctx, val);
    return JS_UNDEFINED;
  }
}


static JSValue js_accessor_get_buffer_view(JSContext *ctx, JSValueConst this_val) {
  Accessor *accessor = JS_GetOpaque2(ctx, this_val, js_accessor_class_id);

  if (!accessor) {
    return JS_EXCEPTION;
  } else {
    JSValue val;
    val = create_buffer_view_from_ptr(ctx, accessor->buffer_view);
    return val;
  }
}


static JSValue js_accessor_get_byte_offset(JSContext *ctx, JSValueConst this_val) {
  Accessor *accessor = JS_GetOpaque2(ctx, this_val, js_accessor_class_id);

  if (!accessor) {
    return JS_EXCEPTION;
  } else {
    JSValue val;
    val = JS_NewUint32(ctx, accessor->byte_offset);
    return val;
  }
}


static JSValue js_accessor_get_component_type(JSContext *ctx, JSValueConst this_val) {
  Accessor *accessor = JS_GetOpaque2(ctx, this_val, js_accessor_class_id);

  if (!accessor) {
    return JS_EXCEPTION;
  } else {
    JSValue val;
    val = JS_NewUint32(ctx, accessor->component_type);
    return val;
  }
}


static JSValue js_accessor_get_normalized(JSContext *ctx, JSValueConst this_val) {
  Accessor *accessor = JS_GetOpaque2(ctx, this_val, js_accessor_class_id);

  if (!accessor) {
    return JS_EXCEPTION;
  } else {
    JSValue val;
    val = JS_NewBool(ctx, accessor->normalized);
    return val;
  }
}


static JSValue js_accessor_get_count(JSContext *ctx, JSValueConst this_val) {
  Accessor *accessor = JS_GetOpaque2(ctx, this_val, js_accessor_class_id);

  if (!accessor) {
    return JS_EXCEPTION;
  } else {
    JSValue val;
    val = JS_NewUint32(ctx, accessor->count);
    return val;
  }
}


static JSValue js_accessor_get_type(JSContext *ctx, JSValueConst this_val) {
  Accessor *accessor = JS_GetOpaque2(ctx, this_val, js_accessor_class_id);

  if (!accessor) {
    return JS_EXCEPTION;
  } else {
    JSValue val;
    val = JS_NewUint32(ctx, accessor->type);
    return val;
  }
}


static JSValue js_accessor_get_sparse(JSContext *ctx, JSValueConst this_val) {
  Accessor *accessor = JS_GetOpaque2(ctx, this_val, js_accessor_class_id);

  if (!accessor) {
    return JS_EXCEPTION;
  } else {
    JSValue val;
    val = create_sparse_accessor_from_ptr(ctx, accessor->sparse);
    return val;
  }
}




static JSValue js_accessor_dispose(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  Accessor *accessor = JS_GetOpaque(this_val, js_accessor_class_id);
  websg_dispose_resource(accessor);
  js_free(ctx, accessor);
  return JS_UNDEFINED;
}

static JSClassDef js_accessor_class = {
  "Accessor"
};

static const JSCFunctionListEntry js_accessor_proto_funcs[] = {
  JS_CGETSET_DEF("name", js_accessor_get_name, js_accessor_set_name),
  JS_CGETSET_DEF("bufferView", js_accessor_get_buffer_view, NULL),
  JS_CGETSET_DEF("byteOffset", js_accessor_get_byte_offset, NULL),
  JS_CGETSET_DEF("componentType", js_accessor_get_component_type, NULL),
  JS_CGETSET_DEF("normalized", js_accessor_get_normalized, NULL),
  JS_CGETSET_DEF("count", js_accessor_get_count, NULL),
  JS_CGETSET_DEF("type", js_accessor_get_type, NULL),
  JS_CGETSET_DEF("sparse", js_accessor_get_sparse, NULL),
  JS_CFUNC_DEF("dispose", 0, js_accessor_dispose),
  JS_PROP_STRING_DEF("[Symbol.toStringTag]", "Accessor", JS_PROP_CONFIGURABLE),
};

static JSValue js_define_accessor_class(JSContext *ctx) {
  JSRuntime *rt = JS_GetRuntime(ctx);

  JS_NewClassID(&js_accessor_class_id);
  JS_NewClass(rt, js_accessor_class_id, &js_accessor_class);

  JSValue accessor_proto = JS_NewObject(ctx);
  JS_SetPropertyFunctionList(ctx, accessor_proto, js_accessor_proto_funcs, countof(js_accessor_proto_funcs));
  
  JSValue accessor_class = JS_NewCFunction2(ctx, js_accessor_constructor, "Accessor", 1, JS_CFUNC_constructor, 1);
  JS_SetConstructor(ctx, accessor_class, accessor_proto);
  JS_SetClassProto(ctx, js_accessor_class_id, accessor_proto);

  return accessor_class;
}

/**
 * WebSG.Accessor related functions
*/

static JSValue js_get_accessor_by_name(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  const char *name = JS_ToCString(ctx, argv[0]);
  Accessor *accessor = websg_get_resource_by_name(ResourceType_Accessor, name);
  JS_FreeCString(ctx, name);
  return create_accessor_from_ptr(ctx, accessor);
}

JSValue create_accessor_from_ptr(JSContext *ctx, Accessor *accessor) {
  if (!accessor) {
    return JS_UNDEFINED;
  }

  JSValue val = get_js_val_from_ptr(ctx, accessor);

  if (JS_IsUndefined(val)) {
    val = JS_NewObjectClass(ctx, js_accessor_class_id);
    JS_DefineReadOnlyFloat32ArrayProperty(ctx, val, "max", accessor->max, 16);
JS_DefineReadOnlyFloat32ArrayProperty(ctx, val, "min", accessor->min, 16);
    JS_SetOpaque(val, accessor);
    set_js_val_from_ptr(ctx, accessor, val);
  }

  return val;
}

void js_define_accessor_api(JSContext *ctx, JSValue *target) {
  JS_SetPropertyStr(ctx, *target, "Accessor", js_define_accessor_class(ctx));
  JS_SetPropertyStr(
    ctx,
    *target,
    "getAccessorByName",
    JS_NewCFunction(ctx, js_get_accessor_by_name, "getAccessorByName", 1)
  );
}