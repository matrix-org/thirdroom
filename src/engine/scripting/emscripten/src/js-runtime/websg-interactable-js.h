#ifndef __websg_interactable_js_h
#define __websg_interactable_js_h
#include "../websg.h"
#include "./quickjs/quickjs.h"

typedef struct WebSGInteractableData {
  node_id_t node_id;
} WebSGInteractableData;

static JSClassID websg_interactable_class_id;

void js_define_websg_interactable(JSContext *ctx);

JSValue js_websg_node_add_interactable(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv);

JSValue js_websg_node_remove_interactable(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv);

JSValue js_websg_node_has_interactable(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv);

JSValue js_websg_node_get_interactable(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv);

#endif
