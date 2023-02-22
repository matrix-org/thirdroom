#include "./quickjs/quickjs.h"

#include <string.h>
#include "./quickjs/cutils.h"
#include "./quickjs/quickjs.h"
#include "../websg-network.h"
#include "./websg-network-js.h"

#include <emscripten/console.h>

static JSValue js_listen(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  if (websg_network_listen() == 0) {
    return JS_UNDEFINED;
  }

  JS_ThrowInternalError(ctx, "WebSGNetworking: error listening for packets.");

  return JS_EXCEPTION;
}

static JSValue js_close(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  if (websg_network_close() == 0) {
    return JS_UNDEFINED;
  }

  JS_ThrowInternalError(ctx, "WebSGNetworking: error closing listener.");

  return JS_EXCEPTION;
}

static JSValue js_broadcast(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  size_t byte_length;
  uint8_t *packet = JS_GetArrayBuffer(ctx, &byte_length, argv[0]);

  if (packet == NULL) {
    return JS_EXCEPTION;
  }

  if (websg_network_broadcast(packet, byte_length) == 0) {
    return JS_UNDEFINED;
  }

  JS_ThrowInternalError(ctx, "WebSGNetworking: error broadcasting event.");

  return JS_EXCEPTION;
}

static void js_receive_buffer_free(JSRuntime *rt, void *opaque, void *ptr) {
  js_free_rt(rt, ptr);
}

static JSValue js_receive(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  uint32_t packet_byte_length = websg_network_get_packet_size();

  if (packet_byte_length == 0) {
    return JS_UNDEFINED;
  }

  uint8_t *target = js_malloc(ctx, packet_byte_length);
  JSValue array_buffer = JS_NewArrayBuffer(ctx, target, packet_byte_length, js_receive_buffer_free, NULL, 0);

  int32_t read_bytes = websg_network_receive(target, packet_byte_length);

  if (read_bytes == 0) {
    return JS_UNDEFINED;
  } else if (read_bytes < 0) {
     JS_ThrowInternalError(ctx, "WebSGNetworking: error receiving packet.");
    return JS_EXCEPTION;
  }

  return array_buffer;
}

static JSValue js_receive_into(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  uint32_t packet_byte_length = websg_network_get_packet_size();

  if (packet_byte_length == 0) {
    return JS_UNDEFINED;
  }

  size_t target_byte_length;
  uint8_t *target = JS_GetArrayBuffer(ctx, &target_byte_length, argv[0]);

  if (target == NULL) {
    return JS_EXCEPTION;
  }

  if (packet_byte_length > target_byte_length) {
    JS_ThrowRangeError(ctx, "WebSGNetworking: packet is too large for target array buffer.");
    return JS_EXCEPTION;
  }

  int32_t read_bytes = websg_network_receive(target, target_byte_length);

  if (read_bytes < 0) {
    JS_ThrowInternalError(ctx, "WebSGNetworking: error receiving packet.");
    return JS_EXCEPTION;
  }

  return JS_NewInt32(ctx, read_bytes);
}

void js_define_websg_network_api(JSContext *ctx, JSValue *target) {
  JSValue matrix = JS_NewObject(ctx);
  JS_SetPropertyStr(ctx, matrix, "listen", JS_NewCFunction(ctx, js_listen, "listen", 0));
  JS_SetPropertyStr(ctx, matrix, "close", JS_NewCFunction(ctx, js_close, "close", 0));
  JS_SetPropertyStr(ctx, matrix, "receive", JS_NewCFunction(ctx, js_receive, "receive", 0));
  JS_SetPropertyStr(ctx, matrix, "receiveInto", JS_NewCFunction(ctx, js_receive_into, "receiveInto", 1));
  JS_SetPropertyStr(ctx, matrix, "broadcast", JS_NewCFunction(ctx, js_broadcast, "broadcast", 1));
  JS_SetPropertyStr(ctx, *target, "Network", matrix);
}