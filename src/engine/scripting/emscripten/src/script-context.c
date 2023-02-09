#include <emscripten.h>
#include <emscripten/console.h>
#include "./script-context.h"
#include "../include/quickjs/quickjs.h"

void define_script_context(JSContext *ctx) {
  ScriptContext *script = js_mallocz(ctx, sizeof(ScriptContext));
  script->ptr_to_val = JS_NewObject(ctx);
  JS_SetContextOpaque(ctx, script);
}

// TODO: Stop using a JS Object for this map which will allow for these objects
// to be properly freed when the last reference goes out of scope
JSValue get_js_val_from_ptr(JSContext *ctx, void *ptr) {
  ScriptContext *script = JS_GetContextOpaque(ctx);
  JSValue val = JS_GetPropertyUint32(ctx, script->ptr_to_val, (uint32_t)ptr);
  return JS_DupValue(ctx, val);
}

int set_js_val_from_ptr(JSContext *ctx, void *ptr, JSValue val) {
  ScriptContext *script = JS_GetContextOpaque(ctx);
  return JS_SetPropertyUint32(ctx, script->ptr_to_val, (uint32_t)ptr, JS_DupValue(ctx, val));
}

int delete_js_val_from_ptr(JSContext *ctx, void *ptr) {
  ScriptContext *script = JS_GetContextOpaque(ctx);
  return JS_DeleteProperty(ctx, script->ptr_to_val, (size_t)ptr, 0);
}