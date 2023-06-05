#include "../quickjs/quickjs.h"
#include "../quickjs/cutils.h"
#include "../../websg-networking.h"
#include "../../websg-networking.h"
#include "./network-listener.h"
#include "./peer.h"
#include "../utils/exception.h"
#include "./replicator.h"

JSClassID js_websg_network_class_id;

/**
 * Class Definition
 **/

static JSClassDef js_websg_network_class = {
  "Network",
};

static JSValue js_websg_network_listen(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  WebSGNetworkData *network_data = JS_GetOpaque2(ctx, this_val, js_websg_network_class_id);

  network_listener_id_t listener_id = websg_network_listen();

  if (listener_id == 0) {
    JS_ThrowInternalError(ctx, "WebSGNetworking: error listening for packets.");
    return JS_EXCEPTION;
  }

  return js_websg_new_network_listener_instance(ctx, network_data, listener_id);
}

static JSValue js_websg_network_broadcast(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  int binary = !JS_IsString(argv[0]);

  size_t byte_length;
  uint8_t *buffer;

  if (binary) {
    buffer = JS_GetArrayBuffer(ctx, &byte_length, argv[0]);
  } else {
    buffer = (uint8_t *)JS_ToCStringLen(ctx, &byte_length, argv[0]);
  }

  if (buffer == NULL) {
    return JS_EXCEPTION;
  }

  int reliable = 1;

  if (argc > 1) {
    reliable = JS_ToBool(ctx, argv[1]);

    if (reliable == -1) {
      return JS_EXCEPTION;
    }
  }

  if (websg_network_broadcast(buffer, byte_length, binary, reliable) == 0) {
    return JS_UNDEFINED;
  }

  JS_ThrowInternalError(ctx, "WebSGNetworking: error broadcasting event.");

  return JS_EXCEPTION;
}

static JSValue js_websg_network_get_host(JSContext *ctx, JSValueConst this_val) {
  WebSGNetworkData *network_data = JS_GetOpaque2(ctx, this_val, js_websg_network_class_id);
  uint32_t peer_index = websg_network_get_host_peer_index();

  if (peer_index == 0) {
    return JS_UNDEFINED;
  }

  return js_websg_get_peer(ctx, network_data, peer_index);
}

static JSValue js_websg_network_get_local(JSContext *ctx, JSValueConst this_val) {
  WebSGNetworkData *network_data = JS_GetOpaque2(ctx, this_val, js_websg_network_class_id);
  uint32_t peer_index = websg_network_get_local_peer_index();

  if (peer_index == 0) {
    return JS_UNDEFINED;
  }

  return js_websg_get_peer(ctx, network_data, peer_index);
}

static JSValue js_websg_network_get_peers(JSContext *ctx, JSValueConst this_val) {
  WebSGNetworkData *network_data = JS_GetOpaque2(ctx, this_val, js_websg_network_class_id);
  return JS_DupValue(ctx, network_data->peers);
}

static JSValue js_websg_network_define_replicator(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  if (argc < 1 || !JS_IsFunction(ctx, argv[0])) {
    return JS_ThrowTypeError(ctx, "WebSGNetworking: Unable to create replicator, expected a function as the first argument.");
  }

  WebSGNetworkData *network_data = JS_GetOpaque(this_val, js_websg_network_class_id);

  JSValue factory_function = JS_DupValue(ctx, argv[0]);

  replication_id_t replicator_id = websg_network_define_replicator();

  return js_websg_new_replicator_instance(ctx, network_data, replicator_id, factory_function);
}


static const JSCFunctionListEntry js_websg_network_proto_funcs[] = {
  JS_CFUNC_DEF("listen", 0, js_websg_network_listen),
  JS_CFUNC_DEF("broadcast", 2, js_websg_network_broadcast),
  JS_CFUNC_DEF("defineReplicator", 1, js_websg_network_define_replicator),
  JS_CGETSET_DEF("host", js_websg_network_get_host, NULL),
  JS_CGETSET_DEF("local", js_websg_network_get_local, NULL),
  JS_PROP_STRING_DEF("[Symbol.toStringTag]", "Network", JS_PROP_CONFIGURABLE),
};

static JSValue js_websg_network_constructor(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  return JS_ThrowTypeError(ctx, "Illegal Constructor.");
}

void js_websg_define_network(JSContext *ctx, JSValue websg_networking) {
  JS_NewClassID(&js_websg_network_class_id);
  JS_NewClass(JS_GetRuntime(ctx), js_websg_network_class_id, &js_websg_network_class);
  JSValue network_proto = JS_NewObject(ctx);
  JS_SetPropertyFunctionList(
    ctx,
    network_proto,
    js_websg_network_proto_funcs,
    countof(js_websg_network_proto_funcs)
  );
  JS_SetClassProto(ctx, js_websg_network_class_id, network_proto);

  JSValue constructor = JS_NewCFunction2(
    ctx,
    js_websg_network_constructor,
    "Network",
    0,
    JS_CFUNC_constructor,
    0
  );
  JS_SetConstructor(ctx, constructor, network_proto);
  JS_SetPropertyStr(
    ctx,
    websg_networking,
    "Network",
    constructor
  );
}

JSValue js_websg_new_network(JSContext *ctx) {
  JSValue network = JS_NewObjectClass(ctx, js_websg_network_class_id);

  if (JS_IsException(network)) {
    return network;
  }

  WebSGNetworkData *network_data = js_mallocz(ctx, sizeof(WebSGNetworkData));
  network_data->peers = JS_NewObject(ctx);
  JS_SetOpaque(network, network_data);

  return network;
}

int32_t js_websg_network_local_peer_entered(JSContext *ctx, JSValue network) {
  uint32_t local_peer_index = websg_network_get_local_peer_index();

  if (local_peer_index == -1) {
    return -1;
  }

  WebSGNetworkData *network_data = JS_GetOpaque2(ctx, network, js_websg_network_class_id);

  JSValue local_peer = js_websg_create_peer(ctx, network_data, local_peer_index);

  JS_SetPropertyUint32(ctx, network_data->peers, local_peer_index, local_peer);

  return 0;
}

int32_t js_websg_network_peer_entered(JSContext *ctx, JSValue network, uint32_t peer_index) {
  WebSGNetworkData *network_data = JS_GetOpaque2(ctx, network, js_websg_network_class_id);

  JSValue peer = js_websg_create_peer(ctx, network_data, peer_index);

  if (js_handle_exception(ctx, peer) == -1) {
    return -1;
  }

  JS_SetPropertyUint32(ctx, network_data->peers, peer_index, peer);

  JSValue network_on_peer_entered_func = JS_GetPropertyStr(ctx, network, "onpeerentered");

  if (js_handle_exception(ctx, network_on_peer_entered_func) < 0) {
    return -1;
  } else if (JS_IsUndefined(network_on_peer_entered_func)) {
    return 0;
  }

  JSValueConst args[] = { peer };
  JSValue val = JS_Call(ctx, network_on_peer_entered_func, JS_UNDEFINED, 1, args);
  JS_FreeValue(ctx, network_on_peer_entered_func);

  if (js_handle_exception(ctx, val) < 0) {
    return -1;
  } else {
    JS_FreeValue(ctx, val);
    return 0;
  }
}

int32_t js_websg_network_peer_exited(JSContext *ctx, JSValue network, uint32_t peer_index) {
  WebSGNetworkData *network_data = JS_GetOpaque2(ctx, network, js_websg_network_class_id);

  JSValue peer = js_websg_remove_peer(ctx, network_data, peer_index);

  if (js_handle_exception(ctx, peer) == -1) {
    return -1;
  }

  JSValue network_on_peer_exited_func = JS_GetPropertyStr(ctx, network, "onpeerexited");

  if (js_handle_exception(ctx, network_on_peer_exited_func) < 0) {
    return -1;
  } else if (JS_IsUndefined(network_on_peer_exited_func)) {
    return 0;
  }

  JSValueConst args[] = { peer };
  JSValue val = JS_Call(ctx, network_on_peer_exited_func, JS_UNDEFINED, 1, args);
  JS_FreeValue(ctx, network_on_peer_exited_func);

  if (js_handle_exception(ctx, val) < 0) {
    return -1;
  } else {
    JS_FreeValue(ctx, val);
    return 0;
  }
}