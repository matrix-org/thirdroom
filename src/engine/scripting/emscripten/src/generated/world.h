
#ifndef __world_h
#define __world_h
#include "../../include/quickjs/quickjs.h"
#include "websg.h"

extern JSClassID js_world_class_id;

JSValue create_world_from_ptr(JSContext *ctx, World *world);

void js_define_world_api(JSContext *ctx, JSValue *target);

#endif