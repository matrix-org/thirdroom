#ifndef __websg_interactable_js_h
#define __websg_interactable_js_h
#include "../../websg.h"
#include "../quickjs/quickjs.h"

typedef struct WebSGInteractableData {
  node_id_t node_id;
} WebSGInteractableData;

extern JSClassID js_websg_interactable_class_id;

void js_websg_define_interactable(JSContext *ctx, JSValue websg);

JSValue js_websg_init_node_interactable(JSContext *ctx, node_id_t node_id_t);

JSValue js_websg_node_add_interactable(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv);

JSValue js_websg_node_remove_interactable(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv);

JSValue js_websg_node_get_interactable(JSContext *ctx, JSValueConst this_val);

#endif
