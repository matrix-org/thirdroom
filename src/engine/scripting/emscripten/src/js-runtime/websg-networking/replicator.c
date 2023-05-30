#include <string.h>
#include "../quickjs/cutils.h"
#include "../quickjs/quickjs.h"
#include "../../websg.h"
#include "../../websg-networking.h"
#include "../websg/world.h"
#include "../websg/node.h"
#include "../utils/array.h"
#include "./replicator.h"
#include "./replication.h"
#include "./replication-iterator.h"
#include "./network.h"

JSClassID js_websg_replicator_class_id;

/**
 * Class Definition
 **/

static void js_websg_replicator_finalizer(JSRuntime *rt, JSValue val) {
  WebSGReplicatorData *replicator_data = JS_GetOpaque(val, js_websg_replicator_class_id);

  if (replicator_data) {
    js_free_rt(rt, replicator_data);
  }
}

static JSClassDef js_websg_replicator_class = {
  "Replicator",
  .finalizer = js_websg_replicator_finalizer
};

static JSValue js_websg_replicator_spawn(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  WebSGReplicatorData *replicator_data = JS_GetOpaque(this_val, js_websg_replicator_class_id);

  if (JS_IsUndefined(replicator_data->factory_function)) {
    JS_ThrowTypeError(ctx, "WebSGNetworking: Factory function undefined for replicator.");
    return JS_EXCEPTION;
  }

  size_t byte_length = 0;
  uint8_t *buffer;

  if (!JS_IsUndefined(argv[0])) {
    buffer = JS_GetArrayBuffer(ctx, &byte_length, argv[0]);
  }

  JSValue node = JS_Call(ctx, replicator_data->factory_function, JS_UNDEFINED, 0, NULL);

  WebSGNodeData *node_data = JS_GetOpaque(node, js_websg_node_class_id);

  if (websg_replicator_spawn_local(replicator_data->replicator_id, node_data->node_id, buffer, byte_length) != 0) {
    JS_ThrowTypeError(ctx, "WebSGNetworking: Error during replicator spawn.");
    return JS_EXCEPTION;
  }

  return JS_DupValue(ctx, node);
}

static JSValue js_websg_replicator_despawn(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  WebSGReplicatorData *replicator_data = JS_GetOpaque(this_val, js_websg_replicator_class_id);

  if (JS_IsUndefined(replicator_data->factory_function)) {
    JS_ThrowTypeError(ctx, "WebSGNetworking: Factory function undefined for replicator.");
    return JS_EXCEPTION;
  }

  if (JS_IsUndefined(argv[0])) {
    JS_ThrowTypeError(ctx, "WebSGNetworking: Replicator despawn requires a node as first parameter.");
    return JS_EXCEPTION;
  }

  JSValue node = argv[0];
  WebSGNodeData *node_data = JS_GetOpaque(node, js_websg_node_class_id);

  size_t byte_length = 0;
  uint8_t *buffer;

  if (!JS_IsUndefined(argv[1])) {
    buffer = JS_GetArrayBuffer(ctx, &byte_length, argv[1]);
  }

  if (websg_replicator_despawn_local(replicator_data->replicator_id, node_data->node_id, buffer, byte_length) != 0) {
    JS_ThrowTypeError(ctx, "WebSGNetworking: Error during replicator despawn.");
    return JS_EXCEPTION;
  }

  return JS_UNDEFINED;
}

static JSValue js_websg_replicator_spawned(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  WebSGReplicatorData *replicator_data = JS_GetOpaque(this_val, js_websg_replicator_class_id);
  return js_websg_create_replication_iterator(ctx, replicator_data, WebSGReplicatorIteratorType_Spawned);
}

static JSValue js_websg_replicator_despawned(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  WebSGReplicatorData *replicator_data = JS_GetOpaque(this_val, js_websg_replicator_class_id);
  return js_websg_create_replication_iterator(ctx, replicator_data, WebSGReplicatorIteratorType_Despawned);
}

static const JSCFunctionListEntry js_websg_replicator_proto_funcs[] = {
  JS_CFUNC_DEF("spawn", 1, js_websg_replicator_spawn),
  JS_CFUNC_DEF("spawned", 0, js_websg_replicator_spawned),
  JS_CFUNC_DEF("despawn", 2, js_websg_replicator_despawn),
  JS_CFUNC_DEF("despawned", 0, js_websg_replicator_despawned),
  JS_PROP_STRING_DEF("[Symbol.toStringTag]", "Replicator", JS_PROP_CONFIGURABLE),
};

static JSValue js_websg_replicator_constructor(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv) {
  return JS_ThrowTypeError(ctx, "Illegal Constructor.");
}

void js_websg_define_replicator(JSContext *ctx, JSValue network) {
  JS_NewClassID(&js_websg_replicator_class_id);
  JS_NewClass(JS_GetRuntime(ctx), js_websg_replicator_class_id, &js_websg_replicator_class);
  JSValue replicator_proto = JS_NewObject(ctx);
  JS_SetPropertyFunctionList(ctx, replicator_proto, js_websg_replicator_proto_funcs, countof(js_websg_replicator_proto_funcs));
  JS_SetClassProto(ctx, js_websg_replicator_class_id, replicator_proto);

  JSValue constructor = JS_NewCFunction2(
    ctx,
    js_websg_replicator_constructor,
    "Replicator",
    0,
    JS_CFUNC_constructor,
    0
  );
  JS_SetConstructor(ctx, constructor, replicator_proto);
  JS_SetPropertyStr(
    ctx,
    network,
    "Replicator",
    constructor
  );
}

JSValue js_websg_new_replicator_instance(JSContext *ctx, WebSGNetworkData *network_data, replicator_id_t replicator_id, JSValue factory_function) {
  JSValue replicator = JS_NewObjectClass(ctx, js_websg_replicator_class_id);

  if (JS_IsException(replicator)) {
    return replicator;
  }

  WebSGReplicatorData *replicator_data = js_mallocz(ctx, sizeof(WebSGReplicatorData));
  replicator_data->replicator_id = replicator_id;
  replicator_data->factory_function = factory_function;
  JS_SetOpaque(replicator, replicator_data);

  JS_SetPropertyUint32(ctx, network_data->replicators, replicator_id, JS_DupValue(ctx, replicator));

  return replicator;
}