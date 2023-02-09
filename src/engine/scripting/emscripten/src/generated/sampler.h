
#ifndef __sampler_h
#define __sampler_h
#include "../../include/quickjs/quickjs.h"
#include "websg.h"

extern JSClassID js_sampler_class_id;

JSValue create_sampler_from_ptr(JSContext *ctx, Sampler *sampler);

void js_define_sampler_api(JSContext *ctx, JSValue *target);

#endif