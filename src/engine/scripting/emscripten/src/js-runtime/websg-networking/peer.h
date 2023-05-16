#ifndef __websg_peer_js_h
#define __websg_peer_js_h
#include "../../websg-networking.h"
#include "../quickjs/quickjs.h"
#include "./network.h"

typedef struct WebSGPeerData {
  WebSGNetworkData *network_data;
  uint32_t peer_index;
} WebSGPeerData;

extern JSClassID js_websg_peer_class_id;

void js_websg_define_peer(JSContext *ctx, JSValue network);

JSValue js_websg_create_peer(JSContext *ctx, WebSGNetworkData *network_data, uint32_t peer_index);

JSValue js_websg_get_peer(JSContext *ctx, WebSGNetworkData *network_data, uint32_t peer_index);

JSValue js_websg_remove_peer(JSContext *ctx, WebSGNetworkData *network_data, uint32_t peer_index);

#endif
