
#ifndef __animation_channel_h
#define __animation_channel_h
#include "../../include/quickjs/quickjs.h"
#include "websg.h"

extern JSClassID js_animation_channel_class_id;

JSValue create_animation_channel_from_ptr(JSContext *ctx, AnimationChannel *animation_channel);

void js_define_animation_channel_api(JSContext *ctx, JSValue *target);

#endif