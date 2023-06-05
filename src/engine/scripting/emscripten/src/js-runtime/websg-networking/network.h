#ifndef __js_websg_network_h
#define __js_websg_network_h
#include "../quickjs/quickjs.h"

typedef struct WebSGNetworkData {
  JSValue peers;
  JSValue replicators;
  JSValue replications;
} WebSGNetworkData;

extern JSClassID js_websg_network_class_id;

void js_websg_define_network(JSContext *ctx, JSValue websg_networking);

JSValue js_websg_new_network(JSContext *ctx);

void js_websg_network(JSContext *ctx, JSValue websg_networking);

int32_t js_websg_network_local_peer_entered(JSContext *ctx, JSValue network);

int32_t js_websg_network_peer_entered(JSContext *ctx, JSValue network, uint32_t peer_index);

int32_t js_websg_network_peer_exited(JSContext *ctx, JSValue network, uint32_t peer_index);

#endif
