#include <string.h>
#include "./quickjs/cutils.h"
#include "./quickjs/quickjs.h"
#include "../matrix.h"
#include "./matrix-js.h"

static JSValue js_listen(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  if (matrix_listen() == 0) {
    return JS_UNDEFINED;
  }

  JS_ThrowInternalError(ctx, "Matrix: error listening for messages.");

  return JS_EXCEPTION;
}

static JSValue js_close(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  if (matrix_close() == 0) {
    return JS_UNDEFINED;
  }

  JS_ThrowInternalError(ctx, "Matrix: error closing listener.");

  return JS_EXCEPTION;
}

static JSValue js_send(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  JSValue eventStr = JS_JSONStringify(ctx, argv[0], JS_UNDEFINED, JS_UNDEFINED);

  if (JS_IsException(eventStr)) {
    return JS_EXCEPTION;
  }

  size_t byte_length;
  const char *event = JS_ToCStringLen(ctx, &byte_length, eventStr);
  JS_FreeValue(ctx, eventStr);

  if (event == NULL) {
    return JS_EXCEPTION;
  }
  
  int32_t result = matrix_send(event, byte_length);

  JS_FreeCString(ctx, event);

  if (result == 0) {
    return JS_UNDEFINED;
  }

  JS_ThrowInternalError(ctx, "Matrix: error sending event.");

  return JS_EXCEPTION;
}


static JSValue js_receive(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  uint32_t byte_length = matrix_get_event_size();

  if (byte_length == 0) {
    return JS_UNDEFINED;
  }

  char* event = js_malloc(ctx, byte_length);
  int32_t read_bytes = matrix_receive(event, byte_length);

  if (read_bytes == 0) {
    return JS_UNDEFINED;
  } else if (read_bytes < 0) {
    JS_ThrowInternalError(ctx, "Matrix: error receiving event.");
    return JS_EXCEPTION;
  }

  JSValue value = JS_ParseJSON(ctx, event, read_bytes, NULL);

  js_free(ctx, event);

  return value;
}

void js_define_matrix_api(JSContext *ctx, JSValue *target) {
  JSValue matrix = JS_NewObject(ctx);
  JS_SetPropertyStr(ctx, matrix, "listen", JS_NewCFunction(ctx, js_listen, "listen", 0));
  JS_SetPropertyStr(ctx, matrix, "close", JS_NewCFunction(ctx, js_close, "close", 0));
  JS_SetPropertyStr(ctx, matrix, "receive", JS_NewCFunction(ctx, js_receive, "receive", 0));
  JS_SetPropertyStr(ctx, matrix, "send", JS_NewCFunction(ctx, js_send, "send", 1));
  JS_SetPropertyStr(ctx, *target, "Matrix", matrix);
}