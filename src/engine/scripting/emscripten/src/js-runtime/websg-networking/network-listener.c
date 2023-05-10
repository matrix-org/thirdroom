#include "../quickjs/cutils.h"
#include "../quickjs/quickjs.h"
#include "../../websg-networking.h"
#include "./websg-networking-js.h"
#include "./network-listener.h"
#include "./network-message-iterator.h"

JSClassID js_websg_network_listener_class_id;

/**
 * Class Definition
 **/

static void js_websg_network_listener_finalizer(JSRuntime *rt, JSValue val) {
  WebSGNetworkListenerData *network_listener_data = JS_GetOpaque(val, js_websg_network_listener_class_id);

  if (network_listener_data) {
    js_free_rt(rt, network_listener_data);
  }
}

static JSClassDef js_websg_network_listener_class = {
  "NetworkListener",
  .finalizer = js_websg_network_listener_finalizer
};

static JSValue js_websg_network_listener_receive(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  WebSGNetworkListenerData *network_listener_data = JS_GetOpaque(this_val, js_websg_network_listener_class_id);
  return js_websg_create_network_message_iterator(ctx, network_listener_data, argv[0]);
}

static JSValue js_websg_network_listener_close(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  WebSGNetworkListenerData *network_listener_data = JS_GetOpaque(this_val, js_websg_network_listener_class_id);

  if (websg_network_listener_close(network_listener_data->listener_id) == 0) {
    return JS_UNDEFINED;
  }

  JS_ThrowInternalError(ctx, "WebSGNetworking: error closing listener.");

  return JS_EXCEPTION;
}

static const JSCFunctionListEntry js_websg_network_listener_proto_funcs[] = {
  JS_CFUNC_DEF("receive", 1, js_websg_network_listener_receive),
  JS_CFUNC_DEF("close", 0, js_websg_network_listener_close),
  JS_PROP_STRING_DEF("[Symbol.toStringTag]", "NetworkListener", JS_PROP_CONFIGURABLE),
};

static JSValue js_websg_network_listener_constructor(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  return JS_ThrowTypeError(ctx, "Illegal Constructor.");
}

void js_websg_define_network_listener(JSContext *ctx, JSValue websg_networking) {
  JS_NewClassID(&js_websg_network_listener_class_id);
  JS_NewClass(JS_GetRuntime(ctx), js_websg_network_listener_class_id, &js_websg_network_listener_class);
  JSValue network_listener_proto = JS_NewObject(ctx);
  JS_SetPropertyFunctionList(
    ctx,
    network_listener_proto,
    js_websg_network_listener_proto_funcs,
    countof(js_websg_network_listener_proto_funcs)
  );
  JS_SetClassProto(ctx, js_websg_network_listener_class_id, network_listener_proto);

  JSValue constructor = JS_NewCFunction2(
    ctx,
    js_websg_network_listener_constructor,
    "NetworkListener",
    0,
    JS_CFUNC_constructor,
    0
  );
  JS_SetConstructor(ctx, constructor, network_listener_proto);
  JS_SetPropertyStr(
    ctx,
    websg_networking,
    "NetworkListener",
    constructor
  );
}

/**
 * Public Methods
 **/

JSValue js_websg_new_network_listener_instance(JSContext *ctx, WebSGNetworkData *network_data, network_listener_id_t listener_id) {
  JSValue network_listener = JS_NewObjectClass(ctx, js_websg_network_listener_class_id);

  if (JS_IsException(network_listener)) {
    return network_listener;
  }

  WebSGNetworkListenerData *listener_data = js_mallocz(ctx, sizeof(WebSGNetworkListenerData));
  listener_data->network_data = network_data;
  listener_data->listener_id = listener_id;
  JS_SetOpaque(network_listener, listener_data);
  
  return network_listener;
}
