#ifndef __websg_collision_js_h
#define __websg_collision_js_h
#include "../../websg.h"
#include "../quickjs/quickjs.h"
#include "./world.h"


extern JSClassID js_websg_collision_class_id;

void js_websg_define_collision(JSContext *ctx, JSValue websg);

JSValue js_websg_new_collision(JSContext *ctx, WebSGWorldData *world_data, CollisionItem *collision);

#endif
