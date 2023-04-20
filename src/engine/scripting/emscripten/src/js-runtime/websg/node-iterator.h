#ifndef __websg_node_iterator_js_h
#define __websg_node_iterator_js_h
#include "../quickjs/quickjs.h"
#include "../../websg.h"
#include "./world.h"

typedef struct JSWebSGNodeIteratorData {
    WebSGWorldData *world_data;
    node_id_t *nodes;
    uint32_t idx;
    uint32_t count;
} JSWebSGNodeIteratorData;

extern JSClassID js_websg_node_iterator_class_id;

void js_websg_define_node_iterator(JSContext *ctx);

JSValue js_websg_create_node_iterator(JSContext *ctx, WebSGWorldData *world_data, node_id_t *nodes, uint32_t count);

#endif
