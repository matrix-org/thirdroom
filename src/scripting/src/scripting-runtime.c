#include <emscripten.h>
#include <emscripten/console.h>
#include <math.h>
#include <stdbool.h>
#include <string.h>

#include "../include/quickjs/cutils.h"
#include "../include/quickjs/quickjs.h"

/*********************
 * Imported Functions
 *********************/

extern int32_t create_node(void);

/**
 * Global State
 **/

JSRuntime *rt;
JSContext *ctx;
JSAtom onUpdate;

/************************
 * JS API Implementation
 ************************/

static JSValue js_console_log(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  for(int i = 0; i < argc; i++) {
    const char *str = JS_ToCString(ctx, argv[i]);

    if (!str)
      return JS_EXCEPTION;

    emscripten_console_logf("%s", str);

    JS_FreeCString(ctx, str);
  }

  return JS_UNDEFINED;
}



static JSValue js_create_node(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  return JS_NewInt32(ctx, create_node());
}


/*********************
 * Exported Functions
 *********************/

EMSCRIPTEN_KEEPALIVE
int32_t initialize() {
  rt = JS_NewRuntime();
  ctx = JS_NewContext(rt);

  JSValue global = JS_GetGlobalObject(ctx);

  JSValue console = JS_NewObject(ctx);
  JS_SetPropertyStr(ctx, console, "log", JS_NewCFunction(ctx, js_console_log, "log", 1));
  JS_SetPropertyStr(ctx, global, "console", console);

  JS_SetPropertyStr(ctx, global, "createNode", JS_NewCFunction(ctx, js_create_node, "createNode", 0));

  onUpdate = JS_NewAtom(ctx, "onUpdate");

  emscripten_console_log("Initialized");

  return 0; 
}

// NONSTANDARD: execute the provided code in the JS context
// Should be called immediately after initialize()
EMSCRIPTEN_KEEPALIVE
int32_t evalJS(const char * code) {
  JSValue val = JS_Eval(ctx, code, strlen(code), "<module>", JS_EVAL_TYPE_GLOBAL);

  if (JS_IsException(val)) {
    JSValue error = JS_GetException(ctx);

    emscripten_console_errorf("Error calling update(): %s", JS_ToCString(ctx, error));

    JS_FreeValue(ctx, error);

    return -1;
  }

  return 0;
}

// Called 
EMSCRIPTEN_KEEPALIVE
int32_t update() {
  int32_t ret;

  JSValue global = JS_GetGlobalObject(ctx);

  JSValue updateFn = JS_GetProperty(ctx, global, onUpdate);

  if (!JS_IsFunction(ctx, updateFn)) {
    JS_FreeValue(ctx, updateFn);
    return 0;
  }

  JSValue val = JS_Call(ctx, updateFn, JS_UNDEFINED, 0, NULL);

  JS_FreeValue(ctx, updateFn);

  if (JS_IsException(val)) {
    JSValue error = JS_GetException(ctx);

    emscripten_console_errorf("Error calling update(): %s", JS_ToCString(ctx, error));

    JS_FreeValue(ctx, error);

    ret = -1;
  } else {
    ret = 0;
  }

  JS_FreeValue(ctx, val);

  return ret;
}