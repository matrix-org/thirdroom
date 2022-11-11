#ifndef __texture_h
#define __texture_h
#include "../include/quickjs/quickjs.h"
#include "./websg.h";

JSValue create_texture_from_ptr(JSContext *ctx, Texture *texture);

Texture *get_texture_from_js_val(JSContext *ctx, JSValue texture);

void js_define_texture_api(JSContext *ctx, JSValue *target);

#endif