#ifndef __websg_peer_js_h
#define __websg_peer_js_h
#include "../../websg-networking.h"
#include "../quickjs/quickjs.h"
#include "./network.h"

typedef struct WebSGPeerData {
  WebSGNetworkData *network_data;
  peer_id_t peer_id;
} WebSGPeerData;

extern JSClassID js_websg_peer_class_id;

void js_websg_define_peer(JSContext *ctx, JSValue network);

JSValue js_websg_create_peer(JSContext *ctx, WebSGNetworkData *network_data, peer_id_t peer_id);

JSValue js_websg_get_peer(JSContext *ctx, WebSGNetworkData *network_data, peer_id_t peer_id);

JSValue js_websg_remove_peer(JSContext *ctx, WebSGNetworkData *network_data, peer_id_t peer_id);

#endif
