
#ifndef __animation_h
#define __animation_h
#include "../../include/quickjs/quickjs.h"
#include "websg.h"

extern JSClassID js_animation_class_id;

JSValue create_animation_from_ptr(JSContext *ctx, Animation *animation);

void js_define_animation_api(JSContext *ctx, JSValue *target);

#endif