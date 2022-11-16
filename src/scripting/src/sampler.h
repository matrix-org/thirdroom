#ifndef __sampler_h
#define __sampler_h
#include "../include/quickjs/quickjs.h"
#include "./websg.h";

JSValue create_sampler_from_ptr(JSContext *ctx, Sampler *sampler);

Sampler *get_sampler_from_js_val(JSContext *ctx, JSValue sampler);

void js_define_sampler_api(JSContext *ctx, JSValue *target);

#endif