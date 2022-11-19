#include "./script-context.h"
#include "../include/quickjs/quickjs.h"

// TODO: Stop using a JS Object for this map which will allow for these objects
// to be properly freed when the last reference goes out of scope
JSValue get_js_val_from_ptr(JSContext *ctx, void *ptr) {
  ScriptContext *script = JS_GetContextOpaque(ctx);
  JSValue val = JS_GetProperty(ctx, script->ptr_to_val, (size_t)ptr);
  return JS_DupValue(ctx, val);
}

int set_js_val_from_ptr(JSContext *ctx, void *ptr, JSValue val) {
  ScriptContext *script = JS_GetContextOpaque(ctx);
  return JS_SetProperty(ctx, script->ptr_to_val, (size_t)ptr, val);
}

int delete_js_val_from_ptr(JSContext *ctx, void *ptr) {
  ScriptContext *script = JS_GetContextOpaque(ctx);
  return JS_DeleteProperty(ctx, script->ptr_to_val, (size_t)ptr, 0);
}