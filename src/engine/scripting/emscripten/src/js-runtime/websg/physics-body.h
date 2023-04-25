#ifndef __websg_physics_body_js_h
#define __websg_physics_body_js_h
#include "../../websg.h"
#include "../quickjs/quickjs.h"

typedef struct WebSGPhysicsBodyData {
  node_id_t node_id;
} WebSGPhysicsBodyData;

extern JSClassID js_websg_physics_body_class_id;

void js_websg_define_physics_body(JSContext *ctx, JSValue websg);

JSValue js_websg_init_node_physics_body(JSContext *ctx, node_id_t node_id_t);

JSValue js_websg_node_add_physics_body(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv);

JSValue js_websg_node_remove_physics_body(JSContext *ctx, JSValueConst this_val, int argc, JSValueConst *argv);

JSValue js_websg_node_get_physics_body(JSContext *ctx, JSValueConst this_val);

#endif
