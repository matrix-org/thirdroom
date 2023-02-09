
#ifndef __animation_sampler_h
#define __animation_sampler_h
#include "../../include/quickjs/quickjs.h"
#include "websg.h"

extern JSClassID js_animation_sampler_class_id;

JSValue create_animation_sampler_from_ptr(JSContext *ctx, AnimationSampler *animation_sampler);

void js_define_animation_sampler_api(JSContext *ctx, JSValue *target);

#endif