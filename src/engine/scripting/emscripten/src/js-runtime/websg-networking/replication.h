#ifndef __websg_network_replication_js_h
#define __websg_network_replication_js_h
#include "../quickjs/quickjs.h"
#include "../../websg.h"
#include "../../websg-networking.h"
#include "../websg/world.h"

extern JSClassID js_websg_replication_class_id;

void js_websg_define_replication(JSContext *ctx, JSValue network);

JSValue js_websg_new_replication_instance(JSContext *ctx, JSValue node, JSValue peer, JSValue data);

#endif
