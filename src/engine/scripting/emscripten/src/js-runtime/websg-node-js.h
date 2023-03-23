#ifndef __websg_node_js_h
#define __websg_node_js_h
#include "../websg.h"
#include "./quickjs/quickjs.h"

static JSClassID websg_node_class_id;

void js_define_websg_node(JSContext *ctx);

JSValue js_websg_create_node(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv);

JSValue js_websg_find_node_by_name(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv);

JSValue js_websg_get_node_by_id(JSContext *ctx, node_id_t node_id);

#endif
