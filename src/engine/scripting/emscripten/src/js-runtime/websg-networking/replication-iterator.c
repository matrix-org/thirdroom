#include <string.h>
#include <stdbool.h>
#include "../quickjs/cutils.h"
#include "../quickjs/quickjs.h"
#include "../../websg.h"
#include "../websg/node.h"
#include "./peer.h"
#include "./network.h"
#include "./replicator.h"
#include "./replication.h"
#include "./replication-iterator.h"

JSClassID js_websg_replication_iterator_class_id;

static void js_websg_replication_iterator_finalizer(JSRuntime *rt, JSValue val) {
  WebSGReplicationIteratorData *it = JS_GetOpaque(val, js_websg_replication_iterator_class_id);

  if (it) {
    js_free_rt(rt, it);
  }
}

static JSClassDef js_websg_replication_iterator_class = {
  "ReplicationIterator",
  .finalizer = js_websg_replication_iterator_finalizer
};

static void js_buffer_free(JSRuntime *rt, void *opaque, void *ptr) {
  js_free_rt(rt, ptr);
}

static JSValue js_websg_replication_iterator_next(
  JSContext *ctx,
  JSValueConst this_val,
  int argc,
  JSValueConst *argv,
  BOOL *pdone,
  int magic
) {
  WebSGReplicationIteratorData *it = JS_GetOpaque2(ctx, this_val, js_websg_replication_iterator_class_id);

  if (!it) {
    *pdone = FALSE;
    return JS_EXCEPTION;
  }
  
  bool spawning = it->type == WebSGReplicatorIteratorType_Spawned;
  bool despawning = it->type == WebSGReplicatorIteratorType_Despawned;

  uint32_t replicator_id = it->replicator_data->replicator_id;

  ReplicationInfo *info = js_mallocz(ctx, sizeof(ReplicationInfo));

  int result;
  
  if (spawning) {
    result = websg_replicator_get_spawned_message_info(replicator_id, info);
  } else if (despawning) {
    result = websg_replicator_get_despawned_message_info(replicator_id, info);
  } else {
    JS_ThrowRangeError(ctx, "WebSGNetworking: invalid replicator type.");
    return JS_EXCEPTION;
  }

  if (result == -1) {
    js_free(ctx, info);
    JS_ThrowInternalError(ctx, "WebSGNetworking: error getting replication info.");
    return JS_EXCEPTION;
  } else if (result == 0) {
    js_free(ctx, info);
    *pdone = TRUE;
    return JS_UNDEFINED;
  }

  *pdone = FALSE;
  uint8_t *target = NULL;
  int32_t read_bytes = 0;
  JSValue data;

  if (info->byte_length > 0) {
    target = js_mallocz(ctx, info->byte_length);
  }

  if (spawning) {
    read_bytes = websg_replicator_spawn_receive(
      replicator_id,
      target,
      info->byte_length
    );
  } else if (despawning) {
    read_bytes = websg_replicator_despawn_receive(
      replicator_id,
      target,
      info->byte_length
    );
  } else {
    JS_ThrowRangeError(ctx, "WebSGNetworking: invalid replicator type.");
    return JS_EXCEPTION;
  }

  if (read_bytes > 0) {
    data = JS_NewArrayBuffer(ctx, target, read_bytes, js_buffer_free, NULL, 0);
  } else if (read_bytes == -1) {
    js_free(ctx, info);
    js_free(ctx, target);

    JS_ThrowInternalError(ctx, "WebSGNetworking: error receiving message.");
    return JS_EXCEPTION;
  }

  JSValue peer = js_websg_get_peer(ctx, it->network_data, info->peer_index);

  JSValue node;
  if (info->node_id > 0) {
    node = js_websg_get_node_by_id(ctx, it->world_data, info->node_id);
  } else {
    node = JS_Call(ctx, it->replicator_data->factory_function, JS_UNDEFINED, 0, NULL);
    if (JS_IsUndefined(node)) {
      JS_ThrowInternalError(ctx, "WebSGNetworking: replicator factory function did not return a node.");
      return JS_EXCEPTION;
    }

    WebSGNodeData *node_data = JS_GetOpaque2(ctx, node, js_websg_node_class_id);

    NetworkSynchronizerProps *synchronizer_props = js_mallocz(ctx, sizeof(NetworkSynchronizerProps));
    synchronizer_props->network_id = info->network_id;
    synchronizer_props->replicator_id = replicator_id;

    if (websg_node_add_network_synchronizer(node_data->node_id, synchronizer_props) == -1) {
      JS_ThrowInternalError(ctx, "WebSGNetworking: unable to assign networkID to nodeID.");
      js_free(ctx, synchronizer_props);
      return JS_EXCEPTION;
    }

    js_free(ctx, synchronizer_props);
  }

  js_free(ctx, target);
  js_free(ctx, info);

  return js_websg_new_replication_instance(ctx, node, peer, data);
}

static JSValue js_websg_replication_iterator(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  return JS_DupValue(ctx, this_val);
}


static const JSCFunctionListEntry js_websg_replication_iterator_proto_funcs[] = {
  JS_ITERATOR_NEXT_DEF("next", 0, js_websg_replication_iterator_next, 0),
  JS_PROP_STRING_DEF("[Symbol.toStringTag]", "ReplicationIterator", JS_PROP_CONFIGURABLE),
  JS_CFUNC_DEF("[Symbol.iterator]", 0, js_websg_replication_iterator),
};

void js_websg_define_replication_iterator(JSContext *ctx) {
  JS_NewClassID(&js_websg_replication_iterator_class_id);
  JS_NewClass(JS_GetRuntime(ctx), js_websg_replication_iterator_class_id, &js_websg_replication_iterator_class);
  JSValue proto = JS_NewObject(ctx);
  JS_SetPropertyFunctionList(
    ctx,
    proto,
    js_websg_replication_iterator_proto_funcs,
    countof(js_websg_replication_iterator_proto_funcs)
  );
  JS_SetClassProto(ctx, js_websg_replication_iterator_class_id, proto);
}

JSValue js_websg_create_replication_iterator(
    JSContext *ctx,
    WebSGReplicatorData *replicator_data,
    WebSGReplicatorIteratorType type
) {
  JSValue iter_obj = JS_NewObjectClass(ctx, js_websg_replication_iterator_class_id);

  if (JS_IsException(iter_obj)) {
    return JS_EXCEPTION;
  }

  WebSGReplicationIteratorData *it = js_mallocz(ctx, sizeof(WebSGReplicationIteratorData));

  if (!it) {
    JS_FreeValue(ctx, iter_obj);
    return JS_EXCEPTION;
  }

  JSValue global = JS_GetGlobalObject(ctx);

  JSValue world = JS_GetPropertyStr(ctx, global, "world");
  WebSGWorldData *world_data = JS_GetOpaque2(ctx, world, js_websg_world_class_id);

  JSValue network = JS_GetPropertyStr(ctx, global, "network");
  WebSGNetworkData *network_data = JS_GetOpaque2(ctx, network, js_websg_network_class_id);

  it->world_data = world_data;
  it->network_data = network_data;
  it->replicator_data = replicator_data;
  it->type = type;

  JS_SetOpaque(iter_obj, it);

  return iter_obj;
}