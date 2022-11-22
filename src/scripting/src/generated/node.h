
#ifndef __node_h
#define __node_h
#include "../../include/quickjs/quickjs.h"
#include "websg.h"

extern JSClassID js_node_class_id;

JSValue create_node_from_ptr(JSContext *ctx, Node *node);

void js_define_node_api(JSContext *ctx, JSValue *target);

#endif