#include <emscripten.h>
#include <emscripten/console.h>
#include <math.h>
#include <stdbool.h>
#include <string.h>

#include "./quickjs/quickjs.h"
#include "./quickjs/cutils.h"
#include "./console-js.h"

/**
 * console API
*/

static JSValue js_console_log(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  for(int i = 0; i < argc; i++) {
    const char *str = JS_ToCString(ctx, argv[i]);

    if (!str) {
      return JS_EXCEPTION;
    }

    emscripten_console_logf("%s", str);

    JS_FreeCString(ctx, str);
  }

  return JS_UNDEFINED;
}

void js_define_console_api(JSContext *ctx, JSValue *target) {
  JSValue console = JS_NewObject(ctx);
  JS_SetPropertyStr(ctx, console, "log", JS_NewCFunction(ctx, js_console_log, "log", 1));
  JS_SetPropertyStr(ctx, *target, "console", console);
}

void js_log_error(JSContext *ctx, JSValue *error) {
  emscripten_console_errorf(
    "%s\n  %s",
    JS_ToCString(ctx, *error),
    JS_ToCString(ctx, JS_GetPropertyStr(ctx, *error, "stack"))
  );
}