#ifndef __websg_collision_iterator_js_h
#define __websg_collision_iterator_js_h
#include "../quickjs/quickjs.h"
#include "../../websg.h"
#include "./collision-listener.h"

typedef struct WebSGCollisionIteratorData {
    WebSGWorldData *world_data;
    CollisionItem *collisions;
    uint32_t idx;
    uint32_t count;
} WebSGCollisionIteratorData;

extern JSClassID js_websg_collision_iterator_class_id;

void js_websg_define_collision_iterator(JSContext *ctx);

JSValue js_websg_create_collision_iterator(
    JSContext *ctx,
    WebSGCollisionListenerData *listener_data
);

#endif
