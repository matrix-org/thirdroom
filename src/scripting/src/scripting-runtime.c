#include <emscripten.h>
#include <emscripten/console.h>
#include <math.h>
#include <stdbool.h>
#include <string.h>

#include "../include/quickjs/cutils.h"
#include "../include/quickjs/quickjs.h"

#include "./websg.h"
#include "./console.h"
#include "./light.h"

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

export int32_t websg_initialize() {
  rt = JS_NewRuntime();
  ctx = JS_NewContext(rt);
  onUpdateAtom = JS_NewAtom(ctx, "onupdate");

  JSValue global = JS_GetGlobalObject(ctx);
  js_define_console_api(ctx, &global);

  JSValue jsSceneGraphNamespace = JS_NewObject(ctx);
  js_define_light_api(ctx, &jsSceneGraphNamespace);
  JS_SetPropertyStr(ctx, global, "WebSG", jsSceneGraphNamespace);

  return 0; 
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
  int32_t ret;

  JSValue global = JS_GetGlobalObject(ctx);

  JSValue updateFn = JS_GetProperty(ctx, global, onUpdateAtom);

  if (!JS_IsFunction(ctx, updateFn)) {
    JS_FreeValue(ctx, updateFn);
    return 0;
  }

  JSValue dtVal = JS_NewFloat64(ctx, dt);

  int argc = 1;
  JSValueConst argv[1] = { dtVal };

  JSValue val = JS_Call(ctx, updateFn, JS_UNDEFINED, argc, argv);

  JS_FreeValue(ctx, updateFn);

  if (JS_IsException(val)) {
    JSValue error = JS_GetException(ctx);
    js_log_error(ctx, &error);
    JS_FreeValue(ctx, error);

    ret = -1;
  } else {
    ret = 0;
  }

  JS_FreeValue(ctx, val);

  return ret;
}