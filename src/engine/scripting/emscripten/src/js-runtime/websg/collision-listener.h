#ifndef __websg_collision_listener_js_h
#define __websg_collision_listener_js_h
#include "../../websg.h"
#include "../quickjs/quickjs.h"
#include "./world.h"

typedef struct WebSGCollisionListenerData {
  WebSGWorldData *world_data;
  collision_listener_id_t listener_id;
} WebSGCollisionListenerData;

extern JSClassID js_websg_collision_listener_class_id;

void js_websg_define_collision_listener(JSContext *ctx, JSValue websg);

JSValue js_websg_world_create_collision_listener(
  JSContext *ctx,
  JSValueConst this_val,
  int argc,
  JSValueConst *argv
) ;

#endif
