
#ifndef __texture_h
#define __texture_h
#include "../../include/quickjs/quickjs.h"
#include "websg.h"

extern JSClassID js_texture_class_id;

JSValue create_texture_from_ptr(JSContext *ctx, Texture *texture);

void js_define_texture_api(JSContext *ctx, JSValue *target);

#endif