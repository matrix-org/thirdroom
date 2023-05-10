#include "../quickjs/cutils.h"
#include "../quickjs/quickjs.h"
#include "../../websg-networking.h"
#include "./websg-networking-js.h"
#include "./network-message.h"

JSClassID js_websg_network_message_class_id;

/**
 * Class Definition
 **/

static JSClassDef js_websg_network_message_class = {
  "NetworkMessage",
};

static const JSCFunctionListEntry js_websg_network_message_proto_funcs[] = {
  JS_PROP_STRING_DEF("[Symbol.toStringTag]", "NetworkMessage", JS_PROP_CONFIGURABLE),
};

static JSValue js_websg_network_message_constructor(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  return JS_ThrowTypeError(ctx, "Illegal Constructor.");
}

void js_websg_define_network_message(JSContext *ctx, JSValue network) {
  JS_NewClassID(&js_websg_network_message_class_id);
  JS_NewClass(JS_GetRuntime(ctx), js_websg_network_message_class_id, &js_websg_network_message_class);
  JSValue network_message_proto = JS_NewObject(ctx);
  JS_SetPropertyFunctionList(
    ctx,
    network_message_proto,
    js_websg_network_message_proto_funcs,
    countof(js_websg_network_message_proto_funcs)
  );
  JS_SetClassProto(ctx, js_websg_network_message_class_id, network_message_proto);

  JSValue constructor = JS_NewCFunction2(
    ctx,
    js_websg_network_message_constructor,
    "NetworkMessage",
    0,
    JS_CFUNC_constructor,
    0
  );
  JS_SetConstructor(ctx, constructor, network_message_proto);
  JS_SetPropertyStr(
    ctx,
    network,
    "NetworkMessage",
    constructor
  );
}

/**
 * Public Methods
 **/

JSValue js_websg_new_network_message_instance(
  JSContext *ctx,
  JSValue peer,
  JSValue data,
  uint32_t bytes_written,
  int32_t is_binary
) {
  JSValue network_message = JS_NewObjectClass(ctx, js_websg_network_message_class_id);

  if (JS_IsException(network_message)) {
    return network_message;
  }

  JS_SetPropertyStr(ctx, network_message, "peer", peer);
  JS_SetPropertyStr(ctx, network_message, "data", data);
  JS_SetPropertyStr(ctx, network_message, "bytesWritten", JS_NewUint32(ctx, bytes_written));
  JS_SetPropertyStr(ctx, network_message, "isBinary", JS_NewBool(ctx, is_binary));

  return network_message;
}
