#include "../quickjs/quickjs.h"
#include "../quickjs/cutils.h"
#include "../../websg-networking.h"
#include "./websg-networking-js.h"
#include "./network-listener.h"
#include "./network-message-iterator.h"
#include "./network-message.h"
#include "./network.h"
#include "./peer.h"
#include "./replicator.h"
#include "./replication.h"
#include "./replication-iterator.h"

void js_define_websg_networking_api(JSContext *ctx) {
  JSValue global = JS_GetGlobalObject(ctx);

  JSValue websg_networking = JS_NewObject(ctx);

  js_websg_define_network_listener(ctx, websg_networking);
  js_websg_define_network_message_iterator(ctx);
  js_websg_define_network_message(ctx, websg_networking);
  js_websg_define_network(ctx, websg_networking);
  js_websg_define_peer(ctx, websg_networking);
  js_websg_define_replicator(ctx, websg_networking);
  js_websg_define_replication_iterator(ctx);
  js_websg_define_replication(ctx, websg_networking);
  JS_SetPropertyStr(ctx, global, "WebSGNetworking", websg_networking);

  JSValue network = js_websg_new_network(ctx);
  JS_SetPropertyStr(ctx, global, "network", network);
}