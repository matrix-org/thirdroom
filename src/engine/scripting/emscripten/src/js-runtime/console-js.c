#include <emscripten.h>
#include <emscripten/console.h>
#include <math.h>
#include <stdbool.h>
#include <string.h>
#include <stdio.h>

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
  if (!JS_IsError(ctx, *error)) {
    emscripten_console_error(JS_ToCString(ctx, *error));
    return;
  }

  JSValue name_val = JS_GetPropertyStr(ctx, *error, "name");
  const char* name = JS_ToCString(ctx, name_val);

  JSValue message_val = JS_GetPropertyStr(ctx, *error, "message");
  const char* message = JS_ToCString(ctx, message_val);

  JSValue stack_val = JS_GetPropertyStr(ctx, *error, "stack");

  if (!JS_IsUndefined(stack_val)) {
    const char* stack = JS_ToCString(ctx, stack_val);
    printf("%s", stack);
    emscripten_console_errorf("%s: %s\n  %s", name, message, stack);
    JS_FreeValue(ctx, stack_val);
    JS_FreeCString(ctx, stack);
  } else {
    emscripten_console_errorf("%s: %s", name, message);
  }

  JS_FreeValue(ctx, name_val);
  JS_FreeValue(ctx, message_val);
  JS_FreeCString(ctx, name);
  JS_FreeCString(ctx, message);
}