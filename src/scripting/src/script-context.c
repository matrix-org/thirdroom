#include "./script-context.h"
#include "../include/quickjs/quickjs.h"

JSValue get_js_val_from_ptr(JSContext *ctx, void *ptr) {
  ScriptContext *script = JS_GetContextOpaque(ctx);
  return JS_GetProperty(ctx, script->ptr_to_val, ptr);

}

int set_js_val_from_ptr(JSContext *ctx, void *ptr, JSValue val) {
  ScriptContext *script = JS_GetContextOpaque(ctx);
  return JS_SetProperty(ctx, script->ptr_to_val, ptr, val);
}

int delete_js_val_from_ptr(JSContext *ctx, void *ptr) {
  ScriptContext *script = JS_GetContextOpaque(ctx);
  return JS_DeleteProperty(ctx, script->ptr_to_val, ptr, 0);
}