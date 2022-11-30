#include <emscripten.h>
#include <emscripten/console.h>
#include <math.h>
#include <stdbool.h>
#include <string.h>

#include "../include/quickjs/cutils.h"
#include "../include/quickjs/quickjs.h"

#include "./script-context.h"
#include "./jsutils.h"
#include "./console.h"
#include "./thirdroom.h"
#include "./generated/websg.h"
#include "./generated/websg-js.h"

/**
 * Global State
 **/

JSRuntime *rt;
JSContext *ctx;

/**
 * Web Scene Graph (WebSG) Implementation
 **/

JSAtom onUpdateAtom;

/*********************
 * Exported Functions
 *********************/

export void websg_initialize() {
  rt = JS_NewRuntime();
  ctx = JS_NewContext(rt);

  onUpdateAtom = JS_NewAtom(ctx, "onupdate");

  define_script_context(ctx);
  JS_DefineRefArrayIterator(ctx);
  JS_DefineRefMapIterator(ctx);
  //JS_DefineNodeIterator(ctx);

  JSValue global = JS_GetGlobalObject(ctx);
  js_define_console_api(ctx, &global);
  js_define_websg_api(ctx, &global);
  js_define_thirdroom_api(ctx, &global);
}

export void *websg_allocate(int size) {
  return js_mallocz_rt(rt, size);
}

export void websg_deallocate(void *ptr) {
  js_free_rt(rt, ptr);
}

// NONSTANDARD: execute the provided code in the JS context
// Should be called immediately after initialize()
export int32_t thirdroom_evalJS(const char * code) {
  JSValue val = JS_Eval(ctx, code, strlen(code), "<module>", JS_EVAL_TYPE_GLOBAL);

  if (JS_IsException(val)) {
    JSValue error = JS_GetException(ctx);
    js_log_error(ctx, &error);
    JS_FreeValue(ctx, error);

    return -1;
  }

  return 0;
}

export int32_t websg_update(float_t dt) {
  JSValue global = JS_GetGlobalObject(ctx);

  JSValue updateFn = JS_GetProperty(ctx, global, onUpdateAtom);

  if (JS_IsException(updateFn)) {
    JSValue error = JS_GetException(ctx);
    js_log_error(ctx, &error);
    JS_FreeValue(ctx, error);
    JS_FreeValue(ctx, updateFn);
    return -1;
  } else if (JS_IsUndefined(updateFn)) {
    return 0;
  }

  JSValue dtVal = JS_NewFloat64(ctx, dt);

  if (JS_IsException(dtVal)) {
    JSValue error = JS_GetException(ctx);
    js_log_error(ctx, &error);
    JS_FreeValue(ctx, error);
    JS_FreeValue(ctx, dtVal);
    return -1;
  }

  JSValueConst args[] = { dtVal };
  JSValue val = JS_Call(ctx, updateFn, JS_UNDEFINED, 1, args);

  JS_FreeValue(ctx, updateFn);

  int32_t ret;

  if (JS_IsException(val)) {
    JSValue error = JS_GetException(ctx);
    js_log_error(ctx, &error);
    JS_FreeValue(ctx, error);
    ret = -1;
  }

  JS_FreeValue(ctx, val);

  return ret;
}