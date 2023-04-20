#include <emscripten.h>
#include <emscripten/console.h>
#include <math.h>
#include <stdbool.h>
#include <string.h>
#include <stdio.h>

#include "../quickjs/quickjs.h"
#include "../quickjs/cutils.h"

int js_handle_exception(JSContext *ctx, JSValue result) {
  if (!JS_IsException(result)) {
    return 0;
  }

  JSValue error = JS_GetException(ctx);

  JSValue name_val = JS_GetPropertyStr(ctx, error, "name");
  const char* name = JS_ToCString(ctx, name_val);

  JSValue message_val = JS_GetPropertyStr(ctx, error, "message");
  const char* message = JS_ToCString(ctx, message_val);

  JSValue stack_val = JS_GetPropertyStr(ctx, error, "stack");

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
  JS_FreeValue(ctx, error);
  JS_FreeValue(ctx, result);

  return -1;
}