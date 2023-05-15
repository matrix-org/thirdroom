#include "../quickjs/cutils.h"
#include "../quickjs/quickjs.h"
#include "../../websg-networking.h"
#include "./websg-networking-js.h"
#include "./network.h"
#include "./peer.h"
#include "../websg/vector3.h"
#include "../websg/quaternion.h"

JSClassID js_websg_peer_class_id;

/**
 * Class Definition
 **/

static void js_websg_peer_finalizer(JSRuntime *rt, JSValue val) {
  WebSGPeerData *peer_data = JS_GetOpaque(val, js_websg_peer_class_id);

  if (peer_data) {
    js_free_rt(rt, peer_data);
  }
}

static JSClassDef js_websg_peer_class = {
  "Peer",
  .finalizer = js_websg_peer_finalizer
};

static JSValue js_websg_peer_get_id(JSContext *ctx, JSValueConst this_val) {
  WebSGPeerData *peer_data = JS_GetOpaque(this_val, js_websg_peer_class_id);

  int32_t length = websg_peer_get_id_length(peer_data->peer_index);

  const char *str = js_mallocz(ctx, sizeof(char) * length);

  int32_t result = websg_peer_get_id(peer_data->peer_index, str, length);

  if (result == -1) {
    JS_ThrowInternalError(ctx, "WebSG: Error getting peer id.");
    return JS_EXCEPTION;
  }

  return JS_NewStringLen(ctx, str, length);
}

static JSValue js_websg_peer_get_is_host(JSContext *ctx, JSValueConst this_val) {
  WebSGPeerData *peer_data = JS_GetOpaque(this_val, js_websg_peer_class_id);
  int32_t result = websg_peer_is_host(peer_data->peer_index);
  return JS_NewBool(ctx, result);
}

static JSValue js_websg_peer_get_is_local(JSContext *ctx, JSValueConst this_val) {
  WebSGPeerData *peer_data = JS_GetOpaque(this_val, js_websg_peer_class_id);
  int32_t result = websg_peer_is_local(peer_data->peer_index);
  return JS_NewBool(ctx, result);
}

static JSValue js_websg_peer_send(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  WebSGPeerData *peer_data = JS_GetOpaque(this_val, js_websg_peer_class_id);

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

  if (websg_peer_send(peer_data->peer_index, buffer, byte_length, binary, reliable) == 0) {
    return JS_UNDEFINED;
  }

  JS_ThrowInternalError(ctx, "WebSGNetworking: error sending peer message.");

  return JS_EXCEPTION;
}

static const JSCFunctionListEntry js_websg_peer_proto_funcs[] = {
  JS_CGETSET_DEF("id", js_websg_peer_get_id, NULL),
  JS_CGETSET_DEF("isHost", js_websg_peer_get_is_host, NULL),
  JS_CGETSET_DEF("isLocal", js_websg_peer_get_is_local, NULL),
  JS_CFUNC_DEF("send", 2, js_websg_peer_send),
  JS_PROP_STRING_DEF("[Symbol.toStringTag]", "Peer", JS_PROP_CONFIGURABLE),
};

static JSValue js_websg_peer_constructor(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  return JS_ThrowTypeError(ctx, "Illegal Constructor.");
}

void js_websg_define_peer(JSContext *ctx, JSValue network) {
  JS_NewClassID(&js_websg_peer_class_id);
  JS_NewClass(JS_GetRuntime(ctx), js_websg_peer_class_id, &js_websg_peer_class);
  JSValue peer_proto = JS_NewObject(ctx);
  JS_SetPropertyFunctionList(
    ctx,
    peer_proto,
    js_websg_peer_proto_funcs,
    countof(js_websg_peer_proto_funcs)
  );
  JS_SetClassProto(ctx, js_websg_peer_class_id, peer_proto);

  JSValue constructor = JS_NewCFunction2(
    ctx,
    js_websg_peer_constructor,
    "Peer",
    0,
    JS_CFUNC_constructor,
    0
  );
  JS_SetConstructor(ctx, constructor, peer_proto);
  JS_SetPropertyStr(
    ctx,
    network,
    "Peer",
    constructor
  );
}

/**
 * Public Methods
 **/

JSValue js_websg_create_peer(JSContext *ctx, WebSGNetworkData *network_data, uint32_t peer_index) {
  JSValue peer = JS_NewObjectClass(ctx, js_websg_peer_class_id);

  if (JS_IsException(peer)) {
    return peer;
  }

  WebSGPeerData *peer_data = js_mallocz(ctx, sizeof(WebSGPeerData));
  peer_data->network_data = network_data;
  peer_data->peer_index = peer_index;
  JS_SetOpaque(peer, peer_data);

  js_websg_define_vector3_prop_read_only(
    ctx,
    peer,
    "translation",
    peer_index,
    &websg_peer_get_translation_element
  );

  js_websg_define_quaternion_prop_read_only(
    ctx,
    peer,
    "rotation",
    peer_index,
    &websg_peer_get_rotation_element
  );

  return JS_DupValue(ctx, peer);
}

JSValue js_websg_get_peer(JSContext *ctx, WebSGNetworkData *network_data, uint32_t peer_index) {
  return JS_GetPropertyUint32(ctx, network_data->peers, peer_index);
}

JSValue js_websg_remove_peer(JSContext *ctx, WebSGNetworkData *network_data, uint32_t peer_index) {
  JSValue peer = JS_GetPropertyUint32(ctx, network_data->peers, peer_index);

  if (JS_IsUndefined(peer)) {
    JS_ThrowInternalError(ctx, "WebSG: Error removing peer by index.");
    return JS_EXCEPTION;
  }

  JS_SetPropertyUint32(ctx, network_data->peers, peer_index, JS_UNDEFINED);

  return peer;
}