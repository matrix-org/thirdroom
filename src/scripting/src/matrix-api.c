#include <string.h>

#include "matrix.h"
#include "matrix-api.h"
#include "../include/quickjs/cutils.h"
#include "../include/quickjs/quickjs.h"

static JSValue js_receive_widget_message(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  char *message = matrix_receive_widget_message();

  if (message == NULL) {
    return JS_UNDEFINED;
  }

  return JS_NewString(ctx, message);
}

static JSValue js_send_widget_message(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  const char *message = JS_ToCString(ctx, argv[0]);
  
  if (matrix_send_widget_message(message)) {
    return JS_TRUE;
  } else {
    return JS_FALSE;
  }
}

void js_define_matrix_api(JSContext *ctx, JSValue *target) {
  JSValue matrix = JS_NewObject(ctx);
  JS_SetPropertyStr(
    ctx,
    matrix,
    "receiveWidgetMessage",
    JS_NewCFunction(ctx, js_receive_widget_message, "receiveWidgetMessage", 0)
  );
  JS_SetPropertyStr(
    ctx,
    matrix,
    "sendWidgetMessage",
    JS_NewCFunction(ctx, js_send_widget_message, "sendWidgetMessage", 1)
  );
  JS_SetPropertyStr(ctx, *target, "matrix", matrix);
}