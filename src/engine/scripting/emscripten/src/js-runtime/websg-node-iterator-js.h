#ifndef __websg_node_iterator_js_h
#define __websg_node_iterator_js_h
#include "./quickjs/quickjs.h"

void js_websg_define_node_iterator(JSContext *ctx);
JSValue js_websg_create_node_iterator(JSContext *ctx, node_id_t *nodes, uint32_t count) ;

#endif
