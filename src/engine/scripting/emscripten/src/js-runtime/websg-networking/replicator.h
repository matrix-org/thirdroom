#ifndef __websg_network_replicator_js_h
#define __websg_network_replicator_js_h
#include <math.h>
#include "../websg/world.h"
#include "../quickjs/quickjs.h"
#include "./network.h"
#include "./replication.h"

typedef struct WebSGReplicatorData {
  replicator_id_t replicator_id;
  JSValue factory_function;
} WebSGReplicatorData;

extern JSClassID js_websg_replicator_class_id;

void js_websg_define_replicator(JSContext *ctx, JSValue network);

JSValue js_websg_create_replicator(JSContext *ctx, float* elements);

JSValue js_websg_new_replicator_instance(JSContext *ctx, WebSGNetworkData *network_data, replicator_id_t replicator_id, JSValue factory_function);

#endif
