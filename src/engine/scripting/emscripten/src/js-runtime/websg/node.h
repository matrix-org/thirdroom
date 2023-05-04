#ifndef __websg_node_js_h
#define __websg_node_js_h
#include "../../websg.h"
#include "../quickjs/quickjs.h"
#include "./world.h"

extern JSClassID js_websg_node_class_id;

typedef struct WebSGNodeData {
  WebSGWorldData *world_data;
  node_id_t node_id;
  uint32_t component_store_index;
  JSValue interactable;
  JSValue physics_body;
} WebSGNodeData;

void js_websg_define_node(JSContext *ctx, JSValue websg);

JSValue js_websg_get_node_by_id(JSContext *ctx,  WebSGWorldData *world_data, node_id_t node_id);

JSValue js_websg_world_create_node(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv);

JSValue js_websg_world_find_node_by_name(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv);

#endif
