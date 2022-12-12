#ifndef __context_h
#define __context_h
#include "../include/quickjs/quickjs.h"

typedef struct ScriptContext {
  JSValue ptr_to_val;
} ScriptContext;

void define_script_context(JSContext *ctx);
JSValue get_js_val_from_ptr(JSContext *ctx, void *ptr);
int set_js_val_from_ptr(JSContext *ctx, void *ptr, JSValue val);
int delete_js_val_from_ptr(JSContext *ctx, void *ptr);

#endif