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
#include "buffer.h"

/**
 * WebSG.Buffer
 */

JSClassID js_buffer_class_id;

static JSValue js_buffer_constructor(JSContext *ctx, JSValueConst new_target, int argc, JSValueConst *argv) {
  Buffer *buffer = js_mallocz(ctx, sizeof(Buffer));

  

  if (websg_create_resource(ResourceType_Buffer, buffer)) {
    return JS_EXCEPTION;
  }

  return create_buffer_from_ptr(ctx, buffer);
}


static JSValue js_buffer_get_name(JSContext *ctx, JSValueConst this_val) {
  Buffer *buffer = JS_GetOpaque2(ctx, this_val, js_buffer_class_id);

  if (!buffer) {
    return JS_EXCEPTION;
  } else {
    JSValue val;
    val = JS_NewString(ctx, buffer->name);
    return val;
  }
}


static JSValue js_buffer_set_name(JSContext *ctx, JSValueConst this_val, JSValue val) {
  Buffer *buffer = JS_GetOpaque2(ctx, this_val, js_buffer_class_id);

  if (!buffer) {
    return JS_EXCEPTION;
  } else {
    buffer->name = JS_ToCString(ctx, val);
    return JS_UNDEFINED;
  }
}


static JSValue js_buffer_get_uri(JSContext *ctx, JSValueConst this_val) {
  Buffer *buffer = JS_GetOpaque2(ctx, this_val, js_buffer_class_id);

  if (!buffer) {
    return JS_EXCEPTION;
  } else {
    JSValue val;
    val = JS_NewString(ctx, buffer->uri);
    return val;
  }
}




static JSValue js_buffer_dispose(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  Buffer *buffer = JS_GetOpaque(this_val, js_buffer_class_id);
  websg_dispose_resource(buffer);
  js_free(ctx, buffer);
  return JS_UNDEFINED;
}

static JSClassDef js_buffer_class = {
  "Buffer"
};

static const JSCFunctionListEntry js_buffer_proto_funcs[] = {
  JS_CGETSET_DEF("name", js_buffer_get_name, js_buffer_set_name),
  JS_CGETSET_DEF("uri", js_buffer_get_uri, NULL),
  JS_CFUNC_DEF("dispose", 0, js_buffer_dispose),
  JS_PROP_STRING_DEF("[Symbol.toStringTag]", "Buffer", JS_PROP_CONFIGURABLE),
};

static JSValue js_define_buffer_class(JSContext *ctx) {
  JSRuntime *rt = JS_GetRuntime(ctx);

  JS_NewClassID(&js_buffer_class_id);
  JS_NewClass(rt, js_buffer_class_id, &js_buffer_class);

  JSValue buffer_proto = JS_NewObject(ctx);
  JS_SetPropertyFunctionList(ctx, buffer_proto, js_buffer_proto_funcs, countof(js_buffer_proto_funcs));
  
  JSValue buffer_class = JS_NewCFunction2(ctx, js_buffer_constructor, "Buffer", 1, JS_CFUNC_constructor, 1);
  JS_SetConstructor(ctx, buffer_class, buffer_proto);
  JS_SetClassProto(ctx, js_buffer_class_id, buffer_proto);

  return buffer_class;
}

/**
 * WebSG.Buffer related functions
*/

static JSValue js_get_buffer_by_name(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  const char *name = JS_ToCString(ctx, argv[0]);
  Buffer *buffer = websg_get_resource_by_name(ResourceType_Buffer, name);
  JS_FreeCString(ctx, name);
  return create_buffer_from_ptr(ctx, buffer);
}

JSValue create_buffer_from_ptr(JSContext *ctx, Buffer *buffer) {
  if (!buffer) {
    return JS_UNDEFINED;
  }

  JSValue val = get_js_val_from_ptr(ctx, buffer);

  if (JS_IsUndefined(val)) {
    val = JS_NewObjectClass(ctx, js_buffer_class_id);
    JS_DefineReadOnlyArrayBufferProperty(ctx, val, "data", buffer->data);
    JS_SetOpaque(val, buffer);
    set_js_val_from_ptr(ctx, buffer, val);
  }

  return val;
}

void js_define_buffer_api(JSContext *ctx, JSValue *target) {
  JS_SetPropertyStr(ctx, *target, "Buffer", js_define_buffer_class(ctx));
  JS_SetPropertyStr(
    ctx,
    *target,
    "getBufferByName",
    JS_NewCFunction(ctx, js_get_buffer_by_name, "getBufferByName", 1)
  );
}