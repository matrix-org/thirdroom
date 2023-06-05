#ifndef __websg_network_replication_iterator_js_h
#define __websg_network_replication_iterator_js_h
#include "../quickjs/quickjs.h"
#include "../../websg.h"
#include "../websg/world.h"
#include "./replication.h"
#include "./replicator.h"

typedef enum WebSGReplicatorIteratorType {
    WebSGReplicatorIteratorType_Spawned,
    WebSGReplicatorIteratorType_Despawned
} WebSGReplicatorIteratorType;

typedef struct WebSGReplicationIteratorData {
    WebSGWorldData *world_data;
    WebSGNetworkData *network_data;
    WebSGReplicatorData *replicator_data;
    WebSGReplicatorIteratorType type;
} WebSGReplicationIteratorData;

extern JSClassID js_websg_replication_iterator_class_id;

void js_websg_define_replication_iterator(JSContext *ctx);

JSValue js_websg_create_replication_iterator(JSContext *ctx, WebSGReplicatorData *replicator_data, WebSGReplicatorIteratorType type);

#endif
