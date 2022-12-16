
#ifndef __scene_h
#define __scene_h
#include "../../include/quickjs/quickjs.h"
#include "websg.h"

extern JSClassID js_scene_class_id;

JSValue create_scene_from_ptr(JSContext *ctx, Scene *scene);

void js_define_scene_api(JSContext *ctx, JSValue *target);

#endif