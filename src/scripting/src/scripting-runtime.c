#include <emscripten.h>
#include <math.h>
#include <stdbool.h>
#include <stdio.h>
#include <string.h>

#include "../include/quickjs/cutils.h"
#include "../include/quickjs/quickjs.h"

JSRuntime *rt;
JSContext *ctx;
JSValue updateFn;

JSAtom onUpdate;

static JSValue js_console_log(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  int i;
  const char *str;

  for(i = 0; i < argc; i++) {
    str = JS_ToCString(ctx, argv[i]);

    if (!str)
      return JS_EXCEPTION;

    emscripten_log(EM_LOG_CONSOLE, "%s", str);

    JS_FreeCString(ctx, str);
  }

  return JS_UNDEFINED;
}

EMSCRIPTEN_KEEPALIVE
int32_t init(const char* code) {
  rt = JS_NewRuntime();
  ctx = JS_NewContext(rt);

  onUpdate = JS_NewAtom(ctx, "onUpdate");
  
  JSValue global = JS_GetGlobalObject(ctx);

  JSValue console = JS_NewObject(ctx);
  JS_SetPropertyStr(ctx, console, "log", JS_NewCFunction(ctx, js_console_log, "log", 1));
  JS_SetPropertyStr(ctx, global, "console", console);

  JSValue val = JS_Eval(ctx, code, strlen(code), "<module>", JS_EVAL_TYPE_GLOBAL);

  if (JS_IsException(val)) {
    JSValue error = JS_GetException(ctx);

    emscripten_log(EM_LOG_ERROR, "Error calling update(): %s", JS_ToCString(ctx, error));

    JS_FreeValue(ctx, error);

    return -1;
  }

  emscripten_log(EM_LOG_CONSOLE, "Initialized");
  return 0;
}

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

    emscripten_log(EM_LOG_ERROR, "Error calling update(): %s", JS_ToCString(ctx, error));

    JS_FreeValue(ctx, error);

    ret = -1;
  } else {
    ret = 0;
  }

  JS_FreeValue(ctx, val);

  return ret;
}