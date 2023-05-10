#ifndef __websg_network_listener_js_h
#define __websg_network_listener_js_h
#include "../../websg-networking.h"
#include "../quickjs/quickjs.h"
#include "./network.h"

typedef struct WebSGNetworkListenerData {
  WebSGNetworkData *network_data;
  network_listener_id_t listener_id;
} WebSGNetworkListenerData;

extern JSClassID js_websg_network_listener_class_id;

void js_websg_define_network_listener(JSContext *ctx, JSValue websg_networking);

JSValue js_websg_new_network_listener_instance(
  JSContext *ctx,
  WebSGNetworkData *network_data,
  network_listener_id_t listener_id
);

#endif
