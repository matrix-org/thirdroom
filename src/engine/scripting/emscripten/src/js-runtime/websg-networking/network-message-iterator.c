#include <string.h>
#include "../quickjs/cutils.h"
#include "../quickjs/quickjs.h"
#include "../../websg.h"
#include "./network-message.h"
#include "./peer.h"
#include "./network-message-iterator.h"

JSClassID js_websg_network_message_iterator_class_id;

static void js_websg_network_message_iterator_finalizer(JSRuntime *rt, JSValue val) {
  WebSGNetworkMessageIteratorData *it = JS_GetOpaque(val, js_websg_network_message_iterator_class_id);

  if (it) {
    js_free_rt(rt, it);
  }
}

static JSClassDef js_ref_children_iterator_class = {
  "NetworkMessageIterator",
  .finalizer = js_websg_network_message_iterator_finalizer
};

static void js_websg_network_buffer_free(JSRuntime *rt, void *opaque, void *ptr) {
  js_free_rt(rt, ptr);
}

static JSValue js_websg_network_message_iterator_next(
  JSContext *ctx,
  JSValueConst this_val,
  int argc,
  JSValueConst *argv,
  BOOL *pdone,
  int magic
) {
  WebSGNetworkMessageIteratorData *it = JS_GetOpaque2(ctx, this_val, js_websg_network_message_iterator_class_id);

  if (!it) {
    *pdone = FALSE;
    return JS_EXCEPTION;
  }

  uint32_t listener_id = it->listener_data->listener_id;

  NetworkMessageInfo *info = js_mallocz(ctx, sizeof(NetworkMessageInfo));

  int result = websg_network_listener_get_message_info(listener_id, info);

  if (result == -1) {
    js_free(ctx, info);
    JS_ThrowInternalError(ctx, "WebSGNetworking: error getting message info.");
    return JS_EXCEPTION;
  } else if (result == 0) {
    js_free(ctx, info);
    *pdone = TRUE;
    return JS_UNDEFINED;
  }

  *pdone = FALSE;

  uint8_t *target;
  uint32_t target_byte_length;

  if (JS_IsUndefined(it->array_buffer)) {
    target = js_mallocz(ctx, info->byte_length);
    target_byte_length = info->byte_length;
  } else {
    target = it->buffer_data;
    target_byte_length = it->buffer_size;
  }

  if (target == NULL) {
    js_free(ctx, info);
    return JS_EXCEPTION;
  }

  if (info->byte_length > target_byte_length) {
    js_free(ctx, info);
    JS_ThrowRangeError(ctx, "WebSGNetworking: message is too large for target array buffer.");
    return JS_EXCEPTION;
  }

  int32_t read_bytes = websg_network_listener_receive(
    listener_id,
    target,
    target_byte_length
  );

  if (read_bytes == -1) {
    js_free(ctx, info);

    if (JS_IsUndefined(it->array_buffer)) {
      js_free(ctx, target);
    }

    JS_ThrowInternalError(ctx, "WebSGNetworking: error receiving message.");
    return JS_EXCEPTION;
  }

  JSValue data;

  if (info->binary) {
    if (JS_IsUndefined(it->array_buffer)) {
      data = JS_NewArrayBuffer(ctx, target, read_bytes, js_websg_network_buffer_free, NULL, 0);
    } else {
      data = JS_DupValue(ctx, it->array_buffer);
    }
  } else {
    data = JS_NewStringLen(ctx, (const char *)target, read_bytes);
  }

  JSValue peer = js_websg_get_peer(ctx, it->listener_data->network_data, info->peer_index);

  int is_binary = info->binary;

  js_free(ctx, info);

  return js_websg_new_network_message_instance(ctx, peer, data, (uint32_t)read_bytes, is_binary);
}

static JSValue js_websg_network_message_iterator(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  return JS_DupValue(ctx, this_val);
}


static const JSCFunctionListEntry js_children_iterator_proto_funcs[] = {
  JS_ITERATOR_NEXT_DEF("next", 0, js_websg_network_message_iterator_next, 0),
  JS_PROP_STRING_DEF("[Symbol.toStringTag]", "NetworkMessageIterator", JS_PROP_CONFIGURABLE),
  JS_CFUNC_DEF("[Symbol.iterator]", 0, js_websg_network_message_iterator),
};

void js_websg_define_network_message_iterator(JSContext *ctx) {
  JS_NewClassID(&js_websg_network_message_iterator_class_id);
  JS_NewClass(JS_GetRuntime(ctx), js_websg_network_message_iterator_class_id, &js_ref_children_iterator_class);
  JSValue proto = JS_NewObject(ctx);
  JS_SetPropertyFunctionList(ctx, proto, js_children_iterator_proto_funcs, countof(js_children_iterator_proto_funcs));
  JS_SetClassProto(ctx, js_websg_network_message_iterator_class_id, proto);
}

JSValue js_websg_create_network_message_iterator(
    JSContext *ctx,
    WebSGNetworkListenerData *listener_data,
    JSValue array_buffer
) {
  JSValue iter_obj = JS_NewObjectClass(ctx, js_websg_network_message_iterator_class_id);

  if (JS_IsException(iter_obj)) {
    return JS_EXCEPTION;
  }

  WebSGNetworkMessageIteratorData *it = js_mallocz(ctx, sizeof(WebSGNetworkMessageIteratorData));

  if (!it) {
    JS_FreeValue(ctx, iter_obj);
    return JS_EXCEPTION;
  }

  it->listener_data = listener_data;
  it->array_buffer = array_buffer;

  if (JS_IsUndefined(array_buffer)) {
    it->buffer_data = NULL;
    it->buffer_size = 0;
  } else {
    size_t byte_length;
    it->buffer_data = JS_GetArrayBuffer(ctx, &byte_length, array_buffer);
    it->buffer_size = byte_length;

    if (it->buffer_data == NULL) {
      js_free(ctx, it);
      JS_FreeValue(ctx, iter_obj);
      return JS_EXCEPTION;
    }
  }

  JS_SetOpaque(iter_obj, it);

  return iter_obj;
}